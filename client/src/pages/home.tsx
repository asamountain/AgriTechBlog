import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import FeaturedStories from "@/components/featured-stories";
import BlogGrid from "@/components/blog-grid";
import NewsletterSection from "@/components/newsletter-section";
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
        image="/api/og-image?title=AgriTech Innovation Hub&category=Agricultural Technology"
        url={currentUrl}
        type="website"
      />
      <Navigation />
      <HeroSection />
      <FeaturedStories />
      <BlogGrid />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
