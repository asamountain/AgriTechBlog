module.exports = (req, res) => {
  const baseUrl = req.headers.host?.includes('localhost') 
    ? 'http://localhost:3000' 
    : `https://${req.headers.host}`;
  
  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(robots);
};