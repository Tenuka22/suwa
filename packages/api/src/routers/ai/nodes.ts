import type { BaseMessage } from "@langchain/core/messages";
import { SystemMessage } from "@langchain/core/messages";
import type { ToolNode } from "@langchain/langgraph/prebuilt";
import type { CloudflareChatModel } from "./cloudflare-chat-model";
import type { GraphState } from "./graph";

export interface AgentConfig {
  llm: CloudflareChatModel;
  systemPrompts: Record<string, string>;
  toolNode: ToolNode;
  tools: ReturnType<typeof import("./tools").createAiTools>;
}

export function createCoordinatorNode(config: AgentConfig) {
  return async (state: GraphState) => {
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
    const last = state.messages[state.messages.length - 1] as BaseMessage & {
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
        const userMsg =
          (state.messages[0]?.content as string)?.toLowerCase() ?? "";
        const needsDoctor =
          /doctor|appointment|book|schedule|availability|clinic|search find|profile|specialist/i.test(
            userMsg
          );
        if (needsDoctor) {
          return agent;
        }
      }
    }
    return "__end__";
  };
}
