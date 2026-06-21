import type { ClerkRequestContext } from "../../../../context";
import type { Suggestion } from "../chat-systems";
import { createDoctorTools } from "./tools";

export interface AgentResult {
  content: string;
  suggestions: Suggestion[];
}

const SUGGESTIONS_RE = /SUGGESTIONS:(\[[\s\S]*?\])\s*$/;

function parseSuggestions(content: string): AgentResult {
  const match = content.match(SUGGESTIONS_RE);
  if (!match || match.index === undefined) {
    return { content, suggestions: [] };
  }
  const json = match[1];
  if (!json) {
    return { content, suggestions: [] };
  }
  try {
    const suggestions = JSON.parse(json) as Suggestion[];
    return {
      content: content.slice(0, match.index).trim(),
      suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 6) : [],
    };
  } catch {
    return { content, suggestions: [] };
  }
}

async function generateSuggestions(
  context: ClerkRequestContext,
  history: Array<{ role: string; content: string }>
): Promise<Suggestion[]> {
  const conversationSummary = history
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const response = await context.ai.run(
    "@cf/meta/llama-3.1-8b-instruct-fast",
    {
      messages: [
        {
          role: "user",
          content: `You generate follow-up suggestions for a medical assistant chat. Return ONLY a JSON array of objects with 'label', 'value', and 'description' fields. No other text. Example: [{"label":"Find a cardiologist","value":"find cardiologist","description":"Search for heart specialists"}]\n\nBased on this conversation, generate 3-4 follow-up options:\n\n${conversationSummary}`,
        },
      ],
    }
  );

  const text = (
    (response as Record<string, unknown>).result as
      | Record<string, unknown>
      | undefined
  )?.response as string | undefined;

  if (!text) {
    return [];
  }

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 6) as Suggestion[];
    }
  } catch {
    // fall through to fallback
  }

  return [
    {
      label: "Find a doctor",
      value: "I need to find a doctor",
      description: "Search for doctors by name or specialty",
    },
    {
      label: "Get doctor info",
      value: "Tell me about a doctor",
      description: "Learn more about a specific doctor",
    },
    {
      label: "Browse specialties",
      value: "What specialties are available?",
      description: "See available medical specialties",
    },
  ];
}

export interface StreamEvent {
  content?: string;
  data?: any;
  id?: string;
  name?: string;
  status?: string;
  suggestions?: Suggestion[];
  type: "token" | "tool_call" | "tool_result" | "result" | "error" | "status";
}

export async function* streamDoctorSearchAgent(
  userMessage: string,
  context: ClerkRequestContext,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const tools = createDoctorTools(context);

  const toolDefs = tools.map((t) => {
    const raw: unknown = t.schema;
    const jsonSchema =
      (raw as { toJSON?: () => Record<string, unknown> }).toJSON?.() ?? {};
    const { properties, required } = jsonSchema as {
      properties?: Record<string, unknown>;
      required?: string[];
    };
    return {
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: "object",
          properties: properties ?? {},
          required: required ?? [],
        },
      },
    };
  });

  const messages: Array<{
    role: string;
    content: string;
    tool_calls?: any[];
    tool_call_id?: string;
  }> = [
    {
      role: "system",
      content:
        "You are a helpful medical assistant. Provide clear, concise information. Always use tools to verify facts. Use markdown for lists and bold text.",
    },
    { role: "user", content: userMessage },
  ];

  let iterations = 0;
  while (iterations < 5) {
    if (signal?.aborted) {
      return;
    }
    iterations++;

    yield { type: "status", status: "Thinking..." };

    let response: ReadableStream;
    try {
      const aiResponse = await context.ai.run(
        "@cf/meta/llama-3.1-8b-instruct-fast",
        {
          messages: messages.map(
            ({ role, content, tool_calls, tool_call_id }) => ({
              role,
              content,
              tool_calls,
              tool_call_id,
            })
          ),
          tools: toolDefs,
          stream: true,
        }
      );
      response = aiResponse as unknown as ReadableStream;
    } catch (e) {
      yield { type: "error", content: "AI service error." };
      return;
    }

    let assistantContent = "";
    let toolCalls: any[] = [];

    const reader = response.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          return;
        }
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!(trimmed && trimmed.startsWith("data: "))) {
            continue;
          }

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.response) {
              assistantContent += parsed.response;
              yield { type: "token", content: parsed.response };
            }
            if (parsed.tool_calls) {
              for (const tc of parsed.tool_calls) {
                const existing = toolCalls.find(
                  (t) =>
                    t.id === tc.id || t.name === (tc.name || tc.function?.name)
                );
                if (!existing) {
                  toolCalls.push(tc);
                  yield {
                    type: "tool_call",
                    name: tc.name || tc.function?.name,
                    data: tc.arguments || tc.function?.arguments,
                    id: tc.id,
                  };
                }
              }
            }
          } catch (e) {}
        }
      }
    } finally {
      reader.releaseLock();
    }

    messages.push({
      role: "assistant",
      content: assistantContent,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
    });

    if (toolCalls.length === 0) {
      let { content, suggestions } = parseSuggestions(assistantContent);
      if (suggestions.length === 0) {
        suggestions = await generateSuggestions(context, messages);
      }
      yield { type: "result", content, suggestions };
      return;
    }

    for (const tc of toolCalls) {
      if (signal?.aborted) {
        return;
      }
      const toolName = tc.name || tc.function?.name;
      const toolId = tc.id || toolName;

      yield { type: "status", status: `Using ${toolName}...` };

      const rawArgs = tc.arguments || tc.function?.arguments;
      const toolArgs =
        typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs || {};
      const tool = tools.find((t) => t.name === toolName);

      if (tool) {
        try {
          const result = await (tool as any).invoke(toolArgs);
          messages.push({
            role: "tool",
            content: result,
            tool_call_id: toolId,
          });
          yield {
            type: "tool_result",
            name: toolName,
            data: result,
            id: toolId,
          };
        } catch (e) {
          const errorMsg = `Error: ${(e as Error).message}`;
          messages.push({
            role: "tool",
            content: errorMsg,
            tool_call_id: toolId,
          });
          yield {
            type: "tool_result",
            name: toolName,
            data: errorMsg,
            id: toolId,
          };
        }
      }
    }
    toolCalls = [];
  }
}

export async function runDoctorSearchAgent(
  userMessage: string,
  context: ClerkRequestContext
): Promise<AgentResult> {
  const generator = streamDoctorSearchAgent(userMessage, context);
  let lastResult: AgentResult = { content: "", suggestions: [] };

  for await (const event of generator) {
    if (event.type === "result") {
      lastResult = { content: event.content!, suggestions: event.suggestions! };
    }
  }

  return lastResult;
}
