import React from 'react';
import AdminLayout from '@/Layouts/adminLayout';
import { router } from '@inertiajs/react';

export default function Appointments({ appointments }) {
    
    const handleCancel = (id) => {
        if (confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) {
            router.post(`/admin/appointments/${id}/cancel`);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                
                {/* Başlık Alanı */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tüm Randevular</h1>
                    <p className="text-sm font-medium text-slate-400 mt-1">Sistemdeki tüm randevuları buradan listeleyebilir ve yönetebilirsiniz.</p>
                </div>

                {/* Tablo Alanı */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm overflow-hidden">
                    {(!appointments || appointments.length === 0) ? (
                        <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium text-sm bg-slate-50/50">
                            Sistemde kayıtlı randevu bulunmuyor.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                                        <th className="pb-4 px-4">Müşteri</th>
                                        <th className="pb-4 px-4">Hizmet</th>
                                        <th className="pb-4 px-4">Personel</th>
                                        <th className="pb-4 px-4">Tarih / Saat</th>
                                        <th className="pb-4 px-4">Durum</th>
                                        <th className="pb-4 px-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-600">
                                    {appointments.map((appointment) => (
                                        <tr key={appointment.id} className="hover:bg-slate-50/50 transition">
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-800">{appointment.client_name}</div>
                                                <div className="text-xs text-slate-400">{appointment.client_phone}</div>
                                            </td>
                                            <td className="py-4 px-4">{appointment.service?.name || '-'}</td>
                                            <td className="py-4 px-4">{appointment.user?.name || '-'}</td>
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-700">{appointment.date}</div>
                                                <div className="text-xs text-slate-400">{appointment.start_time} - {appointment.end_time}</div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                    appointment.status === 'cancelled' 
                                                        ? 'bg-rose-50 text-rose-600' 
                                                        : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                    {appointment.status === 'cancelled' ? 'İptal Edildi' : 'Aktif'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                {appointment.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleCancel(appointment.id)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                                    >
                                                        İptal Et
                                                    </button>
                                                )}
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