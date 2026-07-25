// Minimal no-op stubs for @nestjs/config, see @nestjs/common stub for why.
export function registerAs(_token, factory) {
  return factory;
}
export class ConfigService {
  get() {
    return undefined;
  }
  set() {}
}
