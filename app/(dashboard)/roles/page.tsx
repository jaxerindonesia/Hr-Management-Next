 "use client";
 
 import { useEffect, useState } from "react";
 import { Shield } from "lucide-react";
 
 export default function RolesPage() {
   const [roles, setRoles] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [userRole, setUserRole] = useState<string | null>(null);
 
   const loadRoles = async () => {
     try {
       setLoading(true);
       setError(null);
      const res = await fetch(`${API_BASE}/roles`, { cache: "no-store", credentials: "include" });
       if (!res.ok) {
         const data = await res.json().catch(() => ({}));
         throw new Error(data.message || "Gagal mengambil data roles");
       }
      const data = await res.json();

       // Filter sesuai role login: jika bukan Super Admin, tampilkan hanya role-nya sendiri
       setRoles(() => {
        const all = Array.isArray(data) ? data : data?.data ?? [];
         if (userRole && userRole !== "Super Admin") {
           return all.filter((r: any) => r.name === userRole);
         }  
         return all;
       });
     } catch (e: any) {
       setError(e.message || "Terjadi kesalahan");
     } finally {
       setLoading(false);
     }
   };
 
   useEffect(() => {
     if (typeof window !== "undefined") {
       const userData = localStorage.getItem("hr_user_data");
       if (userData) {
         try {
           const parsed = JSON.parse(userData);
           setUserRole(parsed.role ?? null);
         } catch {
           setUserRole(null);
         }
       }
     }
   }, []);
 
   useEffect(() => {
     loadRoles();
   }, [userRole]);
 
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<"array" | "object">("array");
  const commonModels = ["users", "roles", "leaves"];
  const commonActions = ["get-all", "get-by-id", "create", "update"];
  const [selectedActions, setSelectedActions] = useState<Record<string, Set<string>>>({});
  const [rwPermissions, setRwPermissions] = useState<Record<string, { read: boolean; write: boolean }>>({});
  const [newModel, setNewModel] = useState("");
  const API_BASE = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

  const openEditRole = (role: any) => {
    setEditingRole(role);
    setFormName(role?.name ?? "");
    setFormError(null);
    // Prefill editor berdasarkan tipe permission
    const perm = role?.permission;
    if (Array.isArray(perm)) {
      setEditorMode("array");
      const map: Record<string, Set<string>> = {};
      for (const item of perm) {
        const m = String(item.model ?? "");
        const a = String(item.action ?? "");
        map[m] ||= new Set();
        map[m].add(a);
      }
      setSelectedActions(map);
      setRwPermissions({});
    } else if (perm && typeof perm === "object") {
      setEditorMode("object");
      const obj: Record<string, { read: boolean; write: boolean }> = {};
      for (const [k, v] of Object.entries(perm)) {
        const vv = v as any;
        obj[k] = { read: !!vv?.read, write: !!vv?.write };
      }
      setRwPermissions(obj);
      setSelectedActions({});
    } else {
      setEditorMode("array");
      setSelectedActions({});
      setRwPermissions({});
    }
    setShowRoleModal(true);
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setFormName("");
    setFormError(null);
    setEditorMode("array");
    setSelectedActions({});
    setRwPermissions({
      dashboard: { read: true, write: false },
    });
    setShowRoleModal(true);
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setEditingRole(null);
    setFormName("");
    setFormError(null);
    setSaving(false);
    setSelectedActions({});
    setRwPermissions({});
    setNewModel("");
  };

  const saveRole = async () => {
    try {
      setSaving(true);
      setFormError(null);
      let permissions: any;
      if (editorMode === "array") {
        const arr: Array<{ model: string; action: string }> = [];
        for (const [model, actions] of Object.entries(selectedActions)) {
          for (const a of Array.from(actions)) {
            arr.push({ model, action: a });
          }
        }
        permissions = arr;
      } else {
        const obj: Record<string, { read: boolean; write: boolean }> = {};
        for (const [k, v] of Object.entries(rwPermissions)) {
          obj[k] = { read: !!(v as any).read, write: !!(v as any).write };
        }
        permissions = obj;
      }
      const payload = { name: formName, permissions };
      let res: Response;
      if (editingRole?.id) {
        res = await fetch(`${API_BASE}/roles/${editingRole.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
      } else {
        res = await fetch(`${API_BASE}/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(json.message || "Gagal menyimpan role");
        setSaving(false);
        return;
      }
      await loadRoles();
      closeRoleModal();
    } catch (e: any) {
      setFormError(e.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: any) => {
    const ok = typeof window !== "undefined" ? window.confirm(`Hapus role "${role.name}"?`) : true;
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/roles/${role.id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      await loadRoles();
    } catch {}
  };

   const renderPermissions = (permission: any) => {
     if (Array.isArray(permission)) {
      const grouped: Record<string, string[]> = {};
      for (const item of permission) {
        const model = String(item.model ?? "");
        const action = String(item.action ?? "");
        if (!grouped[model]) grouped[model] = [];
        grouped[model].push(action);
      }
      const entries = Object.entries(grouped);
      return (
        <div className="space-y-2">
          {entries.map(([model, actions]) => (
            <div key={model} className="flex items-center flex-wrap gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-200 font-semibold">
                {model}
              </span>
              {actions.map((a) => (
                <span
                  key={`${model}-${a}`}
                  className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {a}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
     }
 
     if (permission && typeof permission === "object") {
       return (
         <div className="flex flex-wrap gap-2">
           {Object.entries(permission).map(([k, v]: [string, any]) => {
             if (v && typeof v === "object" && "read" in v) {
               return (
                 <span
                   key={k}
                   className="px-2 py-1 text-xs rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                 >
                   {k}: {v.read ? "read" : ""}{v.write ? "/write" : ""}
                 </span>
               );
             }
             return (
               <span
                 key={k}
                 className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300"
               >
                 {k}
               </span>
             );
           })}
         </div>
       );
     }
 
     return (
       <span className="text-sm text-gray-600 dark:text-gray-400">
         {JSON.stringify(permission)}
       </span>
     );
   };
 
   return (
     <div className="space-y-6">
       <div className="flex items-center gap-3">
         <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white">
           <Shield className="w-6 h-6" />
         </div>
         <div>
           <h2 className="text-2xl font-bold">
             {userRole && userRole !== "Super Admin" ? "Role Saya" : "Roles"}
           </h2>
           <p className="text-sm text-gray-600 dark:text-gray-400">
             {userRole && userRole !== "Super Admin"
               ? `Role aktif: ${userRole}`
               : "Daftar role dan permissions."}
           </p>
         </div>
       </div>
 
       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
         <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
           <div className="text-sm text-gray-600 dark:text-gray-400">
             {loading ? "Memuat..." : `${roles.length} roles`}
           </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadRoles}
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              disabled={loading}
            >
              Refresh
            </button>
            {userRole === "Super Admin" && (
              <button
                onClick={openCreateRole}
                className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
              >
                Tambah Role
              </button>
            )}
          </div>
         </div>
 
         {error ? (
           <div className="p-4 text-red-600 dark:text-red-400">{error}</div>
         ) : (
           <div className="overflow-x-auto">
             <table className="min-w-full text-sm">
               <thead className="bg-gray-50 dark:bg-gray-700/50">
                 <tr>
                   <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                     Nama Role
                   </th>
                   <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                     Permissions
                   </th>
                   {userRole === "Super Admin" && (
                     <th className="text-right p-3 font-semibold text-gray-700 dark:text-gray-300">
                       Dibuat
                     </th>
                   )}
                  {userRole === "Super Admin" && (
                    <th className="text-right p-3 font-semibold text-gray-700 dark:text-gray-300">
                      Aksi
                    </th>
                  )}
                 </tr>
               </thead>
               <tbody>
                 {!loading && roles.length === 0 && (
                   <tr>
                     <td colSpan={3} className="p-4 text-center text-gray-600 dark:text-gray-400">
                       Tidak ada data
                     </td>
                   </tr>
                 )}
                 {roles.map((role) => (
                   <tr
                     key={role.id}
                     className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                   >
                     <td className="p-3 font-medium">{role.name}</td>
                     <td className="p-3">{renderPermissions(role.permission)}</td>
                     {userRole === "Super Admin" && (
                       <td className="p-3 text-right">
                         <span className="text-gray-600 dark:text-gray-400">
                           {role.createdAt ? new Date(role.createdAt).toLocaleString("id-ID") : "-"}
                         </span>
                       </td>
                     )}
                    {userRole === "Super Admin" && (
                      <td className="p-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditRole(role)}
                            className="px-3 py-1 text-xs rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRole(role)}
                            className="px-3 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    )}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
       </div>
      {showRoleModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeRoleModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-xl w-full mx-4">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRole ? "Edit Role" : "Tambah Role"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Isi nama role dan pilih permissions secara visual.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Role</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  placeholder="mis. Super Admin"
                />
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditorMode("array")}
                    className={`px-3 py-1.5 text-sm rounded-lg ${editorMode === "array" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}
                  >
                    Model & Action
                  </button>
                  <button
                    onClick={() => setEditorMode("object")}
                    className={`px-3 py-1.5 text-sm rounded-lg ${editorMode === "object" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}
                  >
                    Read/Write
                  </button>
                </div>
                {editorMode === "array" ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        value={newModel}
                        onChange={(e) => setNewModel(e.target.value)}
                        placeholder="Tambah model (mis. payroll)"
                        className="flex-1 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                      />
                      <button
                        onClick={() => {
                          const m = newModel.trim();
                          if (!m) return;
                          setSelectedActions((prev) => ({ ...prev, [m]: prev[m] || new Set() }));
                          setNewModel("");
                        }}
                        className="px-3 py-2 rounded-lg bg-green-600 text-white"
                      >
                        Tambah
                      </button>
                    </div>
                    {[...new Set([...commonModels, ...Object.keys(selectedActions)])].map((m) => (
                      <div key={m} className="border rounded-lg p-3 dark:border-gray-700">
                        <div className="font-semibold mb-2">{m}</div>
                        <div className="flex flex-wrap gap-2">
                          {commonActions.map((a) => {
                            const checked = selectedActions[m]?.has(a) ?? false;
                            return (
                              <label key={`${m}-${a}`} className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setSelectedActions((prev) => {
                                      const set = new Set(prev[m] || []);
                                      if (e.target.checked) set.add(a);
                                      else set.delete(a);
                                      return { ...prev, [m]: set };
                                    });
                                  }}
                                />
                                <span className="text-sm">{a}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {["dashboard", "leaves", "attendance"].map((k) => (
                      <div key={k} className="border rounded-lg p-3 dark:border-gray-700">
                        <div className="font-semibold mb-2">{k}</div>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={rwPermissions[k]?.read ?? false}
                              onChange={(e) =>
                                setRwPermissions((p) => ({ ...p, [k]: { read: e.target.checked, write: p[k]?.write ?? false } }))
                              }
                            />
                            <span className="text-sm">read</span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={rwPermissions[k]?.write ?? false}
                              onChange={(e) =>
                                setRwPermissions((p) => ({ ...p, [k]: { read: p[k]?.read ?? false, write: e.target.checked } }))
                              }
                            />
                            <span className="text-sm">write</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formError && (
                <div className="text-sm text-red-600 dark:text-red-400">{formError}</div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeRoleModal}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                disabled={saving}
              >
                Batal
              </button>
              <button
                onClick={saveRole}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 }
