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
       const res = await fetch("/api/roles", { cache: "no-store" });
       if (!res.ok) {
         const data = await res.json().catch(() => ({}));
         throw new Error(data.message || "Gagal mengambil data roles");
       }
       const data = await res.json();
       // Filter sesuai role login: jika bukan Super Admin, tampilkan hanya role-nya sendiri
       setRoles(() => {
         const all = data || [];
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
 
   const renderPermissions = (permission: any) => {
     if (Array.isArray(permission)) {
       return (
         <div className="flex flex-wrap gap-2">
           {permission.map((p: any, idx: number) => (
             <span
               key={idx}
               className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
             >
               {p.model}/{p.action}
             </span>
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
           <button
             onClick={loadRoles}
             className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
             disabled={loading}
           >
             Refresh
           </button>
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
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
       </div>
     </div>
   );
 }
