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
  return { get, set };
};

export default {
  async fetch(request, env, ctx) {
    const { get, set } = KV(env.testKV);
    // await set("test", "test");
    return new Response(
      `${await get("test")} ---  Hello from test worker!235 ${JSON.stringify(
        env,
      )} ${JSON.stringify(ctx)}`,
    );
  },
};
