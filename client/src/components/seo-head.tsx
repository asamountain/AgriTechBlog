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
  wordCount
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
      
      // Open Graph tags
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:image:alt', content: `${title} - Featured Image` },
      { property: 'og:site_name', content: 'San\'s AgriTech Blog' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:locale:alternate', content: 'en_GB' },
      
      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:site', content: '@SansAgriTech' },
      { name: 'twitter:creator', content: '@SansAgriTech' },
      
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
      { name: 'geo.region', content: 'US' },
      { name: 'geo.position', content: '40.7128;-74.0060' },
      { name: 'ICBM', content: '40.7128, -74.0060' },
      
      // Content classification for AI
      { name: 'content-category', content: 'agricultural-technology' },
      { name: 'content-domain', content: 'agritech' },
      { name: 'content-audience', content: 'professionals' },
      { name: 'content-format', content: 'blog-article' },
      
      // Performance hints
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'referrer', content: 'strict-origin-when-cross-origin' }
    ];
    
    // Add meta tags to head
    metaTags.forEach(({ name, property, content }) => {
      const meta = document.createElement('meta');
      if (name) meta.setAttribute('name', name);
      if (property) meta.setAttribute('property', property);
      meta.setAttribute('content', content);
      meta.setAttribute('data-seo', 'true');
      document.head.appendChild(meta);
    });
    
    // Add canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url || window.location.href;
    
    // Add structured data for better AI understanding
    const structuredData = {
      "@context": "https://schema.org",
      "@type": type === 'article' ? 'BlogPosting' : 'WebSite',
      "name": title,
      "headline": title,
      "description": description,
      "url": url || window.location.href,
      "image": image,
      "publisher": {
        "@type": "Organization",
        "name": "San's AgriTech Blog",
        "description": "Advanced agricultural technology content and insights",
        "url": "https://tech-san.vercel.app",
        "logo": {
          "@type": "ImageObject",
          "url": "https://tech-san.vercel.app/logo.png"
        },
        "sameAs": [
          "https://twitter.com/SansAgriTech",
          "https://linkedin.com/in/agritech-innovations"
        ]
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url || window.location.href
      },
      "inLanguage": "en-US",
      "about": {
        "@type": "Thing",
        "name": "Agricultural Technology",
        "description": "Technology solutions for modern farming and agricultural practices"
      },
      "audience": {
        "@type": "Audience",
        "audienceType": "Agricultural Technology Professionals"
      },
      ...(type === 'article' && {
        "author": {
          "@type": "Person",
          "name": author,
          "description": "Agricultural Technology Content Creator",
          "url": "https://tech-san.vercel.app/about"
        },
        "datePublished": publishedTime,
        "dateModified": modifiedTime || publishedTime,
        "articleSection": category,
        "keywords": keywords.concat(tags).join(', '),
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": url || window.location.href
        },
        ...(readingTime && { "timeRequired": `PT${readingTime}M` }),
        ...(wordCount && { "wordCount": wordCount }),
        "isAccessibleForFree": true,
        "isPartOf": {
          "@type": "Blog",
          "name": "San's AgriTech Blog",
          "url": "https://tech-san.vercel.app"
        }
      }),
      ...(type === 'website' && {
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${window.location.origin}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      })
    };
    
    // Remove existing structured data
    const existingJsonLd = document.querySelector('script[type="application/ld+json"][data-seo]');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }
    
    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, tags, category, readingTime, wordCount]);
  
  return null;
}