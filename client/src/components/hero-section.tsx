import { ChevronDown, Play, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const scrollToContent = () => {
    const element = document.getElementById('featured-stories');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden mt-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')`
        }}
      />
      
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
            <span className="mr-2">📅</span>
            Latest Insights
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-playfair font-bold mb-6 leading-tight">
          Future of{" "}
          <span className="text-fresh-lime">Smart</span>
          <br />
          Agriculture
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto leading-relaxed">
          Exploring cutting-edge technology solutions that revolutionize modern farming 
          practices and sustainable food production.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg"
            onClick={scrollToContent}
            className="bg-sage-green hover:bg-forest-green text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Explore Articles
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="border-2 border-white text-white hover:bg-white hover:text-forest-green font-semibold py-3 px-8 rounded-lg transition-all duration-300"
          >
            <Play className="h-4 w-4 mr-2" />
            Watch Demo
          </Button>
        </div>
        
        <div className="mt-12 text-sm text-gray-300">
          <p className="flex items-center justify-center gap-2">
            <Sprout className="h-4 w-4 text-fresh-lime" />
            Empowering 10,000+ farmers with technology insights
          </p>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce cursor-pointer"
        onClick={scrollToContent}
      >
        <ChevronDown className="h-8 w-8" />
      </div>
    </section>
  );
}
