const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Serve the main React app
    const indexPath = path.join(__dirname, '../client/dist/index.html');
    
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } else {
      res.status(404).send('App not found');
    }
  } catch (error) {
    console.error('Error serving app:', error);
    res.status(500).send('Server error');
  }
};