import { Linkedin, Instagram, Github, Camera, Leaf, Globe, Users, BookOpen, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface FooterProps {
  variant?: "simple" | "enhanced";
}

const FOOTER_TEXT = {
  tagline: {
    en: "Pioneering the future of agriculture through innovative technology solutions, sustainable farming practices to generate the greatest abundance for every lives.",
    ko: "혁신적인 기술 솔루션과 지속 가능한 농업 실천을 통해, 모든 생명을 위한 최대의 풍요를 만들어가는 농업의 미래를 개척합니다.",
  },
  connect: { en: "Connect With San", ko: "San과 연결하기" },
  copyright: { en: "© 2025 San. All rights reserved.", ko: "© 2025 San. All rights reserved." },
  privacy: { en: "Privacy Policy", ko: "개인정보 처리방침" },
  terms: { en: "Terms of Service", ko: "이용약관" },
  sections: [
    {
      en: { title: "Innovation Hub", description: "Pioneering sustainable agriculture through cutting-edge technology and smart farming solutions." },
      ko: { title: "이노베이션 허브", description: "최첨단 기술과 스마트 농업 솔루션을 통해 지속 가능한 농업을 개척합니다." },
      icon: Leaf,
    },
    {
      en: { title: "Global Impact", description: "Connecting farmers worldwide with innovative solutions for a more sustainable future." },
      ko: { title: "글로벌 임팩트", description: "혁신적인 솔루션으로 전 세계 농업인들을 연결하여 더 지속 가능한 미래를 만듭니다." },
      icon: Globe,
    },
    {
      en: { title: "Community", description: "Building a network of agricultural innovators, researchers, and technology enthusiasts." },
      ko: { title: "커뮤니티", description: "농업 혁신가, 연구자, 기술 애호가들의 네트워크를 구축합니다." },
      icon: Users,
    },
    {
      en: { title: "Knowledge Base", description: "Comprehensive resources on sustainable farming, technology integration, and best practices." },
      ko: { title: "지식 기반", description: "지속 가능한 농업, 기술 통합, 모범 사례에 대한 종합 자료를 제공합니다." },
      icon: BookOpen,
    },
  ],
};

export default function Footer({ variant = "simple" }: FooterProps) {
  const { lang } = useLanguage();

  const socialLinks = [
    { href: "https://linkedin.com/in/seungjinyoun/", icon: Linkedin, label: "LinkedIn" },
    { href: "https://instagram.com/like__san", icon: Instagram, label: "Instagram" },
    { href: "https://github.com/asamountain", icon: Github, label: "GitHub" },
    { href: "https://asamountain.myportfolio.com/", icon: Camera, label: "Photo Portfolio" },
    { href: "https://discord.gg/3crTf7nqUk", icon: MessageCircle, label: "Discord" },
  ];

  if (variant === "enhanced") {
    return (
      <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16 p-golden-lg">
            <div className="inline-flex items-center justify-center mb-6 p-golden-md bg-forest-green/10 rounded-full">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
              {FOOTER_TEXT.tagline[lang]}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {FOOTER_TEXT.sections.map((section, index) => {
              const IconComponent = section.icon;
              const t = section[lang];
              return (
                <div
                  key={index}
                  className="text-center p-golden-lg rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="inline-flex items-center justify-center mb-4 p-golden-sm bg-forest-green/20 rounded-full">
                    <IconComponent className="h-6 w-6 text-forest-green" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-3 font-playfair">{t.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{t.description}</p>
                </div>
              );
            })}
          </div>

          {socialLinks.length > 0 && (
            <div className="text-center mb-12">
              <h4 className="text-lg font-semibold text-white mb-6 font-playfair">
                {FOOTER_TEXT.connect[lang]}
              </h4>
              <div className="flex flex-wrap justify-center gap-4">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a key={social.href} href={social.href} target="_blank" rel="noopener noreferrer" className="group relative p-4 rounded-full bg-gray-800/50 hover:bg-forest-green/20 transition-all duration-300 hover:transform hover:scale-110" aria-label={social.label}>
                      <IconComponent className="h-6 w-6 text-gray-400 group-hover:text-forest-green transition-colors duration-300" />
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        {social.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-gray-700 bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-center md:text-left">
                  <p className="text-gray-400">{FOOTER_TEXT.copyright[lang]}</p>
                </div>
                <div className="flex space-x-6 text-sm text-gray-400">
                  <a href="/privacy" className="hover:text-forest-green transition-colors duration-300">{FOOTER_TEXT.privacy[lang]}</a>
                  <a href="/terms" className="hover:text-forest-green transition-colors duration-300">{FOOTER_TEXT.terms[lang]}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Simple variant (default)
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center text-center">
          <div className="mb-12 p-golden-lg">
            <div className="inline-flex items-center justify-center mb-6 p-golden-md bg-forest-green/10 rounded-full">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl">
              {FOOTER_TEXT.tagline[lang]}
            </p>
          </div>

          {socialLinks.length > 0 && (
            <div className="mb-12">
              <div className="flex flex-wrap justify-center gap-4">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a key={social.href} href={social.href} target="_blank" rel="noopener noreferrer" className="group relative p-4 rounded-full bg-gray-800/50 hover:bg-forest-green/20 transition-all duration-300 hover:transform hover:scale-110" aria-label={social.label}>
                      <IconComponent className="h-6 w-6 text-gray-400 group-hover:text-forest-green transition-colors duration-300" />
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                        {social.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400">{FOOTER_TEXT.copyright[lang]}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
