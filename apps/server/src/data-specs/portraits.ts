export interface PortraitSpec {
  city: string;
  country: string;
  doctorIndex: number;
  email: string;
  firstName: string;
  gender: "men" | "women";
  lastName: string;
  url: string;
}

export const PORTRAIT_SPECS: PortraitSpec[] = [
  {
    doctorIndex: 0,
    gender: "women",
    url: createSriLankanPortraitDataUri("Anjalee Perera"),
    firstName: "Anjalee",
    lastName: "Perera",
    city: "Colombo",
    country: "Sri Lanka",
    email: "anjalee.perera@suwa.care",
  },
  {
    doctorIndex: 1,
    gender: "men",
    url: createSriLankanPortraitDataUri("Nuwan Jayasinghe"),
    firstName: "Nuwan",
    lastName: "Jayasinghe",
    city: "Kandy",
    country: "Sri Lanka",
    email: "nuwan.jayasinghe@suwa.care",
  },
  {
    doctorIndex: 2,
    gender: "women",
    url: createSriLankanPortraitDataUri("Tharushi Fernando"),
    firstName: "Tharushi",
    lastName: "Fernando",
    city: "Galle",
    country: "Sri Lanka",
    email: "tharushi.fernando@suwa.care",
  },
  {
    doctorIndex: 3,
    gender: "men",
    url: createSriLankanPortraitDataUri("Mohamed Rizwan"),
    firstName: "Mohamed",
    lastName: "Rizwan",
    city: "Negombo",
    country: "Sri Lanka",
    email: "mohamed.rizwan@suwa.care",
  },
  {
    doctorIndex: 4,
    gender: "women",
    url: createSriLankanPortraitDataUri("Isuri Wickramasinghe"),
    firstName: "Isuri",
    lastName: "Wickramasinghe",
    city: "Kurunegala",
    country: "Sri Lanka",
    email: "isuri.wickramasinghe@suwa.care",
  },
  {
    doctorIndex: 5,
    gender: "men",
    url: createSriLankanPortraitDataUri("Kavinda Samarasinghe"),
    firstName: "Kavinda",
    lastName: "Samarasinghe",
    city: "Matara",
    country: "Sri Lanka",
    email: "kavinda.samarasinghe@suwa.care",
  },
  {
    doctorIndex: 6,
    gender: "women",
    url: createSriLankanPortraitDataUri("Dilini Senanayake"),
    firstName: "Dilini",
    lastName: "Senanayake",
    city: "Jaffna",
    country: "Sri Lanka",
    email: "dilini.senanayake@suwa.care",
  },
  {
    doctorIndex: 7,
    gender: "men",
    url: createSriLankanPortraitDataUri("Suresh Pathirana"),
    firstName: "Suresh",
    lastName: "Pathirana",
    city: "Badulla",
    country: "Sri Lanka",
    email: "suresh.pathirana@suwa.care",
  },
  {
    doctorIndex: 8,
    gender: "women",
    url: createSriLankanPortraitDataUri("Ayesha Haniffa"),
    firstName: "Ayesha",
    lastName: "Haniffa",
    city: "Batticaloa",
    country: "Sri Lanka",
    email: "ayesha.haniffa@suwa.care",
  },
  {
    doctorIndex: 9,
    gender: "men",
    url: createSriLankanPortraitDataUri("Chamara Ekanayake"),
    firstName: "Chamara",
    lastName: "Ekanayake",
    city: "Anuradhapura",
    country: "Sri Lanka",
    email: "chamara.ekanayake@suwa.care",
  },
];

export const PATIENT_PORTRAIT_SPECS: PortraitSpec[] = [
  {
    doctorIndex: 0,
    gender: "women",
    url: createSriLankanPortraitDataUri("Piumi Liyanage"),
    firstName: "Piumi",
    lastName: "Liyanage",
    city: "Colombo",
    country: "Sri Lanka",
    email: "piumi.liyanage@suwa.care",
  },
  {
    doctorIndex: 1,
    gender: "men",
    url: createSriLankanPortraitDataUri("Dinesh Alwis"),
    firstName: "Dinesh",
    lastName: "Alwis",
    city: "Gampaha",
    country: "Sri Lanka",
    email: "dinesh.alwis@suwa.care",
  },
  {
    doctorIndex: 2,
    gender: "women",
    url: createSriLankanPortraitDataUri("Nadini Herath"),
    firstName: "Nadini",
    lastName: "Herath",
    city: "Kegalle",
    country: "Sri Lanka",
    email: "nadini.herath@suwa.care",
  },
  {
    doctorIndex: 3,
    gender: "men",
    url: createSriLankanPortraitDataUri("Sameera Bandara"),
    firstName: "Sameera",
    lastName: "Bandara",
    city: "Ratnapura",
    country: "Sri Lanka",
    email: "sameera.bandara@suwa.care",
  },
  {
    doctorIndex: 4,
    gender: "women",
    url: createSriLankanPortraitDataUri("Menaka Kularatne"),
    firstName: "Menaka",
    lastName: "Kularatne",
    city: "Trincomalee",
    country: "Sri Lanka",
    email: "menaka.kularatne@suwa.care",
  },
];

export const SAMPLE_PORTRAIT_URL = createSriLankanPortraitDataUri(
  "Sample Portrait"
);
export const SAMPLE_THUMBNAIL_URL = createSriLankanPortraitDataUri(
  "Sample Thumbnail"
);

function createSriLankanPortraitDataUri(displayName: string) {
  const svg = buildSriLankanPortraitSvg(displayName);
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString(
    "base64"
  )}`;
}

function buildSriLankanPortraitSvg(displayName: string) {
  const [primary, secondary, accent] = portraitColorsForName(displayName);
  const initials = portraitInitials(displayName);
  const safeName = escapeXml(displayName);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="800" rx="72" fill="url(#bg)"/>
  <rect x="88" y="88" width="624" height="624" rx="56" fill="url(#glow)"/>
  <circle cx="400" cy="286" r="150" fill="#ffffff" opacity="0.14"/>
  <circle cx="400" cy="268" r="112" fill="#f8fafc"/>
  <path d="M312 536c18-74 72-112 88-112s70 38 88 112v50H312z" fill="#f8fafc"/>
  <circle cx="400" cy="258" r="52" fill="${accent}" opacity="0.22"/>
  <text x="400" y="304" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="104" font-weight="800" fill="#0f172a">${initials}</text>
  <text x="400" y="596" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${safeName}</text>
  <text x="400" y="636" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" fill="#fffbeb" opacity="0.96">Sri Lankan clinician</text>
  <rect x="220" y="676" width="360" height="10" rx="5" fill="#ffd54f"/>
  <rect x="260" y="692" width="280" height="10" rx="5" fill="#ffffff" opacity="0.75"/>
  </svg>`;
}

function portraitColorsForName(displayName: string) {
  const palettes = [
    ["#0f766e", "#134e4a", "#f59e0b"],
    ["#7c3aed", "#312e81", "#fde047"],
    ["#b91c1c", "#7f1d1d", "#f97316"],
    ["#1d4ed8", "#0f172a", "#facc15"],
    ["#15803d", "#14532d", "#f59e0b"],
    ["#b45309", "#78350f", "#fde68a"],
  ] as const;

  const index = hashString(displayName) % palettes.length;
  return palettes[index] ?? palettes[0];
}

function portraitInitials(displayName: string) {
  const parts = displayName.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "S";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "L" : first;
  return `${first}${last}`.toUpperCase();
}

function hashString(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
