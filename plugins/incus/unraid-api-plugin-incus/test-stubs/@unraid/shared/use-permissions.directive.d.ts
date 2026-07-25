export declare const AuthAction: { READ_ANY: string; UPDATE_ANY: string; DELETE_ANY: string };
export declare const appliedPermissions: Array<{ key: string; action: string; resource: string }>;
export declare const Resource: { VMS: string };
export declare const UsePermissions: (permission: { action: string; resource: string }) => MethodDecorator;
