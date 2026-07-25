#!/usr/bin/env node
"use strict";

const WebSocket = require(process.env.WS_MODULE || "ws");

const socketPath = process.argv[2] || "/run/unraid-codex/appserver.sock";
const socket = new WebSocket(`ws+unix://${socketPath}:/`, {
  perMessageDeflate: false,
});
const pending = new Map();
let nextId = 1;

function request(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(String(id), { resolve, reject });
  });
}

socket.on("message", (data) => {
  const message = JSON.parse(data.toString());

  if (Object.prototype.hasOwnProperty.call(message, "id") && !message.method) {
    const waiter = pending.get(String(message.id));
    if (!waiter) return;
    pending.delete(String(message.id));
    if (message.error) waiter.reject(new Error(message.error.message || "request failed"));
    else waiter.resolve(message.result);
    return;
  }

  if (message.method === "account/login/completed") {
    const params = message.params || {};
    if (params.success) {
      console.log(JSON.stringify({ authenticated: true }));
      socket.close();
    } else {
      console.error(params.error || "device login failed");
      socket.close();
      process.exitCode = 1;
    }
  }
});

socket.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

socket.on("open", async () => {
  try {
    await request("initialize", {
      clientInfo: { name: "unraid-codex-login", title: "Unraid Codex Login", version: "0.1.0" },
      capabilities: {
        experimentalApi: true,
        requestAttestation: false,
        mcpServerOpenaiFormElicitation: true,
      },
    });
    socket.send(JSON.stringify({ method: "initialized", params: {} }));

    const account = await request("account/read", { refreshToken: false });
    if (account.account) {
      console.log(JSON.stringify({ authenticated: true, alreadyAuthenticated: true }));
      socket.close();
      return;
    }

    const result = await request("account/login/start", { type: "chatgptDeviceCode" });
    console.log(
      JSON.stringify({
        authenticated: false,
        verificationUrl: result.verificationUrl,
        userCode: result.userCode,
      }),
    );
  } catch (error) {
    console.error(error.message);
    socket.close();
    process.exitCode = 1;
  }
});

setTimeout(() => {
  console.error("device login timed out");
  socket.terminate();
  process.exit(1);
}, 15 * 60_000).unref();
