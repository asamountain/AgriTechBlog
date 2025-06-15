import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";

interface TagDisplayProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  selectedTag?: string;
  variant?: "default" | "outline";
  showHash?: boolean;
}

export default function TagDisplay({ 
  tags, 
  onTagClick, 
  selectedTag,
  variant = "outline",
  showHash = true 
}: TagDisplayProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-golden-xs">
      {tags.map((tag, index) => (
        <Badge
          key={index}
          variant={selectedTag === tag ? "default" : variant}
          className={`
            ${selectedTag === tag 
              ? "bg-forest-green text-white" 
              : "border-forest-green text-forest-green hover:bg-forest-green hover:text-white"
            }
            ${onTagClick ? "cursor-pointer transition-colors" : ""}
            p-golden-xs rounded-golden-sm
          `}
          onClick={() => onTagClick?.(tag)}
        >
          {showHash && <Hash className="h-3 w-3 mr-1" />}
          {tag}
        </Badge>
      ))}
    </div>
  );
}