// Schema-faithful mock GraphQL server for offline integration tests.
//
// Serves docs/unraid/UNRAID-SCHEMA.graphql via @graphql-tools/mock
// (addMocksToSchema), so the real Python httpx client + WebSocket subscription
// client exercise a schema-accurate endpoint end-to-end without a live Unraid.
//
//   MOCK_PORT=9002 node mock-server.mjs
//
// HTTP (queries + mutations) is served by graphql-yoga; subscriptions are served
// over the `graphql-transport-ws` protocol by graphql-ws on the SAME port/path
// (/graphql) — matching the Python client's WebSocket dialect. Subscription
// fields "tick" a few mocked events so snapshot (first event) and collect
// (multiple events) consumers both get data.

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { addMocksToSchema } from "@graphql-tools/mock";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { execute, subscribe } from "graphql";
import { useServer } from "graphql-ws/use/ws";
import { createYoga } from "graphql-yoga";
import { WebSocketServer } from "ws";

const SDL_PATH = fileURLToPath(
  new URL("../../docs/unraid/UNRAID-SCHEMA.graphql", import.meta.url),
);
const typeDefs = readFileSync(SDL_PATH, "utf8");
const PORT = Number(process.env.MOCK_PORT ?? 9002);
const TICKS = Number(process.env.MOCK_TICKS ?? 3);
const TICK_MS = Number(process.env.MOCK_TICK_MS ?? 120);

// Every custom scalar in the SDL needs a mock, or value serialization throws.
// Standard scalars (Int/Float/String/Boolean/ID) use addMocksToSchema defaults.
const mocks = {
  DateTime: () => "2026-01-01T00:00:00.000Z",
  BigInt: () => 1024,
  JSON: () => ({ mock: true }),
  Port: () => 8080,
  URL: () => "https://mock.local",
  PrefixedID: () => "mock:0000000000000000000000000000000000000000000000000000000000000000",
};

// Give every Subscription field a `subscribe` that emits a few empty payloads;
// addMocksToSchema (preserveResolvers) supplies the per-field `resolve` mock, so
// each emitted event carries schema-valid mock data.
const subscriptionFields = makeExecutableSchema({ typeDefs }).getSubscriptionType()?.getFields();
const subscriptionResolvers = Object.fromEntries(
  Object.keys(subscriptionFields ?? {}).map((name) => [
    name,
    {
      subscribe: async function* () {
        for (let i = 0; i < TICKS; i++) {
          yield {};
          await sleep(TICK_MS);
        }
      },
    },
  ]),
);

const schema = addMocksToSchema({
  schema: makeExecutableSchema({ typeDefs, resolvers: { Subscription: subscriptionResolvers } }),
  mocks,
  preserveResolvers: true,
});

const yoga = createYoga({
  schema,
  logging: false,
  graphqlEndpoint: "/graphql",
  landingPage: false,
});

const server = createServer(yoga);

// graphql-transport-ws over WebSocket on the same /graphql path. connection_init
// (with the client's x-api-key payload) is accepted by default.
const wss = new WebSocketServer({ server, path: yoga.graphqlEndpoint });
useServer({ schema, execute, subscribe }, wss);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock] graphql ready on http://127.0.0.1:${PORT}/graphql (+ ws subscriptions)`);
});
