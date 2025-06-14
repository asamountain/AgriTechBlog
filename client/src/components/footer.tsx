import { Link } from "wouter";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const quickLinks = [
    { href: "/about", label: "About Us" },
    { href: "/team", label: "Editorial Team" },
    { href: "/write", label: "Write for Us" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy Policy" },
  ];

  const categories = [
    { href: "/category/precision-farming", label: "Precision Farming" },
    { href: "/category/hydroponics", label: "Hydroponics" },
    { href: "/category/sustainability", label: "Sustainability" },
    { href: "/category/biotechnology", label: "Biotechnology" },
    { href: "/category/automation", label: "Automation" },
  ];

  const socialLinks = [
    { href: "https://twitter.com", icon: "fab fa-twitter", label: "Twitter" },
    { href: "https://linkedin.com", icon: "fab fa-linkedin", label: "LinkedIn" },
    { href: "https://youtube.com", icon: "fab fa-youtube", label: "YouTube" },
    { href: "https://instagram.com", icon: "fab fa-instagram", label: "Instagram" },
  ];

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-playfair font-bold text-fresh-lime mb-4">
              AgroTech
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Empowering farmers and agricultural professionals with cutting-edge 
              technology insights and sustainable farming solutions.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-fresh-lime transition-colors"
                  aria-label={social.label}
                >
                  <i className={`${social.icon} text-xl`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-gray-300 hover:text-fresh-lime transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.href}>
                  <Link href={category.href}>
                    <span className="text-gray-300 hover:text-fresh-lime transition-colors cursor-pointer">
                      {category.label}
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
                <Mail className="h-4 w-4 text-fresh-lime" />
                <span>hello@agrotech.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-fresh-lime" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-fresh-lime" />
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
