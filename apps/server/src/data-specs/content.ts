export interface ChannelSpec {
  description: string;
  name: string;
}

export const CHANNEL_SPECS: ChannelSpec[] = [
  {
    name: "Mindful Living",
    description:
      "Evidence-based strategies for maintaining mental wellness and emotional balance in daily life.",
  },
  {
    name: "Stress Management",
    description:
      "Practical techniques to identify, manage, and reduce stress using CBT and mindfulness approaches.",
  },
  {
    name: "Sleep & Recovery",
    description:
      "Expert guidance on improving sleep quality and establishing healthy sleep patterns.",
  },
  {
    name: "Anxiety Relief",
    description:
      "Cognitive-behavioral tools and relaxation techniques for understanding and managing anxiety.",
  },
  {
    name: "Trauma Recovery",
    description:
      "Gentle, evidence-based resources for healing from trauma and building resilience.",
  },
];

export interface MaterialSpec {
  description: string;
  durationSeconds: number;
  fileType: "video" | "audio";
  mimeType: string;
  /** If set, hub.ts reads this local file instead of downloading a sample URL */
  seedFile?: string;
  /** YouTube video ID if sourced from YouTube (for provenance) */
  sourceYouTubeId?: string;
  /** If set, the seedFile is a video file; hub.ts will use it for video DOCTOR_ files */
  tags: string[];
  title: string;
}

export const MATERIAL_SPECS_VIDEO: MaterialSpec[] = [
  {
    title: "8 Signs That Someone is Battling Mental Health Problems",
    description:
      "Learn to recognize depression, anxiety, eating disorders, and other signs that someone may be struggling with mental health.",
    fileType: "video",
    mimeType: "video/mp4",
    durationSeconds: 306,
    seedFile: "WiJn9EpvtEk.mp4",
    sourceYouTubeId: "WiJn9EpvtEk",
    tags: ["mental-health", "depression", "anxiety", "awareness"],
  },
  {
    title: "Every Mental Disorder Explained in 6 Minutes",
    description:
      "A concise overview of major mental health disorders including their symptoms and characteristics.",
    fileType: "video",
    mimeType: "video/mp4",
    durationSeconds: 384,
    seedFile: "7fWo_Yme2G0.mp4",
    sourceYouTubeId: "7fWo_Yme2G0",
    tags: ["mental-health", "education", "disorders", "psychology"],
  },
  {
    title: "Teen Health: Mental Health",
    description:
      "Understanding mental health for teens — covering common challenges and when to seek help.",
    fileType: "video",
    mimeType: "video/mp4",
    durationSeconds: 165,
    seedFile: "1i9OktVsTWo.mp4",
    sourceYouTubeId: "1i9OktVsTWo",
    tags: ["teen", "mental-health", "education", "awareness"],
  },
  {
    title: "There's No Shame in Taking Care of Your Mental Health",
    description:
      "A powerful TED Talk on breaking the stigma around mental health and prioritizing self-care.",
    fileType: "video",
    mimeType: "video/mp4",
    durationSeconds: 546,
    seedFile: "BvpmZktlBFs.mp4",
    sourceYouTubeId: "BvpmZktlBFs",
    tags: ["ted-talk", "mental-health", "stigma", "self-care", "motivation"],
  },
  {
    title: "Introduction to Cognitive Behavioral Therapy",
    description:
      "Learn the foundations of CBT and how to identify thought patterns that affect your well-being.",
    fileType: "video",
    mimeType: "video/mp4",
    durationSeconds: 840,
    tags: ["cbt", "therapy", "mental-health"],
  },
  {
    title: "Breathing Techniques for Anxiety Relief",
    description:
      "Guided demonstration of proven breathing exercises to calm your nervous system.",
    fileType: "video",
    mimeType: "video/mp4",
    durationSeconds: 600,
    tags: ["anxiety", "relaxation", "breathing"],
  },
  {
    title: "Understanding the Stress Response",
    description:
      "An educational walkthrough of your body's stress response system and how to regulate it.",
    fileType: "video",
    mimeType: "video/mp4",
    durationSeconds: 720,
    tags: ["stress", "wellness", "mental-health"],
  },
  {
    title: "Managing Panic Attacks",
    description:
      "Learn practical strategies to recognize, manage, and reduce the intensity of panic attacks.",
    fileType: "video",
    mimeType: "video/mp4",
    durationSeconds: 660,
    tags: ["anxiety", "cbt", "therapy"],
  },
  {
    title: "Building Emotional Resilience",
    description:
      "Discover evidence-based techniques for developing greater emotional resilience.",
    fileType: "video",
    mimeType: "video/mp4",
    durationSeconds: 780,
    tags: ["resilience", "wellness", "mental-health"],
  },
  {
    title: "Mindful Morning Routine",
    description:
      "Follow along with a complete mindful morning practice to start your day with clarity.",
    fileType: "video",
    mimeType: "video/mp4",
    durationSeconds: 900,
    tags: ["mindfulness", "meditation", "wellness"],
  },
];

export const MATERIAL_SPECS_AUDIO: MaterialSpec[] = [
  {
    title: "Guided Body Scan Meditation",
    description:
      "A 20-minute body scan meditation to promote relaxation and body awareness.",
    fileType: "audio",
    mimeType: "audio/mpeg",
    durationSeconds: 1200,
    tags: ["meditation", "mindfulness", "relaxation"],
  },
  {
    title: "Calming Ocean Waves Background",
    description:
      "Natural ocean sounds for relaxation, focus, or sleep support.",
    fileType: "audio",
    mimeType: "audio/mpeg",
    durationSeconds: 1800,
    tags: ["sleep", "relaxation", "nature"],
  },
  {
    title: "5-Minute Breathing Exercise",
    description:
      "A quick guided breathing exercise for immediate stress relief.",
    fileType: "audio",
    mimeType: "audio/mpeg",
    durationSeconds: 300,
    tags: ["breathing", "stress", "relaxation"],
  },
  {
    title: "Evening Wind-Down Meditation",
    description:
      "Unwind from your day with this calming evening meditation practice.",
    fileType: "audio",
    mimeType: "audio/mpeg",
    durationSeconds: 900,
    tags: ["meditation", "sleep", "relaxation"],
  },
  {
    title: "Focus and Concentration Soundscape",
    description:
      "Ambient soundscape designed to enhance focus and deep concentration.",
    fileType: "audio",
    mimeType: "audio/mpeg",
    durationSeconds: 3600,
    tags: ["focus", "productivity", "wellness"],
  },
  {
    title: "Morning Affirmations",
    description:
      "Start your day with positive affirmations to build confidence and motivation.",
    fileType: "audio",
    mimeType: "audio/mpeg",
    durationSeconds: 600,
    tags: ["motivation", "mindfulness", "wellness"],
  },
];

export const PLAYLIST_TITLES = [
  "Beginner's Guide",
  "Stress Relief Toolkit",
  "Sleep Better Tonight",
  "Anxiety Management",
  "Daily Mindfulness",
  "Deep Dive Series",
] as const;
