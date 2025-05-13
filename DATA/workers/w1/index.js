export default {
  async fetch(req, env, ctx) {
    // Log the test property of MY_KV
    const value = await env.MY_KV.get("test");

    return new Response(`Worker A sees test property: ${value}` + JSON.stringify(env));

// store all keyys of env.
// const keys = Object.keys(env.MY_KV);
// return new Response(`Worker A sees: ${keys}`);
    // return new Response(`Worker A sees: ${env.MY_KV} || ${env.MY_KV.get("latest")}` + JSON.stringify(env));

    const url = new URL(req.url);

    if (req.method === "POST") {
      const value = await req.text();
      await env.MY_KV.set("latest", value);
      return new Response("Stored in A!");
    }

    const kvVal = await env.MY_KV.get("latest");
    return new Response("Worker A sees: " + (kvVal ?? "[empty]"));
  },
};

// curl -X POST http://localhost:8787 -d "Hello!"
// curl http://localhost:8787/get
