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
    <section className="py-12 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Browse Categories
          </h2>
          <div className="w-16 h-1 bg-sage-green"></div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
              selectedCategory === null
                ? "bg-sage-green text-white"
                : "bg-gray-100 text-gray-700 hover:bg-sage-green hover:text-white"
            }`}
          >
            All Articles
          </button>
          
          {categories?.map((category) => {
            const IconComponent = categoryIcons[category.slug] || Sprout;
            const isSelected = selectedCategory === category.slug;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.slug)}
                className={`px-4 py-2 text-sm font-medium uppercase tracking-wide transition-all duration-300 flex items-center space-x-2 ${
                  isSelected
                    ? "bg-sage-green text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-sage-green hover:text-white"
                }`}
              >
                <IconComponent className="h-3 w-3" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
