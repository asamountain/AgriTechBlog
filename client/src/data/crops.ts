export type CropStatus = "planning" | "growing" | "harvest-soon" | "available";

interface Bilingual {
  en: string;
  ko: string;
}

export interface Crop {
  id: string;
  name: Bilingual;
  note: Bilingual;
  status: CropStatus;
  season?: Bilingual;
  price?: Bilingual;
  image?: string;
}

export const CROP_STATUS_LABEL: Record<CropStatus, Bilingual> = {
  planning: { en: "Planning", ko: "계획 중" },
  growing: { en: "Growing", ko: "재배 중" },
  "harvest-soon": { en: "Harvest soon", ko: "수확 임박" },
  available: { en: "Available", ko: "판매 중" },
};

// Edit this list to update the shop page: change `status`, add a `season`, `price` or `image` (a path under /public), or add new crops.
export const CROPS: Crop[] = [
  {
    id: "rye",
    name: { en: "Rye", ko: "호밀" },
    note: {
      en: "Grain and soil-builder. Grown with hairy vetch as green manure; sourdough bread is the idea.",
      ko: "곡물이자 토양을 살리는 작물. 헤어리베치와 함께 녹비로 기르고, 사워도우 빵도 생각 중입니다.",
    },
    status: "planning",
  },
  {
    id: "hairy-vetch",
    name: { en: "Hairy vetch", ko: "헤어리베치" },
    note: {
      en: "Cover crop that feeds the soil alongside rye. A soil-building partner, not a product yet.",
      ko: "호밀과 함께 토양을 살리는 피복작물. 아직 상품은 아니에요.",
    },
    status: "planning",
  },
  {
    id: "kale",
    name: { en: "Kale", ko: "케일" },
    note: {
      en: "Trial crop. Testing whether it grows well and keeps steady quality.",
      ko: "시험 재배 작물. 잘 자라는지, 품질이 일정한지 확인합니다.",
    },
    status: "planning",
  },
  {
    id: "jicama",
    name: { en: "Jicama (yam bean)", ko: "얌빈" },
    note: {
      en: "Trial crop. I'll learn from farms already growing it first.",
      ko: "시험 재배 작물. 이미 기르는 농가에서 먼저 배우려 합니다.",
    },
    status: "planning",
  },
  {
    id: "lemon",
    name: { en: "Lemon", ko: "레몬" },
    note: {
      en: "Trial crop. Trees need land of my own before I can plant them.",
      ko: "시험 재배 작물. 내 땅이 있어야 심을 수 있어요.",
    },
    status: "planning",
  },
  {
    id: "maca",
    name: { en: "Maca", ko: "마카" },
    note: {
      en: "I hear it sells well, but I need to learn it properly before promising anything.",
      ko: "잘 팔린다고 알고 있지만, 제대로 배우기 전에는 약속하지 않으려 합니다.",
    },
    status: "planning",
  },
  {
    id: "honey",
    name: { en: "Honey", ko: "꿀" },
    note: {
      en: "Bees are planned alongside the crops. Honey depends on how they settle in.",
      ko: "작물과 함께 벌도 기를 계획입니다. 꿀은 벌이 자리 잡는 만큼 기대해요.",
    },
    status: "planning",
  },
];
