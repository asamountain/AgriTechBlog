import { useState } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import FeaturedStories from "@/components/featured-stories";
import CategoryFilter from "@/components/category-filter";
import BlogGrid from "@/components/blog-grid";
import NewsletterSection from "@/components/newsletter-section";
import Footer from "@/components/footer";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <FeaturedStories />
      <CategoryFilter 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <BlogGrid selectedCategory={selectedCategory} />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
