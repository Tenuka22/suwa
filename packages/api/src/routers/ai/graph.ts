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

const PROMPTS: Record<string, string> = {
  coordinator: `You are a friendly, conversational medical assistant. Your ONLY tool is transfer_to_agent — call it ONLY when the user is asking about finding a doctor, searching for a specialist, booking an appointment, checking availability, viewing a doctor's profile, or describing symptoms/conditions that need a doctor.

CRITICAL: NEVER call transfer_to_agent for: greetings ("hello", "hi", "hey"), casual chat, feelings, loneliness, general health advice, questions about what you can do, requests to list features, or any meta-questions about yourself. For those, just respond conversationally and end the conversation.

If you are unsure whether to transfer, just respond conversationally instead. It's better to chat than to incorrectly transfer.`,
  db: `You are a friendly database assistant that helps users find doctors and manage appointments.

CRITICAL RULE: Your response is shown DIRECTLY to the user. Never output instructions, meta-commentary, or internal reasoning. Every word you write is a message to the user.

For doctor search requests, do not ask the user to refine the query first. Use the user's message as the search input, answer the request immediately, then optionally include 4 refinement cards if they help narrow results.

When you do need the user to choose or answer a follow-up, ALWAYS do both:
1. Ask exactly ONE clear question in natural language.
2. Output a single JSON object with this shape: {"question":"...","answers":[{"title":"...","answer":"..."}, ...]}

Format the response as plain text question first, then the JSON object on the next lines.
The question must be a complete sentence that the UI can display directly.

Each card must have:
- title: short label for the option
- answer: the exact text to send when the user taps the card

Rules for cards:
- Always provide exactly 4 answers when asking a follow-up
- Keep answers short and specific
- Do not add any extra text inside the JSON object
- Do not omit the question sentence before the object
- For doctor search refinements, cards should be direct shortcuts like "Search doctors by specialty: stress management" or "Search doctors by symptoms: stress management".
- Never ask follow-up questions such as "What specialty are you looking for?" if you can infer a usable search query from the user's message.
- Never return only tool names or tool instructions to the user.

Always use tools to answer questions — never just describe what tools exist. Follow this pattern:
1. Understand what the user needs
2. Call the right tool (search_doctors, get_doctor_profile, check_availability, or get_upcoming_sessions). Use the most specific search query possible.
3. After receiving tool results, respond with a natural message for the user and, if useful, 4 refinement cards.

Response guidelines:
- If search finds doctors → I found [number] [specialty] near you: Dr. Name, Dr. Name...
- If no results → I couldn't find any doctors matching that. Try a different search term or specialty.
- If the question isn't doctor-related → Sorry, I can only help with finding doctors and managing appointments.
- Never explain what you should do — just do it.
- Never start with Since, I should, We should, Based on, or other reasoning language.
- Never use quotation marks around your response — just speak naturally.

After you receive tool results, always respond with a descriptive message for the user — never end with silence or only a tool call.`,
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
    "@cf/meta/llama-3.1-8b-instruct-fast",
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
    | "message.error";
}

export async function* runAgentStream(
  ctx: ClerkRequestContext,
  userMessage: string
): AsyncGenerator<StreamEvent> {
  const graph = createGraph(ctx);
  let lastContent = "";
  let lastAgent = "";

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
            if (node !== lastAgent) {
              lastContent = "";
            }
            if (content !== lastContent) {
              if (!lastContent) {
                yield {
                  event: "message.start",
                  data: { agent: node },
                };
              }
              const delta = content.slice(lastContent.length);
              if (delta) {
                yield {
                  event: "message.token",
                  data: { token: delta, agent: node },
                };
              }
              lastContent = content;
              lastAgent = node;
            }
          }
        }
      }
    }

    if (!lastContent) {
      const fallbackAgent = lastAgent || "coordinator";
      yield {
        event: "message.start",
        data: { agent: fallbackAgent },
      };
      yield {
        event: "message.token",
        data: {
          token:
            "I wasn't able to find an answer to that. Could you try rephrasing your question?",
          agent: fallbackAgent,
        },
      };
    }
  } catch (err) {
    const isRecursion =
      err instanceof Error && err.name === "GraphRecursionError";
    if (isRecursion && !lastContent) {
      const fallbackAgent = lastAgent || "coordinator";
      yield {
        event: "message.start",
        data: { agent: fallbackAgent },
      };
      yield {
        event: "message.token",
        data: {
          token:
            "I wasn't able to find an answer to that. Could you try rephrasing your question?",
          agent: fallbackAgent,
        },
      };
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
