export interface Hospital {
  address: string;
  category: string;
  hours?: Record<string, string> | null;
  latitude: number;
  longitude: number;
  name: string;
  phone: string | null;
  rating: number;
  reviewCount: number;
  website: string | null;
}

export const hospitals: Hospital[] = [
  {
    name: "Asiri Hospital Galle",
    address: "No.10 Wakwella Rd, Galle 80000",
    rating: 3.7,
    reviewCount: 725,
    latitude: 6.035_742_8,
    longitude: 80.215_941_1,
    phone: "0914 640 640",
    website: "http://www.asirihealth.com/",
    category: "Private hospital",
  },
  {
    name: "Co-Operative hospital Galle",
    address: "24 Gamini Mawatha, Galle 80000",
    rating: 2.2,
    reviewCount: 634,
    latitude: 6.036_664,
    longitude: 80.216_114_6,
    phone: "0912 234 270",
    website: null,
    category: "Private hospital",
  },
  {
    name: "Ruhunu Hospital",
    address: "36CG+2VQ, Galle 80000",
    rating: 3.5,
    reviewCount: 692,
    latitude: 6.069_392_7,
    longitude: 80.227_164_5,
    phone: "0917 694 059",
    website: "http://www.ruhunuhospital.lk/",
    category: "Hospital",
  },
  {
    name: "Queensbury Hospitals (Pvt) Ltd",
    address: "91 Hirimbura Cross Rd, Galle 80000",
    rating: 4.0,
    reviewCount: 360,
    latitude: 6.062_356_2,
    longitude: 80.220_978_2,
    phone: "0912 270 270",
    website: "https://www.queensburyhospitals.lk/",
    category: "Private hospital",
  },
  {
    name: "International Medical Center",
    address: "Galkatiya junction, Unawatuna 80600",
    rating: 4.8,
    reviewCount: 302,
    latitude: 6.023_521_7,
    longitude: 80.247_224_5,
    phone: "074 243 0000",
    website: "http://imcsrilanka.com/",
    category: "Hospital",
  },
  {
    name: "Lanka Hospitals Medical Center",
    address: "57 Wakwella Rd, Galle 80000",
    rating: 3.8,
    reviewCount: 10,
    latitude: 6.035_628_8,
    longitude: 80.216_379_1,
    phone: "074 202 4611",
    website: "https://www.lankahospitals.com/en/",
    category: "Medical Center",
  },
  {
    name: "Sahana Medical Centre & Laboratory Complex",
    address: "Mapalagama Bus Rd, Galle 80000",
    rating: 3.6,
    reviewCount: 29,
    latitude: 6.067_518_3,
    longitude: 80.227_273_2,
    phone: "0912 227 777",
    website: null,
    category: "Medical Center",
  },
  {
    name: "Lanka Hospitals Laboratories",
    address: "57/1 Wakwella Rd, Galle 80000",
    rating: 5.0,
    reviewCount: 20,
    latitude: 6.035_595,
    longitude: 80.216_219_3,
    phone: "0917 223 723",
    website: "http://lhd.lk/",
    category: "Medical Center",
  },
  {
    name: "The German-Sri Lanka Friendship Hospital for Women (Helmut Kohl Memorial Maternity Hospital)",
    address: "369F+GG8, Cross Road, Galle 80000",
    rating: 4.3,
    reviewCount: 65,
    latitude: 6.067_514_9,
    longitude: 80.223_421_2,
    phone: "0912 018 200",
    website: null,
    category: "Government hospital",
  },
  {
    name: "Coop chanelling center",
    address: "368C+WVP, Hirimbura Rd, Galle 80000",
    rating: 2.8,
    reviewCount: 41,
    latitude: 6.067_342_6,
    longitude: 80.222_192_5,
    phone: "0912 228 358",
    website: null,
    category: "Medical Center",
  },
];

export const CATEGORIES = [
  "All",
  "Private hospital",
  "Government hospital",
  "Hospital",
  "Medical Center",
] as const;

export const GALLE_REGION = {
  latitude: 6.0367,
  longitude: 80.217,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
} as const;
