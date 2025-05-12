export default {
  async fetch(req, env, ctx) {
    return new Response("Worker B sees: ");

    // const url = new URL(req.url);

    // if (req.method === "POST") {
    //   const value = await req.text();
    //   await env.MY_KV.set("latest", value);
    //   return new Response("Stored in B!");
    // }

    // const kvVal = await env.MY_KV.get("latest");
    // return new Response("Worker B sees: " + (kvVal ?? "[empty]"));
  },
};
