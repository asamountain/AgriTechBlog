import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";
import { useLocation } from "wouter";

interface TagDisplayProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  selectedTag?: string;
  variant?: "default" | "outline";
  showHash?: boolean;
  size?: string;
}

export default function TagDisplay({ 
  tags, 
  onTagClick, 
  selectedTag,
  variant = "outline",
  showHash = true,
  size 
}: TagDisplayProps) {
  const [, setLocation] = useLocation();

  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      // Navigate to tagged posts page
      setLocation(`/tags/${encodeURIComponent(tag)}`);
    }
  };

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-golden-xs">
      {/* Tags Display */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">Tags</h4>
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
                cursor-pointer transition-colors
                p-golden-xs rounded-golden-sm
              `}
              onClick={() => handleTagClick(tag)}
            >
              {showHash && <Hash className="h-3 w-3 mr-1" />}
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}