import { Linkedin, Instagram, Youtube, Github, Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Author } from "@shared/schema";

export default function Footer() {
  // Fetch profile data for social media links
  const { data: profile } = useQuery<Author>({
    queryKey: ["/api/admin/profile"],
    retry: false,
  });

  // Create social links array from profile data, with fallbacks
  const socialLinks = [
    {
      href: profile?.linkedinUrl || "https://linkedin.com/in/hopeinvest",
      icon: Linkedin,
      label: "LinkedIn",
      enabled: !!profile?.linkedinUrl,
    },
    {
      href: profile?.instagramUrl || "https://instagram.com/hopeinvest",
      icon: Instagram,
      label: "Instagram",
      enabled: !!profile?.instagramUrl,
    },
    {
      href: profile?.youtubeUrl || "https://youtube.com/@hopeinvest",
      icon: Youtube,
      label: "YouTube",
      enabled: !!profile?.youtubeUrl,
    },
    {
      href: profile?.githubUrl || "https://github.com/hopeinvest",
      icon: Github,
      label: "GitHub",
      enabled: !!profile?.githubUrl,
    },
    {
      href: profile?.portfolioUrl || "https://portfolio.hopeinvest.com",
      icon: Camera,
      label: "Photo Portfolio",
      enabled: !!profile?.portfolioUrl,
    },
  ].filter((link) => link.enabled || !profile); // Show all links if no profile data, only enabled ones if profile exists

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Brand Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-playfair font-bold text-forest-green mb-4"></h3>
            <p className="text-gray-300 mb-6 leading-relaxed max-w-2xl"></p>
          </div>

          {/* Social Links Only */}
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
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 All rights reserved by San.</p>
        </div>
      </div>
    </footer>
  );
}
