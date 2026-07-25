export const appliedPermissions = [];
export const AuthAction = { READ_ANY: "READ_ANY", UPDATE_ANY: "UPDATE_ANY", DELETE_ANY: "DELETE_ANY" };
export const Resource = { VMS: "VMS" };
export const UsePermissions = (permission) => (_target, key) => {
  appliedPermissions.push({ key: String(key), ...permission });
};
