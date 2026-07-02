import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";

type AiBinding = {
  run(model: string, options: Record<string, unknown>): Promise<unknown>;
};

type MessageLike =
  | BaseMessage
  | {
      role?: string;
      content?: string | unknown;
      tool_calls?: unknown[];
      tool_call_id?: string;
    };

function roleOf(msg: MessageLike): string {
  if (typeof (msg as BaseMessage)._getType === "function") {
    const t = (msg as BaseMessage)._getType();
    if (t === "human") {
      return "user";
    }
    if (t === "ai") {
      return "assistant";
    }
    if (t === "system") {
      return "system";
    }
    if (t === "tool") {
      return "tool";
    }
  }
  const m = msg as Record<string, string>;
  return m.role ?? "user";
}

function toApiToolCalls(tc: Record<string, unknown>): Record<string, unknown> {
  if (tc.type === "function") {
    return tc as Record<string, unknown>;
  }
  return {
    id: tc.id,
    type: "function",
    function: {
      name: tc.name,
      arguments:
        typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args ?? {}),
    },
  };
}

function formatMessages(messages: MessageLike[]) {
  return messages.map((msg) => {
    const m = msg as Record<string, unknown>;
    const formatted: Record<string, unknown> = {
      role: roleOf(msg),
      content:
        typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    };
    if (Array.isArray(m.tool_calls)) {
      formatted.tool_calls = (m.tool_calls as Record<string, unknown>[]).map(
        toApiToolCalls
      );
    }
    if (m.tool_call_id) {
      formatted.tool_call_id = m.tool_call_id;
    }
    return formatted;
  });
}

function toToolDef(tool: StructuredToolInterface) {
  const raw = tool.schema as {
    toJSONSchema?: () => Record<string, unknown>;
    toJSON?: () => Record<string, unknown>;
  };
  const jsonSchema = raw.toJSONSchema?.() ?? raw.toJSON?.() ?? {};
  const { properties, required } = jsonSchema as {
    properties?: Record<string, unknown>;
    required?: string[];
  };
  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: properties ?? {},
        required: required ?? [],
      },
    },
  };
}

function parseToolCalls(rawCalls: unknown) {
  if (!Array.isArray(rawCalls)) {
    return;
  }
  return rawCalls.map((tc: Record<string, unknown>) => {
    const fn = tc.function as { name?: string; arguments?: string } | undefined;
    const rawArgs = fn?.arguments ?? (tc.arguments as string) ?? "{}";
    let args: Record<string, unknown> = {};
    if (typeof rawArgs === "string") {
      try {
        args = JSON.parse(rawArgs) as Record<string, unknown>;
      } catch {
        args = {};
      }
    } else if (rawArgs && typeof rawArgs === "object") {
      args = rawArgs as Record<string, unknown>;
    }
    return {
      name: fn?.name ?? (tc.name as string) ?? "",
      args,
      id: (tc.id as string) ?? `call_${Math.random().toString(36).slice(2)}`,
      type: "tool_call" as const,
    };
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`AI request timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
}

export class CloudflareChatModel {
  private modelName: string;
  private ai: AiBinding;
  private tools: StructuredToolInterface[] = [];
  private timeoutMs: number;

  constructor(modelName: string, ai: AiBinding, timeoutMs = 30_000) {
    this.modelName = modelName;
    this.ai = ai;
    this.timeoutMs = timeoutMs;
  }

  bindTools(tools: StructuredToolInterface[]): this {
    this.tools = tools;
    return this;
  }

  async invoke(messages: MessageLike[]): Promise<AIMessage> {
    const body: Record<string, unknown> = {
      messages: formatMessages(messages),
    };
    if (this.tools.length > 0) {
      body.tools = this.tools.map(toToolDef);
    }

    const raw = await withTimeout(
      this.ai.run(this.modelName, body),
      this.timeoutMs
    );

    const response = raw as Record<string, unknown>;

    const choice = (
      Array.isArray(response.choices) ? response.choices[0] : undefined
    ) as
      | {
          message?: {
            content?: string | null;
            tool_calls?: unknown;
          };
        }
      | undefined;

    if (!choice) {
      throw new Error(
        `Unexpected AI response: ${JSON.stringify(response).slice(0, 500)}`
      );
    }

    const content = choice.message?.content ?? "";
    const toolCalls = parseToolCalls(choice.message?.tool_calls);

    return new AIMessage({
      content,
      ...(toolCalls && toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
    });
  }
}
