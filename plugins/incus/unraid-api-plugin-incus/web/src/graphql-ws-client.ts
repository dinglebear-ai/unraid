import { createClient } from "graphql-ws";

// Same-origin ws(s) upgrade of the existing /graphql endpoint — this is the
// graphql-ws subscription transport unraid-api already has wired up
// (api/src/unraid-api/graph/graph.module.ts: subscriptions['graphql-ws']),
// so it rides on proxying/auth that's already known to work, rather than a
// brand new route nginx wouldn't know to forward. Cookies ride along on the
// WS upgrade automatically; the CSRF token goes in connectionParams, which
// the server merges straight into the request headers it checks (see
// api/src/unraid-api/auth/authentication.guard.ts).
function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/graphql`;
}

export function subscribe<T>(
  query: string,
  variables: Record<string, unknown>,
  onData: (data: T) => void,
  onError: (err: unknown) => void
): () => void {
  const client = createClient({
    url: wsUrl(),
    connectionParams: () => ({ "x-csrf-token": window.csrf_token ?? "" }),
  });

  const unsubscribe = client.subscribe<T>(
    { query, variables },
    {
      next: (msg) => {
        if (msg.errors?.length) {
          onError(new Error(msg.errors[0]?.message ?? "Subscription error"));
          return;
        }
        if (msg.data) onData(msg.data);
      },
      error: onError,
      complete: () => {},
    }
  );

  return () => {
    unsubscribe();
    void client.dispose();
  };
}
