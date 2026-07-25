// Minimal no-op stubs for @nestjs/common decorators/classes used by this
// package's source files, so vitest can import the real .ts sources
// directly without pulling in the full NestJS framework (which is only a
// peer dependency here, resolved from the host unraid-api install at
// runtime/build time — not present in this package's node_modules).
export function Injectable() {
  return (target) => target;
}

export class Logger {
  constructor(_context) {}
  log() {}
  warn() {}
  error() {}
  debug() {}
  verbose() {}
}
