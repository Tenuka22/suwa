export interface HospitalInfo {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  rating: number;
  reviewCount: number;
  category: string;
  website: string | null;
}

export const hospitals: HospitalInfo[] = [
  { name: "Asiri Hospital Galle", address: "No.10 Wakwella Rd, Galle 80000", rating: 3.7, reviewCount: 725, latitude: 6.0357428, longitude: 80.2159411, phone: "0914 640 640", website: "http://www.asirihealth.com/", category: "Private hospital" },
  { name: "Co-Operative hospital Galle", address: "24 Gamini Mawatha, Galle 80000", rating: 2.2, reviewCount: 634, latitude: 6.036664, longitude: 80.2161146, phone: "0912 234 270", website: null, category: "Private hospital" },
  { name: "Ruhunu Hospital", address: "36CG+2VQ, Galle 80000", rating: 3.5, reviewCount: 692, latitude: 6.0693927, longitude: 80.2271645, phone: "0917 694 059", website: "http://www.ruhunuhospital.lk/", category: "Hospital" },
  { name: "Queensbury Hospitals (Pvt) Ltd", address: "91 Hirimbura Cross Rd, Galle 80000", rating: 4.0, reviewCount: 360, latitude: 6.0623562, longitude: 80.2209782, phone: "0912 270 270", website: "https://www.queensburyhospitals.lk/", category: "Private hospital" },
  { name: "International Medical Center", address: "Galkatiya junction, Unawatuna 80600", rating: 4.8, reviewCount: 302, latitude: 6.0235217, longitude: 80.2472245, phone: "074 243 0000", website: "http://imcsrilanka.com/", category: "Hospital" },
  { name: "Lanka Hospitals Medical Center", address: "57 Wakwella Rd, Galle 80000", rating: 3.8, reviewCount: 10, latitude: 6.0356288, longitude: 80.2163791, phone: "074 202 4611", website: "https://www.lankahospitals.com/en/", category: "Medical Center" },
  { name: "Sahana Medical Centre & Laboratory Complex", address: "Mapalagama Bus Rd, Galle 80000", rating: 3.6, reviewCount: 29, latitude: 6.0675183, longitude: 80.2272732, phone: "0912 227 777", website: null, category: "Medical Center" },
  { name: "Lanka Hospitals Laboratories", address: "57/1 Wakwella Rd, Galle 80000", rating: 5.0, reviewCount: 20, latitude: 6.035595, longitude: 80.2162193, phone: "0917 223 723", website: "http://lhd.lk/", category: "Medical Center" },
  { name: "The German-Sri Lanka Friendship Hospital for Women", address: "369F+GG8, Cross Road, Galle 80000", rating: 4.3, reviewCount: 65, latitude: 6.0675149, longitude: 80.2234212, phone: "0912 018 200", website: null, category: "Government hospital" },
  { name: "Coop chanelling center", address: "368C+WVP, Hirimbura Rd, Galle 80000", rating: 2.8, reviewCount: 41, latitude: 6.0673426, longitude: 80.2221925, phone: "0912 228 358", website: null, category: "Medical Center" },
];

const WORD_SPLIT = /[^a-z0-9]+/;

export function searchHospitals(query: string): HospitalInfo[] {
  if (!query.trim()) {
    return hospitals;
  }
  const q = query.toLowerCase();
  const tokens = q.split(WORD_SPLIT).filter(Boolean);

  return hospitals.filter((h) => {
    const name = h.name.toLowerCase();
    const address = h.address.toLowerCase();
    const category = h.category.toLowerCase();

    return tokens.some(
      (token) =>
        name.includes(token) ||
        address.includes(token) ||
        category.includes(token)
    );
  });
}
