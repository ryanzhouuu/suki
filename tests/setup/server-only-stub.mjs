import Module from "node:module";

// `server-only` / `client-only` throw by design outside their intended bundler
// environment. Under the node:test runtime they'd break any test that
// transitively imports a server-only module (e.g. src/lib/anilist/token.ts), so
// stub them to empty modules here.
const STUBBED = new Set(["server-only", "client-only"]);

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (STUBBED.has(request)) return {};
  return originalLoad.call(this, request, parent, isMain);
};
