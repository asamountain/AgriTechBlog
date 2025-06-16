import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ExternalLink, 
  Share2, 
  Eye, 
  Copy, 
  Check,
  RefreshCw,
  Globe,
  MessageSquare,
  Users,
  Smartphone
} from "lucide-react";

export default function OpenGraphTester() {
  const [testUrl, setTestUrl] = useState("");
  const [copied, setCopied] = useState("");
  const [selectedPost, setSelectedPost] = useState("");

  // Get blog posts for testing
  const { data: posts } = useQuery({
    queryKey: ["/api/blog-posts"],
    select: (data: any[]) => data.slice(0, 10)
  });

  const currentDomain = window.location.origin;

  const testUrls = [
    { 
      name: "Homepage", 
      url: `${currentDomain}/`,
      description: "Main landing page with featured content"
    },
    { 
      name: "Sample Blog Post", 
      url: posts?.[0] ? `${currentDomain}/blog/${posts[0].slug}` : `${currentDomain}/blog/sample-post`,
      description: "Individual blog post with custom metadata"
    },
    { 
      name: "Open Graph Image API", 
      url: `${currentDomain}/api/og-image`,
      description: "Dynamic image generation endpoint"
    },
    { 
      name: "Custom OG Image", 
      url: `${currentDomain}/api/og-image?title=Smart%20Farming%20Innovation&category=IoT%20Agriculture`,
      description: "Customized Open Graph image with parameters"
    }
  ];

  const socialPlatforms = [
    {
      name: "Facebook Sharing Debugger",
      url: "https://developers.facebook.com/tools/debug/",
      icon: "🔵",
      description: "Test Facebook sharing preview and cache refresh",
      instructions: "Paste your URL to see Facebook preview"
    },
    {
      name: "LinkedIn Post Inspector",
      url: "https://www.linkedin.com/post-inspector/",
      icon: "💼",
      description: "Validate LinkedIn professional sharing",
      instructions: "Enter URL to check LinkedIn card preview"
    },
    {
      name: "Twitter Card Validator",
      url: "https://cards-dev.twitter.com/validator",
      icon: "🐦",
      description: "Test Twitter Card implementation",
      instructions: "Validate Twitter sharing appearance"
    },
    {
      name: "WhatsApp Preview",
      url: "#whatsapp",
      icon: "💬",
      description: "Send URL to yourself via WhatsApp",
      instructions: "Share link in WhatsApp to see mobile preview"
    },
    {
      name: "Discord Preview",
      url: "#discord",
      icon: "🎮",
      description: "Test community platform integration",
      instructions: "Share URL in Discord to see embed preview"
    },
    {
      name: "OpenGraph.xyz",
      url: "https://www.opengraph.xyz/",
      icon: "🔍",
      description: "Real-time Open Graph preview tool",
      instructions: "Universal Open Graph testing platform"
    }
  ];

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openTester = (platform: any, url: string) => {
    if (platform.url === "#whatsapp") {
      const message = encodeURIComponent(`Check out this agricultural technology content: ${url}`);
      window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    } else if (platform.url === "#discord") {
      alert("Open Discord and paste your URL in any channel to see the preview");
    } else {
      window.open(platform.url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-playfair font-bold text-gray-900">
              Open Graph Testing Center
            </h1>
            <p className="text-gray-600 mt-2">
              Test how your agricultural technology content appears when shared across platforms
            </p>
          </div>

          <Tabs defaultValue="quick-test" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick-test">Quick Test</TabsTrigger>
              <TabsTrigger value="platforms">Platform Tools</TabsTrigger>
              <TabsTrigger value="preview">Live Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="quick-test" className="space-y-6">
              {/* Test URLs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Ready-to-Test URLs
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Copy these URLs and test them on any social platform
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {testUrls.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-forest-green">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <Badge variant="outline">Ready</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <code className="flex-1 p-2 bg-white rounded text-sm border">
                          {item.url}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(item.url, `url-${index}`)}
                        >
                          {copied === `url-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Custom URL Testing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Custom URL Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter any URL from your blog..."
                      value={testUrl}
                      onChange={(e) => setTestUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => copyToClipboard(testUrl, 'custom')}
                      disabled={!testUrl}
                      variant="outline"
                    >
                      {copied === 'custom' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {testUrl && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Next step:</strong> Copy this URL and paste it into any social platform testing tool below
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="platforms" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {socialPlatforms.map((platform, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <span className="text-2xl">{platform.icon}</span>
                        {platform.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{platform.description}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-4">{platform.instructions}</p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => openTester(platform, testUrls[0].url)}
                          className="bg-forest-green hover:bg-forest-green/90"
                          size="sm"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Tool
                        </Button>
                        {platform.url !== "#whatsapp" && platform.url !== "#discord" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(platform.url, `platform-${index}`)}
                          >
                            {copied === `platform-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              {/* Live Preview Demo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Social Media Preview Simulation
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    This shows approximately how your content appears on social platforms
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Facebook Style Preview */}
                  <div className="border rounded-lg p-4 bg-white">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-600 rounded"></div>
                      Facebook Preview
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="aspect-[1.91:1] bg-forest-green relative">
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <div className="text-center">
                            <div className="text-2xl font-bold">AgriTech Innovation Hub</div>
                            <div className="text-sm opacity-90 mt-1">Advancing Agricultural Technology Worldwide</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {currentDomain.replace('http://', '').replace('https://', '')}
                        </div>
                        <div className="font-semibold text-lg mt-1">
                          Advanced Agricultural Technology Insights
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          Comprehensive coverage of IoT solutions, precision agriculture, and sustainable farming innovations...
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LinkedIn Style Preview */}
                  <div className="border rounded-lg p-4 bg-white">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-700 rounded"></div>
                      LinkedIn Preview
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="aspect-[1.91:1] bg-forest-green relative">
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <div className="text-center">
                            <div className="text-xl font-bold">Professional AgriTech Insights</div>
                            <div className="text-sm opacity-90 mt-1">Innovation in Agricultural Technology</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="font-semibold text-base">
                          Agricultural Technology Innovation Platform
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          Professional insights into IoT agriculture, smart farming solutions, and sustainable practices for modern agricultural enterprises.
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {currentDomain.replace('http://', '').replace('https://', '')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Twitter Style Preview */}
                  <div className="border rounded-lg p-4 bg-white">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-400 rounded"></div>
                      Twitter Preview
                    </h3>
                    <div className="border rounded-lg overflow-hidden max-w-md">
                      <div className="aspect-[2:1] bg-forest-green relative">
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <div className="text-center">
                            <div className="text-lg font-bold">AgriTech Hub</div>
                            <div className="text-xs opacity-90 mt-1">Smart Farming Technology</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-sm">
                          Agricultural Technology Innovation
                        </div>
                        <div className="text-gray-600 text-xs mt-1">
                          IoT solutions for precision agriculture and sustainable farming
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {currentDomain.replace('http://', '').replace('https://', '')}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Quick Testing Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => window.open('https://developers.facebook.com/tools/debug/', '_blank')}
                  className="bg-forest-green hover:bg-forest-green/90"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Test on Facebook
                </Button>
                <Button
                  onClick={() => window.open('https://www.linkedin.com/post-inspector/', '_blank')}
                  className="bg-forest-green hover:bg-forest-green/90"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Test on LinkedIn
                </Button>
                <Button
                  onClick={() => window.open('https://www.opengraph.xyz/', '_blank')}
                  variant="outline"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Universal Tester
                </Button>
                <Button
                  onClick={() => {
                    const url = encodeURIComponent(testUrls[0].url);
                    window.open(`https://api.whatsapp.com/send?text=Check out this agricultural technology content: ${url}`, '_blank');
                  }}
                  variant="outline"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Test on WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}