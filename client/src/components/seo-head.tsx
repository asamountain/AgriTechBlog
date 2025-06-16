import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  category?: string;
}

export default function SEOHead({
  title = "AgriTech Innovation Hub - Advanced Agricultural Technology Blog",
  description = "Discover cutting-edge agricultural technology, IoT solutions, and sustainable farming practices. Expert insights on precision agriculture, crop monitoring, and smart farming innovations.",
  keywords = ["agricultural technology", "precision agriculture", "IoT farming", "smart agriculture", "crop monitoring", "sustainable farming", "AgriTech"],
  image = "/api/og-image",
  url = "",
  type = "website",
  author = "",
  publishedTime,
  modifiedTime,
  tags = [],
  category = "Technology"
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
      
      // Open Graph tags
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:image:alt', content: `${title} - Featured Image` },
      { property: 'og:site_name', content: 'AgriTech Innovation Hub' },
      { property: 'og:locale', content: 'en_US' },
      
      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:site', content: '@AgriTechHub' },
      { name: 'twitter:creator', content: '@AgriTechHub' },
      
      // Article specific meta tags
      ...(type === 'article' && publishedTime ? [
        { property: 'article:published_time', content: publishedTime },
        { property: 'article:author', content: author },
        { property: 'article:section', content: category },
        ...(modifiedTime ? [{ property: 'article:modified_time', content: modifiedTime }] : []),
        ...tags.map(tag => ({ property: 'article:tag', content: tag }))
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
      { name: 'ICBM', content: '40.7128, -74.0060' }
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
        "name": "AgriTech Innovation Hub",
        "logo": {
          "@type": "ImageObject",
          "url": "/logo.png"
        }
      },
      ...(type === 'article' && {
        "author": {
          "@type": "Person",
          "name": author
        },
        "datePublished": publishedTime,
        "dateModified": modifiedTime || publishedTime,
        "articleSection": category,
        "keywords": keywords.concat(tags).join(', '),
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": url || window.location.href
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
    
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, tags, category]);
  
  return null;
}