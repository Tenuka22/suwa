import { Annotation, StateGraph, START, END } from "@langchain/langgraph"
import { CloudflareWorkersAIEmbeddings } from "@langchain/cloudflare"
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages"
import { env } from "@zen-doc/env/server"
import { cosineSimilarity, type DoctorInfo } from "./doctor-index"

interface EmbeddingEntry extends DoctorInfo {
  embedding: number[]
}

const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current: BaseMessage[], update: BaseMessage[]) => [...current, ...update],
    default: () => [],
  }),
  matchedDoctors: Annotation<DoctorInfo[]>({
    reducer: (_current: DoctorInfo[], update: DoctorInfo[]) => update,
    default: () => [],
  }),
})

const SYSTEM_PROMPT = `You are a friendly and knowledgeable medical assistant for ZenDoc, a telehealth platform. Your role is to help users find the right doctor and provide general wellness guidance.

## Core Rules (MANDATORY - Never violate these):
1. NEVER prescribe medication, diagnose conditions, or provide specific medical treatment advice
2. ALWAYS suggest consulting with a doctor for any medical concerns
3. CRITICAL: ONLY recommend doctors from the "Available Doctors" list below. NEVER invent or suggest doctors not in this list. If the list is empty or has no relevant match, tell the user to browse the ZenDoc doctor directory instead.
4. Focus on behavioral health, wellness, and lifestyle guidance only
5. Be warm, empathetic, and encouraging
6. The user is ALREADY inside the ZenDoc mobile app. Do NOT tell them to download an app, create an account, or visit a website. All booking happens inside this app.
7. Keep responses VERY concise - 2-3 paragraphs maximum. No long lists of generic tips.

## Available Doctors (ONLY these exist - do not invent others):
{doctorContext}

## Response Format:
- Start with empathy and acknowledgment
- Suggest 1-3 relevant doctors from the list above with brief reasoning
- If no matching doctors exist, just offer general wellness guidance
- Keep it short and conversational`

function formatDoctorsForPrompt(doctors: DoctorInfo[]): string {
  if (doctors.length === 0) {
    return "No specific doctors found matching the query. Please suggest the user browse the doctor directory."
  }

  return doctors
    .map(
      (d, i) =>
        `${i + 1}. ${d.displayName ?? "Unknown"}${d.headline ? ` - ${d.headline}` : ""}
   Specialties: ${d.specialties.join(", ") || "General"}
   Focus Areas: ${d.focusAreas.join(", ") || "General wellness"}
   Languages: ${d.languages.join(", ") || "English"}
   ${d.location ? `Location: ${d.location}` : "Remote/Online"}
   ${d.experienceStartYear ? `Experience: ${Math.max(0, new Date().getFullYear() - d.experienceStartYear)} years` : ""}`
    )
    .join("\n\n")
}

async function searchDoctorsNode(state: typeof GraphState.State) {
  const lastUserMsg = [...state.messages].reverse().find(
    (m: BaseMessage) => m._getType() === "human"
  )
  const query = lastUserMsg?.content?.toString() ?? ""

  if (!query) {
    return { matchedDoctors: [] }
  }

  try {
    const embeddings = new CloudflareWorkersAIEmbeddings({
      binding: env.AI,
      model: "@cf/baai/bge-small-en-v1.5",
    })

    const [queryVec] = await embeddings.embedDocuments([query])

    const listResult = await env.DOCTOR_EMBEDDINGS_KV.list({ prefix: "doctors/" })
    const keys: { name: string }[] = listResult.keys ?? []

    const entries: (EmbeddingEntry | null)[] = await Promise.all(
      keys.map(async (key: { name: string }) => {
        const raw = await env.DOCTOR_EMBEDDINGS_KV.get(key.name)
        if (!raw) return null
        try {
          return JSON.parse(raw) as EmbeddingEntry
        } catch {
          return null
        }
      })
    )

    const valid = entries.filter(
      (e): e is EmbeddingEntry => e !== null && Array.isArray(e.embedding)
    )

    const scored = valid
      .map((e: EmbeddingEntry) => ({
        userId: e.userId,
        displayName: e.displayName,
        headline: e.headline,
        specialties: e.specialties,
        focusAreas: e.focusAreas,
        languages: e.languages,
        consultationModes: e.consultationModes,
        location: e.location,
        experienceStartYear: e.experienceStartYear,
        score: cosineSimilarity(queryVec ?? [], e.embedding),
      }))
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, 5)

    return {
      matchedDoctors: scored.map(
        ({ score: _score, ...rest }: { score: number; userId: string; displayName: string | null; headline: string | null; specialties: string[]; focusAreas: string[]; languages: string[]; consultationModes: string[]; location: string | null; experienceStartYear: number | null }) => rest
      ),
    }
  } catch {
    return { matchedDoctors: [] }
  }
}

const chatGraph = new StateGraph(GraphState)
  .addNode("searchDoctors", searchDoctorsNode)
  .addEdge(START, "searchDoctors")
  .addEdge("searchDoctors", END)
  .compile()

export { chatGraph }

export type ChatEvent =
  | { type: "text-delta"; text: string }
  | { type: "doctor-suggestions"; doctors: Array<{ id: string; name: string }> }

export async function* streamChatWorkflow(
  rawMessages: Array<{ role: string; content: string }>
): AsyncGenerator<ChatEvent> {
  const langchainMessages: BaseMessage[] = rawMessages.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  )

  let matchedDoctors: DoctorInfo[] = []

  try {
    const result = await chatGraph.invoke({
      messages: langchainMessages,
      matchedDoctors: [],
    })
    matchedDoctors = result.matchedDoctors
  } catch {
    matchedDoctors = []
  }

  const doctorText = formatDoctorsForPrompt(matchedDoctors)
  const systemPrompt = SYSTEM_PROMPT.replace("{doctorContext}", doctorText)

  const cfMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
    ...rawMessages,
  ]

  const aiResponse = await env.AI.run(
    "@cf/meta/llama-3.1-8b-instruct-fast",
    {
      messages: cfMessages,
      stream: true,
      max_tokens: 1024,
    }
  )

  const aiStream = aiResponse as ReadableStream<Uint8Array>
  const decoder = new TextDecoder()
  let fullText = ""

  const reader = aiStream.getReader()
  let buffer = ""
  let done = false

  try {
    while (!done) {
      const result = await reader.read()
      done = result.done
      if (!done) {
        buffer += decoder.decode(result.value, { stream: true })
      }

      // Process all complete SSE events (delimited by \n\n)
      let boundary: number
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const event = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)

        let isDone = false
        for (const line of event.split("\n")) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6)
            if (payload === "[DONE]") {
              isDone = true
              break
            }
            try {
              const data = JSON.parse(payload)
              if (data.response) {
                fullText += data.response
                yield { type: "text-delta" as const, text: data.response }
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
        if (isDone) {
          done = true
          break
        }
      }

      // Process remaining data on stream end
      if (done && buffer.trim()) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith("data: ")) {
          const payload = trimmed.slice(6)
          if (payload !== "[DONE]") {
            try {
              const data = JSON.parse(payload)
              if (data.response) {
                fullText += data.response
                yield { type: "text-delta" as const, text: data.response }
              }
            } catch {
              // Skip malformed remaining data
            }
          }
        }
        buffer = ""
      }
    }
  } finally {
    reader.releaseLock()
  }

  if (matchedDoctors.length > 0) {
    yield {
      type: "doctor-suggestions",
      doctors: matchedDoctors.map((d) => ({
        id: d.userId,
        name: d.displayName ?? "Unknown",
      })),
    }
  }
}
