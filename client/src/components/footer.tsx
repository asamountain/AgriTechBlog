import { Linkedin, Instagram, Youtube, Github, Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Author } from "@shared/schema";

export default function Footer() {
  // Fetch profile data for social media links
  const { data: profile } = useQuery<Author>({
    queryKey: ["/api/admin/profile"],
    retry: false,
  });

  // Create social links array from profile data, with appropriate fallbacks
  const socialLinks = [
    {
      href: profile?.linkedinUrl || "https://linkedin.com/in/agritech-innovations",
      icon: Linkedin,
      label: "LinkedIn",
      enabled: !!profile?.linkedinUrl,
    },
    {
      href: profile?.instagramUrl || "https://instagram.com/agritech_blog",
      icon: Instagram,
      label: "Instagram",
      enabled: !!profile?.instagramUrl,
    },
    {
      href: profile?.youtubeUrl || "https://youtube.com/@AgriTechInnovations",
      icon: Youtube,
      label: "YouTube",
      enabled: !!profile?.youtubeUrl,
    },
    {
      href: profile?.githubUrl || "https://github.com/agritech-innovations",
      icon: Github,
      label: "GitHub",
      enabled: !!profile?.githubUrl,
    },
    {
      href: profile?.portfolioUrl || "https://portfolio.agritech-innovations.com",
      icon: Camera,
      label: "Photo Portfolio",
      enabled: !!profile?.portfolioUrl,
    },
  ].filter((link) => link.enabled); // Only show links that have actual URLs from profile

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Brand Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-playfair font-bold text-forest-green mb-4">
              AgriTech Innovation Hub
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed max-w-2xl">
              Pioneering the future of agriculture through innovative technology solutions, 
              sustainable farming practices, and smart agricultural systems.
            </p>
          </div>

          {/* Social Links Only */}
          {socialLinks.length > 0 && (
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-forest-green transition-colors p-3 rounded-lg hover:bg-gray-800"
                    aria-label={social.label}
                  >
                    <IconComponent className="h-6 w-6" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 AgriTech Innovation Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
