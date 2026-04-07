import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useLanguage } from "@/contexts/language-context";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface TimelineEntry {
  year: string;
  imageId: string;
  title: { en: string; ko: string };
  story: { en: string; ko: string };
  accent?: string;
}

const TIMELINE: TimelineEntry[] = [
  {
    year: "2008–2015",
    imageId: "undergrad",
    title: {
      en: "University — Special Education & Culinary Arts",
      ko: "학부 — 중등특수교육 / 호텔외식조리 복수전공",
    },
    story: {
      en: "Caring for the vulnerable was in my DNA. When my father had major pancreas surgery, I saw how food is health. While everyone turned to exercise, I chose the kitchen — a different path to the same goal.",
      ko: "약자를 돌보는 일이 체질이었습니다. 아버지의 큰 췌장 수술을 겪으며, 먹는 것이 곧 건강이라는 확신을 얻었습니다. 모두가 운동으로 건강을 찾을 때, 저는 다른 길을 선택했습니다.",
    },
  },
  {
    year: "2009–2011",
    imageId: "army",
    title: {
      en: "Korean Army — DMZ Frontline, 22nd Division",
      ko: "대한민국 육군 — 22사단 56연대, DMZ 최전방",
    },
    story: {
      en: "Rifleman → signalman → squad leader. Daily journaling became a habit that earned natural trust. When conflicts arose, I chose tea and conversation over force. Four commendations, including first landmine discovery in the DMZ.",
      ko: "소총병에서 분대장까지. 매일 메모하는 습관이 자연스러운 신뢰로 이어졌습니다. 갈등이 생기면 차를 나누며 이야기를 들었습니다. GOP작전유공 등 포상 4회 수상.",
    },
  },
  {
    year: "2015–2017",
    imageId: "workingholiday",
    title: {
      en: "France & Australia — Working Holidays",
      ko: "프랑스 · 호주 워킹홀리데이",
    },
    story: {
      en: "Walked into a Paris guesthouse with my resume on day one and landed a kitchen job. In Australia, I packed strawberries and hauled pallets for months. The grueling repetition of farm labor planted a seed: there has to be a better way. Automation isn't optional — it's essential.",
      ko: "파리 도착 당일 이력서를 들고 직접 문을 두드려 주방 스태프로 일했습니다. 호주에서는 딸기 패키징과 팔레트 운반을 수개월간. 장시간 단순 반복 노동의 현실이 하나의 씨앗을 심었습니다 — 자동화는 선택이 아니라 필수라는 것.",
    },
  },
  {
    year: "2017–2021",
    imageId: "marketing",
    title: {
      en: "Performance Marketing & YouTube",
      ko: "퍼포먼스 마케팅 · 유튜브",
    },
    story: {
      en: "Discovered the explosive power of data and automation — Python, Selenium, precision marketing. Built a cat rescue YouTube channel from zero to 4,500 subscribers and secured $2,000/month in sponsorships. But when the structure lacked substance, I walked away. \"Structures without integrity don't last.\"",
      ko: "데이터와 자동화의 폭발적인 힘을 체험했습니다 — Python, Selenium, 정밀 마케팅. 고양이 구조 유튜브를 0에서 4,500명까지 키우고 월 $2,000 스폰서십을 수주했습니다. 하지만 알맹이 없는 구조는 오래 못 간다는 걸 깨닫고 떠났습니다.",
    },
  },
  {
    year: "2021",
    imageId: "vipassana",
    title: {
      en: "Vipassana Meditation & Temple Kitchen",
      ko: "위빳사나 수행 · 정관스님 주방",
    },
    story: {
      en: "Ten days of complete silence at Dhamma Korea — learning to observe emotions without reacting. Then trained in Master Jeong-gwan's temple kitchen, one of the toughest and most humbling environments I've known.",
      ko: "담마코리아에서 10일 이상의 침묵 수행 — 감정을 다루는 방식을 내면에서 재정비했습니다. 이후 정관스님 주방에서 수련. 매섭고 어려운 환경이었지만, 음식의 기초를 배웠습니다.",
    },
  },
  {
    year: "2021–2022",
    imageId: "yeongwol",
    title: {
      en: "Yeongwol — Farm Community Building",
      ko: "영월 청년마을만들기",
    },
    story: {
      en: "Asked \"why\" before anything else. Discovered a leaf-field image that became the core story — it won government grants. Contacted David Holmgren's permaculture foundation directly. When you dig deep into \"why,\" you find value no one else can see.",
      ko: "\"왜\"부터 파고들었습니다. 나뭇잎 밭 이미지를 스토리의 핵심으로 설계해 지원금을 수주했습니다. David Holmgren 퍼머컬처 재단에 영어로 직접 컨택했습니다. \"왜\"를 깊이 파고들면 아무도 보지 못한 가치가 보입니다.",
    },
  },
  {
    year: "2022",
    imageId: "farming-exploration",
    title: {
      en: "Farming Exploration — Across Korea",
      ko: "창농 탐색 — 양평, 거제, 제주, 완주",
    },
    story: {
      en: "Completed 550 hours of government farming education. Led SK Social Impact Index grant application (passed first round). In Geoje, an elder offered me a 50-hive bee farm for \u20A9300M — beautiful, but the ROI was unclear. The dream was vivid; the economics weren't.",
      ko: "농림부 귀농 정규 교육 550시간을 수료했습니다. SK 사회성과 지표 지원사업 1차 서류를 통과했습니다. 거제에서 벌통 50동 농가를 3억에 제안받았지만, 투자 회수가 불투명했습니다. 이상은 아름다웠지만 현실에서 독립적이지 못했습니다.",
    },
  },
  {
    year: "2022–2023",
    imageId: "justbe",
    title: {
      en: "JustBe Temple, Hongdae — Eco-Community",
      ko: "JustBe Temple (홍대) — 에코 커뮤니티",
    },
    story: {
      en: "Built a rooftop garden from scratch — 21 varieties of herbs and native plants, bokashi compost cycling, connected with vegan potluck gatherings the head monk had run for decades. Started alone, invited others, grew it into a living community. Here I met my American wife. Together we dream of a farm in California.",
      ko: "옥상 허브 정원을 처음부터 만들었습니다 — 21종의 허브와 토종 식물, 보카시 퇴비 순환 구조. 혼자 시작해서 사람들을 합류시키며 살아있는 커뮤니티로 키웠습니다. 이곳에서 미국인 아내를 만났습니다. 함께 캘리포니아에서 농장을 꿈꿉니다.",
    },
  },
  {
    year: "2024",
    imageId: "workaway",
    title: {
      en: "Permaculture Farms — Thailand & Malaysia",
      ko: "퍼머컬처 농장 — 태국 · 말레이시아",
    },
    story: {
      en: "Four months on Workaway farms across Southeast Asia. Witnessed how nature \u00D7 design can transform entire ecosystems. But most farmers I met couldn't sustain themselves — the ideals were beautiful, the economics weren't. The conviction crystallized: without tech, farming can't work at scale.",
      ko: "동남아 퍼머컬처 농장에서 4개월. 자연과 설계의 결합이 생태계 전체를 바꾸는 과정을 목격했습니다. 하지만 직접 만난 농가 대부분이 자급자족도, 충분한 수입도 얻지 못하는 현실. 확신이 굳어졌습니다 — 테크 없이는 안 된다.",
    },
  },
  {
    year: "2023–Now",
    imageId: "iocrops",
    title: {
      en: "Computer Science & ioCrops — Building the Infrastructure",
      ko: "컴퓨터과학과 · ioCrops — 인프라를 만드는 사람",
    },
    story: {
      en: "Enrolled in KNOU Computer Science to systematically understand sensors and embedded systems. At ioCrops, I debug STM32 firmware, calibrate EC/pH sensors, and support 18 smart farms nationwide. I went from defect rate 6.4% to 0% on 33 drainage pumps. This is where all the threads converge.",
      ko: "센서와 임베디드 하드웨어를 체계적으로 이해하기 위해 컴퓨터과학과에 진학했습니다. ioCrops에서 STM32 펌웨어 디버깅, EC/pH 센서 캘리브레이션, 전국 18개 농가 기술지원을 수행합니다. 배수펌프 불량률 6.4%에서 0%를 달성했습니다. 모든 실이 여기서 하나로 모입니다.",
    },
  },
];

type ImageMap = Record<string, string[]>;

function TimelineCard({
  entry,
  index,
  images,
  lang,
}: {
  entry: TimelineEntry;
  index: number;
  images: string[];
  lang: "ko" | "en";
}) {
  const { ref, isVisible } = useScrollReveal();
  const [expandedImg, setExpandedImg] = useState<string | null>(null);
  const isLeft = index % 2 === 0;
  const hasImages = images.length > 0;

  return (
    <div ref={ref} className="relative md:pt-8">
      {/* Dot on the timeline */}
      <div
        className={`absolute left-4 md:left-1/2 w-3.5 h-3.5 rounded-full -translate-x-[7px] md:-translate-x-[7px] top-2 z-10 ring-4 ring-white transition-all duration-700 ${
          isVisible ? "bg-forest-green scale-100" : "bg-gray-300 scale-75"
        }`}
      />

      {/* Year badge - centered on desktop */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 -top-6">
        <span
          className={`inline-block text-[10px] font-bold tracking-[0.25em] text-forest-green uppercase bg-white px-3 py-1 border border-forest-green/20 rounded-full transition-all duration-500 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          {entry.year}
        </span>
      </div>

      {/* Card */}
      <div
        className={`ml-12 md:ml-0 md:w-[calc(50%-2.5rem)] transition-all duration-700 ease-out ${
          isLeft ? "md:mr-auto" : "md:ml-auto"
        } ${
          isVisible
            ? "opacity-100 translate-y-0"
            : `opacity-0 translate-y-8 ${isLeft ? "md:-translate-x-4" : "md:translate-x-4"}`
        }`}
        style={{ transitionDelay: "150ms" }}
      >
        {/* Mobile year */}
        <span className="md:hidden text-[10px] font-bold tracking-[0.25em] text-forest-green uppercase">
          {entry.year}
        </span>

        <div className="mt-1 bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300 group">
          {/* Images strip */}
          {hasImages && (
            <div className="mb-4 -mx-6 -mt-6">
              <div className={`grid gap-0.5 rounded-t-lg overflow-hidden ${
                images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"
              }`}>
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setExpandedImg(expandedImg === url ? null : url)}
                    className="relative aspect-[4/3] overflow-hidden cursor-pointer focus:outline-none"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expanded image lightbox */}
          {expandedImg && (
            <div className="mb-4 -mx-6">
              <button
                onClick={() => setExpandedImg(null)}
                className="w-full focus:outline-none cursor-pointer"
              >
                <img
                  src={expandedImg}
                  alt=""
                  className="w-full max-h-80 object-contain bg-gray-50"
                />
              </button>
            </div>
          )}

          <h3 className="text-lg font-playfair font-bold text-gray-900 mb-3 leading-snug">
            {entry.title[lang]}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {entry.story[lang]}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  const { lang } = useLanguage();
  const [imageMap, setImageMap] = useState<ImageMap>({});
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const closingReveal = useScrollReveal();

  useEffect(() => {
    // Trigger hero animation on mount
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch("/api/admin/timeline-images")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, { images: string[] }>) => {
        const map: ImageMap = {};
        for (const [id, v] of Object.entries(data)) {
          const imgs = (v.images || []).filter(Boolean);
          if (imgs.length) map[id] = imgs;
        }
        setImageMap(map);
      })
      .catch(() => {});
  }, []);

  const getImages = useCallback(
    (imageId: string) => imageMap[imageId] || [],
    [imageMap]
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div ref={heroRef} className="mb-20">
            <span
              className={`text-xs font-bold tracking-[0.4em] text-gray-400 uppercase mb-4 block transition-all duration-700 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {lang === "ko" ? "소개" : "About"}
            </span>
            <h1
              className={`text-5xl sm:text-6xl font-playfair font-bold text-gray-900 mb-8 leading-tight transition-all duration-700 delay-150 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              {lang === "ko" ? (
                <>윤승진</>
              ) : (
                <>
                  SeungJin <span className="italic">Youn</span>
                </>
              )}
            </h1>
            <p
              className={`text-xl text-gray-600 leading-relaxed max-w-3xl transition-all duration-700 delay-300 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {lang === "ko"
                ? "사회적 일을 하다 농업으로, 그리고 테크로."
                : "From social impact to agriculture, then to tech."}
            </p>
            <p
              className={`mt-6 text-sm text-gray-400 max-w-xl leading-relaxed transition-all duration-700 delay-500 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {lang === "ko"
                ? "농사를 짓는 사람이 아니라, 농업이 제대로 작동할 수 있는 인프라를 만드는 사람이 되기로 했습니다."
                : "I decided to become not the farmer, but the one who builds the infrastructure that makes farming actually work."}
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-forest-green/30 to-transparent md:-translate-x-px" />

            <div className="space-y-16 md:space-y-24">
              {TIMELINE.map((entry, i) => (
                <TimelineCard
                  key={i}
                  entry={entry}
                  index={i}
                  images={getImages(entry.imageId)}
                  lang={lang}
                />
              ))}
            </div>
          </div>

          {/* Closing */}
          <div
            ref={closingReveal.ref}
            className={`mt-32 pt-16 border-t border-gray-100 text-center transition-all duration-1000 ${
              closingReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <blockquote className="text-2xl sm:text-3xl font-playfair italic text-gray-800 leading-relaxed max-w-2xl mx-auto">
              {lang === "ko"
                ? "\"\uACB0\uAD6D \uD14C\uD06C\uB97C \uC81C\uB300\uB85C \uACF5\uBD80\uD558\uACE0 \uB098\uC544\uAC00\uB294 \uC218\uBC16\uC5D0 \uC5C6\uACA0\uB2E4.\""
                : "\"In the end, the only way forward is to truly learn tech and keep going.\""}
            </blockquote>
            <div className="mt-16 flex justify-center gap-8 text-sm">
              <a
                href="mailto:sjisyours@gmail.com"
                className="text-gray-400 hover:text-forest-green transition-colors duration-300"
              >
                sjisyours@gmail.com
              </a>
              <span className="text-gray-200">|</span>
              <a
                href="https://github.com/asamountain"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-forest-green transition-colors duration-300"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
