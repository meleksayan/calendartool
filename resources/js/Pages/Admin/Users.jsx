import React from 'react';
import AdminLayout from '@/Layouts/adminLayout';
import { router } from '@inertiajs/react';

export default function Users({ users }) {

    // Rol değiştiğinde çalışacak fonksiyon (web.php'deki PATCH metoduna uygun)
    const handleRoleChange = (userId, newRole) => {
        router.patch(`/admin/users/${userId}/role`, {
            role: newRole
        }, {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                
                {/* Başlık Alanı */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kullanıcılar ve Roller</h1>
                    <p className="text-sm font-medium text-slate-400 mt-1">Sistemdeki kullanıcıları listeleyebilir ve yetkilerini (rollerini) güncelleyebilirsiniz.</p>
                </div>

                {/* Tablo Alanı */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm overflow-hidden">
                    {(!users || users.length === 0) ? (
                        <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium text-sm bg-slate-50/50">
                            Sistemde kayıtlı kullanıcı bulunmuyor.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                                        <th className="pb-4 px-4">Kullanıcı</th>
                                        <th className="pb-4 px-4">E-posta</th>
                                        <th className="pb-4 px-4">Mevcut Rol</th>
                                        <th className="pb-4 px-4 text-right">Rolü Değiştir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-600">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition">
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-800">{user.name}</div>
                                            </td>
                                            <td className="py-4 px-4 text-slate-500">{user.email}</td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                    user.role === 'admin' 
                                                        ? 'bg-purple-50 text-purple-600' 
                                                        : user.role === 'staff'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {user.role ? user.role.toUpperCase() : 'CUSTOMER'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <select
                                                    value={user.role || 'customer'}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
>
                                                    <option value="admin">Admin</option>
                                                    <option value="technician">Teknisyen (Technician)</option>
                                                    <option value="representative">Temsilci (Representative)</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </AdminLayout>
    );
}