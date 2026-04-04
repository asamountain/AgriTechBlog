import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Cpu, Globe, Shield, Zap } from 'lucide-react';
import { useLanguage } from "@/contexts/language-context";

interface JourneyNode {
  year: string;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  icon: React.ReactNode;
  color: string;
}

const milestones: JourneyNode[] = [
  {
    year: "2008–2015",
    title: { en: "Roots: Care & Craft", ko: "뿌리: 돌봄과 기술" },
    description: {
      en: "Dual major in Special Education + Culinary Arts. Army service at DMZ (22nd Division, 717 OP) — daily discipline, 4 commendations including first landmine discovery report.",
      ko: "중등특수교육 + 호텔외식조리 복수전공. DMZ 최전방 군복무 (22사단, 717 OP) — 매일의 규율, 지뢰 최초 발견 보고 포함 포상 4회.",
    },
    icon: <Shield className="w-6 h-6" />,
    color: "bg-blue-600"
  },
  {
    year: "2015–2021",
    title: { en: "World & Hustle", ko: "세계와 도전" },
    description: {
      en: "Working holidays in France and Australia. Performance marketing and a YouTube cat rescue channel — 4,500 subscribers, $2,000/month sponsorship. Rescued cats eating local wildlife sparked a deeper question: was this actually good?",
      ko: "프랑스·호주 워킹홀리데이. 퍼포먼스 마케팅과 고양이 구조 유튜브 채널 — 구독자 4,500명, 월 $2,000 스폰서십. 구조한 고양이가 야생동물을 잡는 모습에서 더 깊은 질문이 시작되었다.",
    },
    icon: <Zap className="w-6 h-6" />,
    color: "bg-yellow-500"
  },
  {
    year: "2021–2024",
    title: { en: "Land & Silence", ko: "땅과 고요" },
    description: {
      en: "Vipassana silent retreat, temple kitchen training under Monk Jeonggwan, Yeongwol village branding (govt grant won), JustBe Temple rooftop garden, Southeast Asia permaculture farms. Beautiful ideals — but tech-less farming can't scale.",
      ko: "위빳사나 침묵 수행, 정관스님 사찰 주방 수련, 영월 청년마을 브랜딩(정부 지원금 수주), JustBe Temple 옥상 정원, 동남아 퍼머컬처 농장. 아름다운 이상 — 하지만 기술 없는 농업은 확장 불가.",
    },
    icon: <Sprout className="w-6 h-6" />,
    color: "bg-green-600"
  },
  {
    year: "2025–Now",
    title: { en: "Soil to Silicon", ko: "흙에서 실리콘으로" },
    description: {
      en: "IoT Hardware QA Engineer at ioCrops. RS-485/Modbus sensors, STM32 edge cases, real-time sensor data pipelines. The same care as a temple kitchen — pursuing correctness even when 'it works'.",
      ko: "ioCrops IoT 하드웨어 QA 엔지니어. RS-485/Modbus 센서, STM32 엣지 케이스, 실시간 센서 데이터 파이프라인. 사찰 주방에서의 정성처럼 — '작동한다'에 안주하지 않는 정확성 추구.",
    },
    icon: <Cpu className="w-6 h-6" />,
    color: "bg-forest-green"
  },
  {
    year: "Future",
    title: { en: "Reproducible Abundance", ko: "재현 가능한 풍요" },
    description: {
      en: "Building the infrastructure layer that makes regenerative farming economically viable at scale — precise, reproducible, sensor-driven systems that give farmers a real exit beyond government subsidies.",
      ko: "재생 농업을 경제적으로 확장 가능하게 하는 인프라 구축 — 정밀하고 재현 가능한 센서 기반 시스템으로, 농업인에게 정부 보조금 너머의 진짜 출구를 제공.",
    },
    icon: <Globe className="w-6 h-6" />,
    color: "bg-indigo-600"
  }
];

export default function VisualJourney() {
  const { lang } = useLanguage();
  return (
    <div className="relative py-20 overflow-hidden">
      {/* Background Line */}
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 hidden md:block" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
          {milestones.map((node, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative flex flex-col items-center group"
            >
              {/* Year Bubble */}
              <div className="mb-6 z-10">
                <div className={`w-16 h-16 rounded-full ${node.color} text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 ring-4 ring-white`}>
                  {node.icon}
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-serif font-bold text-gray-400 group-hover:text-forest-green transition-colors">
                  {node.year}
                </div>
              </div>

              {/* Content Card */}
              <motion.div 
                className="text-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full"
                whileHover={{ y: -5 }}
              >
                <h3 className="font-bold text-gray-900 mb-2">{node.title[lang]}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {node.description[lang]}
                </p>
              </motion.div>

              {/* Current Status Pulse for the last 'active' node */}
              {node.year === "2025–Now" && (
                <div className="absolute -bottom-4">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-forest-green"></span>
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center text-gray-400 text-sm italic">
        {lang === "ko" ? "각 마일스톤 위에 마우스를 올려 여정을 확인하세요" : "Hover over each milestone to see the journey evolve"}
      </div>
    </div>
  );
}
