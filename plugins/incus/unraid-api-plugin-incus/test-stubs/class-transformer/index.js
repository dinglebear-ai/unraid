// Minimal no-op stubs for class-transformer, see @nestjs/common stub for why.
export function Exclude() {
  return (target) => target;
}
export function Expose() {
  return (_target, _key) => {};
}
