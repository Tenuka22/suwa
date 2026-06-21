export interface QualificationSpec {
  abbreviation: string;
  degree: string;
  field: string;
  institution: string;
  yearRange: [number, number];
}

export const QUALIFICATION_SPECS: QualificationSpec[] = [
  {
    degree: "Doctor of Philosophy",
    abbreviation: "Ph.D.",
    field: "Clinical Psychology",
    institution: "University of Helsinki",
    yearRange: [2003, 2010],
  },
  {
    degree: "Doctor of Psychology",
    abbreviation: "Psy.D.",
    field: "Clinical Psychology",
    institution: "Uppsala University",
    yearRange: [2005, 2011],
  },
  {
    degree: "Doctor of Medicine",
    abbreviation: "M.D.",
    field: "Psychiatry",
    institution: "Karolinska Institutet",
    yearRange: [2000, 2008],
  },
  {
    degree: "Master of Arts",
    abbreviation: "M.A.",
    field: "Clinical Psychology",
    institution: "University of Amsterdam",
    yearRange: [2007, 2011],
  },
  {
    degree: "Master of Science",
    abbreviation: "M.S.",
    field: "Neuroscience",
    institution: "University of Zurich",
    yearRange: [2008, 2012],
  },
  {
    degree: "Doctor of Philosophy",
    abbreviation: "Ph.D.",
    field: "Cognitive Behavioral Science",
    institution: "Trinity College Dublin",
    yearRange: [2004, 2009],
  },
  {
    degree: "Doctor of Psychology",
    abbreviation: "Psy.D.",
    field: "Counseling Psychology",
    institution: "University of Cape Town",
    yearRange: [2006, 2012],
  },
  {
    degree: "Doctor of Medicine",
    abbreviation: "M.D.",
    field: "Child & Adolescent Psychiatry",
    institution: "McGill University",
    yearRange: [2002, 2009],
  },
  {
    degree: "Master of Arts",
    abbreviation: "M.A.",
    field: "Psychotherapy Studies",
    institution: "University of Vienna",
    yearRange: [2009, 2013],
  },
  {
    degree: "Doctor of Philosophy",
    abbreviation: "Ph.D.",
    field: "Health Psychology",
    institution: "University of Manchester",
    yearRange: [2005, 2010],
  },
];

export const SECONDARY_QUALIFICATIONS: QualificationSpec[] = [
  {
    degree: "Diploma in Cognitive Behavioral Therapy",
    abbreviation: "Dip. CBT",
    field: "CBT",
    institution: "Oxford Cognitive Therapy Centre",
    yearRange: [2010, 2014],
  },
  {
    degree: "Certification in EMDR",
    abbreviation: "EMDR Certified",
    field: "Trauma Therapy",
    institution: "EMDR Institute",
    yearRange: [2011, 2015],
  },
  {
    degree: "Diploma in Mindfulness-Based Interventions",
    abbreviation: "Dip. Mindfulness",
    field: "Mindfulness",
    institution: "Bangor University",
    yearRange: [2012, 2016],
  },
  {
    degree: "Fellow of the Royal Society of Medicine",
    abbreviation: "FRSM",
    field: "General Medicine",
    institution: "Royal Society of Medicine",
    yearRange: [2013, 2017],
  },
  {
    degree: "Advanced Certificate in Dialectical Behavior Therapy",
    abbreviation: "Adv. Cert. DBT",
    field: "DBT",
    institution: "Behavioral Tech LLC",
    yearRange: [2014, 2018],
  },
  {
    degree: "Diploma in Sports Psychology",
    abbreviation: "Dip. Sports Psych.",
    field: "Sports Psychology",
    institution: "British Psychological Society",
    yearRange: [2010, 2014],
  },
  {
    degree: "Certification in Hypnotherapy",
    abbreviation: "Cert. Hypno.",
    field: "Hypnotherapy",
    institution: "National Hypnotherapy Society",
    yearRange: [2011, 2015],
  },
];

export const APPROACH_STEP_TEMPLATES: string[][] = [
  [
    "Begin with a comprehensive intake assessment to understand your personal history, current stressors, and therapeutic goals.",
    "Introduce mindfulness-based grounding techniques to build emotional regulation skills from the first session.",
    "Gradually incorporate cognitive restructuring to identify and challenge unhelpful thought patterns.",
    "Work collaboratively on behavioral experiments to test new ways of thinking and acting.",
    "Integrate relaxation techniques and psychoeducation to build long-term coping strategies.",
  ],
  [
    "Create a safe, non-judgmental space for open exploration of your thoughts and feelings.",
    "Use evidence-based assessment tools to establish baseline measurements for your well-being.",
    "Apply CBT frameworks to break down complex problems into manageable components.",
    "Develop personalized coping strategies based on your unique strengths and resources.",
    "Schedule regular progress reviews to adjust the therapeutic approach as needed.",
  ],
  [
    "Conduct a thorough biopsychosocial evaluation to understand all contributing factors.",
    "Introduce psychoeducation about the mind-body connection and stress physiology.",
    "Teach practical stress management techniques including breathing and progressive muscle relaxation.",
    "Work through trauma processing using appropriate evidence-based protocols when readiness is established.",
    "Develop a sustainable wellness plan for continued growth beyond therapy.",
  ],
  [
    "Establish therapeutic alliance through active listening, empathy, and unconditional positive regard.",
    "Use solution-focused brief therapy principles to identify and amplify existing strengths.",
    "Introduce positive psychology interventions to broaden thinking and build resilience.",
    "Work on values clarification to align daily actions with long-term life goals.",
    "Practice gratitude and meaning-making exercises to enhance overall life satisfaction.",
  ],
  [
    "Start with a detailed clinical interview covering developmental history and presenting concerns.",
    "Apply dialectical behavior therapy skills training for emotion regulation and distress tolerance.",
    "Use exposure-based techniques for anxiety-related concerns when appropriate.",
    "Process underlying relational patterns using psychodynamic insight.",
    "Create relapse prevention strategies and celebrate therapeutic progress.",
  ],
];

export const APPROACH_TEMPLATES: string[] = [
  "I take an integrative approach, blending cognitive-behavioral techniques with mindfulness-based interventions. Each treatment plan is personalized based on your unique needs and goals, drawing from evidence-based practices including CBT, DBT, and Acceptance and Commitment Therapy.",
  "My practice is grounded in psychodynamic principles combined with modern cognitive science. I believe understanding the roots of patterns is essential, while also building concrete skills for daily functioning. Together we will work on insight, behavior change, and building a meaningful life.",
  "I specialize in trauma-informed care, using EMDR and somatic experiencing alongside traditional talk therapy. Safety and stabilization come first, then processing difficult material at a pace that feels manageable. I emphasize building resilience and post-traumatic growth.",
  "My approach combines humanistic therapy with practical behavioral interventions. I believe you are the expert on your own life, and my role is to support and guide your journey. We will focus on building self-awareness, developing coping skills, and creating meaningful change.",
  "I use a strengths-based, collaborative model that draws on positive psychology and solution-focused therapy. Rather than focusing solely on what is wrong, we will identify and build on your existing strengths to create lasting positive change in your life.",
];

export function buildEducationString(
  spec: QualificationSpec,
  year: number
): string {
  return `${spec.abbreviation} in ${spec.field} — ${spec.institution} (${year})`;
}

export function buildFullEducation(
  primary: QualificationSpec,
  primaryYear: number,
  secondary: QualificationSpec | null,
  secondaryYear: number | null
): string {
  let result = buildEducationString(primary, primaryYear);
  if (secondary) {
    result += `\n${buildEducationString(secondary, secondaryYear ?? primaryYear)}`;
  }
  return result;
}
