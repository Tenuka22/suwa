export interface ApproachStep {
  id: string;
  text: string;
}

export interface EducationRow {
  degree: string;
  id: string;
  institution: string;
  year: string;
}

export function parseApproachSteps(
  value: string | ApproachStep[] | null | undefined
): ApproachStep[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is ApproachStep =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          "text" in item &&
          typeof (item as ApproachStep).id === "string" &&
          typeof (item as ApproachStep).text === "string"
      );
    }
  } catch {
    return [];
  }

  return [];
}

export function parseEducationRows(
  value: string | null | undefined
): EducationRow[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (
            item
          ): item is {
            degree: string;
            institution: string;
            year: number | null;
          } =>
            typeof item === "object" &&
            item !== null &&
            "institution" in item &&
            "degree" in item
        )
        .map((item) => ({
          id: crypto.randomUUID(),
          institution: item.institution,
          degree: item.degree,
          year: item.year ? String(item.year) : "",
        }));
    }
  } catch {
    return [];
  }

  return [];
}
