import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Twitter, 
  Facebook, 
  Linkedin, 
  Mail, 
  Link, 
  MessageCircle,
  Share2
} from "lucide-react";

interface SocialShareProps {
  title: string;
  url: string;
  excerpt?: string;
  className?: string;
}

export default function SocialShare({ title, url, excerpt, className = "" }: SocialShareProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { toast } = useToast();

  // Ensure absolute URL for sharing
  const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
  const shareText = excerpt ? `${title} - ${excerpt}` : title;
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(absoluteUrl);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
  };

  const handleShare = (platform: string) => {
    const link = shareLinks[platform as keyof typeof shareLinks];
    if (link) {
      window.open(link, '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      toast({
        title: "Link copied!",
        description: "The article link has been copied to your clipboard.",
      });
      setShowShareMenu(false);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: excerpt,
          url: absoluteUrl,
        });
        setShowShareMenu(false);
      } catch (error) {
        // User cancelled sharing or error occurred
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="text-gray-600 hover:text-forest-green"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>

      {showShareMenu && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[250px]">
          <div className="flex flex-col space-y-2">
            <h4 className="font-medium text-gray-900 mb-2">Share this article</h4>
            
            {/* Native Share (if supported) */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNativeShare}
                className="justify-start text-gray-700 hover:text-forest-green hover:bg-forest-green/10"
              >
                <Share2 className="w-4 h-4 mr-3" />
                Share via device
              </Button>
            )}

            {/* Social Media Platforms */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="justify-start text-gray-700 hover:text-blue-500 hover:bg-blue-50"
            >
              <Twitter className="w-4 h-4 mr-3" />
              Share on Twitter
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              <Facebook className="w-4 h-4 mr-3" />
              Share on Facebook
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="justify-start text-gray-700 hover:text-blue-700 hover:bg-blue-50"
            >
              <Linkedin className="w-4 h-4 mr-3" />
              Share on LinkedIn
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="justify-start text-gray-700 hover:text-green-600 hover:bg-green-50"
            >
              <MessageCircle className="w-4 h-4 mr-3" />
              Share on WhatsApp
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare('email')}
              className="justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              <Mail className="w-4 h-4 mr-3" />
              Share via Email
            </Button>

            <hr className="my-2" />

            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="justify-start text-gray-700 hover:text-forest-green hover:bg-forest-green/10"
            >
              <Link className="w-4 h-4 mr-3" />
              Copy link
            </Button>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShareMenu(false)}
            className="absolute top-2 right-2 p-1 h-auto text-gray-400 hover:text-gray-600"
          >
            ×
          </Button>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}