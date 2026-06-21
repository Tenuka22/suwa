import {
  AIMessage,
  type BaseMessage,
  SystemMessage,
} from "@langchain/core/messages";
import type { ToolNode } from "@langchain/langgraph/prebuilt";
import type { CloudflareChatModel } from "./cloudflare-chat-model";
import type { GraphState } from "./graph";

export interface AgentConfig {
  llm: CloudflareChatModel;
  systemPrompts: Record<string, string>;
  toolNode: ToolNode;
  tools: ReturnType<typeof import("./tools").createAiTools>;
}

const GREETING_RESPONSE =
  "Hello! I'm Suwa, your health guide. How can I help you today? You can ask me about finding a doctor, understanding symptoms, or any health questions you have.";

const TRAILING_NON_LETTERS = /[^a-zA-Z\s]+$/;

function isSimpleGreeting(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (!lower) {
    return false;
  }
  const greetings = [
    "hello",
    "hi",
    "hey",
    "greetings",
    "howdy",
    "good morning",
    "good afternoon",
    "good evening",
  ];
  const cleaned = lower.replace(TRAILING_NON_LETTERS, "").trimEnd();
  return greetings.some(
    (g) =>
      cleaned === g ||
      cleaned.startsWith(`${g} `) ||
      cleaned.startsWith(`${g},`) ||
      cleaned.startsWith(`${g}!`) ||
      cleaned.startsWith(`${g}?`)
  );
}

export function createCoordinatorNode(config: AgentConfig) {
  return async (state: GraphState) => {
    const userMessages = state.messages.filter(
      (m) => (m as BaseMessage)._getType() === "human"
    );
    const lastUserMessage = userMessages.at(-1);
    const lastUserText =
      lastUserMessage && typeof lastUserMessage.content === "string"
        ? lastUserMessage.content
        : "";

    if (isSimpleGreeting(lastUserText)) {
      return {
        messages: [new AIMessage(GREETING_RESPONSE)],
        activeAgent: "coordinator",
      };
    }

    const llm = config.llm.bindTools([config.tools.transferToAgent]);
    const result = await llm.invoke([
      new SystemMessage(config.systemPrompts.coordinator!),
      ...state.messages,
    ]);
    const tc = (
      result as unknown as {
        tool_calls?: Array<{ name: string; args: Record<string, unknown> }>;
      }
    ).tool_calls;
    const transfer = tc?.find((t) => t.name === "transfer_to_agent");
    const agent =
      typeof transfer?.args?.agent === "string" && transfer.args.agent === "db"
        ? transfer.args.agent
        : "coordinator";
    return { messages: [result], activeAgent: agent };
  };
}

export function createDbAgentNode(config: AgentConfig) {
  return async (state: GraphState) => {
    const tools = [
      config.tools.searchDoctors,
      config.tools.getDoctorProfile,
      config.tools.checkAvailability,
      config.tools.getUpcomingSessions,
    ].filter(Boolean);
    const llm = tools.length > 0 ? config.llm.bindTools(tools) : config.llm;
    const result = await llm.invoke([
      new SystemMessage(config.systemPrompts.db!),
      ...state.messages,
    ]);
    return { messages: [result] };
  };
}

export function createRouter(_config: AgentConfig) {
  return (state: GraphState) => {
    const last = state.messages.at(-1) as BaseMessage & {
      tool_calls?: Array<{ name: string; args: Record<string, unknown> }>;
      content?: string;
    };
    const calls = last?.tool_calls ?? [];
    if (calls.length === 0) {
      return "__end__";
    }
    const transfer = calls.find((tc) => tc.name === "transfer_to_agent");
    if (transfer) {
      const agent = transfer.args.agent;
      if (typeof agent === "string" && agent === "db") {
        return agent;
      }
    }
    return "__end__";
  };
}
