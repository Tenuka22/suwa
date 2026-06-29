import type { BaseMessage } from "@langchain/core/messages";
import {
  Annotation,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { ClerkRequestContext } from "../../context";
import { CloudflareChatModel } from "./cloudflare-chat-model";
import {
  createCoordinatorNode,
  createDbAgentNode,
  createRouter,
} from "./nodes";
import { createAiTools } from "./tools";

export interface QuestionCard {
  answer: string;
  title: string;
}

const PROMPTS: Record<string, string> = {
  coordinator: `You are a friendly, conversational medical assistant. Your ONLY tool is transfer_to_agent — call it ONLY when the user is asking about finding a doctor, searching for a specialist, booking an appointment, checking availability, viewing a doctor's profile, or describing symptoms/conditions that need a doctor.

CRITICAL: NEVER call transfer_to_agent for: greetings ("hello", "hi", "hey"), casual chat, feelings, loneliness, general health advice, questions about what you can do, requests to list features, or any meta-questions about yourself. For those, just respond conversationally and end the conversation.

If you are unsure whether to transfer, just respond conversationally instead. It's better to chat than to incorrectly transfer.`,
  db: `You are a friendly medical assistant that helps users find doctors, nearby hospitals, and manage appointments.

CRITICAL RULE: Your response is shown DIRECTLY to the user. Never output instructions, meta-commentary, or internal reasoning. Every word you write is a message to the user.

You MUST ALWAYS output a JSON object as your ENTIRE response. Never output anything before or after the JSON object. Your entire response must be parseable as a single JSON object.

When you just need to respond conversationally (no follow-up needed), output:
{"message":"your friendly response here"}

When you need the user to choose or answer a follow-up, output:
{"message":"your question here","questionCards":[{"title":"short label","answer":"exact text to send on tap"},{"title":"...","answer":"..."},{"title":"...","answer":"..."},{"title":"...","answer":"..."}]}

Rules:
- message: The text shown to the user. Must be a complete sentence.
- questionCards (optional): Exactly 4 cards when asking a follow-up, omitted otherwise.
  - title: short label for the option
  - answer: the exact text to send when the user taps the card

For doctor search requests, do not ask the user to refine the query first. Use the user's message as the search input, answer the request immediately, then optionally include 4 refinement cards if they help narrow results.

For doctor search refinements, cards should be direct shortcuts like "Search doctors by specialty: stress management" or "Search doctors by symptoms: stress management".
Never ask follow-up questions such as "What specialty are you looking for?" if you can infer a usable search query from the user's message.
Never return only tool names or tool instructions to the user.

Always use tools to answer questions — never just describe what tools exist. Follow this pattern:
1. Understand what the user needs
2. Call the right tool (search_doctors, search_hospitals, get_doctor_profile, check_availability, or get_upcoming_sessions). Use the most specific search query possible.
3. After receiving tool results, respond with a natural message for the user and, if useful, 4 refinement cards.

HOSPITAL SEARCH — When search_doctors returns 0 results, call search_hospitals with the user's symptom or specialty to find nearby hospitals. Always suggest the user can check the hospital map in the app for directions.

MEDICATION GUIDELINES — For common symptoms only, you may suggest general over-the-counter options with a disclaimer. Follow these rules:
- Headache/migraine: "Over-the-counter pain relievers like paracetamol or ibuprofen may help. Always follow the dosage on the package."
- Cold/flu: "Rest, hydration, and OTC cold medications may help relieve symptoms."
- Allergies: "Antihistamines like cetirizine or loratadine may help with mild allergies."
- Indigestion: "Antacids or proton pump inhibitors (like omeprazole) may help."
- Always add: "Please consult a pharmacist or doctor before taking any new medication."
- Never prescribe prescription-only medications.
- If symptoms are severe, always recommend seeing a doctor or visiting a hospital.

Response guidelines:
- If search_doctors finds doctors → {"message":"I found 3 specialists near you: Dr. Smith, Dr. Jones, and Dr. Lee."}
- If search_doctors finds no results but search_hospitals finds hospitals → {"message":"I couldn't find a matching doctor, but there are hospitals nearby like Asiri Hospital Galle (3.7★) and Queensbury Hospitals (4.0★). You can check the hospital map in the app to find one near you.\n\nFor your symptoms, over-the-counter pain relievers like paracetamol may help. Please consult a pharmacist before taking any new medication."}
- If neither found → {"message":"I couldn't find any doctors or hospitals matching that. Try a different search term or check the hospital map in the app."}
- If the question isn't health-related → {"message":"Sorry, I can only help with finding doctors, hospitals, and managing appointments."}
- Never explain what you should do — just do it.
- Never start with Since, I should, We should, Based on, or other reasoning language.
- Never use quotation marks around your spoken message text — the JSON already handles structure.

After you receive tool results, always respond with a message for the user — never end with silence or only a tool call.`,
};

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  activeAgent: Annotation<string>({
    default: () => "coordinator",
    reducer: (_current, next) => next,
  }),
});

export type GraphState = typeof GraphAnnotation.State;

function createAgentRouter() {
  return (state: GraphState) => {
    const last = state.messages.at(-1) as BaseMessage & {
      tool_calls?: Array<{ name: string }>;
    };
    return last?.tool_calls?.length ? "tools" : "__end__";
  };
}

function createToolsRouter() {
  return (state: GraphState) => {
    if (state.activeAgent === "db") {
      return "db";
    }
    return "coordinator";
  };
}

// ── Graph ──

export function createGraph(ctx: ClerkRequestContext) {
  const llm = new CloudflareChatModel(
    "@cf/google/gemma-4-26b-a4b-it",
    ctx.ai
  );

  const tools = createAiTools(ctx);
  const allTools = Object.values(tools).filter(
    (t): t is NonNullable<typeof t> => t != null
  );
  const toolNode = new ToolNode(allTools);
  const config = { llm, toolNode, systemPrompts: PROMPTS, tools };

  return new StateGraph(GraphAnnotation)
    .addNode("coordinator", createCoordinatorNode(config))
    .addNode("db", createDbAgentNode(config))
    .addNode("tools", toolNode)
    .addEdge("__start__", "coordinator")
    .addConditionalEdges("coordinator", createRouter(config))
    .addConditionalEdges("db", createAgentRouter())
    .addConditionalEdges("tools", createToolsRouter())
    .compile();
}

export interface StreamEvent {
  data: Record<string, unknown>;
  event:
    | "message.start"
    | "message.token"
    | "message.tool_call"
    | "message.tool_result"
    | "message.end"
    | "message.question_cards"
    | "message.error";
}

function parseLlmResponse(
  raw: string
): { message: string; questionCards: QuestionCard[] } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { message: "", questionCards: [] };
  }

  const tryParse = (text: string) => {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }
      const message =
        typeof parsed.message === "string" ? parsed.message.trim() : "";
      if (!message) {
        return null;
      }
      const rawCards = parsed.questionCards;
      const questionCards = Array.isArray(rawCards)
        ? rawCards
            .filter(
              (c: unknown): c is { title: string; answer: string } =>
                typeof c === "object" &&
                c !== null &&
                typeof (c as Record<string, unknown>).title === "string" &&
                typeof (c as Record<string, unknown>).answer === "string"
            )
            .map((c) => ({
              title: c.title.trim(),
              answer: c.answer.trim(),
            }))
        : [];

      return {
        message,
        questionCards:
          questionCards.length === 4 ? questionCards : ([] as QuestionCard[]),
      };
    } catch {
      return null;
    }
  };

  const result = tryParse(trimmed);
  if (result) {
    return result;
  }

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const extracted = tryParse(jsonMatch[0]);
    if (extracted) {
      return extracted;
    }
  }

  return { message: trimmed, questionCards: [] };
}

export async function* runAgentStream(
  ctx: ClerkRequestContext,
  userMessage: string
): AsyncGenerator<StreamEvent> {
  const graph = createGraph(ctx);
  let lastAgent = "";
  let rawBuffer = "";

  const FALLBACK =
    "I wasn't able to find an answer to that. Could you try rephrasing your question?";

  try {
    const stream = await graph.stream(
      {
        messages: [{ role: "user", content: userMessage }],
      },
      { recursionLimit: 15 }
    );

    for await (const update of stream) {
      for (const [node, data] of Object.entries(update) as [
        string,
        {
          messages?: Array<{
            content: string;
            tool_calls?: Array<{ name: string }>;
          }>;
        },
      ][]) {
        const msgs = data?.messages ?? [];
        for (const msg of msgs) {
          if (msg.tool_calls?.length) {
            for (const tc of msg.tool_calls) {
              yield {
                event: "message.tool_call",
                data: { tool: tc.name, agent: node },
              };
            }
          }
          if (node === "tools") {
            continue;
          }
          const content = typeof msg.content === "string" ? msg.content : "";
          if (content) {
            rawBuffer = content;
            lastAgent = node;
          }
        }
      }
    }

    const { message, questionCards } = parseLlmResponse(rawBuffer);
    const agent = lastAgent || "coordinator";

    if (message) {
      yield { event: "message.start", data: { agent } };
      yield {
        event: "message.token",
        data: { token: message, agent },
      };
      if (questionCards.length) {
        yield {
          event: "message.question_cards",
          data: { cards: questionCards },
        };
      }
    } else if (!rawBuffer) {
      yield { event: "message.start", data: { agent } };
      yield { event: "message.token", data: { token: FALLBACK, agent } };
    }
  } catch (err) {
    const isRecursion =
      err instanceof Error && err.name === "GraphRecursionError";
    if (isRecursion && !rawBuffer) {
      const agent = lastAgent || "coordinator";
      yield { event: "message.start", data: { agent } };
      yield { event: "message.token", data: { token: FALLBACK, agent } };
    } else {
      const msg = err instanceof Error ? err.message : "Unknown error";
      yield {
        event: "message.error",
        data: { error: msg, agent: lastAgent || "coordinator" },
      };
    }
    return;
  }
}
