export default {
  async fetch(request, env, ctx) {
    const config = env._config;

    // extract the function path --> /$function-name/...splat
    // function name is case insensitive
    const [, route] = new URL(request.url).pathname.toLowerCase().split("/");

    // function not specified or not found
    if (!route || !config.routes.includes(route)) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: `Route '${route || ""}' not found`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // worker not loaded
    // something wrong internally
    try {
      const worker = env[route];
      if (!worker || typeof worker.fetch !== "function") {
        // console.error("Worker not loaded", route);
        return new Response(
          JSON.stringify({
            error: "Internal Server Error",
            message: `Worker for route '${route}' not loaded properly (missing fetch method)`,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // forward the request to the function
      try {
        // Await the worker's response to catch any Promise rejections
        const response = await worker.fetch(request);
        // const response = new Response("Hello from router");
        return response;
      } catch (workerError) {
        console.error(`Worker execution error in '${route}':`, workerError);
        return new Response(
          JSON.stringify({
            error: "Worker Execution Error",
            message: workerError.message || "Unknown error in worker execution",
            name: workerError.name,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } catch (e) {
      console.error(`Router error:`, e);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: e.message || "Unknown error",
          stack: e.stack,
          name: e.name,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
