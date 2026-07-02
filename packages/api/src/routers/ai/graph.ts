import { Annotation, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { ClerkRequestContext } from "../../context";
import { CloudflareChatModel } from "./cloudflare-chat-model";
import {
  createCoordinatorNode,
  createDbAgentNode,
  createRouter,
} from "./nodes";
import { createAiTools } from "./tools";

export interface ActionCard {
  description?: string;
  kind: "appointment" | "availability" | "doctor" | "hospital";
  params?: Record<string, string>;
  route: string;
  title: string;
}

const PROMPTS: Record<string, string> = {
  coordinator: `You are Suwa's router.

Keep replies short, warm, and direct.
Only transfer to the db agent when the user wants to find care, compare doctors, check availability, book an appointment, view an appointment, or open a doctor or hospital profile.
Answer directly for greetings, casual chat, general health questions, or anything that does not need a search.
If the intent is unclear, respond naturally instead of routing.`,
  db: `You are Suwa's care assistant.

Use the available tools freely and in sequence when needed. You may call more than one tool if it helps you answer well.
Use recent conversation context. Do not ask the user to repeat details that are already in the chat.
Keep the final reply natural, concise, and helpful. Never output JSON, metadata, or internal tool names.
If you found doctors, hospitals, or appointments, summarize them naturally and mention the best next step.
If a search returns no useful results, try the next best related tool before answering.
Use list_available_doctors for broad questions like "which doctors are available". Use check_availability for a specific doctor, even if the user did not give a date, because it can return the next open slots.
If the user asks for availability, always use a tool first and let the client show cards. Do not invent doctor names or schedules from memory.
Let the client surface the matching cards from the tool results.`,
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
    const last = state.messages.at(-1) as unknown as Record<string, unknown> & {
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
    | "message.cards"
    | "message.error";
}

type ToolResultRecord = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  const text = asString(value);
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return text
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function safeJsonParse(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

function formatDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    weekday: "short",
  }).format(date);
}

function prettifyStatus(value: string): string {
  return value.replace(/_/g, " ");
}

function getDoctorProfile(record: ToolResultRecord): ToolResultRecord {
  if (record.profile && typeof record.profile === "object") {
    return record.profile as ToolResultRecord;
  }

  return record;
}

function summarizeDoctor(record: ToolResultRecord): ActionCard | null {
  const profile = getDoctorProfile(record);
  const id = asString(record.id) || asString(record.userId) || asString(profile.userId);
  if (!id) {
    return null;
  }

  const specialties = asStringList(profile.specialties).slice(0, 2).join(", ");
  const focusAreas = asStringList(profile.focusAreas).slice(0, 2).join(", ");
  const availability =
    typeof record.hasAvailability === "boolean"
      ? record.hasAvailability
      : typeof profile.hasAvailability === "boolean"
        ? profile.hasAvailability
        : undefined;
  const parts = [
    asString(profile.headline) || asString(record.headline),
    specialties,
    focusAreas,
    asString(profile.location) || asString(record.location),
    availability === true
      ? "Open availability"
      : availability === false
        ? "No open slots"
        : "",
  ].filter(Boolean);

  return {
    kind: "doctor",
    route: `/(patient)/doctors/${id}`,
    title:
      asString(profile.displayName) ||
      asString(record.name) ||
      asString(record.displayName) ||
      "Doctor",
    description: parts.join(" · "),
  };
}

function summarizeHospital(record: ToolResultRecord): ActionCard | null {
  const name = asString(record.name);
  if (!name) {
    return null;
  }

  const rating =
    typeof record.rating === "number" ? `${record.rating.toFixed(1)}★` : "";
  const reviews =
    typeof record.reviewCount === "number" ? `${record.reviewCount} reviews` : "";
  const description = [
    rating,
    reviews,
    asString(record.category),
    asString(record.address),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    kind: "hospital",
    params: {
      mode: "hospitals",
      search: name,
    },
    route: "/(patient)/map",
    title: name,
    description,
  };
}

function summarizeProfile(record: ToolResultRecord): ActionCard | null {
  const id = asString(record.id);
  if (!id) {
    return null;
  }

  const specialties = asStringList(record.specialties).slice(0, 2).join(", ");
  const parts = [asString(record.headline), specialties, asString(record.location)]
    .filter(Boolean)
    .join(" · ");

  return {
    kind: "doctor",
    route: `/(patient)/doctors/${id}`,
    title: asString(record.name) || asString(record.displayName) || "Doctor",
    description: parts,
  };
}

function summarizeSession(record: ToolResultRecord): ActionCard | null {
  const id = asString(record.id);
  if (!id) {
    return null;
  }

  const doctor =
    record.doctor && typeof record.doctor === "object"
      ? (record.doctor as ToolResultRecord)
      : null;
  const plan =
    record.plan && typeof record.plan === "object"
      ? (record.plan as ToolResultRecord)
      : null;

  const description = [
    doctor ? asString(doctor.displayName) : "",
    asString(record.startAt) ? formatDateLabel(asString(record.startAt)) : "",
    plan ? asString(plan.name) : "",
    asString(record.status) ? prettifyStatus(asString(record.status)) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    kind: "appointment",
    route: `/(patient)/appointments/${id}`,
    title:
      (doctor ? asString(doctor.displayName) : "") ||
      `Appointment ${id.slice(0, 6)}`,
    description,
  };
}

function summarizeAvailability(record: ToolResultRecord): ActionCard[] {
  const doctorId = asString(record.doctorId);
  if (!doctorId) {
    return [];
  }

  const doctorName = asString(record.doctorName);
  const date = asString(record.date);
  const available = Boolean(record.available);

  const slots = Array.isArray(record.slots)
    ? record.slots.filter(
        (slot): slot is ToolResultRecord =>
          Boolean(slot) && typeof slot === "object"
      )
    : [];

  if (slots.length > 0) {
    return slots.slice(0, 3).map((slot) => ({
      kind: "availability",
      route: `/(patient)/doctors/${doctorId}/booking`,
      params: {
        date: asString(slot.startAt),
      },
      title: doctorName ? `Book ${doctorName}` : "Book this slot",
      description: `${formatDateLabel(asString(slot.startAt))} · ${formatDateLabel(asString(slot.endAt))}`,
    }));
  }

  return [
    {
      kind: "availability",
      route: available
        ? `/(patient)/doctors/${doctorId}/booking`
        : `/(patient)/doctors/${doctorId}`,
      title: available
        ? doctorName
          ? `Book ${doctorName}`
          : "Book this doctor"
        : doctorName
          ? `Open ${doctorName} profile`
          : "Open doctor profile",
      description: available
        ? date
          ? `Available on ${formatDateLabel(date)}`
          : "Open booking to choose a time"
        : date
          ? `No open slot on ${formatDateLabel(date)}`
          : "See the full profile and other dates",
    },
  ];
}

function deriveCardsFromToolResult(toolName: string, rawContent: string): ActionCard[] {
  const parsed = safeJsonParse(rawContent);
  if (!parsed) {
    return [];
  }

  switch (toolName) {
    case "search_doctors": {
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .slice(0, 4)
        .map((item) =>
          item && typeof item === "object"
            ? summarizeDoctor(item as ToolResultRecord)
            : null
        )
        .filter((card): card is ActionCard => card !== null);
    }
    case "list_available_doctors": {
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .slice(0, 4)
        .map((item) =>
          item && typeof item === "object"
            ? summarizeDoctor(item as ToolResultRecord)
            : null
        )
        .filter((card): card is ActionCard => card !== null);
    }
    case "search_hospitals": {
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .slice(0, 4)
        .map((item) =>
          item && typeof item === "object"
            ? summarizeHospital(item as ToolResultRecord)
            : null
        )
        .filter((card): card is ActionCard => card !== null);
    }
    case "get_doctor_profile": {
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const card = summarizeProfile(parsed as ToolResultRecord);
        return card ? [card] : [];
      }
      return [];
    }
    case "check_availability": {
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return summarizeAvailability(parsed as ToolResultRecord);
      }
      return [];
    }
    case "get_upcoming_sessions": {
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .slice(0, 3)
        .map((item) =>
          item && typeof item === "object"
            ? summarizeSession(item as ToolResultRecord)
            : null
        )
        .filter((card): card is ActionCard => card !== null);
    }
    default:
      return [];
  }
}

function extractAssistantText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  if (/^<tool_call\|>\s*$/i.test(trimmed)) {
    return "";
  }

  const parsed = safeJsonParse(trimmed);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const message = asString((parsed as ToolResultRecord).message);
    if (message) {
      return message;
    }
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/<tool_call\|>/gim, "")
    .trim();
}

type ConversationMessage = {
  content: string;
  role: string;
};

export async function* runAgentStream(
  ctx: ClerkRequestContext,
  messages: ConversationMessage[]
): AsyncGenerator<StreamEvent> {
  const graph = createGraph(ctx);
  let lastAgent = "";
  let lastToolName = "";
  const toolNamesById = new Map<string, string>();
  let rawBuffer = "";
  let latestCards: ActionCard[] = [];

  const FALLBACK =
    "I wasn't able to find a clear answer. Could you try rephrasing your question?";

  try {
    const stream = await graph.stream(
      {
        messages,
      },
      { recursionLimit: 15 }
    );

    for await (const update of stream) {
      for (const [node, data] of Object.entries(update) as [
        string,
        {
          messages?: Array<{
            content: string | unknown;
            name?: string;
            tool_call_id?: string;
            tool_calls?: Array<{ id?: string; name: string }>;
          }>;
        },
      ][]) {
        const msgs = data?.messages ?? [];
        for (const msg of msgs) {
          if (msg.tool_calls?.length) {
            for (const tc of msg.tool_calls) {
              lastToolName = tc.name;
              if (tc.id) {
                toolNamesById.set(tc.id, tc.name);
              }
              yield {
                event: "message.tool_call",
                data: { tool: tc.name, agent: node, id: tc.id },
              };
            }
          }

          const content =
            typeof msg.content === "string"
              ? msg.content
              : Array.isArray(msg.content)
                ? JSON.stringify(msg.content)
                : "";

          if (node === "tools") {
            const toolName =
              asString(msg.name) ||
              (msg.tool_call_id ? toolNamesById.get(msg.tool_call_id) ?? "" : "") ||
              lastToolName;
            if (toolName) {
              if (content) {
                const cards = deriveCardsFromToolResult(toolName, content);
                if (cards.length > 0) {
                  latestCards = cards;
                }
              }
              yield {
                event: "message.tool_result",
                data: {
                  agent: node,
                  id: asString(msg.tool_call_id),
                  tool: toolName,
                },
              };
            }
            continue;
          }

          if (content) {
            rawBuffer = content;
            lastAgent = node;
          }
        }
      }
    }

    const assistantText =
      extractAssistantText(rawBuffer) ||
      (latestCards.length ? "I found a few options you can open below." : FALLBACK);
    const agent = lastAgent || "coordinator";

    if (assistantText) {
      yield { event: "message.start", data: { agent } };
      yield {
        event: "message.token",
        data: { token: assistantText, agent },
      };
      if (latestCards.length) {
        yield {
          event: "message.cards",
          data: { agent, cards: latestCards },
        };
      }
    } else if (!rawBuffer) {
      yield { event: "message.start", data: { agent } };
      yield { event: "message.token", data: { token: FALLBACK, agent } };
      if (latestCards.length) {
        yield {
          event: "message.cards",
          data: { agent, cards: latestCards },
        };
      }
    }
  } catch (err) {
    const isRecursion =
      err instanceof Error && err.name === "GraphRecursionError";
    if (isRecursion) {
      const agent = lastAgent || "coordinator";
      const assistantText =
        extractAssistantText(rawBuffer) ||
        (latestCards.length ? "I found a few options you can open below." : FALLBACK);
      yield { event: "message.start", data: { agent } };
      yield { event: "message.token", data: { token: assistantText, agent } };
      if (latestCards.length) {
        yield {
          event: "message.cards",
          data: { agent, cards: latestCards },
        };
      }
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
