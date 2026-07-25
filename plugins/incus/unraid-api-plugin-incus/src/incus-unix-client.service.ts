import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { request as httpRequest } from "node:http";

export interface IncusResponse<T = unknown> {
  type: "sync" | "async" | "error";
  status: string;
  status_code: number;
  operation?: string;
  metadata: T;
  error?: string;
  error_code?: number;
}

const DEFAULT_MAX_RESPONSE_BYTES = 4 * 1024 * 1024;

interface RawResponse {
  statusCode: number;
  text: string;
  truncated: boolean;
}

@Injectable()
export class IncusUnixClient {
  constructor(private readonly config: ConfigService) {}

  get socketPath(): string {
    const dir = this.config.get<string>("incus.stateDir", "/mnt/user/appdata/incus");
    return `${dir}/unix.socket`;
  }

  async requestText(
    method: string,
    path: string,
    body?: unknown,
    timeoutMs = 30_000,
    maxBytes = DEFAULT_MAX_RESPONSE_BYTES,
  ): Promise<string> {
    const response = await this.requestRaw(method, path, body, timeoutMs, maxBytes, false);
    if (response.statusCode >= 400) {
      throw new Error(`Incus HTTP ${response.statusCode} on ${method} ${path}`);
    }
    return response.text;
  }

  async requestTextTruncated(
    method: string,
    path: string,
    body?: unknown,
    timeoutMs = 30_000,
    maxBytes = DEFAULT_MAX_RESPONSE_BYTES,
  ): Promise<{ text: string; truncated: boolean }> {
    const response = await this.requestRaw(method, path, body, timeoutMs, maxBytes, true);
    if (response.statusCode >= 400) {
      throw new Error(`Incus HTTP ${response.statusCode} on ${method} ${path}`);
    }
    return { text: response.text, truncated: response.truncated };
  }

  private async requestRaw(
    method: string,
    path: string,
    body?: unknown,
    timeoutMs = 30_000,
    maxBytes = DEFAULT_MAX_RESPONSE_BYTES,
    truncate = false,
  ): Promise<RawResponse> {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    return new Promise((resolve, reject) => {
      let failed = false;
      const req = httpRequest({
        socketPath: this.socketPath,
        method,
        path,
        timeout: timeoutMs,
        headers: {
          ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      }, (res) => {
        const chunks: Buffer[] = [];
        let bytes = 0;
        let truncated = false;
        res.on("data", (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          const remaining = Math.max(0, maxBytes - bytes);
          bytes += buffer.length;
          if (buffer.length > remaining) {
            if (truncate) {
              if (remaining > 0) chunks.push(buffer.subarray(0, remaining));
              truncated = true;
              return;
            }
            if (!failed) reject(new Error(`Incus response exceeded ${maxBytes} bytes for ${method} ${path}`));
            failed = true;
            res.destroy();
            return;
          }
          chunks.push(buffer);
        });
        res.on("end", () => {
          if (failed) return;
          resolve({
            statusCode: res.statusCode ?? 500,
            text: Buffer.concat(chunks).toString("utf-8"),
            truncated,
          });
        });
      });
      req.on("timeout", () => req.destroy(new Error(`Incus request timed out after ${timeoutMs}ms: ${method} ${path}`)));
      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  async request<T = unknown>(method: string, path: string, body?: unknown, timeoutMs = 30_000): Promise<IncusResponse<T>> {
    const { statusCode, text } = await this.requestRaw(method, path, body, timeoutMs, DEFAULT_MAX_RESPONSE_BYTES, false);
    let parsed: IncusResponse<T>;
    try {
      parsed = text ? JSON.parse(text) as IncusResponse<T> : {} as IncusResponse<T>;
    } catch (error) {
      if (statusCode >= 400) {
        throw new Error(`Incus HTTP ${statusCode} on ${method} ${path}`);
      }
      throw new Error(`Incus API parse error on ${path}: ${(error as Error).message}`);
    }
    if (parsed.type === "error") {
      throw new Error(`Incus API error on ${method} ${path}: ${parsed.error} (${parsed.error_code})`);
    }
    if (statusCode >= 400) {
      throw new Error(`Incus HTTP ${statusCode} on ${method} ${path}`);
    }
    return parsed;
  }

  async requestAndWait<T = unknown>(method: string, path: string, body?: unknown, timeoutSec = 60): Promise<IncusResponse<T>> {
    const response = await this.request<T>(method, path, body);
    if (response.type === "async" && response.operation) await this.wait(response.operation, timeoutSec);
    return response;
  }

  async wait<T = unknown>(operationUrl: string, timeoutSec = 60): Promise<IncusResponse<T>> {
    const response = await this.request<T>("GET", `${operationUrl}/wait?timeout=${timeoutSec}`, undefined, (timeoutSec + 10) * 1000);
    const metadata = response.metadata as { status?: string; err?: string };
    if (metadata?.status === "Failure") throw new Error(`Incus operation failed: ${metadata.err}`);
    return response;
  }
}
