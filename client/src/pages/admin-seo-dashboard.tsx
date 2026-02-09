import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Search, 
  Globe, 
  Bot, 
  TrendingUp, 
  Eye, 
  Link, 
  FileText, 
  Zap,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from "lucide-react";

interface SEOMetrics {
  overallScore: number;
  geoScore: number;
  technicalSEO: number;
  contentOptimization: number;
  aiVisibility: number;
  searchEngineHealth: number;
  socialSignals: number;
  performanceScore: number;
}

interface GEOMetrics {
  aiChatbotReferences: number;
  structuredDataCompliance: number;
  contentAuthority: number;
  semanticOptimization: number;
  conversationalQueryOptimization: number;
  knowledgeGraphPresence: number;
}

interface PerformanceData {
  sitemap: { status: string; urls: number; lastUpdate: string };
  robotsTxt: { status: string; aiBotsAllowed: number };
  rss: { status: string; posts: number };
  ogImages: { status: string; generated: boolean };
  structuredData: { status: string; schemas: number };
  pageSpeed: { mobile: number; desktop: number };
  ssl: { status: string; expiry: string };
  indexability: { indexed: number; total: number };
}

export default function AdminSEODashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Mock data for demonstration - in production, this would come from real analytics APIs
  const seoMetrics: SEOMetrics = {
    overallScore: 95,
    geoScore: 92,
    technicalSEO: 98,
    contentOptimization: 89,
    aiVisibility: 94,
    searchEngineHealth: 96,
    socialSignals: 87,
    performanceScore: 93
  };

  const geoMetrics: GEOMetrics = {
    aiChatbotReferences: 78,
    structuredDataCompliance: 95,
    contentAuthority: 88,
    semanticOptimization: 91,
    conversationalQueryOptimization: 86,
    knowledgeGraphPresence: 82
  };

  const performanceData: PerformanceData = {
    sitemap: { status: "Active", urls: 89, lastUpdate: new Date().toISOString() },
    robotsTxt: { status: "Optimized", aiBotsAllowed: 12 },
    rss: { status: "Active", posts: 50 },
    ogImages: { status: "Active", generated: true },
    structuredData: { status: "Valid", schemas: 8 },
    pageSpeed: { mobile: 89, desktop: 95 },
    ssl: { status: "Valid", expiry: "2025-12-31" },
    indexability: { indexed: 86, total: 89 }
  };

  const aiBotData = [
    { name: "GPTBot", allowed: true, crawled: 45, score: 92 },
    { name: "Claude-Web", allowed: true, crawled: 38, score: 89 },
    { name: "PerplexityBot", allowed: true, crawled: 42, score: 94 },
    { name: "CCBot", allowed: true, crawled: 51, score: 88 },
    { name: "YouBot", allowed: true, crawled: 33, score: 85 },
    { name: "Applebot", allowed: true, crawled: 29, score: 91 }
  ];

  const searchEngineData = [
    { name: "Google", indexed: 82, score: 96, visibility: 94 },
    { name: "Bing", indexed: 79, score: 91, visibility: 87 },
    { name: "DuckDuckGo", indexed: 76, score: 89, visibility: 83 },
    { name: "Yandex", indexed: 71, score: 85, visibility: 79 },
    { name: "Baidu", indexed: 68, score: 82, visibility: 75 }
  ];

  const performanceTrend = [
    { date: "2024-01", seo: 75, geo: 68 },
    { date: "2024-02", seo: 82, geo: 74 },
    { date: "2024-03", seo: 88, geo: 81 },
    { date: "2024-04", seo: 91, geo: 85 },
    { date: "2024-05", seo: 94, geo: 89 },
    { date: "2024-06", seo: 95, geo: 92 }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-forest-green";
    if (score >= 75) return "text-forest-green/70";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-forest-green/10 text-forest-green">Excellent</Badge>;
    if (score >= 75) return <Badge className="bg-forest-green/20 text-forest-green/80">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call to refresh data
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastUpdated(new Date());
    setRefreshing(false);
  };

  const testEndpoints = [
    { name: "XML Sitemap", url: "/sitemap.xml", status: "✓" },
    { name: "Robots.txt", url: "/robots.txt", status: "✓" },
    { name: "RSS Feed", url: "/rss.xml", status: "✓" },
    { name: "Open Graph Image", url: "/api/og-image", status: "✓" },
    { name: "Structured Data", url: "/api/structured-data", status: "⚠" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-playfair font-bold text-gray-900">
                  SEO & GEO Performance Dashboard
                </h1>
                <p className="text-gray-600 mt-2">
                  Global optimization health for search engines and AI chatbots
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
                <Button 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                  className="bg-forest-green hover:bg-forest-green/90"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Overall Scores */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Overall SEO Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(seoMetrics.overallScore)}`}>
                    {seoMetrics.overallScore}%
                  </span>
                  {getScoreBadge(seoMetrics.overallScore)}
                </div>
                <Progress value={seoMetrics.overallScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">GEO Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(seoMetrics.geoScore)}`}>
                    {seoMetrics.geoScore}%
                  </span>
                  {getScoreBadge(seoMetrics.geoScore)}
                </div>
                <Progress value={seoMetrics.geoScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">AI Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(seoMetrics.aiVisibility)}`}>
                    {seoMetrics.aiVisibility}%
                  </span>
                  {getScoreBadge(seoMetrics.aiVisibility)}
                </div>
                <Progress value={seoMetrics.aiVisibility} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(seoMetrics.performanceScore)}`}>
                    {seoMetrics.performanceScore}%
                  </span>
                  {getScoreBadge(seoMetrics.performanceScore)}
                </div>
                <Progress value={seoMetrics.performanceScore} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="geo">GEO Analysis</TabsTrigger>
              <TabsTrigger value="technical">Technical SEO</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Performance Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    SEO & GEO Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="seo" stroke="#2D5016" strokeWidth={2} />
                      <Line type="monotone" dataKey="geo" stroke="#1a3009" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Technical SEO</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{seoMetrics.technicalSEO}%</div>
                    <Progress value={seoMetrics.technicalSEO} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Content Optimization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{seoMetrics.contentOptimization}%</div>
                    <Progress value={seoMetrics.contentOptimization} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Search Engine Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{seoMetrics.searchEngineHealth}%</div>
                    <Progress value={seoMetrics.searchEngineHealth} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Social Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{seoMetrics.socialSignals}%</div>
                    <Progress value={seoMetrics.socialSignals} className="mt-2" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="geo" className="space-y-6">
              {/* GEO Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">AI Chatbot References</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{geoMetrics.aiChatbotReferences}%</div>
                    <Progress value={geoMetrics.aiChatbotReferences} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-2">Content referenced by AI systems</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Structured Data Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{geoMetrics.structuredDataCompliance}%</div>
                    <Progress value={geoMetrics.structuredDataCompliance} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-2">Schema.org implementation</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Content Authority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{geoMetrics.contentAuthority}%</div>
                    <Progress value={geoMetrics.contentAuthority} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-2">AI trust and expertise signals</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Semantic Optimization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{geoMetrics.semanticOptimization}%</div>
                    <Progress value={geoMetrics.semanticOptimization} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-2">Context understanding</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Conversational Queries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{geoMetrics.conversationalQueryOptimization}%</div>
                    <Progress value={geoMetrics.conversationalQueryOptimization} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-2">Natural language optimization</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Knowledge Graph</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{geoMetrics.knowledgeGraphPresence}%</div>
                    <Progress value={geoMetrics.knowledgeGraphPresence} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-2">Entity recognition</p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Bot Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Chatbot Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={aiBotData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" fill="#2D5016" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-6">
              {/* Technical SEO Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Infrastructure</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>XML Sitemap</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-600">{performanceData.sitemap.urls} URLs</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Robots.txt</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-600">{performanceData.robotsTxt.aiBotsAllowed} AI bots allowed</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>RSS Feed</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-600">{performanceData.rss.posts} posts</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>SSL Certificate</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-600">Valid until {performanceData.ssl.expiry}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Search Engine Indexing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={searchEngineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="indexed" fill="#2D5016" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Endpoint Testing */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO Endpoint Health Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{endpoint.status}</span>
                          <span className="font-medium">{endpoint.name}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(endpoint.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Page Speed Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span>Mobile</span>
                          <span className="font-bold text-green-600">{performanceData.pageSpeed.mobile}</span>
                        </div>
                        <Progress value={performanceData.pageSpeed.mobile} />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span>Desktop</span>
                          <span className="font-bold text-green-600">{performanceData.pageSpeed.desktop}</span>
                        </div>
                        <Progress value={performanceData.pageSpeed.desktop} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Indexing Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {performanceData.indexability.indexed}/{performanceData.indexability.total}
                      </div>
                      <p className="text-gray-600">Pages Indexed</p>
                      <Progress 
                        value={(performanceData.indexability.indexed / performanceData.indexability.total) * 100} 
                        className="mt-4" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6">
              {/* Third-party Tools Integration */}
              <Card>
                <CardHeader>
                  <CardTitle>Third-party SEO Analysis Tools</CardTitle>
                  <p className="text-sm text-gray-600">
                    Recommended tools to validate and monitor your SEO/GEO performance
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Google Search Console</h4>
                      <p className="text-sm text-gray-600 mb-3">Official Google indexing and performance data</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://search.google.com/search-console', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Tool
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">GTmetrix</h4>
                      <p className="text-sm text-gray-600 mb-3">Page speed and performance analysis</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://gtmetrix.com', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Analyze Site
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Schema Markup Validator</h4>
                      <p className="text-sm text-gray-600 mb-3">Validate structured data implementation</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://validator.schema.org', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Validate
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Lighthouse</h4>
                      <p className="text-sm text-gray-600 mb-3">Comprehensive web performance audit</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://pagespeed.web.dev', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Run Audit
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">SEMrush</h4>
                      <p className="text-sm text-gray-600 mb-3">Comprehensive SEO analysis and monitoring</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://semrush.com', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Analyze
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Ahrefs</h4>
                      <p className="text-sm text-gray-600 mb-3">Backlink analysis and SEO monitoring</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://ahrefs.com', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Check Site
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GEO-specific Monitoring */}
              <Card>
                <CardHeader>
                  <CardTitle>GEO Performance Monitoring</CardTitle>
                  <p className="text-sm text-gray-600">
                    Monitor your content's visibility in AI chatbots and generative engines
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Manual AI Testing</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Regularly test your content visibility by asking AI chatbots questions about agricultural technology topics covered in your blog.
                      </p>
                      <div className="text-sm">
                        <strong>Sample queries to test:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>"What are the latest IoT solutions for precision agriculture?"</li>
                          <li>"How can smart farming improve crop monitoring?"</li>
                          <li>"What are the benefits of sustainable farming practices?"</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Content Authority Signals</h4>
                      <p className="text-sm text-gray-600">
                        Your content is optimized with expertise signals that AI systems recognize:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>Technical depth and specificity in agricultural technology topics</li>
                        <li>Structured data markup for enhanced understanding</li>
                        <li>Comprehensive coverage of IoT and smart farming solutions</li>
                        <li>Regular updates and fresh content publication</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}