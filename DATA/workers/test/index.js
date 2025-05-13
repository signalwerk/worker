// KV Service for {{name}}

// const KV = function (env) {
//   const get = async (key) => {
//     return await env.get({ key });
//   };

//   const set = async (key, value) => {
//     await env.set({ key, value });
//   };
//   return { get, set };
// };

// import KV from "@workerd/kv";
const KV = function (env) {
  const get = async (key) => {
    return await env.get({ key });
  };

  const set = async (key, value) => {
    await env.set({ key, value });
  };

  const del = async (key) => {
    return await env.delete({ key });
  };

  return { get, set, delete: del };
};

export default {
  async fetch(request, env, ctx) {
    // First initialize the testKV service with its KV binding
    // This is needed only once, but doesn't hurt to do it on each request
    // const a =  await env.testKV.fetch(new Request("http://internal/initialize"), env);

    // return a;
    const a = await fetch("http://localhost:3041/health");

    return new Response(a.statusText);

    const { get, set } = env.testKV;

    // Test writing and reading data
    await set({ key: "test", value: "Hello from KV" });

    return new Response(`${await get("test")} --- Hello from test worker!`);
  },
};
