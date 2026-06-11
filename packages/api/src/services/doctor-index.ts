import { CloudflareWorkersAIEmbeddings } from "@langchain/cloudflare"
import { env } from "@zen-doc/env/server"

export interface DoctorInfo {
  userId: string
  displayName: string | null
  headline: string | null
  specialties: string[]
  focusAreas: string[]
  languages: string[]
  consultationModes: string[]
  location: string | null
  experienceStartYear: number | null
}

interface DoctorEmbeddingEntry extends DoctorInfo {
  embedding: number[]
}

export function buildDoctorDocument(profile: {
  userId: string
  displayName: string | null
  headline: string | null
  bio: string | null
  specialties: string[]
  focusAreas: string[]
  languages: string[]
  consultationModes: string[]
  location: string | null
  experienceStartYear: number | null
  approach: string | null
  approachSteps: { id: string; text: string }[]
  education: string | null
}): string {
  const sections: string[] = []

  sections.push(`# ${profile.displayName ?? "Doctor"}`)
  sections.push("")

  if (profile.headline) {
    sections.push(`**Headline:** ${profile.headline}`)
    sections.push("")
  }

  if (profile.bio) {
    sections.push(`## About\n\n${profile.bio}`)
    sections.push("")
  }

  if (profile.specialties.length > 0) {
    sections.push(`**Specialties:** ${profile.specialties.join(", ")}`)
  }

  if (profile.focusAreas.length > 0) {
    sections.push(`**Focus Areas:** ${profile.focusAreas.join(", ")}`)
  }

  if (profile.languages.length > 0) {
    sections.push(`**Languages:** ${profile.languages.join(", ")}`)
  }

  if (profile.consultationModes.length > 0) {
    sections.push(`**Consultation Modes:** ${profile.consultationModes.join(", ")}`)
  }

  if (profile.location) {
    sections.push(`**Location:** ${profile.location}`)
  }

  if (profile.experienceStartYear) {
    const years = Math.max(0, new Date().getFullYear() - profile.experienceStartYear)
    sections.push(`**Experience:** ${years} years (since ${profile.experienceStartYear})`)
  }

  if (profile.approach) {
    sections.push(`## Approach\n\n${profile.approach}`)
  }

  if (profile.approachSteps.length > 0) {
    sections.push("## Approach Steps")
    for (const step of profile.approachSteps) {
      sections.push(`- ${step.text}`)
    }
  }

  return sections.join("\n")
}

async function createEmbeddings(): Promise<CloudflareWorkersAIEmbeddings> {
  return new CloudflareWorkersAIEmbeddings({
    binding: env.AI,
    model: "@cf/baai/bge-small-en-v1.5",
  })
}

export async function indexDoctorProfile(
  profile: Parameters<typeof buildDoctorDocument>[0]
): Promise<void> {
  const document = buildDoctorDocument(profile)
  const embeddings = await createEmbeddings()
  const [embedding] = await embeddings.embedDocuments([document])

  const entry: DoctorEmbeddingEntry = {
    embedding: embedding ?? [],
    userId: profile.userId,
    displayName: profile.displayName,
    headline: profile.headline,
    specialties: profile.specialties,
    focusAreas: profile.focusAreas,
    languages: profile.languages,
    consultationModes: profile.consultationModes,
    location: profile.location,
    experienceStartYear: profile.experienceStartYear,
  }

  await env.DOCTOR_EMBEDDINGS_KV.put(
    `doctors/${profile.userId}`,
    JSON.stringify(entry),
    {
      metadata: {
        displayName: profile.displayName ?? "",
        specialties: profile.specialties.join(","),
        focusAreas: profile.focusAreas.join(","),
      },
    }
  )
}

export async function removeDoctorIndex(userId: string): Promise<void> {
  await env.DOCTOR_EMBEDDINGS_KV.delete(`doctors/${userId}`)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function searchDoctorsByQuery(
  query: string
): Promise<Array<DoctorInfo & { score: number }>> {
  const embeddings = await createEmbeddings()
  const [queryVec] = await embeddings.embedDocuments([query])

  const listResult = await env.DOCTOR_EMBEDDINGS_KV.list({ prefix: "doctors/" })
  const keys = listResult.keys ?? []

  const entries: (DoctorEmbeddingEntry | null)[] = await Promise.all(
    keys.map(async (key: { name: string }) => {
      const raw = await env.DOCTOR_EMBEDDINGS_KV.get(key.name)
      if (!raw) return null
      try {
        return JSON.parse(raw) as DoctorEmbeddingEntry
      } catch {
        return null
      }
    })
  )

  const valid = entries.filter((e): e is DoctorEmbeddingEntry =>
    e !== null && Array.isArray(e.embedding)
  )

  const results = valid
    .map(e => ({
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
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return results
}
