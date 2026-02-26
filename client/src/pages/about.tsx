import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SEOHead from "@/components/seo-head";
import VisualJourney from "@/components/visual-journey";
import { Cpu, Sprout, Zap, Globe, MessageSquare, Database } from "lucide-react";

export default function About() {
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="About San - The Vision of Soil-to-Silicon"
        description="Learn about San's mission to bridge the gap between nature and technology, creating multi-layered abundance through IoT, robotics, and sustainable engineering."
        url={`${currentUrl}/about`}
        type="profile"
        author="San"
      />
      <Navigation />
      
      <main className="pt-32 pb-20 min-h-[70vh]">
        <div className="max-w-7xl mx-auto px-6 w-full">
          {/* Hero Section */}
          <section className="mb-12 text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6 italic">
              Soil to Silicon
            </h1>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 text-forest-green rounded-full text-sm font-medium mb-8">
              <Sprout className="w-4 h-4 animate-bounce" />
              <span>Vision Under Cultivation</span>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed mb-12">
              The bridge between nature and technology is being carefully engineered. 
              Explore the journey that led to this intersection.
            </p>
          </section>

          {/* Linear Journey Diagram */}
          <VisualJourney />

          <div className="py-20 border-y border-gray-100 mb-12 text-center">
            <h2 className="text-3xl font-serif text-gray-400 italic">Story In Progress / 준비 중</h2>
            <p className="mt-4 text-gray-500">I am currently refining the communication protocols for this page.</p>
          </div>

          {/* Professional Context for HR */}
          <section className="bg-gray-900 text-white p-10 rounded-3xl overflow-hidden relative text-left max-w-4xl mx-auto">
            <div className="relative z-10">
              <h2 className="text-3xl font-serif font-bold mb-6">Let's Build the Future</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-xl">
                I am currently working as a QA and IoT Engineer. While this page is being updated, 
                you can still reach out for discussions on AgriTech, IoT, and Systems Engineering.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="https://linkedin.com/in/seungjinyoun/" target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                    LinkedIn Profile
                  </button>
                </a>
                <a href="https://discord.gg/3crTf7nqUk" target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 bg-transparent border border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
                    Join Discord Community
                  </button>
                </a>
              </div>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 opacity-10">
              <Sprout className="w-96 h-96" />
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
