const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");
const handlebars = require("handlebars");
const exphbs = require("express-handlebars");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "admin_api_key";
const KV_SERVICE_URL = process.env.KV_SERVICE_URL || "http://localhost:3001";
const WORKERD_CONTAINER_NAME =
  process.env.WORKERD_CONTAINER_NAME || "worker-workerd-1";

const APP_DIR = path.join(__dirname, ".");
const DATA_DIR = path.join(__dirname, "DATA");

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

// Set up handlebars as the view engine
app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(APP_DIR, "views/layouts"),
    partialsDir: path.join(APP_DIR, "views/partials"),
  }),
);
app.set("view engine", "hbs");
app.set("views", path.join(APP_DIR, "views"));

// Serve static files
app.use(express.static(path.join(APP_DIR, "public")));

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  next();
};

// Authentication middleware for UI pages
const authenticateForUi = (req, res, next) => {
  const authCookie = req.cookies?.apiKey;

  console.log("Auth cookie:", authCookie);
  console.log("Expected API key:", API_KEY);

  if (!authCookie || authCookie !== API_KEY) {
    console.log("Authentication failed, redirecting to login");
    return res.redirect("/login");
  }

  console.log("Authentication successful");
  next();
};

// Load worker data from filesystem
const getWorkerData = async () => {
  try {
    const metaPath = path.join(DATA_DIR, "_meta.json");
    const metaData = await fs.readJson(metaPath);

    const workers = [];
    for (const workerName of metaData.routes) {
      const workerMetaPath = path.join(DATA_DIR, workerName, "_meta.json");

      try {
        const workerMeta = await fs.readJson(workerMetaPath);
        workers.push({
          name: workerName,
          ...workerMeta,
        });
      } catch (err) {
        console.error(`Error reading worker metadata for ${workerName}:`, err);
      }
    }

    return { workers, meta: metaData };
  } catch (error) {
    console.error("Error loading worker data:", error);
    return { workers: [], meta: { routes: [] } };
  }
};

// Generate capnp config using handlebars
const generateCapnpConfig = async (workerData) => {
  try {
    // Read the template
    const templatePath = path.join(APP_DIR, "templates", "config.capnp.hbs");
    const templateContent = await fs.readFile(templatePath, "utf8");

    // Compile the template
    const template = handlebars.compile(templateContent);

    // Generate the config
    const config = template(workerData);

    // Write the updated config
    const configPath = path.join(DATA_DIR, "config.capnp");
    await fs.writeFile(configPath, config);

    return true;
  } catch (error) {
    console.error("Error generating capnp config:", error);
    return false;
  }
};

// Restart workerd container
const restartWorkerd = async () => {
  console.log(`Restarting workerd service via API call`);

  const WORKERD_RESTART_URL =
    process.env.WORKERD_RESTART_URL || "http://workerd:3002/restart";

  try {
    const response = await axios.post(
      WORKERD_RESTART_URL,
      {},
      {
        headers: {
          "x-api-key": API_KEY,
        },
      },
    );

    console.log("Restart response:", response.data);
    return true;
  } catch (error) {
    console.error("Error restarting workerd service:", error.message);
    throw error;
  }
};

// Add body-parser middleware for cookie handling
app.use(require("cookie-parser")());
app.use(express.urlencoded({ extended: true }));

// Login route for authentication
app.get("/login", (req, res) => {
  res.render("login", { layout: "auth" });
});

app.post("/login", (req, res) => {
  const { apiKey } = req.body;

  console.log("Received login attempt with apiKey:", apiKey);

  if (apiKey === API_KEY) {
    console.log("Login successful, setting cookie");

    // Set a cookie with the API key
    res.cookie("apiKey", apiKey, {
      httpOnly: false, // Changed to false so client JavaScript can access it
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/", // Ensure the cookie is available for the entire site
      sameSite: "strict", // Security best practice
    });

    return res.redirect("/");
  }

  console.log("Login failed, invalid API key");
  res.render("login", {
    layout: "auth",
    error: "Invalid API key",
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("apiKey");
  res.redirect("/login");
});

// Admin UI routes - protected by authentication
app.get("/", authenticateForUi, async (req, res) => {
  const workerData = await getWorkerData();
  res.render("dashboard", { workers: workerData.workers });
});

app.get("/workers/new", authenticateForUi, (req, res) => {
  res.render("worker-form", { worker: {} });
});

app.get("/workers/:name/edit", authenticateForUi, async (req, res) => {
  const { name } = req.params;
  const { workers } = await getWorkerData();
  const worker = workers.find((w) => w.name === name);

  if (!worker) {
    return res.status(404).send("Worker not found");
  }

  res.render("worker-form", { worker });
});

// Add route for editing worker code
app.get("/workers/:name/code", authenticateForUi, async (req, res) => {
  const { name } = req.params;
  const { workers } = await getWorkerData();
  const worker = workers.find((w) => w.name === name);

  if (!worker) {
    return res.status(404).send("Worker not found");
  }

  try {
    const codeFilePath = path.join(DATA_DIR, name, "index.js");
    const code = await fs.readFile(codeFilePath, "utf8");

    res.render("code-editor", {
      worker,
      code,
    });
  } catch (error) {
    console.error(`Error reading code for worker ${name}:`, error);
    res.status(500).send("Error reading worker code");
  }
});

// API Routes
app.get("/api/workers", authenticateApiKey, async (req, res) => {
  const workerData = await getWorkerData();
  res.json(workerData);
});

app.get("/api/workers/:name", authenticateApiKey, async (req, res) => {
  const { name } = req.params;
  const { workers } = await getWorkerData();
  const worker = workers.find((w) => w.name === name);

  if (!worker) {
    return res.status(404).json({ error: "Worker not found" });
  }

  res.json(worker);
});

// Get worker code
app.get("/api/workers/:name/code", authenticateApiKey, async (req, res) => {
  const { name } = req.params;
  try {
    const codeFilePath = path.join(DATA_DIR, name, "index.js");
    const code = await fs.readFile(codeFilePath, "utf8");
    res.json({ code });
  } catch (error) {
    console.error(`Error reading code for worker ${name}:`, error);
    res.status(500).json({ error: "Error reading worker code" });
  }
});

// Generate KV service file for a binding
const generateKVServiceFile = async (kvServicePath) => {
  try {
    // Read the template
    const templatePath = path.join(APP_DIR, "templates", "kv-service.js.hbs");
    const templateContent = await fs.readFile(templatePath, "utf8");

    // Compile the template
    const template = handlebars.compile(templateContent);

    // Generate the service file
    const serviceContent = template({ name: "xxxx" });

    // Create directory for the binding if it doesn't exist
    const bindingDir = path.join(DATA_DIR, bindingName);
    await fs.ensureDir(bindingDir);

    // Write the service file
    const serviceFilePath = path.join(bindingDir, "kv-service.js");
    await fs.writeFile(serviceFilePath, kvServicePath);

    return true;
  } catch (error) {
    console.error(
      `Error generating KV service file for binding (${kvServicePath}):`,
      error,
    );
    return false;
  }
};

// Update worker code
app.put("/api/workers/:name/code", authenticateApiKey, async (req, res) => {
  const { name } = req.params;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const codeFilePath = path.join(DATA_DIR, name, "index.js");
    await fs.writeFile(codeFilePath, code);

    // Restart workerd to apply code changes
    await restartWorkerd();

    res.json({ message: "Worker code updated successfully" });
  } catch (error) {
    console.error(`Error updating code for worker ${name}:`, error);
    res.status(500).json({ error: "Error updating worker code" });
  }
});

app.post("/api/workers", authenticateApiKey, async (req, res) => {
  try {
    const { name, route = "", bindings = {} } = req.body;

    if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
      return res.status(400).json({ error: "Invalid worker name" });
    }

    // Validate bindings format - should be name:service pairs
    for (const [bindingName, service] of Object.entries(bindings)) {
      if (service !== "kv") {
        return res.status(400).json({
          error: `Invalid service type for binding '${bindingName}'. Only 'kv' is supported.`,
        });
      }
    }

    // Load current meta data
    const metaPath = path.join(DATA_DIR, "_meta.json");
    const metaData = await fs.readJson(metaPath);

    // Check if worker already exists
    if (metaData.routes.includes(name)) {
      return res.status(409).json({ error: "Worker already exists" });
    }

    // Create worker directory
    const workerDir = path.join(DATA_DIR, name);
    await fs.ensureDir(workerDir);

    // Create worker metadata
    const workerMeta = {
      name,
      route,
      bindings,
    };

    await fs.writeJson(path.join(workerDir, "_meta.json"), workerMeta, {
      spaces: 2,
    });

    // Create initial worker code
    const indexJsPath = path.join(workerDir, "index.js");
    await fs.writeFile(
      indexJsPath,
      `
export default {
  async fetch(request, env) {
    return new Response('Hello from ${name} worker!');
  }
}
    `.trim(),
    );

    // Generate KV service files for each binding
    for (const bindingName of Object.keys(bindings)) {
      const kvServicePath = path.join(workerDir, bindingName, "kv-service.js");
      await generateKVServiceFile(kvServicePath);
    }

    // Update main meta data
    metaData.routes.push(name);
    await fs.writeJson(metaPath, metaData, { spaces: 2 });

    // Generate new capnp config
    const workerData = await getWorkerData();
    await generateCapnpConfig(workerData);

    // Restart workerd
    await restartWorkerd();

    res.status(201).json({ name, ...workerMeta });
  } catch (error) {
    console.error("Error creating worker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/workers/:name", authenticateApiKey, async (req, res) => {
  try {
    const { name } = req.params;
    const { routes = [], bindings = {} } = req.body;

    // Validate that routes is an array with at most one element
    if (!Array.isArray(routes) || routes.length > 1) {
      return res
        .status(400)
        .json({ error: "Routes must be a single route value" });
    }

    // Validate bindings format - should be name:service pairs
    for (const [bindingName, service] of Object.entries(bindings)) {
      if (service !== "kv") {
        return res.status(400).json({
          error: `Invalid service type for binding '${bindingName}'. Only 'kv' is supported.`,
        });
      }
    }

    // Check if worker exists
    const workerDir = path.join(DATA_DIR, name);
    if (!(await fs.pathExists(workerDir))) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Generate KV service files for each binding
    for (const bindingName of Object.keys(bindings)) {
      const kvServicePath = path.join(workerDir, bindingName, "kv-service.js");
      await generateKVServiceFile(kvServicePath);
    }

    // Update worker metadata
    const workerMeta = {
      routes,
      bindings,
    };

    await fs.writeJson(path.join(workerDir, "_meta.json"), workerMeta, {
      spaces: 2,
    });

    // Generate new capnp config
    const workerData = await getWorkerData();
    await generateCapnpConfig(workerData);

    // Restart workerd
    await restartWorkerd();

    res.json({ name, ...workerMeta });
  } catch (error) {
    console.error("Error updating worker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/workers/:name", authenticateApiKey, async (req, res) => {
  try {
    const { name } = req.params;

    // Load current meta data
    const metaPath = path.join(DATA_DIR, "_meta.json");
    const metaData = await fs.readJson(metaPath);

    // Check if worker exists
    if (!metaData.routes.includes(name)) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Remove worker from meta data
    metaData.routes = metaData.routes.filter((route) => route !== name);
    await fs.writeJson(metaPath, metaData, { spaces: 2 });

    // Delete worker directory
    const workerDir = path.join(DATA_DIR, name);
    await fs.remove(workerDir);

    // Generate new capnp config
    const workerData = await getWorkerData();
    await generateCapnpConfig(workerData);

    // Restart workerd
    await restartWorkerd();

    res.json({ message: `Worker '${name}' deleted successfully` });
  } catch (error) {
    console.error("Error deleting worker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Admin service running on port ${PORT}`);
});
