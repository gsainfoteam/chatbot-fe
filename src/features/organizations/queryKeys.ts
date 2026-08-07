export const organizationQueryKeys = {
  all: ["organizations"] as const,
  list: () => [...organizationQueryKeys.all, "list"] as const,
  invitations: () => [...organizationQueryKeys.all, "invitations"] as const,
};
