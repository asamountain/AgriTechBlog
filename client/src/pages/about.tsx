import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SEOHead from "@/components/seo-head";
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
      
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Hero Section */}
          <section className="mb-20 text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6 italic">
              Soil to Silicon
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              Designing the communication protocols between smart devices and sensors, servers and soil, humanity and nature.
            </p>
          </section>

          {/* The Vision */}
          <section className="mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-serif font-bold text-forest-green mb-6">The Vision of Abundance</h2>
                <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
                  <p>
                    I envision a future where technology is not a barrier to nature, but its most sophisticated ally. 
                    My goal is to build a "Tech Farm" where data doesn't just sit in a database—it flows like nutrients 
                    through a multi-layered ecosystem.
                  </p>
                  <p>
                    By mastering the protocols that allow smart devices to speak to sensors and soil to speak to electricity, 
                    we can create a sustainable abundance that supports both human civilization and the natural world 
                    simultaneously.
                  </p>
                </div>
              </div>
              <div className="bg-green-50 p-8 rounded-2xl border border-green-100">
                <blockquote className="text-xl font-serif italic text-forest-green leading-relaxed">
                  "Abundance is not about having more; it's about creating systems so efficient and harmonious 
                  that nature and technology become indistinguishable."
                </blockquote>
              </div>
            </div>
          </section>

          {/* Layers of Expertise */}
          <section className="mb-24">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">The Layers of Communication</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-forest-green">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-2">Hardware to Sensor</h3>
                <p className="text-gray-600">Precision hardware meeting environmental feedback for autonomous health monitoring.</p>
              </div>
              
              <div className="p-6 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-2">Server to Front</h3>
                <p className="text-gray-600">Transforming raw agricultural data into actionable, visual human intuition.</p>
              </div>

              <div className="p-6 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-yellow-600">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-2">Soil to Electricity</h3>
                <p className="text-gray-600">Bridging the chemical energy of the earth with the digital pulse of modern IoT.</p>
              </div>
            </div>
          </section>

          {/* Professional Context for HR */}
          <section className="bg-gray-900 text-white p-10 rounded-3xl overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-3xl font-serif font-bold mb-6">Let's Build the Future</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-xl">
                I am currently working as a QA and IoT Engineer, specializing in ensuring the reliability 
                of systems that operate in harsh, real-world conditions. I am always open to discussing 
                innovations in AgriTech, IoT, and Systems Engineering.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="https://linkedin.com/in/seungjinyoun/" target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                    LinkedIn Profile
                  </button>
                </a>
                <a href="mailto:yoonseungjin@gmail.com">
                  <button className="px-6 py-3 bg-transparent border border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
                    Get in Touch
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
