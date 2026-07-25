const decorator = () => () => undefined;
module.exports = {
  AuthAction: { READ_ANY: "READ_ANY", UPDATE_ANY: "UPDATE_ANY", DELETE_ANY: "DELETE_ANY" },
  Resource: { VMS: "VMS" },
  UsePermissions: decorator,
};
