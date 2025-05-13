
class RemoteKV {
  constructor() {
    this.baseUrl = 'http://localhost:3001/kv';
    this.namespace = 'default';
    this.apiKey = 'admin_api_key'; // Use the default API key from the server
  }

  async get({ key }) {
    try {
      const response = await fetch(`${this.baseUrl}/${this.namespace}/${key}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Error getting value: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error(`Error fetching key ${key}:`, error);
      return null;
    }
  }

  async set({ key, value }) {
    try {
      const response = await fetch(`${this.baseUrl}/${this.namespace}/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({ value })
      });

      if (!response.ok) {
        throw new Error(`Error setting value: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
    }
  }

  async delete({ key }) {
    try {
      const response = await fetch(`${this.baseUrl}/${this.namespace}/${key}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        }
      });
      
      if (!response.ok && response.status !== 404) {
        throw new Error(`Error deleting value: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
    }
  }
}

// Export plain object with methods for RPC
const kv = new RemoteKV();

export default {
  async get({ key }) {
    return kv.get({ key });
  },
  async set({ key, value }) {
    return kv.set({ key, value });
  },
  async delete({ key }) {
    return kv.delete({ key });
  },
};

// export default {
//   get: kv.get,
//   set: kv.set,
//   delete: kv.delete,
// };

// export default {
//   async get({ key }) {
//     return kv.get({key});
//   },
//   async set({ key, value }) {
//     return kv.set({key, value});
//   },
//   async delete({ key }) {
//     return kv.delete({key});
//   },
// };
