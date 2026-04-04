import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SEOHead from "@/components/seo-head";
import CareerTimeline from "@/components/career-timeline";
import { useLanguage } from "@/contexts/language-context";

const TEXT = {
  seo: {
    en: {
      title: "About San - The Vision of Soil-to-Silicon",
      description: "Learn about San's mission to bridge the gap between nature and technology, creating multi-layered abundance through IoT, robotics, and sustainable engineering.",
    },
    ko: {
      title: "소개 - 흙에서 실리콘까지의 비전",
      description: "자연과 기술의 간극을 연결하고, IoT·로보틱스·지속 가능한 엔지니어링으로 다층적 풍요를 만들어가는 San의 이야기.",
    },
  },
  header: {
    en: { tag: "The Path", title: ["Soil, Code, ", "Silence"], subtitle: "How a special-ed teacher ended up calibrating RS-485 sensors on a smart farm." },
    ko: { tag: "걸어온 길", title: ["흙, 코드, ", "고요"], subtitle: "특수교육 교사가 어떻게 스마트팜에서 RS-485 센서를 캘리브레이션하게 되었는가." },
  },
  bio: {
    en: "Seungjin Youn is a QA & IoT engineer at ioCrops with a background spanning special education, culinary arts, military service, performance marketing, permaculture farming, and embedded systems. The thread connecting them is a single question: how do we build systems — social, ecological, technical — that actually work for the people inside them? At ioCrops, that question meets its answer in reproducible, sensor-driven agricultural infrastructure.",
    ko: "윤승진은 ioCrops의 QA & IoT 엔지니어로, 특수교육·조리학·군 복무·퍼포먼스 마케팅·퍼머컬처 농업·임베디드 시스템을 아우르는 배경을 가지고 있습니다. 이 모든 경험을 관통하는 하나의 질문 — 사회적·생태적·기술적 시스템을, 그 안에 있는 사람들을 위해 실제로 작동하게 만들려면 어떻게 해야 하는가? ioCrops에서 그 답을 재현 가능한 센서 기반 농업 인프라로 찾아가고 있습니다.",
  },
  cta: {
    en: { title: "Let's Build the Future", body: "I am currently working as a QA and IoT Engineer. While this page is being updated, you can still reach out for discussions on AgriTech, IoT, and Systems Engineering.", linkedin: "LinkedIn Profile", discord: "Join Discord Community" },
    ko: { title: "미래를 함께 만들어갑시다", body: "현재 QA 및 IoT 엔지니어로 근무 중입니다. 이 페이지가 업데이트되는 동안에도 AgriTech, IoT, 시스템 엔지니어링에 대한 논의는 언제든 환영합니다.", linkedin: "LinkedIn 프로필", discord: "Discord 커뮤니티 참여" },
  },
};

export default function About() {
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const { lang } = useLanguage();
  const seo = TEXT.seo[lang];
  const header = TEXT.header[lang];
  const bio = TEXT.bio[lang];
  const cta = TEXT.cta[lang];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={seo.title}
        description={seo.description}
        url={`${currentUrl}/about`}
        type="website"
        author="San"
      />
      <Navigation />

      <main className="pt-32 pb-20 min-h-[70vh]">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="mb-16">
            <span className="text-xs font-bold tracking-[0.4em] text-gray-400 uppercase mb-4 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {header.tag}
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
              {header.title[0]}<span className="italic">{header.title[1]}</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl">
              {header.subtitle}
            </p>
          </div>

          {/* Career Timeline */}
          <CareerTimeline />

          <div className="py-20 border-y border-gray-100 mb-12 text-center max-w-3xl mx-auto">
            <p className="text-lg text-gray-600 leading-relaxed">
              {bio}
            </p>
          </div>

          {/* Professional Context for HR */}
          <section className="bg-gray-900 text-white p-10 rounded-3xl overflow-hidden relative text-left max-w-4xl mx-auto">
            <div className="relative z-10">
              <h2 className="text-3xl font-serif font-bold mb-6">{cta.title}</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-xl">
                {cta.body}
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="https://linkedin.com/in/seungjinyoun/" target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                    {cta.linkedin}
                  </button>
                </a>
                <a href="https://discord.gg/3crTf7nqUk" target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 bg-transparent border border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
                    {cta.discord}
                  </button>
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
