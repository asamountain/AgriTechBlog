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
  
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Category */}
      {category && (
        <Link href={`/category/${category.slug}`}>
          <Badge 
            variant="secondary" 
            className={`${badgeSize} hover:bg-opacity-80 cursor-pointer transition-colors`}
            style={{ 
              backgroundColor: category.color || '#52B788',
              color: 'white'
            }}
          >
            {showIcons && <Folder className="h-3 w-3 mr-1" />}
            {category.name}
          </Badge>
        </Link>
      )}
      
      {/* Tags */}
      {tags.length > 0 && tags.map((tag, index) => (
        <Link key={index} href={`/search?q=${encodeURIComponent(tag)}`}>
          <Badge 
            variant="outline" 
            className={`${badgeSize} hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950 cursor-pointer transition-colors`}
          >
            {showIcons && index === 0 && <Tag className="h-3 w-3 mr-1" />}
            {tag}
          </Badge>
        </Link>
      ))}
    </div>
  );
}