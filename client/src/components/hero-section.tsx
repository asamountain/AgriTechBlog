import { ChevronDown, ExternalLink, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { trackEvent } from "@/lib/analytics"; // DISABLED
import { useEffect, useRef, useState } from "react";

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  const scrollToContent = () => {
    const element = document.getElementById("featured-stories");
    element?.scrollIntoView({ behavior: "smooth" });
    // trackEvent("scroll_to_content", "navigation", "hero_scroll"); // DISABLED
  };

  const openPortfolio = () => {
    // trackEvent("portfolio_click", "external_link", "photography_portfolio"); // DISABLED
    window.open("https://asamountain.myportfolio.com/", "_blank");
  };

  useEffect(() => {
    // Load video after component mounts for better performance
    setTimeout(() => setShowVideo(true), 1000);
  }, []);

  return (
    <section className="relative h-screen flex items-end justify-center overflow-hidden">
      {/* Background Video */}
      {showVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="https://cdn.myportfolio.com/e5b750a4-50d3-4551-bd7b-c4c4e3e39d73/8b70ddf3-e9a7-49a7-a1cd-b84056520f4a.jpg?h=23852e2440450a21161999cbfb84a425"
        >
          <source
            src="https://www.youtube.com/embed/videoseries?list=PLBsrsimlDkLDrohYzmDERCsacIMNkGIgb&autoplay=1&mute=1"
            type="video/mp4"
          />
        </video>
      )}

      {/* Fallback Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('https://cdn.myportfolio.com/e5b750a4-50d3-4551-bd7b-c4c4e3e39d73/8b70ddf3-e9a7-49a7-a1cd-b84056520f4a.jpg?h=23852e2440450a21161999cbfb84a425')`,
        }}
      />

      {/* Content positioned at bottom */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6 pb-32">
        {/* Top indicator */}
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-white/80 font-light"></span>
        </div>

        {/* Back to link */}
        <div className="mb-6">
          <span className="text-sm text-white/90 font-light tracking-wide"></span>
        </div>

        {/* Main heading */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-normal mb-8 leading-none tracking-tight"></h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl mb-12 text-white/90 max-w-lg mx-auto leading-relaxed font-light">
          Bridging Nature and Technology, One Data Point at a Time
        </p>

        {/* Photography Portfolio Link */}
        <div className="mb-8"></div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 animate-bounce cursor-pointer"
        onClick={scrollToContent}
      ></div>
    </section>
  );
}
