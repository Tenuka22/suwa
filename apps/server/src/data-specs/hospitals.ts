export interface HospitalSpec {
  address: string;
  clinics: ClinicSpec[];
  latitude: number;
  longitude: number;
  name: string;
  phone: string;
  services: string[];
  type: "PRIVATE_HOSPITAL" | "PUBLIC_HOSPITAL";
  website: string;
}

export interface ClinicSpec {
  name: string;
  specialization: string;
}

export interface PlacesDataEntry {
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  name: string;
  phone: string;
  place_id: string;
  rating: number;
  review_count: number;
  url: string;
  website: string | null;
}

function categorize(category: string): "PRIVATE_HOSPITAL" | "PUBLIC_HOSPITAL" {
  if (category === "Government hospital") {
    return "PUBLIC_HOSPITAL";
  }
  return "PRIVATE_HOSPITAL";
}

const servicesByCategory: Record<string, string[]> = {
  "Private hospital": [
    "EMERGENCY",
    "OPD",
    "PHARMACY",
    "LABORATORY",
    "ICU",
    "RADIOLOGY",
  ],
  "Government hospital": [
    "EMERGENCY",
    "OPD",
    "ICU",
    "PHARMACY",
    "LABORATORY",
    "RADIOLOGY",
    "THEATRE",
  ],
  Hospital: ["EMERGENCY", "OPD", "PHARMACY", "LABORATORY", "ICU"],
  "Medical Center": ["OPD", "PHARMACY", "LABORATORY", "PHYSIOTHERAPY"],
};

const clinicAssignments: Record<string, ClinicSpec[]> = {
  "Asiri Hospital Galle": [
    {
      name: "General Psychiatry Outpatient",
      specialization: "General Psychiatry",
    },
    {
      name: "Anxiety & Mood Disorders Unit",
      specialization: "Anxiety and Mood Disorders",
    },
  ],
  "Co-Operative hospital Galle": [
    {
      name: "Community Mental Health Clinic",
      specialization: "General Psychiatry",
    },
  ],
  "Ruhunu Hospital": [
    {
      name: "Addiction Medicine & Recovery",
      specialization: "Addiction Medicine",
    },
    {
      name: "Child & Adolescent Mental Health",
      specialization: "Child and Adolescent Psychiatry",
    },
    {
      name: "Geriatric Psychiatry Ward",
      specialization: "Geriatric Psychiatry",
    },
  ],
  "Queensbury Hospitals (Pvt) Ltd": [
    {
      name: "Trauma Recovery & PTSD Clinic",
      specialization: "Trauma Recovery",
    },
    {
      name: "Eating Disorders Treatment Center",
      specialization: "Eating Disorders",
    },
  ],
  "International Medical Center": [
    {
      name: "Wellness & Stress Management",
      specialization: "Anxiety and Mood Disorders",
    },
  ],
  "Lanka Hospitals Medical Center": [
    { name: "General Psychiatry Clinic", specialization: "General Psychiatry" },
  ],
  "The German-Sri Lanka Friendship Hospital for Women (Helmut Kohl Memorial Maternity Hospital)":
    [
      {
        name: "Women's Mental Health Unit",
        specialization: "General Psychiatry",
      },
      { name: "Neuropsychiatry Center", specialization: "Neuropsychiatry" },
    ],
};

export function buildHospitalSpecs(
  placesData: PlacesDataEntry[]
): HospitalSpec[] {
  const hospitalPlaces = placesData.filter(
    (p) =>
      p.name !== "Sahana Medical Centre & Laboratory Complex" &&
      p.name !== "Lanka Hospitals Laboratories" &&
      p.name !== "Coop chanelling center"
  );

  return hospitalPlaces.map((place) => ({
    name: place.name,
    address: place.address,
    phone: place.phone,
    website: place.website ?? "",
    latitude: place.latitude,
    longitude: place.longitude,
    type: categorize(place.category),
    services: servicesByCategory[place.category] ?? [
      "OPD",
      "PHARMACY",
      "LABORATORY",
    ],
    clinics: clinicAssignments[place.name] ?? [
      {
        name: "General Psychiatry Clinic",
        specialization: "General Psychiatry",
      },
    ],
  }));
}
