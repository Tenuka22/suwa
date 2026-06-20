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
  coordinator: `You are a friendly, conversational medical assistant. Your ONLY tool is transfer_to_agent — use it ONLY when the user explicitly asks to find a doctor, book an appointment, check a doctor's availability, or view a doctor profile. For ANY other query — greetings, feelings, loneliness, health advice, general questions, or just chatting — respond conversationally and NEVER call transfer_to_agent.`,
  db: "You are a database assistant. Help users find doctors, view profiles, check availability, and manage appointments. Use your tools to query information.",
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
    const last = state.messages[state.messages.length - 1] as BaseMessage & {
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
  let agent = "coordinator";
  let prevAgent = "";

  try {
    const stream = await graph.stream({
      messages: [{ role: "user", content: userMessage }],
    });

    for await (const update of stream) {
      for (const [node, data] of Object.entries(update) as Array<
        [
          string,
          {
            messages?: Array<{
              content: string;
              tool_calls?: Array<{ name: string }>;
            }>;
          },
        ]
      >) {
        agent = node;
        if (node !== "tools" && agent !== prevAgent && prevAgent !== "") {
          yield {
            event: "message.start",
            data: { agent: node },
          };
          lastContent = "";
        }
        prevAgent = agent;
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
          if (content && content !== lastContent) {
            const delta = content.slice(lastContent.length);
            if (delta) {
              yield {
                event: "message.token",
                data: { token: delta, agent: node },
              };
            }
            lastContent = content;
          }
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    yield { event: "message.error", data: { error: msg, agent } };
    return;
  }
}
