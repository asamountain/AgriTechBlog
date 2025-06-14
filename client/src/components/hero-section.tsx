import { ChevronDown } from "lucide-react";
import naturalBackground from "@assets/IMG_8696_1749914332545.png";

export default function HeroSection() {
  const scrollToContent = () => {
    const element = document.getElementById('featured-stories');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen flex items-end justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.4)), url('${naturalBackground}')`
        }}
      />
      
      {/* Content positioned at bottom */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6 pb-32">
        {/* Top indicator */}
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-white/80 font-light">
            03 / 01 / 2025
          </span>
        </div>
        
        {/* Back to link */}
        <div className="mb-6">
          <span className="text-sm text-white/90 font-light tracking-wide">
            back to ●
          </span>
        </div>
        
        {/* Main heading */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-normal mb-8 leading-none tracking-tight">
          AgroTech
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl mb-12 text-white/90 max-w-lg mx-auto leading-relaxed font-light">
          Memahami teknologi pertanian modern yang menghadirkan solusi inovatif untuk masa depan yang berkelanjutan
        </p>
        
        {/* Created by */}
        <div className="text-xs text-white/70 font-light tracking-widest">
          <span className="italic">Created by |</span>
          <br />
          <span className="font-medium tracking-wider">agriculturist</span>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 animate-bounce cursor-pointer"
        onClick={scrollToContent}
      >
        <ChevronDown className="h-6 w-6" />
      </div>
    </section>
  );
}
