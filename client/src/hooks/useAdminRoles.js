import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/pagination";

export function useAdminPermissionGroups() {
  return useQuery({ queryKey: queryKeys.admin.permissionGroups, queryFn: api.adminPermissionGroups });
}

export function useAdminRoles() {
  return useQuery({ queryKey: queryKeys.admin.roles, queryFn: api.adminRoles });
}

export function useAdminAdmins() {
  return useQuery({ queryKey: queryKeys.admin.admins, queryFn: api.adminAdmins });
}

export function useAdminAuditLog() {
  return useQuery({
    queryKey: queryKeys.admin.auditLog({ page: 1, pageSize: PAGE_SIZE }),
    queryFn: () => api.adminAuditLog({ page: 1, pageSize: PAGE_SIZE }),
  });
}

function useInvalidateRbac() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.admins });
    queryClient.invalidateQueries({ queryKey: ["admin", "auditLog"] });
  };
}

export function useCreateAdminRole() {
  const invalidate = useInvalidateRbac();
  return useMutation({
    mutationFn: ({ name, permissions }) => api.createAdminRole(name, permissions),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminRolePermissions() {
  const invalidate = useInvalidateRbac();
  return useMutation({
    mutationFn: ({ id, permissions }) => api.updateAdminRolePermissions(id, permissions),
    onSuccess: invalidate,
  });
}

export function useCloneAdminRole() {
  const invalidate = useInvalidateRbac();
  return useMutation({
    mutationFn: ({ id, name }) => api.cloneAdminRole(id, name),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminRole() {
  const invalidate = useInvalidateRbac();
  return useMutation({
    mutationFn: (id) => api.deleteAdminRole(id),
    onSuccess: invalidate,
  });
}

export function useAssignAdminRole() {
  const invalidate = useInvalidateRbac();
  return useMutation({
    mutationFn: ({ userId, adminRoleId }) => api.assignAdminRole(userId, adminRoleId),
    onSuccess: invalidate,
  });
}
