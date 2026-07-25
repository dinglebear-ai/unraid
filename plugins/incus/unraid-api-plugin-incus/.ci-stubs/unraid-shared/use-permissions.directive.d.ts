export declare enum AuthAction {
  READ_ANY = "READ_ANY",
  UPDATE_ANY = "UPDATE_ANY",
  DELETE_ANY = "DELETE_ANY"
}
export declare enum Resource { VMS = "VMS" }
export declare function UsePermissions(input: { action: AuthAction; resource: Resource }): MethodDecorator;
export declare const appliedPermissions: Array<{ key: string; action: AuthAction; resource: Resource }>;
