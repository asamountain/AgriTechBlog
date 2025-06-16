import { Link } from "wouter";
import { Mail, Phone, MapPin, Linkedin, Instagram, Youtube, Github, Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Author } from "@shared/schema";

export default function Footer() {
  // Fetch profile data for social media links
  const { data: profile } = useQuery<Author>({
    queryKey: ["/api/admin/profile"],
    retry: false,
  });

  const quickLinks = [
    { href: "/about", label: "About Us" },
    { href: "/team", label: "Editorial Team" },
    { href: "/write", label: "Write for Us" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy Policy" },
  ];

  const popularTags = [
    { href: "/tags/IoT", label: "IoT" },
    { href: "/tags/Agriculture", label: "Agriculture" },
    { href: "/tags/Technology", label: "Technology" },
    { href: "/tags/Smart%20Farming", label: "Smart Farming" },
    { href: "/tags/Sustainability", label: "Sustainability" },
  ];

  // Create social links array from profile data, with fallbacks
  const socialLinks = [
    { 
      href: profile?.linkedinUrl || "https://linkedin.com/in/hopeinvest", 
      icon: Linkedin, 
      label: "LinkedIn",
      enabled: !!profile?.linkedinUrl
    },
    { 
      href: profile?.instagramUrl || "https://instagram.com/hopeinvest", 
      icon: Instagram, 
      label: "Instagram",
      enabled: !!profile?.instagramUrl
    },
    { 
      href: profile?.youtubeUrl || "https://youtube.com/@hopeinvest", 
      icon: Youtube, 
      label: "YouTube",
      enabled: !!profile?.youtubeUrl
    },
    { 
      href: profile?.githubUrl || "https://github.com/hopeinvest", 
      icon: Github, 
      label: "GitHub",
      enabled: !!profile?.githubUrl
    },
    { 
      href: profile?.portfolioUrl || "https://portfolio.hopeinvest.com", 
      icon: Camera, 
      label: "Photo Portfolio",
      enabled: !!profile?.portfolioUrl
    },
  ].filter(link => link.enabled || !profile); // Show all links if no profile data, only enabled ones if profile exists

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-playfair font-bold text-forest-green mb-4">
              AgroTech
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Empowering farmers and agricultural professionals with cutting-edge 
              technology insights and sustainable farming solutions.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-forest-green transition-colors p-2 rounded-lg hover:bg-gray-800"
                    aria-label={social.label}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-gray-300 hover:text-forest-green transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Tags */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Popular Tags</h4>
            <ul className="space-y-2">
              {popularTags.map((tag) => (
                <li key={tag.href}>
                  <Link href={tag.href}>
                    <span className="text-gray-300 hover:text-forest-green transition-colors cursor-pointer">
                      {tag.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-forest-green" />
                <span>hello@agrotech.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-forest-green" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-forest-green" />
                <span>Silicon Valley, CA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>
            &copy; 2024 AgroTech Insights. All rights reserved. | Built with ❤️ for sustainable agriculture
          </p>
        </div>
      </div>
    </footer>
  );
}
