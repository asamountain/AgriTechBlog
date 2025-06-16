import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SearchOverlay from "./search-overlay";

export default function Navigation() {
  const [location] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/admin", label: "Admin" },
    { href: "/admin/seo", label: "SEO Dashboard" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-playfair font-bold text-forest-green cursor-pointer">
                  AgroTech
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span className={`transition-colors cursor-pointer ${
                      location === item.href 
                        ? "text-forest-green font-medium" 
                        : "text-gray-700 hover:text-forest-green"
                    }`}>
                      {item.label}
                    </span>
                  </Link>
                ))}
                <Button
                  onClick={() => setIsSearchOpen(true)}
                  className="bg-forest-green text-white hover:opacity-80"
                  size="sm"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <span 
                          className={`block py-2 text-lg transition-colors cursor-pointer ${
                            location === item.href 
                              ? "text-forest-green font-medium" 
                              : "text-gray-700 hover:text-forest-green"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.label}
                        </span>
                      </Link>
                    ))}
                    <Button
                      onClick={() => {
                        setIsSearchOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="bg-forest-green text-white hover:bg-forest-green justify-start"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
}
