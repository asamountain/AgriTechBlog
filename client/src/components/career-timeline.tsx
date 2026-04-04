import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";

// ─── Config ───────────────────────────────────────────────────────────────────
// Set to false to display "San" instead of the real name in the header
const SHOW_REAL_NAME = false;

type Thread = "farm" | "tech" | "well";
type DotType = "current" | "hollow" | "cert" | "default";

interface EntryContent {
  title: string;
  place: string;
  insight: string;
  detail: {
    summary: string;
    skills: string[];
    bullets: string[];
  };
}

interface Entry {
  id: string;
  date: { ko: string; en: string };
  dotType: DotType;
  threads: Thread[];
  isCert?: boolean;
  // Optional: drop an image URL here to show a photo in the detail panel.
  // Use a public/ path like "/images/iocrops.jpg" or a full Cloudinary URL.
  image?: string;
  ko: EntryContent;
  en: EntryContent;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const FarmIcon = ({ size = 16, color = "#4a7c59" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 21V11" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M12 11C10.5 9 8 9 6.5 10.5C5 12 6 14 7.5 14.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill={color} fillOpacity="0.1" />
    <path d="M12 11C13.5 9 16 9 17.5 10.5C19 12 18 14 16.5 14.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill={color} fillOpacity="0.1" />
    <path d="M12 8C11.2 6 11.5 4 12 3C12.5 4 12.8 6 12 8Z" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.15" />
    <path d="M7 21H17" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
const TechIcon = ({ size = 16, color = "#3a6b8c" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="8" y="8" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.06" />
    <circle cx="12" cy="12" r="2" fill={color} fillOpacity="0.3" />
    <line x1="12" y1="8" x2="12" y2="4" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    <line x1="12" y1="20" x2="12" y2="16" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    <line x1="8" y1="12" x2="4" y2="12" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    <line x1="20" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    <line x1="9.2" y1="9.2" x2="6.5" y2="6.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="3.5" r="1.2" stroke={color} strokeWidth="0.9" />
    <circle cx="12" cy="20.5" r="1.2" stroke={color} strokeWidth="0.9" />
    <circle cx="3.5" cy="12" r="1.2" stroke={color} strokeWidth="0.9" />
    <circle cx="20.5" cy="12" r="1.2" stroke={color} strokeWidth="0.9" />
  </svg>
);
const WellIcon = ({ size = 16, color = "#8b6b4a" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 20C12 20 12 15 12 13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M12 13C9.5 11 7 11.5 6 14C5 16.5 8.5 18 12 20C15.5 18 19 16.5 18 14C17 11.5 14.5 11 12 13Z" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.08" />
    <path d="M9.5 11.5C8.5 9.5 7.5 8 6.5 8.5C5.5 9 6.5 11 8 12.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" fill={color} fillOpacity="0.06" />
    <path d="M14.5 11.5C15.5 9.5 16.5 8 17.5 8.5C18.5 9 17.5 11 16 12.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" fill={color} fillOpacity="0.06" />
    <path d="M12 9C11.5 7 11.8 5 12 3.5C12.2 5 12.5 7 12 9Z" stroke={color} strokeWidth="1.1" fill={color} fillOpacity="0.12" />
    <circle cx="12" cy="3" r="0.8" fill={color} fillOpacity="0.3" />
  </svg>
);

const THREAD_ICONS: Record<Thread, (s: number) => JSX.Element> = {
  farm: (s) => <FarmIcon size={s} color="#4a7c59" />,
  tech: (s) => <TechIcon size={s} color="#3a6b8c" />,
  well: (s) => <WellIcon size={s} color="#8b6b4a" />,
};
const THREAD_BG: Record<Thread, string> = {
  farm: "rgba(74,124,89,0.1)",
  tech: "rgba(58,107,140,0.1)",
  well: "rgba(139,107,74,0.1)",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
// To add a photo to an entry, set `image: "/images/your-photo.jpg"` (place file
// in client/public/images/) or use a full Cloudinary URL.
const ENTRIES: Entry[] = [
  {
    id: "iocrops",
    date: { ko: "2025.06 – 현재", en: "Jun 2025 – Present" },
    dotType: "current",
    threads: ["farm", "tech"],
    // image: "/images/iocrops.jpg",
    ko: {
      title: "ioCrops · IoT 하드웨어 QA 엔지니어",
      place: "본업",
      insight: "농업이 기술을 만나는 곳 — 마침내.",
      detail: {
        summary: "RS-485/Modbus 기반 IoT 센서 하드웨어 품질 보증 엔지니어로 근무. 스마트팜 데이터 파이프라인 전반을 검증하며, 하드웨어·소프트웨어 경계를 직접 다루는 역할.",
        skills: ["RS-485 / Modbus 프로토콜", "IoT 하드웨어 QA", "센서 데이터 파이프라인 검증", "스마트팜 시스템"],
        bullets: [
          "물리 센서 → Modbus 레지스터 파싱 → Node.js 백엔드 → 웹 UI 전 구간 QA",
          "캘리브레이션 계수(K값) 검증 및 하드웨어 회귀 테스트",
          "내부 AgriTech 블로그 플랫폼 풀스택 개발 병행",
        ],
      },
    },
    en: {
      title: "ioCrops · IoT Hardware QA Engineer",
      place: "Current Role",
      insight: "Where farming meets technology — finally.",
      detail: {
        summary: "QA engineer for RS-485/Modbus-based IoT sensor hardware at a Korean smart-farm company. Owns the full sensor data pipeline from physical hardware to web UI.",
        skills: ["RS-485 / Modbus Protocol", "IoT Hardware QA", "Sensor Data Pipeline Validation", "Smart Farm Systems"],
        bullets: [
          "End-to-end QA: physical sensor → Modbus register parsing → Node.js backend → web UI",
          "Calibration coefficient (K-value) verification and hardware regression testing",
          "Parallel full-stack development of internal AgriTech blog platform",
        ],
      },
    },
  },
  {
    id: "workaway",
    date: { ko: "2024.06 – 2024.09", en: "Jun 2024 – Sep 2024" },
    dotType: "default",
    threads: ["farm", "tech"],
    // image: "/images/workaway-thailand.jpg",
    ko: {
      title: "Workaway — 사하이난 (태국) · A Little Wild (말레이시아)",
      place: "태국 · 말레이시아 조호르바루",
      insight: "테크 없이는 작동하는 농업 모델이 없다 — 전향 결심.",
      detail: {
        summary: "태국과 말레이시아 퍼머컬처 농장에서 약 4개월 Workaway 체류. 사진·영상 콘텐츠 자산을 농장에 제공하며 재능 교환. 현장에서 직접 만난 대부분의 농가가 자급자족도, 충분한 수입도 얻지 못하는 현실을 확인.",
        skills: ["퍼머컬처 농업 실습", "재능 교환 제안 / 영업", "농업 비즈니스 모델 분석", "사진·영상 제작"],
        bullets: [
          "자연 자원 × 설계 결합 시 생태계 전체가 달라지는 과정 현장 목격",
          "거제 한 달살기 — 이장님 라포 구축, 벌통 50동 농가 3억 제안 받음 (ROI 불투명 → 투자 내려놓음)",
          "\"테크 없이는 작동하는 농업 모델이 없다\" — 엔지니어로의 전향 결심",
        ],
      },
    },
    en: {
      title: "Workaway — Sahainan (Thailand) · A Little Wild (Malaysia)",
      place: "Thailand · Johor Bahru, Malaysia",
      insight: "No viable farming model exists without technology — decision to pivot.",
      detail: {
        summary: "~4 months Workaway stay at permaculture farms in Thailand and Malaysia. Provided photo/video content assets in talent exchange. Directly observed that most farmers couldn't achieve self-sufficiency or sufficient income.",
        skills: ["Permaculture Farming Practice", "Talent Exchange Proposal / Sales", "Agricultural Business Model Analysis", "Photo & Video Production"],
        bullets: [
          "Witnessed how natural resource × intentional design transforms an entire ecosystem",
          "Geoje month-long stay — built rapport with village head, received offer for 50+ hive farm (300M KRW); declined due to unclear ROI",
          "Confirmed: no functioning farming model exists without technology → decision to become a tech engineer",
        ],
      },
    },
  },
  {
    id: "justbe",
    date: { ko: "2022.11 – 2023.12", en: "Nov 2022 – Dec 2023" },
    dotType: "default",
    threads: ["farm", "well"],
    // image: "/images/justbe-rooftop.jpg",
    ko: {
      title: "JustBe Temple (홍대) — 에코비 운영",
      place: "홍대, 서울",
      insight: "옥상 정원, 생태 커뮤니티 — 도시 속 농업 실천.",
      detail: {
        summary: "명상 요가 그룹에 사진·영상 지원으로 합류 후 JustBe Temple 프로젝트로 확장. 영업·홍보·PM 역할을 동시에 수행하며 옥상 허브류·토종 식물 21동 직접 재배, 찻잎 보카시 퇴비 순환 구조 구축.",
        skills: ["사진·영상 제작 및 브랜드 홍보", "옥상 정원 PM", "생태 순환 설계 (보카시 퇴비)", "커뮤니티 빌딩"],
        bullets: [
          "옥상 허브·토종 식물 21동 재배, 수확한 공심채 직접 식용",
          "외부 Wellness College 연계, 비건 커뮤니티(선재스님, nonoshop)와 접점 형성",
          "혼자 시작 → 직접 제안해 2–3인 합류, 목적 공유로 조화로운 협력 이끌어냄",
          "현재 미국인 아내를 여기서 만남 — 캘리포니아 농장의 꿈",
        ],
      },
    },
    en: {
      title: "JustBe Temple (Hongdae) — Eco Community Manager",
      place: "Hongdae, Seoul",
      insight: "Rooftop garden, eco community — practicing urban agriculture.",
      detail: {
        summary: "Joined a meditation yoga group as photo/video support; expanded to full JustBe Temple project. Simultaneously handled sales, PR, and PM roles. Grew 21 pots of rooftop herbs and native plants; built a bokashi composting cycle.",
        skills: ["Photo/Video Production & Brand PR", "Rooftop Garden PM", "Ecological System Design (Bokashi)", "Community Building"],
        bullets: [
          "Grew 21 pots of rooftop herbs and native plants; harvested and ate water spinach on-site",
          "Connected with Wellness College, Seonjae Sunim, nonoshop — linked naturally to vegan community",
          "Started solo → recruited 2–3 people through direct proposal; led harmonious collaboration toward shared purpose",
          "Met current American wife here — shared dream of farming in California",
        ],
      },
    },
  },
  {
    id: "wellness-cert",
    date: { ko: "2023.08 – 2023.10", en: "Aug – Oct 2023" },
    dotType: "cert",
    threads: ["well"],
    isCert: true,
    // image: "/images/wellness-cert.jpg",
    ko: {
      title: "웰니스 전문가 LV2 · 마음챙김 실천 강사 수료",
      place: "O2F 산소발자국 · Wellness College (Ashoton Cho Ph.D · 21h)",
      insight: "웰니스, 이제 자격으로 증명하다.",
      detail: {
        summary: "Wellness Expert Level 2 자격 취득 (O2F 산소발자국) 및 Mindfulness Practical Instructor 수료 (Wellness College, Ashoton Cho Ph.D, 7주 21시간).",
        skills: ["마음챙김 기반 지도", "웰니스 전문가 자격"],
        bullets: [
          "Wellness Expert LV2 자격 취득 — O2F 산소발자국",
          "Mindfulness Practical Instructor 수료 — 7주 21시간 과정",
          "마음챙김을 가르치는 사람이 되다",
        ],
      },
    },
    en: {
      title: "Wellness Expert LV2 · Mindfulness Practical Instructor",
      place: "O2F · Wellness College (Ashoton Cho Ph.D · 21h, 7 weeks)",
      insight: "Wellness — now certified.",
      detail: {
        summary: "Obtained Wellness Expert Level 2 certification (O2F) and completed Mindfulness Practical Instructor program (Wellness College, Ashoton Cho Ph.D, 7 weeks / 21 hours).",
        skills: ["Mindfulness-Based Instruction", "Wellness Expert Certification"],
        bullets: [
          "Wellness Expert LV2 — O2F 산소발자국",
          "Mindfulness Practical Instructor — 7-week / 21-hour program",
          "Qualified to teach mindfulness practices",
        ],
      },
    },
  },
  {
    id: "yeongwol",
    date: { ko: "2021.11 – 2022.04", en: "Nov 2021 – Apr 2022" },
    dotType: "default",
    threads: ["farm"],
    // image: "/images/yeongwol.jpg",
    ko: {
      title: "영월 청년마을만들기 활동",
      place: "영월",
      insight: "브랜딩, 스토리텔링, 정부 지원금 수주 — 창농 연습.",
      detail: {
        summary: "마케팅·홍보 담당자로 활동. \"왜\"부터 파고들어 공동체 리드들의 이야기를 직접 채집. 나뭇잎 밭 이미지를 스토리 핵심으로 설계해 정부 지원금 수주 발표에 사용 → 수주 성공.",
        skills: ["브랜딩 / 스토리텔링", "정부 지원금 수주", "숨겨진 가치 발굴·연결", "글로벌 컨택"],
        bullets: [
          "\"렉서스가 먼저 알아봤다\" 프레임 → 지원금 수주 발표에 실제 사용 → 성공",
          "David Holmgren 퍼머컬처 재단에 영어로 직접 컨택",
          "재생 가능 기술 학습을 위해 스트로베일 건축 현장 합류 (비윤리적 시공 발견 후 이탈)",
        ],
      },
    },
    en: {
      title: "Yeongwol Youth Village-Building Project",
      place: "Yeongwol",
      insight: "Branding, storytelling, government grant won — farming rehearsal.",
      detail: {
        summary: "Marketing & PR manager. Dug into 'why' first — directly collected stories from community leaders. Designed a leaf-field narrative as the core story, used it in a grant pitch → successfully secured funding.",
        skills: ["Branding / Storytelling", "Government Grant Secured", "Hidden Value Discovery & Connection", "Global Outreach"],
        bullets: [
          "\"Lexus noticed it first\" framing → used in actual grant pitch → won",
          "Directly contacted David Holmgren's Permaculture Foundation in English",
          "Joined straw-bale construction site for renewable tech learning (departed after discovering unethical practices)",
        ],
      },
    },
  },
  {
    id: "vipassana",
    date: { ko: "2021.05 – 2021.08", en: "May 2021 – Aug 2021" },
    dotType: "default",
    threads: ["well"],
    // image: "/images/vipassana.jpg",
    ko: {
      title: "담마코리아 위빳사나 · 정관스님 주방 수련",
      place: "담마코리아 · 사찰 공양간",
      insight: "감정을 다스리는 법 — 고요 속에서 방향을 찾다.",
      detail: {
        summary: "담마코리아 위빳사나 10일 이상 침묵 수행·봉사로 감정 조절 방식을 내면에서 재정비. 이후 정관스님 주방에서 매섭고 어려운 환경 속 즉각적 보상 없이 버티는 훈련.",
        skills: ["집중력", "팔로워십", "심리적 회복력", "감정 조절"],
        bullets: [
          "10일 이상 완전 침묵 수행 및 봉사 — 감정 다루는 방식 재정비",
          "정관스님 주방: 매섭고 어려운 환경에서 즉각 보상 없이 버티는 훈련",
          "건강한 음식이란 무엇인가에 대한 깊은 이해",
        ],
      },
    },
    en: {
      title: "Dhamma Korea Vipassana · Jeongkwan Sunim's Temple Kitchen",
      place: "Dhamma Korea · Temple Kitchen",
      insight: "Learning to manage emotion — finding direction in silence.",
      detail: {
        summary: "10+ days of silent Vipassana meditation and service at Dhamma Korea, rebuilding emotional regulation from the inside. Followed by Jeongkwan Sunim's kitchen — training to persist in a demanding environment without immediate reward.",
        skills: ["Focus", "Followership", "Psychological Resilience", "Emotional Regulation"],
        bullets: [
          "10+ days of complete silence — restructured emotional response patterns from within",
          "Temple kitchen: persisted in a demanding environment without immediate rewards",
          "Deep understanding of what constitutes truly healthy food",
        ],
      },
    },
  },
  {
    id: "marketing",
    date: { ko: "2017.11 – 2021.04", en: "Nov 2017 – Apr 2021" },
    dotType: "default",
    threads: ["tech"],
    // image: "/images/youtube-channel.jpg",
    ko: {
      title: "퍼포먼스 마케팅 · 유튜브 채널 운영",
      place: "온누리 인턴 · 유튜브 채널 (구독 4,500명)",
      insight: "데이터 기반 판단, 무에서 유 창조, 스폰서십 수주.",
      detail: {
        summary: "퍼포먼스 마케팅 인턴으로 데이터/숫자 기반 정밀 판단 체득. Python + Selenium으로 반복 업무 자동화. 고양이 구조 유튜브 채널 운영 — 구독자 4,500명, $2,000/월 스폰서십 수주.",
        skills: ["Data-Based ROI Analysis", "Python + Selenium 자동화", "스폰서십 피칭·수주", "스토리 기반 콘텐츠 마케팅"],
        bullets: [
          "진정성 콘텐츠가 조작된 댓글보다 전환율이 높다는 것을 데이터로 확인",
          "이제너두 본부장과 콜라보 → $2,000/월 스폰서십 수주",
          "발리 공예품·친환경 비닐 트레이더와 연결 — 소셜 임팩트 비즈니스 플랜 구상",
          "Python + Selenium 반복 업무 자동화로 효율 극대화",
        ],
      },
    },
    en: {
      title: "Performance Marketing · YouTube Channel (4,500 Subscribers)",
      place: "Onnuri Intern · YouTube Channel",
      insight: "Data-driven decisions, something-from-nothing, sponsorship closed.",
      detail: {
        summary: "Performance marketing intern: precision data-driven decision making. Automated repetitive tasks with Python + Selenium. Grew a cat rescue YouTube channel to 4,500 subscribers and secured $2,000/month sponsorship.",
        skills: ["Data-Based ROI Analysis", "Python + Selenium Automation", "Sponsorship Pitch & Close", "Story-Based Content Marketing"],
        bullets: [
          "Data-confirmed: authentic content outconverts fabricated engagement",
          "Collaborated with Jeanerado division head → closed $2,000/month sponsorship",
          "Connected Bali craft + eco-vinyl trader → drafted social impact business plan",
          "Python + Selenium automation to maximize operational efficiency",
        ],
      },
    },
  },
  {
    id: "workingholiday",
    date: { ko: "2015.04 – 2017.08", en: "Apr 2015 – Aug 2017" },
    dotType: "default",
    threads: ["farm"],
    // image: "/images/australia-farm.jpg",
    ko: {
      title: "프랑스 · 호주 워킹홀리데이",
      place: "파리 게스트하우스 · Sweet Strawberry Farm (호주)",
      insight: "더 큰 세상을 꿈꾸며 — 처음으로 흙을 만지다.",
      detail: {
        summary: "프랑스(2015–2016): 파리 게스트하우스 도착 당일 일자리 수소문 → 쿡 스태프 채용. 한국어 과외 직접 홍보 → 3명 학생 확보. 호주(2016–2017): Sweet Strawberry Farm·Craxcorp 딸기 패키징·수확·팔레트 잭 — 자동화 필요성 체감.",
        skills: ["콜드 어프로치 / 직접 영업", "언어 적응력 (프랑스어·영어)", "농업 현장 노동 경험", "다국적 환경 협업"],
        bullets: [
          "이력서 들고 식당 문 두드림 — 도착 당일 쿡 스태프 제안 수락",
          "대학교 게시판에 직접 홍보 → 한국어 과외 학생 3명 확보",
          "딸기 농장 장시간 단순 반복 노동 → 자동화 필요성 체감",
          "북한 출신 동료 포함 다국적 팀에서 협업",
        ],
      },
    },
    en: {
      title: "Working Holiday — France & Australia",
      place: "Paris Guesthouse · Sweet Strawberry Farm (Australia)",
      insight: "Dreaming of a bigger world — first time touching soil.",
      detail: {
        summary: "France (2015–2016): Arrived in Paris, found work as cook staff the same day through cold outreach. Flyered university campus → 3 Korean tutoring students. Australia (2016–2017): Sweet Strawberry Farm & Craxcorp — strawberry packaging, snow bean harvesting, pallet jack.",
        skills: ["Cold Approach / Direct Sales", "Language Adaptation (French, English)", "Agricultural Field Labor", "Multicultural Collaboration"],
        bullets: [
          "Walked into restaurants with CV on day of arrival → accepted cook staff position same day",
          "Flyered university campus → secured 3 Korean tutoring students",
          "Repetitive manual farm labor → visceral understanding of why automation is necessary",
          "Collaborated in multinational team including North Korean colleague",
        ],
      },
    },
  },
  {
    id: "army",
    date: { ko: "2009.09 – 2011.07", en: "Sep 2009 – Jul 2011" },
    dotType: "default",
    threads: [],
    // image: "/images/army-dmz.jpg",
    ko: {
      title: "대한민국 육군 — 22사단 56연대",
      place: "강원도 고성 DMZ 최전방 (717 OP) · 병장 만기전역",
      insight: "인내와 규율 — 병장 만기전역.",
      detail: {
        summary: "소총병 → 통신병 → 소대장 부사수 → 분대장. 매일 메모·기록 습관이 자연스러운 분대장 추천으로 이어짐. 갈등 상황에서 강압 대신 차담·경청으로 평화적 해결. 포상 4회 수상.",
        skills: ["자기개발 지향", "기록·보고 규율 (매일 메모)", "불확실 환경 즉각 판단", "갈등의 평화적 해결"],
        bullets: [
          "GOP작전유공 — DMZ 내 지뢰 최초 발견 후 보고",
          "대대장 유공 표창 — 경계 작전 매우 우수",
          "야간사격조교 우수 — 높은 명중률로 선발, 부대원 훈련 담당",
          "병영생활공감 아이디어 3등 — 초병 행동동선 개선안 건의",
          "전역 후 국토대장정 안전 스태프 (2019) — 독도→임진각, 장애인 동행",
        ],
      },
    },
    en: {
      title: "Republic of Korea Army — 22nd Div., 56th Regiment",
      place: "DMZ Front Line, Goseong, Gangwon (717 OP) · Honorably discharged",
      insight: "Endurance and discipline — honorably discharged.",
      detail: {
        summary: "Rifleman → Signal Corps → Squad Leader's Assistant → Squad Leader. Daily memo/note habit naturally led to squad leader recommendation. Resolved conflicts through tea and conversation instead of confrontation. 4 commendations.",
        skills: ["Self-Development Orientation", "Daily Journaling / Reporting Discipline", "Quick Judgment in Uncertain Environments", "Conflict Resolution Through Listening"],
        bullets: [
          "GOP Operations Merit — first to discover and report landmine in DMZ",
          "Battalion Commander Commendation — exceptional patrol performance",
          "Night Shooting Instructor Excellence — selected for high accuracy, trained unit members",
          "Barracks Life Innovation Award (3rd) — improvement proposal for sentry patrol routes",
          "Post-service: Korea National March safety staff (2019) — Dokdo → Imjingak, inclusive of disabled participants",
        ],
      },
    },
  },
  {
    id: "undergrad",
    date: { ko: "2008.03 – 2015.02", en: "Mar 2008 – Feb 2015" },
    dotType: "hollow",
    threads: [],
    // image: "/images/university.jpg",
    ko: {
      title: "학부 과정",
      place: "중등특수교육 / 호텔외식조리 복수전공",
      insight: "모든 것의 시작.",
      detail: {
        summary: "중등특수교육·호텔외식조리 복수전공. 특수교육은 약자를 돌보는 일이 체질에 맞는다는 것을 확인. 조리학과는 아버지 췌장 수술 후 음식으로 건강해지는 길을 선택. 문산고등학교 특수교사 재직(2016.03–08).",
        skills: ["문제행동 RCA (근본 원인 분석)", "개별화 접근 설계", "다학문적 문제접근", "교사 자격증 (중등특수교육)"],
        bullets: [
          "특수교육: 약자 돌봄이 체질 — 교사 자격증은 삶의 안정적 기반",
          "조리학과: 아버지 췌장 수술 → 음식이 곧 건강이라는 확신",
          "문산고 특수교사(2016): 문제행동 뿌리는 대부분 관심 결핍 또는 자기부정",
          "남들과 다른 방향으로 — 차별화 전략의 시작",
        ],
      },
    },
    en: {
      title: "Undergraduate Studies",
      place: "Double Major: Special Education / Hotel & Culinary Arts",
      insight: "Where everything began.",
      detail: {
        summary: "Double major in Special Education and Hotel & Culinary Arts. Special education confirmed that caring for the vulnerable fits — teaching certification as permanent life insurance. Culinary track after father's pancreatic surgery. Taught at Munsan High School (2016).",
        skills: ["Problem Behavior RCA (Root Cause Analysis)", "Individualized Approach Design", "Multidisciplinary Problem Solving", "Teaching Certification (Special Education)"],
        bullets: [
          "Special Education: confirmed caring for the vulnerable is in my nature; certification = lifetime safety net",
          "Culinary Arts: father's pancreatic surgery → food is health — chose this path when others went to the gym",
          "Munsan High School special ed teacher (2016): most problem behavior rooted in lack of attention or self-denial",
          "Deliberately chose the road not taken — differentiation strategy began here",
        ],
      },
    },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function CareerTimeline() {
  const { lang } = useLanguage();
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [imageMap, setImageMap] = useState<Record<string, string[]>>({});

  const setRowRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  }, []);

  useEffect(() => {
    fetch('/api/admin/timeline-images')
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, { images?: string[]; imageUrl?: string }>) => {
        const map: Record<string, string[]> = {};
        for (const [id, v] of Object.entries(data)) {
          map[id] = Array.isArray(v.images) ? v.images.filter(Boolean)
            : v.imageUrl ? [v.imageUrl] : [];
        }
        setImageMap(map);
      })
      .catch(() => {});
  }, []);

  // Scroll-driven reveal / collapse
  useEffect(() => {
    const els = Array.from(rowRefs.current.entries());
    if (els.length === 0) return;

    // Reveal: fires when top of entry crosses 60% viewport height
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = (e.target as HTMLElement).dataset.entryId;
            if (id) setRevealedIds((prev) => { const next = new Set(prev); next.add(id); return next; });
          }
        });
      },
      { rootMargin: "0px 0px -40% 0px", threshold: 0 }
    );

    // Collapse: fires when entry goes fully below viewport (scroll back up)
    const collapseObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          // When the element is NOT intersecting AND its top is below viewport → it scrolled out downward
          if (!e.isIntersecting && e.boundingClientRect.top > 0) {
            const id = (e.target as HTMLElement).dataset.entryId;
            if (id) setRevealedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
          }
        });
      },
      { rootMargin: "200% 0px -5px 0px", threshold: 0 }
    );

    els.forEach(([, el]) => { revealObs.observe(el); collapseObs.observe(el); });
    return () => { revealObs.disconnect(); collapseObs.disconnect(); };
  }, [imageMap]); // re-attach after images load (DOM may shift)

  const t = (entry: Entry) => entry[lang];

  const THREAD_LABELS: Record<"farm" | "tech" | "well", { ko: string; en: string }> = {
    farm: { ko: "농업인", en: "Farmer" },
    tech: { ko: "테크", en: "Tech-savvy" },
    well: { ko: "웰니스", en: "Wellness" },
  };

  return (
    /* py: 55px, px: 21px — Fibonacci golden-ratio rhythm */
    <section className="bg-white" style={{ padding: "55px 21px", fontFamily: "'EB Garamond', 'Noto Sans KR', serif" }}>

      {/* Timeline */}
      <div className="relative max-w-4xl mx-auto" style={{ paddingTop: 10, paddingBottom: 10 }}>
        {/* Center line */}
        <div className="absolute top-0 bottom-0 bg-gray-200" style={{ left: "50%", width: "1px", transform: "translateX(-50%)" }} />

        {ENTRIES.map((entry, i) => {
          const content = t(entry);
          const isActive = revealedIds.has(entry.id);

          return (
            <div key={entry.id} style={{ marginBottom: 13 }} ref={setRowRef(entry.id)} data-entry-id={entry.id}>
              {/* Row */}
              <div
                className="relative flex items-start"
                style={{ minHeight: 55 }}
              >
                {/* Date — left */}
                <div className="text-right pr-7" style={{ width: "calc(50% - 4px)" }}>
                  <span className="text-xs text-gray-500" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.3px" }}>
                    {entry.date[lang]}
                  </span>
                </div>

                {/* Dot */}
                <div className="absolute" style={{ left: "50%", top: 10, transform: "translateX(-50%)", zIndex: 2 }}>
                  {entry.dotType === "current" && (
                    <div className="rounded-full" style={{ width: 10, height: 10, background: "var(--forest-green, #2D5016)", boxShadow: "0 0 0 3px #ffffff, 0 0 0 4.5px var(--forest-green, #2D5016)" }} />
                  )}
                  {entry.dotType === "hollow" && (
                    <div className="rounded-full" style={{ width: 9, height: 9, background: "#ffffff", border: "1.5px solid #9ca3af" }} />
                  )}
                  {entry.dotType === "cert" && (
                    <div style={{ width: 10, height: 10, background: "#8b6b4a", borderRadius: 2, transform: "translateX(-50%) rotate(45deg)", marginLeft: "50%" }} />
                  )}
                  {entry.dotType === "default" && (
                    <div className="rounded-full transition-transform duration-150" style={{ width: 8, height: 8, background: isActive ? "var(--forest-green, #2D5016)" : "#9ca3af", transform: isActive ? "scale(1.4)" : "scale(1)" }} />
                  )}
                </div>

                {/* Content — right */}
                <div className="pl-7" style={{ width: "calc(50% - 4px)" }}>
                  {entry.isCert && (
                    <div className="inline-block mb-1 px-1.5 py-0.5 rounded" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.8px", textTransform: "uppercase", color: "#8b6b4a", border: "1px solid #8b6b4a", opacity: 0.85 }}>
                      certification
                    </div>
                  )}
                  <div className="flex items-start gap-1.5">
                    <div className="text-sm font-medium leading-tight flex-1 text-gray-900">{content.title}</div>
                    {entry.threads.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0 mt-0.5">
                        {entry.threads.map((th) => (
                          <div key={th} className="flex items-center justify-center rounded" style={{ width: 22, height: 22, background: THREAD_BG[th] }} title={th}>
                            {THREAD_ICONS[th](14)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {content.place && (
                    <div className="text-xs mt-0.5 leading-tight text-gray-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {content.place}
                    </div>
                  )}
                  <div className="text-xs italic mt-1 leading-relaxed text-gray-400" style={{ fontFamily: "'EB Garamond', serif", fontSize: 13 }}>
                    {content.insight}
                  </div>
                </div>
              </div>

              {/* Detail panel */}
              <div
                className="relative overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: isActive ? 700 : 0, opacity: isActive ? 1 : 0, zIndex: 1 }}
              >
                <div
                  className="mb-4 rounded-xl p-5 border"
                  style={{
                    background: "#f9fafb",
                    borderColor: "#e5e7eb",
                  }}
                >
                  {(() => {
                    const imgs = entry.image
                      ? [entry.image]
                      : (imageMap[entry.id] || []);
                    return imgs.length > 0 ? (
                      <div
                        className={`grid gap-2 mb-4 ${imgs.length === 1 ? 'grid-cols-1' : imgs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
                      >
                        {imgs.map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt={`${content.title} ${i + 1}`}
                            className="w-full rounded-lg object-cover"
                            style={{ height: imgs.length === 1 ? 260 : 180 }}
                          />
                        ))}
                      </div>
                    ) : null;
                  })()}
                  <div className="flex gap-4 flex-col">
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed mb-3 text-gray-700" style={{ fontFamily: "'EB Garamond', serif", fontSize: 14 }}>
                        {content.detail.summary}
                      </p>

                      {content.detail.bullets.length > 0 && (
                        <ul className="mb-3 space-y-1">
                          {content.detail.bullets.map((b, bi) => (
                            <li key={bi} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="mt-1.5 flex-shrink-0 rounded-full" style={{ width: 4, height: 4, background: "var(--forest-green, #2D5016)", display: "inline-block" }} />
                              <span className="text-gray-600" style={{ fontFamily: "'EB Garamond', serif", fontSize: 13 }}>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {content.detail.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-full text-gray-500"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, background: "rgba(45,80,22,0.06)", letterSpacing: "0.2px" }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
}
      </div>

      {/* Footer */}
      <div className="text-center mt-12 pt-8 max-w-4xl mx-auto border-t border-gray-100">
        <p className="italic leading-relaxed text-gray-400" style={{ fontFamily: "'EB Garamond', serif", fontSize: 14 }}>
          {lang === "ko"
            ? "모든 우회로는 준비였다.\n흙, 코드, 고요 — 그것들은 언제나 같은 길이었다."
            : "Every detour was preparation.\nThe soil, the code, the silence — they were always the same path."}
        </p>
        <div className="flex justify-center gap-7 mt-4">
          {(["farm", "tech", "well"] as Thread[]).map((th) => (
            <div key={th} className="flex items-center gap-1.5 text-xs text-gray-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {THREAD_ICONS[th](14)}
              {THREAD_LABELS[th][lang]}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
