import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bot, Sprout, Leaf, Dna, Cog } from "lucide-react";
import type { Category } from "@shared/schema";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const categoryIcons: Record<string, any> = {
  'precision-farming': Bot,
  'hydroponics': Sprout,
  'sustainability': Leaf,
  'biotechnology': Dna,
  'automation': Cog,
};

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto animate-pulse" />
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-full w-32 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-playfair font-bold text-forest-green mb-4">
            Explore by Category
          </h2>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button
            onClick={() => onCategoryChange(null)}
            variant={selectedCategory === null ? "default" : "outline"}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
              selectedCategory === null
                ? "bg-sage-green text-white hover:bg-forest-green"
                : "bg-white text-gray-700 border-gray-200 hover:bg-sage-green hover:text-white hover:border-sage-green"
            }`}
          >
            All Articles
          </Button>
          
          {categories?.map((category) => {
            const IconComponent = categoryIcons[category.slug] || Sprout;
            const isSelected = selectedCategory === category.slug;
            
            return (
              <Button
                key={category.id}
                onClick={() => onCategoryChange(category.slug)}
                variant={isSelected ? "default" : "outline"}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  isSelected
                    ? "bg-sage-green text-white hover:bg-forest-green"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-sage-green hover:text-white hover:border-sage-green"
                }`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
