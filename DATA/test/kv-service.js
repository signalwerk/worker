class InMemoryKV {
  constructor() {
    this.store = new Map([["test", "!!!!test"]]);
  }

  async get({ key }) {
    return this.store.get(key) ?? null;
  }

  async set({ key, value }) {
    this.store.set(key, value);
  }

  async delete({ key }) {
    this.store.delete(key);
  }
}

// Export plain object with methods for RPC
const kv = new InMemoryKV();

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
