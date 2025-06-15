import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Tag, Folder } from "lucide-react";

interface TagDisplayProps {
  tags?: string[];
  category?: {
    id: number;
    name: string;
    slug: string;
    color?: string;
  };
  showIcons?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TagDisplay({ tags = [], category, showIcons = true, size = "md" }: TagDisplayProps) {
  const badgeSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3 w-3";
  const spacing = size === "sm" ? "gap-golden-xs" : size === "lg" ? "gap-golden-md" : "gap-golden-sm";
  
  return (
    <div className={`flex flex-wrap items-center ${spacing}`}>
      {/* Category */}
      {category && (
        <Link href={`/category/${category.slug}`}>
          <Badge 
            variant="secondary" 
            className={`${badgeSize} bg-forest-green text-white hover:opacity-80 cursor-pointer transition-all duration-200 p-golden-xs rounded-golden-sm`}
          >
            {showIcons && <Folder className={`${iconSize} mr-1`} />}
            {category.name}
          </Badge>
        </Link>
      )}
      
      {/* Tags */}
      {tags.length > 0 && tags.map((tag, index) => (
        <Link key={index} href={`/search?q=${encodeURIComponent(tag)}`}>
          <Badge 
            variant="outline" 
            className={`${badgeSize} border-forest-green text-forest-green hover:bg-forest-green hover:text-white cursor-pointer transition-all duration-200 p-golden-xs rounded-golden-sm`}
          >
            {showIcons && index === 0 && <Tag className={`${iconSize} mr-1`} />}
            {tag}
          </Badge>
        </Link>
      ))}
    </div>
  );
}