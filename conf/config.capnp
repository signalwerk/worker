using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "func1", worker = .func1),
    (name = "func2", worker = .func2),
    (name = "router", worker = .router),
    (name = "kv1", worker = .kv1),

  ],
  sockets = [(name = "http", address = "*:8080", http = (), service = "router")],
);


const kv1 :Workerd.Worker = (
  modules = [(name = "kv1", esModule = embed "kv-mem.js")],
  compatibilityDate = "2024-04-03",
  compatibilityFlags = [],
);


const func1 :Workerd.Worker = (
  modules = [(name = "func1", esModule = embed "worker-a.js"),
  
    #   ( name = "kv", esModule = "wrk.kv.js" )

  ],
  compatibilityDate = "2023-02-28",
  compatibilityFlags = [],
  bindings = [
    (name = "MY_KV", service = "kv1"),
    (name = "_config", json = embed "_meta_func1.json"),
  ],
);

const func2 :Workerd.Worker = (
  modules = [(name = "func2", esModule = embed "worker-b.js")],
  compatibilityDate = "2023-02-28",
  compatibilityFlags = [],
  bindings = [
    (name = "MY_KV", service = "kv1"),
    (name = "_config", json = embed "_meta_func2.json"),
  ],

);

const router :Workerd.Worker = (
  compatibilityDate = "2023-02-28",
  modules = [(name = "router", esModule = embed "router.js")],
  bindings = [
    (name = "_config", json = embed "_meta.json"),
    (name = "func1", service = "func1"),
    (name = "func2", service = "func2"),
    # (name = "KV", service = "KV"),
  ],
);