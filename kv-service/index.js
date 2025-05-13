const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "DATA/kv");

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite database
const db = new Database(path.join(DATA_DIR, "kv-store.sqlite"));

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS key_values (
    namespace TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSON,
    created_at INTEGER,
    updated_at INTEGER,
    expires_at INTEGER,
    PRIMARY KEY (namespace, key)
  );
  CREATE INDEX IF NOT EXISTS idx_namespace ON key_values (namespace);
  CREATE INDEX IF NOT EXISTS idx_expires_at ON key_values (expires_at);
`);

// Prepare statements with expiration handling in SQL
const getStmt = db.prepare(
  "SELECT value, expires_at FROM key_values WHERE namespace = ? AND key = ? AND (expires_at IS NULL OR expires_at > ?)",
);
const listKeysStmt = db.prepare(
  "SELECT key FROM key_values WHERE namespace = ? AND key >= ? AND key < ? AND (expires_at IS NULL OR expires_at > ?) ORDER BY key LIMIT ?",
);
const putStmt = db.prepare(
  "INSERT OR REPLACE INTO key_values (namespace, key, value, created_at, updated_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
);
const deleteStmt = db.prepare(
  "DELETE FROM key_values WHERE namespace = ? AND key = ?",
);
const keyExistsStmt = db.prepare(
  "SELECT 1 FROM key_values WHERE namespace = ? AND key = ? AND (expires_at IS NULL OR expires_at > ?) LIMIT 1",
);
const namespaceExistsStmt = db.prepare(
  "SELECT 1 FROM key_values WHERE namespace = ? AND (expires_at IS NULL OR expires_at > ?) LIMIT 1",
);
const cleanupExpiredStmt = db.prepare(
  "DELETE FROM key_values WHERE expires_at IS NOT NULL AND expires_at < ?",
);

// Setup periodic cleanup of expired keys
setInterval(() => {
  const now = Date.now();
  const result = cleanupExpiredStmt.run(now);
  if (result.changes > 0) {
    console.log(`Cleaned up ${result.changes} expired keys`);
  }
}, 60 * 60 * 1000); // Run every hour

const app = express();
const PORT = process.env.PORT || 3041;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY is not set");
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["authorization"];

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  next();
};

// Apply authentication to all /kv routes
app.use("/kv", authenticateApiKey);

// Get a value
app.get("/kv/:namespace/:key", async (req, res) => {
  try {
    const { namespace, key } = req.params;
    const now = Date.now();

    const row = getStmt.get(namespace, key, now);
    if (!row) {
      return res.status(404).json({ error: "Key not found" });
    }

    res.json({
      namespace,
      key,
      value: JSON.parse(row.value),
      expires_at: row.expires_at,
    });
  } catch (error) {
    console.error("Error getting value:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set a value
app.post("/kv/:namespace/:key", async (req, res) => {
  try {
    const { namespace, key } = req.params;
    const { value, ttl } = req.body; // ttl in seconds

    if (value === undefined) {
      return res.status(400).json({ error: "Value is required" });
    }

    const now = Date.now();
    const expires_at = ttl ? now + ttl * 1000 : null;

    putStmt.run(namespace, key, JSON.stringify(value), now, now, expires_at);
    res.status(201).json({
      namespace,
      key,
      value,
      expires_at,
    });
  } catch (error) {
    console.error("Error setting value:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a value
app.delete("/kv/:namespace/:key", async (req, res) => {
  try {
    const { namespace, key } = req.params;
    const now = Date.now();

    const exists = keyExistsStmt.get(namespace, key, now);
    if (!exists) {
      return res.status(404).json({ error: "Key not found" });
    }

    deleteStmt.run(namespace, key);
    res.status(200).json({
      message: `Key '${key}' in namespace '${namespace}' deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting value:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List all keys in a namespace (with pagination)
app.get("/kv/:namespace", async (req, res) => {
  try {
    const { namespace } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const prefix = req.query.prefix || "";
    const maxKey = prefix + "\uffff"; // Using the same approach for range queries
    const now = Date.now();

    // Check if namespace exists with non-expired keys
    const namespaceExists = namespaceExistsStmt.get(namespace, now);
    if (!namespaceExists) {
      return res.json({ namespace, keys: [] });
    }

    const keys = listKeysStmt
      .all(namespace, prefix, maxKey, now, limit)
      .map((row) => row.key);

    res.json({ namespace, keys });
  } catch (error) {
    console.error("Error listing keys:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List all namespaces
app.get("/kv", async (req, res) => {
  try {
    const now = Date.now();
    const namespaces = db
      .prepare(
        "SELECT DISTINCT namespace FROM key_values WHERE (expires_at IS NULL OR expires_at > ?) ORDER BY namespace",
      )
      .all(now)
      .map((row) => row.namespace);
    res.json({ namespaces });
  } catch (error) {
    console.error("Error listing namespaces:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.listen(PORT, () => {
  console.log(`KV Service running on port ${PORT}`);
});
