// Minimal no-op stubs for @nestjs/graphql, see @nestjs/common stub for why.
export function ObjectType() {
  return (target) => target;
}
export function InputType() {
  return (target) => target;
}
export const ArgsType = InputType;
export const Int = Number;
export function registerEnumType() {}
export function Field() {
  return (_target, _key) => {};
}
export const Resolver = ObjectType;
export const Query = Field;
export const Mutation = Field;
export const Subscription = Field;
export const Args = Field;
