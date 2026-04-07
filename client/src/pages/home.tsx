import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import FeaturedStories from "@/components/featured-stories";
import BlogGrid from "@/components/blog-grid";
import Footer from "@/components/footer";
import SEOHead from "@/components/seo-head";
import { useLanguage } from "@/contexts/language-context";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Home() {
  const { lang } = useLanguage();
  const visionReveal = useScrollReveal();
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const keywords = [
    'agricultural technology',
    'precision agriculture',
    'IoT farming',
    'smart agriculture',
    'crop monitoring',
    'sustainable farming',
    'AgriTech innovation',
    'farm automation',
    'agricultural IoT',
    'precision farming',
    'smart farming solutions',
    'agricultural data analytics',
    'crop optimization',
    'farming technology',
    'agricultural sensors'
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="San's Agricultural Technology Blog - Innovation & Sustainable Farming"
        description="Discover cutting-edge agricultural technology, IoT solutions, and sustainable farming practices."
        keywords={keywords}
        image="/api/og-image?title=AgriTech Innovation Hub&category=Agricultural Technology&author=San&excerpt=Cutting-edge agricultural technology and sustainable farming solutions"
        url={currentUrl}
        type="website"
        author="San"
      />
      <Navigation />
      <HeroSection />
      <FeaturedStories />
      <BlogGrid />
      
      {/* Vision Section */}
      <section className="py-24 bg-gray-50">
        <div
          ref={visionReveal.ref}
          className={`max-w-4xl mx-auto px-6 text-center transition-all duration-700 ${visionReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-6">
            {lang === "ko" ? "이야기" : "The Story"}
          </h2>
          <h3 className="text-4xl md:text-5xl font-serif mb-8 text-gray-900 italic">"Soil to Silicon"</h3>
          <p className="text-xl text-gray-600 leading-relaxed font-light mb-10 max-w-2xl mx-auto">
            {lang === "ko"
              ? "자연과 기계 사이에서 자발적으로 결합하여 풍요를 만들어갑니다."
              : "Creating the abundance by spontaneously combining in between nature and machine."}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
