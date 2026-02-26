import { Linkedin, Instagram, Youtube, Github, Camera, Leaf, Globe, Users, BookOpen, MessageCircle } from "lucide-react";

interface FooterProps {
  variant?: "simple" | "enhanced";
}

export default function Footer({ variant = "simple" }: FooterProps) {
  // Create social links array with fallback URLs (no profile dependency)
  const socialLinks = [
    {
      href: "https://linkedin.com/in/seungjinyoun/",
      icon: Linkedin,
      label: "LinkedIn",
      enabled: true,
    },
    {
      href: "https://instagram.com/like__san",
      icon: Instagram,
      label: "Instagram",
      enabled: true,
    },
    {
      href: "https://github.com/asamountain",
      icon: Github,
      label: "GitHub",
      enabled: true,
    },
    {
      href: "https://asamountain.myportfolio.com/",
      icon: Camera,
      label: "Photo Portfolio",
      enabled: true,
    },
    {
      href: "https://discord.gg/3crTf7nqUk",
      icon: MessageCircle,
      label: "Discord",
      enabled: true,
    },
  ];

  // Enhanced footer sections
  const footerSections = [
    {
      title: "Innovation Hub",
      description: "Pioneering sustainable agriculture through cutting-edge technology and smart farming solutions.",
      icon: Leaf,
    },
    {
      title: "Global Impact",
      description: "Connecting farmers worldwide with innovative solutions for a more sustainable future.",
      icon: Globe,
    },
    {
      title: "Community",
      description: "Building a network of agricultural innovators, researchers, and technology enthusiasts.",
      icon: Users,
    },
    {
      title: "Knowledge Base",
      description: "Comprehensive resources on sustainable farming, technology integration, and best practices.",
      icon: BookOpen,
    },
  ];

  if (variant === "enhanced") {
    return (
      <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header Section with Golden Ratio Spacing */}
          <div className="text-center mb-16 p-golden-lg">
            <div className="inline-flex items-center justify-center mb-6 p-golden-md bg-forest-green/10 rounded-full">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Pioneering the future of agriculture through innovative technology solutions, 
              sustainable farming practices, and smart agricultural systems that feed the world.
            </p>
          </div>

          {/* Enhanced Footer Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {footerSections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <div 
                  key={index}
                  className="text-center p-golden-lg rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="inline-flex items-center justify-center mb-4 p-golden-sm bg-forest-green/20 rounded-full">
                    <IconComponent className="h-6 w-6 text-forest-green" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-3 font-playfair">
                    {section.title}
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Social Links with Enhanced Styling */}
          {socialLinks.length > 0 && (
            <div className="text-center mb-12">
              <h4 className="text-lg font-semibold text-white mb-6 font-playfair">
                Connect With San
              </h4>
              <div className="flex flex-wrap justify-center gap-4">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative p-4 rounded-full bg-gray-800/50 hover:bg-forest-green/20 transition-all duration-300 hover:transform hover:scale-110"
                      aria-label={social.label}
                    >
                      <IconComponent className="h-6 w-6 text-gray-400 group-hover:text-forest-green transition-colors duration-300" />
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        {social.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        {/* Footer Bottom with Enhanced Border */}
        <div className="border-t border-gray-700 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <p className="text-gray-400">
                  &copy; 2025 San. All rights reserved.
                </p>
              </div>
              <div className="flex space-x-6 text-sm text-gray-400">
                <a href="/privacy" className="hover:text-forest-green transition-colors duration-300">
                  Privacy Policy
                </a>
                <a href="/terms" className="hover:text-forest-green transition-colors duration-300">
                  Terms of Service
                </a>
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
          {/* Enhanced Brand Section with Golden Ratio Spacing */}
          <div className="mb-12 p-golden-lg">
            {/* Icon with forest green accent */}
            <div className="inline-flex items-center justify-center mb-6 p-golden-md bg-forest-green/10 rounded-full">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            
            
            <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl">
              Pioneering the future of agriculture through innovative technology solutions, 
              sustainable farming practices all world.
            </p>
          </div>

          {/* Enhanced Social Links with Better Styling */}
          {socialLinks.length > 0 && (
            <div className="mb-12">
              <div className="flex flex-wrap justify-center gap-4">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative p-4 rounded-full bg-gray-800/50 hover:bg-forest-green/20 transition-all duration-300 hover:transform hover:scale-110"
                      aria-label={social.label}
                    >
                      <IconComponent className="h-6 w-6 text-gray-400 group-hover:text-forest-green transition-colors duration-300" />
                      {/* Tooltip */}
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

        {/* Enhanced Footer Bottom */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400">
                &copy; 2025 San. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-forest-green transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-forest-green transition-colors duration-300">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
