import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { 
      title = 'Agricultural Technology Blog', 
      category = 'Technology',
      author = 'San',
    } = req.query as { title?: string; category?: string; author?: string };

    // Set headers for SVG response
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const ogTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    const ogCategory = category.toUpperCase();

    // Split title into two lines if needed
    const words = ogTitle.split(' ');
    let line1 = '';
    let line2 = '';
    
    if (words.length > 5) {
      const mid = Math.ceil(words.length / 2);
      line1 = words.slice(0, mid).join(' ');
      line2 = words.slice(mid).join(' ');
    } else {
      line1 = ogTitle;
    }

    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2D5016;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a3009;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="0" y="0" width="200%" height="200%">
            <feOffset result="offOut" in="SourceAlpha" dx="0" dy="4" />
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>
        </defs>
        
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Abstract AgriTech Pattern -->
        <g opacity="0.1">
          <circle cx="1100" cy="100" r="150" fill="white" />
          <circle cx="100" cy="530" r="200" fill="white" />
          <path d="M0 630 Q 300 300 600 630 T 1200 630" fill="none" stroke="white" stroke-width="2" />
          <path d="M0 580 Q 300 250 600 580 T 1200 580" fill="none" stroke="white" stroke-width="1" />
        </g>
        
        <!-- Category Badge -->
        <rect x="60" y="60" width="${ogCategory.length * 15 + 40}" height="40" rx="20" fill="rgba(255,255,255,0.2)" />
        <text x="${60 + (ogCategory.length * 15 + 40)/2}" y="87" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="2">${ogCategory}</text>
        
        <!-- Title -->
        <text x="60" y="240" font-family="Georgia, serif" font-size="72" font-weight="bold" fill="white" filter="url(#shadow)">
          <tspan x="60" dy="0">${escapeHtml(line1)}</tspan>
          ${line2 ? `<tspan x="60" dy="90">${escapeHtml(line2)}</tspan>` : ''}
        </text>
        
        <!-- Branding -->
        <g transform="translate(60, 520)">
          <rect width="50" height="50" rx="10" fill="white" />
          <text x="25" y="35" font-size="30" text-anchor="middle">🌱</text>
          <text x="70" y="25" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">San's AgriTech Blog</text>
          <text x="70" y="55" font-family="Arial, sans-serif" font-size="18" fill="white" opacity="0.7">by ${escapeHtml(author)} | tech-san.vercel.app</text>
        </g>
      </svg>
    `;

    res.send(svg);
    
  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).json({ error: 'Failed to generate Open Graph image' });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
 