"use client";

import { createContext, useContext, useMemo, useCallback } from "react";
import { decodeBitfield } from "@/lib/rbac/bitfield";

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

interface PermissionsContextValue {
  /** Check if user has a specific permission */
  can: (permission: string) => boolean;
  /** The raw decoded permission set */
  permissionSet: Set<string>;
  /** Current user info */
  user: UserInfo;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  can: () => false,
  permissionSet: new Set(),
  user: { name: "", email: "", role: "" },
});

interface Props {
  permissions: string; // bitfield-encoded
  role: string;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function PermissionsProvider({ permissions, role, userName, userEmail, children }: Props) {
  const permSet = useMemo(() => {
    if (role === "SUPER_ADMIN") return new Set(["*"]);
    return decodeBitfield(permissions);
  }, [permissions, role]);

  const can = useCallback(
    (permission: string) => {
      return permSet.has("*") || permSet.has(permission);
    },
    [permSet]
  );

  const user = useMemo(
    () => ({ name: userName, email: userEmail, role }),
    [userName, userEmail, role]
  );

  const value = useMemo(
    () => ({ can, permissionSet: permSet, user }),
    [can, permSet, user]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
