// CI-only type stub matching the real @unraid/shared ConfigFilePersister<T>
// contract as used by index.ts's IncusConfigPersister: a constructor taking
// the host's ConfigService, plus fileName()/configKey()/defaultConfig()
// overridden by the subclass. Kept minimal on purpose — this exists only so
// `tsc --noEmit`/`tsc` can typecheck this package in CI without the real
// (private, host-provided) @unraid/shared monorepo. See ../../../CLAUDE.md.
export declare abstract class ConfigFilePersister<T> {
  constructor(configService: unknown);
  abstract fileName(): string;
  abstract configKey(): string;
  abstract defaultConfig(): T;
}
