"use client";

import { useEffect, useState } from "react";

type Permission = {
  model: string;
  action: string;
};

export function usePermission() {
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("hr_user_role");
    if (raw) {
      setPermissions(JSON.parse(raw));
    }
  }, []);

  function checkRole(model: string, action: string) {
    const result = permissions.some(
      (permission) =>
        permission.model === model && permission.action === action,
    );

    return result;
  }

  function checkRoleMulti(model: string, actions: string[]) {
    return permissions.some(
      (permission) =>
        permission.model === model && actions.includes(permission.action),
    );
  }

  return { checkRole, checkRoleMulti };
}
