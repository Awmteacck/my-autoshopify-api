require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000; // Render uses port 10000 by default

// Middleware
app.use(express.json());

// Health check endpoint (Render uses this)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Main API endpoint
app.get('/', async (req, res) => {
  const { site, cc } = req.query;

  // Validation
  if (!site || !cc) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      usage: 'GET /?site={shop_url}&cc={card_info}',
      example: '/?site=example.myshopify.com&cc=test123'
    });
  }

  try {
    // Your Shopify API logic here
    const shopifyApiKey = process.env.SHOPIFY_API_KEY;
    const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shopifyApiKey || !shopifyAccessToken) {
      return res.status(500).json({ error: 'Shopify API credentials not configured' });
    }

    // Example Shopify API call (customize based on your needs)
    const shopifyResponse = await axios.get(`https://${site}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': shopifyAccessToken,
        'Content-Type': 'application/json'
      }
    });

    // Process the card info (NEVER store real card data - use tokenization)
    const processedResult = {
      message: 'API request successful',
      site: site,
      shopInfo: shopifyResponse.data.shop.name,
      cardProcessed: `Card ending in ${cc.slice(-4)}`, // Only show last 4 digits
      timestamp: new Date().toISOString()
    };

    res.json(processedResult);

  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ 
      error: 'Processing failed',
      message: error.response?.data?.errors || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AutoShopify API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
