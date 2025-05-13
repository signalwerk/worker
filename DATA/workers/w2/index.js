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
  async fetch(req, env, ctx) {
    const { get, set } = KV(env.MY_KV);
    if (req.method === "POST") {
      const value = await req.text();
      await set("latest", value);
      return new Response("Stored in B!");
    }

    const kvVal = await get("latest");
    return new Response("Worker B sees: " + (kvVal ?? "[empty]"));
  },
};
