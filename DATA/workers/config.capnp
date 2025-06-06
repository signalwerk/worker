using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "w1", worker = .w1),
    (name = "w2", worker = .w2),
    (name = "test", worker = .test),
    (name = "testKV", worker = .testKV),
    (name = "router", worker = .router),
    (name = "kv", worker = .kv),
  ],
  sockets = [(name = "http", address = "*:8088", http = (), service = "router")],
);

const kv :Workerd.Worker = (
  modules = [(name = "kv", esModule = embed "../../commons/kv-mem.js")],
  compatibilityDate = "2024-04-03",
  compatibilityFlags = [],
);

const router :Workerd.Worker = (
  compatibilityDate = "2024-04-03",
  modules = [(name = "router", esModule = embed "../../commons/router.js")],
  bindings = [
    (name = "_config", json = embed "_meta.json"),
    (name = "w1", service = "w1"),
    (name = "w2", service = "w2"),
    (name = "test", service = "test"),
  ],
);

const w1 :Workerd.Worker = (
  modules = [
    (name = "w1", esModule = embed "w1/index.js"),
  ],
  compatibilityDate = "2024-04-03",
  compatibilityFlags = [],
  bindings = [
    (name = "_config", json = embed "w1/_meta.json"),
  ],
);
const w2 :Workerd.Worker = (
  modules = [
    (name = "w2", esModule = embed "w2/index.js"),
  ],
  compatibilityDate = "2024-04-03",
  compatibilityFlags = [],
  bindings = [
    (name = "_config", json = embed "w2/_meta.json"),
  ],
);
const testKV :Workerd.Worker = (
  modules = [
    (name = "testKV", esModule = embed "test/kv-service.js"),
  ],
  compatibilityDate = "2024-04-03",
  compatibilityFlags = [],
  # bindings = [
  #   (name = "KV", service = "kv"),
  # ],
);
const test :Workerd.Worker = (
  modules = [
    (name = "test", esModule = embed "test/index.js"),
    # (name = "@workerd/kv", esModule = embed "test/kv-service.js"),
  ],
  compatibilityDate = "2024-04-03",
  compatibilityFlags = [],
  bindings = [
    (name = "_config", json = embed "test/_meta.json"),
    (name = "testKV", service = "testKV"),
  ],
);
