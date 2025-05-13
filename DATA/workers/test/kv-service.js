class KVWrapper {
  constructor() {
    // This will be provided by the binding in the worker config
    this.kv = null;
  }

  setBinding(kvBinding) {
    this.kv = kvBinding;
  }

  async get({ key }) {
    try {
      if (!this.kv) {
        throw new Error("KV binding not initialized");
      }
      return await this.kv.get({ key });
    } catch (error) {
      console.error(`Error fetching key ${key}:`, error);
      return null;
    }
  }

  async set({ key, value }) {
    try {
      if (!this.kv) {
        throw new Error("KV binding not initialized");
      }
      await this.kv.set({ key, value });
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
    }
  }

  async delete({ key }) {
    try {
      if (!this.kv) {
        throw new Error("KV binding not initialized");
      }
      await this.kv.delete({ key });
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
    }
  }
}

// Create a singleton instance
const kvWrapper = new KVWrapper();

// This function should be called with the KV binding when the worker initializes
export function initialize(kvBinding) {
  kvWrapper.setBinding(kvBinding);
}

export default {
  // Add a fetch handler to initialize the KV binding
  async fetch(request, env) {
    // Initialize with the KV binding if not already done
    if (!kvWrapper.kv && env.KV) {
      initialize(env.KV);
    } else {
      return new Response("KV service already initialized " + JSON.stringify(env));
    }

    // Return a simple response for direct testing
    return new Response("KV service initialized");
  },

  async get({ key }) {
    return kvWrapper.get({ key });
  },
  async set({ key, value }) {
    return kvWrapper.set({ key, value });
  },
  async delete({ key }) {
    return kvWrapper.delete({ key });
  },
};
