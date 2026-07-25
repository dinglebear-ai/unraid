import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class JsonArrayStore<T> {
  private mutation: Promise<void> = Promise.resolve();

  constructor(private readonly path: () => string, private readonly validate: (value: unknown) => value is T) {}

  async read(): Promise<T[]> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.path(), "utf-8"));
      if (!Array.isArray(parsed) || !parsed.every(this.validate)) throw new Error(`Invalid registry data at ${this.path()}`);
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async update<R>(mutator: (items: T[]) => R | Promise<R>): Promise<R> {
    let result!: R;
    const operation = this.mutation.then(async () => {
      const items = await this.read();
      result = await mutator(items);
      await this.write(items);
    });
    this.mutation = operation.then(() => undefined, () => undefined);
    await operation;
    return result;
  }

  private async write(items: T[]): Promise<void> {
    const path = this.path();
    await mkdir(dirname(path), { recursive: true });
    const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
    try {
      await writeFile(temporary, JSON.stringify(items, null, 2), { encoding: "utf-8", mode: 0o600 });
      await rename(temporary, path);
    } finally {
      await rm(temporary, { force: true }).catch(() => undefined);
    }
  }
}
