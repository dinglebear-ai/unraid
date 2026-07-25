// Talks to the local unraid-api GraphQL endpoint from inside a classic webGUI
// page. Auth is the webGUI's own session cookie (rides along via
// `credentials: "include"`, same-origin) plus the CSRF token DefaultPageLayout.php
// already puts on `window.csrf_token` for every page — see api/src/unraid-api/auth/
// auth.service.ts's validateCookiesWithCsrfToken for why this header is required
// on every non-GET (i.e. every POST, including pure queries) request.
declare global {
  interface Window {
    csrf_token?: string;
  }
}

export class GraphQLError extends Error {
  constructor(
    message: string,
    public readonly errors: unknown[]
  ) {
    super(message);
  }
}

// DefaultPageLayout.php sets window.csrf_token via its own inline <script>, whose
// execution order relative to this bundle isn't guaranteed — on a fresh page load
// the very first request can fire before that script has run, sending an empty
// token and getting rejected with HTTP 400 by the CSRF check every single time
// (verified live). Poll briefly for the token before the first request rather
// than trusting it's already there; every call after the first resolves instantly
// since the token is already set by then.
let csrfTokenReady: Promise<void> | null = null;

function waitForCsrfToken(): Promise<void> {
  if (window.csrf_token) return Promise.resolve();
  csrfTokenReady ??= new Promise((resolve) => {
    const deadline = Date.now() + 2000;
    const poll = () => {
      if (window.csrf_token || Date.now() >= deadline) {
        resolve();
      } else {
        setTimeout(poll, 20);
      }
    };
    poll();
  });
  return csrfTokenReady;
}

async function gqlOnce<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch("/graphql", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": window.csrf_token ?? "",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: HTTP ${res.status}`);
  }

  const body = await res.json();
  if (body.errors?.length) {
    throw new GraphQLError(body.errors[0]?.message ?? "GraphQL error", body.errors);
  }
  return body.data as T;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Only GraphQL queries are safe to replay after an ambiguous transport failure. */
export function isRetrySafeOperation(document: string): boolean {
  const normalized = document.replace(/^\s*(?:#[^\n]*\n\s*)*/, "");
  return normalized.startsWith("query") || normalized.startsWith("{");
}

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  await waitForCsrfToken();

  try {
    return await gqlOnce<T>(query, variables);
  } catch (e) {
    // The webGUI session/CSRF cookie occasionally isn't fully settled on the very
    // first request after a page load or fresh login (a host-page timing issue,
    // not ours to fix at the source) — a plain HTTP-layer failure (not a GraphQL
    // error the server actually returned data+errors for) is worth one silent
    // retry before surfacing anything to the user.
    if (e instanceof GraphQLError || !isRetrySafeOperation(query)) throw e;
    await sleep(300);
    return gqlOnce<T>(query, variables);
  }
}
