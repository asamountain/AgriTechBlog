import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SearchOverlay from "./search-overlay";
import { useLanguage } from "@/contexts/language-context";

const NAV_ITEMS = [
  { href: "/posts", ko: "글", en: "Posts" },
  { href: "/portfolio", ko: "포트폴리오", en: "Portfolio" },
  { href: "/about", ko: "소개", en: "About" },
];

export default function Navigation() {
  const [location] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { lang, setLang } = useLanguage();

  const navItems = [
    { href: "/posts", label: "Posts" },
    { href: "/portfolio", label: "Portfolio" },
  ];

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      }
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });

    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  const toggleLang = () => setLang(lang === "en" ? "ko" : "en");

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-playfair font-bold text-forest-green cursor-pointer">
                  San
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                {NAV_ITEMS.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
                      location === item.href
                        ? "text-forest-green font-medium"
                        : "text-gray-700 hover:text-forest-green"
                    }`}>
                      {item[lang]}
                      {item.href === '/portfolio' && (
                        <span className="w-1 h-1 bg-forest-green rounded-full"></span>
                      )}
                    </span>
                  </Link>
                ))}

                {/* Language Toggle */}
                <button
                  onClick={toggleLang}
                  className="relative flex items-center w-[52px] h-7 rounded-full border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer select-none overflow-hidden"
                  aria-label="Toggle language"
                >
                  <span
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-forest-green transition-transform duration-200 ease-out"
                    style={{ left: 1, transform: lang === "ko" ? "translateX(23px)" : "translateX(0)" }}
                  />
                  <span className={`relative z-10 flex-1 text-center text-xs font-medium transition-colors duration-200 ${lang === "en" ? "text-white" : "text-gray-500"}`}>
                    EN
                  </span>
                  <span className={`relative z-10 flex-1 text-center text-xs font-medium transition-colors duration-200 ${lang === "ko" ? "text-white" : "text-gray-500"}`}>
                    KO
                  </span>
                </button>

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
            <div className="md:hidden flex items-center gap-2">
              {/* Mobile Language Toggle */}
              <button
                onClick={toggleLang}
                className="px-2 py-1 rounded border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {lang === "en" ? "KO" : "EN"}
              </button>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    {NAV_ITEMS.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <span
                          className={`block py-2 text-lg transition-colors cursor-pointer ${
                            location === item.href
                              ? "text-forest-green font-medium"
                              : "text-gray-700 hover:text-forest-green"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item[lang]}
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
                      {lang === "ko" ? "검색" : "Search"}
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
