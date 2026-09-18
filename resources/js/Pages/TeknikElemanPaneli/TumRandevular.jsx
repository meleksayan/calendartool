import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TechnicalLayout from '@/Layouts/TechnicalLayout';

export default function TumRandevular({ auth, appointments = [] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const handleStatusUpdate = (id, newStatus) => {
        router.patch(`/technical/appointments/${id}/status`, { status: newStatus }, {
            preserveScroll: true,
        });
    };

    const filteredAppointments = appointments.filter((app) => {
        const query = search.toLowerCase();
        const matchesSearch = 
            app.user?.name?.toLowerCase().includes(query) ||
            app.service?.name?.toLowerCase().includes(query) ||
            String(app.id).includes(query);
        
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <TechnicalLayout user={auth.user}>
            <Head title="Tüm Randevular" />
            
            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Tüm Randevular (Teknik Ekip)</h2>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Müşteri veya ID ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border-gray-300 rounded-md text-sm px-3 py-1.5 w-full sm:w-64"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border-gray-300 rounded-md text-sm px-3 py-1.5"
                            >
                                <option value="all">Tüm Durumlar</option>
                                <option value="pending">Bekliyor</option>
                                <option value="completed">Tamamlandı</option>
                                <option value="cancelled">İptal Edildi</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servis</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredAppointments.map((app) => (
                                    <tr key={app.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{app.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.user?.name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.service?.name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.appointment_date || app.created_at?.split('T')[0]}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{app.status || 'bekliyor'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                            <button
                                                onClick={() => handleStatusUpdate(app.id, 'completed')}
                                                className="bg-green-100 text-green-700 px-2.5 py-1 rounded text-xs font-semibold hover:bg-green-200"
                                            >
                                                Tamamla
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(app.id, 'cancelled')}
                                                className="bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs font-semibold hover:bg-red-200"
                                            >
                                                İptal
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </TechnicalLayout>
    );
}