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
    url: "https://randomuser.me/api/portraits/women/37.jpg",
    firstName: "Mersana",
    lastName: "Heydari",
    city: "Tabriz",
    country: "Iran",
    email: "mersana.heydari@suwa.care",
  },
  {
    doctorIndex: 1,
    gender: "women",
    url: "https://randomuser.me/api/portraits/women/89.jpg",
    firstName: "Milla",
    lastName: "Wuori",
    city: "Tuusula",
    country: "Finland",
    email: "milla.wuori@suwa.care",
  },
  {
    doctorIndex: 2,
    gender: "men",
    url: "https://randomuser.me/api/portraits/men/41.jpg",
    firstName: "Albert",
    lastName: "Leclercq",
    city: "Bern",
    country: "Switzerland",
    email: "albert.leclercq@suwa.care",
  },
  {
    doctorIndex: 3,
    gender: "men",
    url: "https://randomuser.me/api/portraits/men/53.jpg",
    firstName: "Giray",
    lastName: "Bademci",
    city: "Istanbul",
    country: "Turkey",
    email: "giray.bademci@suwa.care",
  },
  {
    doctorIndex: 4,
    gender: "women",
    url: "https://randomuser.me/api/portraits/women/61.jpg",
    firstName: "Lotta",
    lastName: "Kallio",
    city: "Helsinki",
    country: "Finland",
    email: "lotta.kallio@suwa.care",
  },
  {
    doctorIndex: 5,
    gender: "men",
    url: "https://randomuser.me/api/portraits/men/93.jpg",
    firstName: "Terry",
    lastName: "Jenkins",
    city: "Dublin",
    country: "Ireland",
    email: "terry.jenkins@suwa.care",
  },
  {
    doctorIndex: 6,
    gender: "women",
    url: "https://randomuser.me/api/portraits/women/95.jpg",
    firstName: "Zeferina",
    lastName: "Ramos",
    city: "Sao Paulo",
    country: "Brazil",
    email: "zeferina.ramos@suwa.care",
  },
  {
    doctorIndex: 7,
    gender: "women",
    url: "https://randomuser.me/api/portraits/women/1.jpg",
    firstName: "Amy",
    lastName: "Miller",
    city: "Toronto",
    country: "Canada",
    email: "amy.miller@suwa.care",
  },
  {
    doctorIndex: 8,
    gender: "women",
    url: "https://randomuser.me/api/portraits/women/43.jpg",
    firstName: "Shahistha",
    lastName: "Dhamdhame",
    city: "Kolkata",
    country: "India",
    email: "shahistha.dhamdhame@suwa.care",
  },
  {
    doctorIndex: 9,
    gender: "women",
    url: "https://randomuser.me/api/portraits/women/15.jpg",
    firstName: "Ariadna",
    lastName: "Garica",
    city: "Guadalajara",
    country: "Mexico",
    email: "ariadna.garica@suwa.care",
  },
];

export const PATIENT_PORTRAIT_SPECS: PortraitSpec[] = [
  {
    doctorIndex: 0,
    gender: "women",
    url: "https://randomuser.me/api/portraits/women/3.jpg",
    firstName: "Nadia",
    lastName: "Chen",
    city: "Vancouver",
    country: "Canada",
    email: "nadia.chen@suwa.care",
  },
  {
    doctorIndex: 1,
    gender: "men",
    url: "https://randomuser.me/api/portraits/men/22.jpg",
    firstName: "Ryo",
    lastName: "Yamamoto",
    city: "Tokyo",
    country: "Japan",
    email: "ryo.yamamoto@suwa.care",
  },
  {
    doctorIndex: 2,
    gender: "women",
    url: "https://randomuser.me/api/portraits/women/65.jpg",
    firstName: "Ingrid",
    lastName: "Sorensen",
    city: "Oslo",
    country: "Norway",
    email: "ingrid.sorensen@suwa.care",
  },
  {
    doctorIndex: 3,
    gender: "men",
    url: "https://randomuser.me/api/portraits/men/78.jpg",
    firstName: "Kwame",
    lastName: "Asante",
    city: "Accra",
    country: "Ghana",
    email: "kwame.asante@suwa.care",
  },
  {
    doctorIndex: 4,
    gender: "women",
    url: "https://randomuser.me/api/portraits/women/12.jpg",
    firstName: "Elena",
    lastName: "Popescu",
    city: "Bucharest",
    country: "Romania",
    email: "elena.popescu@suwa.care",
  },
];

export const SAMPLE_PORTRAIT_URL =
  "https://randomuser.me/api/portraits/women/50.jpg";
export const SAMPLE_THUMBNAIL_URL =
  "https://randomuser.me/api/portraits/thumb/women/50.jpg";
