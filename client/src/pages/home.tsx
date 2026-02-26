import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import FeaturedStories from "@/components/featured-stories";
import BlogGrid from "@/components/blog-grid";
import Footer from "@/components/footer";
import SEOHead from "@/components/seo-head";

export default function Home() {
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
        description="Discover cutting-edge agricultural technology, IoT solutions, and sustainable farming practices. Expert insights on precision agriculture, crop monitoring, and smart farming innovations for global agricultural transformation."
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
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-6">The Philosophy</h2>
          <h3 className="text-4xl md:text-5xl font-serif mb-8 text-gray-900 italic">"Soil to Silicon"</h3>
          <p className="text-xl text-gray-600 leading-relaxed font-light mb-10 max-w-2xl mx-auto">
            Creating a multi-layered abundance by mastering the communication protocols between 
            smart devices, sensors, soil, and humanity.
          </p>
          <div className="flex justify-center">
            <a href="/about" className="group flex items-center gap-2 text-forest-green font-medium hover:gap-4 transition-all">
              Learn about the vision <span className="text-xl">→</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
