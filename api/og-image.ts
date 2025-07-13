import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { 
      title = 'Agricultural Technology Blog', 
      category = 'Technology',
      author = 'San\'s Blog',
      excerpt = ''
    } = req.query;

    // Set headers for image response
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Generate dynamic HTML that will be converted to image by social platforms
    // This creates a visually appealing Open Graph image
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Open Graph Image</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              width: 1200px;
              height: 630px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #2D5016 0%, #4F7942 50%, #8BC34A 100%);
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              overflow: hidden;
            }
            
            .pattern {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              opacity: 0.1;
              background-image: 
                radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, white 2px, transparent 2px);
              background-size: 50px 50px;
            }
            
            .content {
              position: relative;
              z-index: 2;
              padding: 60px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              height: 100%;
            }
            
            .category {
              background: rgba(255, 255, 255, 0.2);
              color: white;
              padding: 12px 24px;
              border-radius: 50px;
              font-size: 16px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              display: inline-block;
              margin-bottom: 30px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.3);
              width: fit-content;
            }
            
            .title {
              color: white;
              font-size: 48px;
              font-weight: 800;
              line-height: 1.2;
              margin-bottom: 20px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
              max-width: 900px;
            }
            
            .excerpt {
              color: rgba(255, 255, 255, 0.9);
              font-size: 24px;
              line-height: 1.4;
              margin-bottom: 40px;
              max-width: 800px;
            }
            
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: auto;
            }
            
            .author {
              color: rgba(255, 255, 255, 0.8);
              font-size: 18px;
              font-weight: 500;
            }
            
            .logo {
              color: white;
              font-size: 24px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            
            .icon {
              width: 40px;
              height: 40px;
              background: white;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            }
            
            /* Responsive text sizing */
            @media (max-width: 1200px) {
              .title { font-size: 42px; }
              .excerpt { font-size: 22px; }
            }
            
            /* Handle very long titles */
            .title.long {
              font-size: 40px;
              line-height: 1.1;
            }
          </style>
        </head>
        <body>
          <div class="pattern"></div>
          <div class="content">
            <div class="category">${category}</div>
            <h1 class="title ${(title as string).length > 60 ? 'long' : ''}">${title}</h1>
            ${excerpt ? `<p class="excerpt">${excerpt}</p>` : ''}
            <div class="footer">
              <div class="author">by ${author}</div>
              <div class="logo">
                <div class="icon">🌱</div>
                San's Agricultural Technology Blog
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    res.status(200).send(html);
  } catch (error) {
    console.error('OG Image generation error:', error);
    
    // Fallback to a simple HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Agricultural Technology Blog</title>
        </head>
        <body style="
          margin: 0; 
          padding: 60px; 
          width: 1200px; 
          height: 630px; 
          background: linear-gradient(135deg, #2D5016, #4F7942); 
          color: white; 
          font-family: system-ui; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          text-align: center;
        ">
          <div>
            <h1 style="font-size: 48px; margin-bottom: 20px;">🌱 Agricultural Technology Blog</h1>
            <p style="font-size: 24px; opacity: 0.9;">Innovative Farming Solutions & Technology</p>
          </div>
        </body>
      </html>
    `);
  }
} 