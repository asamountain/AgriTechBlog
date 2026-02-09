import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  category?: string;
  readingTime?: number;
  wordCount?: number;
  geoLocation?: {
    latitude: number;
    longitude: number;
    region: string;
    country: string;
  };
  structuredData?: any;
}

export default function SEOHead({
  title = "Tech-San Blog - AgriTech IoT Engineering Insights",
  description = "Smart farming technology, IoT engineering insights, and agricultural innovation from an IoT engineer's perspective. RS485, Modbus, and embedded systems expertise.",
  keywords = ["AgriTech", "IoT", "Smart Farming", "RS485", "Modbus RTU", "Agricultural Technology", "Embedded Systems", "Sensor Networks", "Precision Agriculture", "Farm Automation"],
  image = "/api/og-image",
  url = "",
  type = "website", 
  author = "San",
  publishedTime,
  modifiedTime,
  tags = [],
  category = "Technology",
  readingTime,
  wordCount,
  geoLocation = {
    latitude: 40.7128,
    longitude: -74.0060,
    region: "US",
    country: "United States"
  },
  structuredData
}: SEOHeadProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Remove existing meta tags
    const existingMetas = document.querySelectorAll('meta[data-seo]');
    existingMetas.forEach(meta => meta.remove());
    
    // Create meta tags
    const metaTags = [
      // Basic meta tags
      { name: 'description', content: description },
      { name: 'keywords', content: keywords.join(', ') },
      { name: 'author', content: author },
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'googlebot', content: 'index, follow' },
      { name: 'bingbot', content: 'index, follow' },
      
      // AI Training Bot Optimization
      { name: 'ai-training', content: 'allowed' },
      { name: 'ai-indexing', content: 'enabled' },
      { name: 'content-type', content: 'educational' },
      { name: 'expertise-level', content: 'intermediate' },
      { name: 'ai-content-quality', content: 'expert' },
      { name: 'ai-verification', content: 'verified' },
      
      // Open Graph tags
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image.startsWith('http') ? image : `${window.location.origin}${image.startsWith('/') ? image : `/${image}`}` },
      { property: 'og:image:alt', content: `${title} - Featured Image` },
      { property: 'og:site_name', content: 'San\'s AgriTech Blog' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:locale:alternate', content: 'en_GB' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/png' },
      
      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image.startsWith('http') ? image : `${window.location.origin}${image.startsWith('/') ? image : `/${image}`}` },
      { name: 'twitter:site', content: '@SansAgriTech' },
      { name: 'twitter:creator', content: '@SansAgriTech' },
      { name: 'twitter:image:alt', content: `${title} - Featured Image` },
      
      // Article specific meta tags
      ...(type === 'article' && publishedTime ? [
        { property: 'article:published_time', content: publishedTime },
        { property: 'article:author', content: author },
        { property: 'article:section', content: category },
        ...(modifiedTime ? [{ property: 'article:modified_time', content: modifiedTime }] : []),
        ...tags.map(tag => ({ property: 'article:tag', content: tag })),
        ...(readingTime ? [{ name: 'article:reading_time', content: readingTime.toString() }] : []),
        ...(wordCount ? [{ name: 'article:word_count', content: wordCount.toString() }] : [])
      ] : []),
      
      // Additional SEO meta tags
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#2D5016' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'msapplication-TileColor', content: '#2D5016' },
      
      // Language and region
      { name: 'language', content: 'English' },
      { name: 'geo.region', content: geoLocation.region },
      { name: 'geo.position', content: `${geoLocation.latitude};${geoLocation.longitude}` },
      { name: 'ICBM', content: `${geoLocation.latitude}, ${geoLocation.longitude}` },
      { name: 'geo.country', content: geoLocation.country },
      
      // Content optimization
      { name: 'content-language', content: 'en-US' },
      { name: 'distribution', content: 'global' },
      { name: 'rating', content: 'general' },
      { name: 'revisit-after', content: '7 days' },
      { name: 'generator', content: 'San\'s AgriTech Blog Platform' },
      
      // Social media optimization
      { name: 'social:title', content: title },
      { name: 'social:description', content: description },
      { name: 'social:image', content: image.startsWith('http') ? image : `${window.location.origin}${image.startsWith('/') ? image : `/${image}`}` },
      { name: 'social:url', content: url },
      
      // Mobile optimization
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'AgriTech Blog' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      
      // Performance optimization
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'msapplication-config', content: '/browserconfig.xml' },
      
      // Security
      { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      { name: 'X-UA-Compatible', content: 'IE=edge' }
    ];

    // Add data-seo attribute for easy removal
    metaTags.forEach(tag => {
      const meta = document.createElement('meta');
      Object.entries(tag).forEach(([key, value]) => {
        if (key === 'name' || key === 'property') {
          meta.setAttribute(key, value);
        } else {
          meta.setAttribute(key, value);
        }
      });
      meta.setAttribute('data-seo', 'true');
      document.head.appendChild(meta);
    });

    // Add structured data for rich snippets
    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      script.setAttribute('data-seo', 'true');
      document.head.appendChild(script);
    }

    // Add default structured data if none provided
    if (!structuredData && type === 'article') {
      const defaultStructuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "image": image.startsWith('http') ? image : `${window.location.origin}${image.startsWith('/') ? image : `/${image}`}`,
        "author": {
          "@type": "Person",
          "name": author
        },
        "publisher": {
          "@type": "Organization",
          "name": "San's AgriTech Blog",
          "logo": {
            "@type": "ImageObject",
            "url": `${window.location.origin}/logo.png`
          }
        },
        "datePublished": publishedTime,
        "dateModified": modifiedTime || publishedTime,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": url
        },
        "keywords": keywords.join(', '),
        "articleSection": category,
        "wordCount": wordCount,
        "timeRequired": readingTime ? `PT${readingTime}M` : undefined
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(defaultStructuredData);
      script.setAttribute('data-seo', 'true');
      document.head.appendChild(script);
    }

  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, tags, category, readingTime, wordCount, geoLocation, structuredData]);

  return null;
}