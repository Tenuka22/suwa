import { z } from "zod";

export const doctorFileKindSchema = z.enum([
  "portrait",
  "qualification",
  "intro_video",
  "other",
]);

export type DoctorFileKind = z.infer<typeof doctorFileKindSchema>;

export const doctorFileUploadSchema = z.object({
  caption: z.string().trim().max(280).optional(),
  fileKind: doctorFileKindSchema,
});

export const doctorFileUpdateSchema = z.object({
  caption: z.string().trim().max(280).nullable().optional(),
  fileKind: doctorFileKindSchema.optional(),
  fileName: z.string().trim().min(1).optional(),
});

export const doctorFileKinds: Array<{
  description: string;
  label: string;
  value: DoctorFileKind;
}> = [
  {
    value: "portrait",
    label: "Portrait",
    description: "Square doctor headshot, best at 1:1.",
  },
  {
    value: "qualification",
    label: "Qualification",
    description: "Certificates, licenses, and supporting documents.",
  },
  {
    value: "intro_video",
    label: "Intro video",
    description: "Landscape video, ideally 16:9.",
  },
  {
    value: "other",
    label: "Other",
    description: "Any public doctor material that does not fit elsewhere.",
  },
] as const;
