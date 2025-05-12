const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { Level } = require('level');

// Initialize the Level database for KV storage
const db = new Level('./data/kv-store', { valueEncoding: 'json' });

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'admin_api_key';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  next();
};

// Get a value
app.get('/kv/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    try {
      const value = await db.get(key);
      res.json({ key, value });
    } catch (err) {
      if (err.code === 'LEVEL_NOT_FOUND') {
        return res.status(404).json({ error: 'Key not found' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error getting value:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set a value
app.post('/kv/:key', authenticateApiKey, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    await db.put(key, value);
    res.status(201).json({ key, value });
  } catch (error) {
    console.error('Error setting value:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a value
app.delete('/kv/:key', authenticateApiKey, async (req, res) => {
  try {
    const { key } = req.params;
    
    try {
      await db.get(key); // Check if key exists
      await db.del(key);
      res.status(200).json({ message: `Key '${key}' deleted successfully` });
    } catch (err) {
      if (err.code === 'LEVEL_NOT_FOUND') {
        return res.status(404).json({ error: 'Key not found' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error deleting value:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all keys (with pagination)
app.get('/kv', authenticateApiKey, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const prefix = req.query.prefix || '';
    
    const keys = [];
    
    for await (const key of db.keys({ limit, lt: prefix + '\uffff', gte: prefix })) {
      keys.push(key);
    }
    
    res.json({ keys });
  } catch (error) {
    console.error('Error listing keys:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`KV Service running on port ${PORT}`);
}); 