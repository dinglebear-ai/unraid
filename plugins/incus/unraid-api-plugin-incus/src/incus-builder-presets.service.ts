import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { join } from "node:path";
import { BuilderPreset, BuilderPresetInput } from "./config.entity.js";
import { JsonArrayStore } from "./json-store.js";

/**
 * Saveable distrobuilder presets (distro/release/packages), persisted as a
 * small JSON array at <stateDir>/builder-presets.json. Read-modify-write on
 * every call — this file is tiny and rarely touched, no in-memory cache.
 */
@Injectable()
export class IncusBuilderPresetsService {
  private readonly store: JsonArrayStore<BuilderPreset>;
  constructor(private readonly config: ConfigService) {
    this.store = new JsonArrayStore(() => this.filePath, isBuilderPreset);
  }

  private get filePath(): string {
    const dir = this.config.get<string>("incus.stateDir", "/mnt/user/appdata/incus");
    return join(dir, "builder-presets.json");
  }

  async list(): Promise<BuilderPreset[]> {
    return this.store.read();
  }

  async save(input: BuilderPresetInput): Promise<BuilderPreset> {
    const preset: BuilderPreset = {
      name: input.name,
      distro: input.distro,
      release: input.release,
      packages: input.packages,
    };
    return this.store.update((presets) => {
      const idx = presets.findIndex((p) => p.name === input.name);
      if (idx >= 0) presets[idx] = preset;
      else presets.push(preset);
      return preset;
    });
  }

  async remove(name: string): Promise<boolean> {
    return this.store.update((presets) => {
      const idx = presets.findIndex((p) => p.name === name);
      if (idx < 0) return false;
      presets.splice(idx, 1);
      return true;
    });
  }
}

function isBuilderPreset(value: unknown): value is BuilderPreset {
  const item = value as Partial<BuilderPreset> | null;
  return !!item && typeof item.name === "string" && typeof item.distro === "string" &&
    typeof item.release === "string" && Array.isArray(item.packages) && item.packages.every((p) => typeof p === "string");
}
