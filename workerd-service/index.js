const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.RESTART_PORT || 3002;
const API_KEY = process.env.API_KEY 


if (!API_KEY) {
  throw new Error("API_KEY is not set");
}


// Middleware to parse JSON
app.use(express.json());

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }

  next();
};

// Function to start workerd
const startWorkerd = () => {
  console.log('Starting workerd...');
  exec('/usr/local/bin/workerd serve /app/DATA/config.capnp > /app/workerd.log 2>&1 & echo $! > /app/workerd.pid', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting workerd: ${error}`);
      return;
    }
    console.log('Workerd started successfully');
  });
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Restart endpoint
app.post('/restart', authenticateApiKey, (req, res) => {
  console.log('Restart request received');
  
  const pidFile = '/app/workerd.pid';
  
  try {
    if (fs.existsSync(pidFile)) {
      const pid = fs.readFileSync(pidFile, 'utf8').trim();
      
      console.log(`Stopping workerd process (PID: ${pid})...`);
      exec(`kill -15 ${pid}`, (error) => {
        if (error) {
          console.log(`Error stopping process: ${error}`);
          // Try force kill if regular kill fails
          exec(`kill -9 ${pid}`);
        }
        
        // Start workerd again
        console.log('Starting workerd...');
        exec('/usr/local/bin/workerd serve /app/DATA/config.capnp > /app/workerd.log 2>&1 & echo $! > /app/workerd.pid', (error, stdout, stderr) => {
          if (error) {
            console.error(`Error restarting workerd: ${error}`);
            return res.status(500).json({ error: 'Failed to restart workerd service' });
          }
          
          console.log('Workerd restarted successfully');
          res.json({ success: true, message: 'Workerd service restarted successfully' });
        });
      });
    } else {
      console.log('PID file not found, starting workerd...');
      exec('/usr/local/bin/workerd serve /app/DATA/config.capnp > /app/workerd.log 2>&1 & echo $! > /app/workerd.pid', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error starting workerd: ${error}`);
          return res.status(500).json({ error: 'Failed to start workerd service' });
        }
        
        console.log('Workerd started successfully');
        res.json({ success: true, message: 'Workerd service started successfully' });
      });
    }
  } catch (error) {
    console.error(`Error in restart endpoint: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Restart service running on port ${PORT}`);
  
  // Start workerd on service initialization
  startWorkerd();
}); 