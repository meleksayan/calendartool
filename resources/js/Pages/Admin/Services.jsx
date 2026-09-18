import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Layers, Plus, Trash2 } from 'lucide-react';

export default function Services({ services }) {
    const { data, setData, post, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        duration: 30,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.services.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleDelete = (id) => {
        if (confirm('Bu hizmeti silmek istediğinize emin misiniz?')) {
            destroy(route('admin.services.destroy', id));
        }
    };

    return (
        <AdminLayout>
            <Head title="Hizmet Yönetimi" />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Hizmet ve Kategori Yönetimi</h2>
                        <p className="text-xs text-slate-400 font-medium">Sistemde yer alan randevu hizmetlerini ve sürelerini buradan yönetin.</p>
                    </div>
                </div>

                {/* Yeni Hizmet Ekleme Formu */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-indigo-600" /> Yeni Hizmet Tanımla
                        </h3>
                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            
                            {/* Hizmet Adı Alanı (Daha Geniş) */}
                            <div className="md:col-span-7 w-full">
                                <input 
                                    type="text" 
                                    placeholder="Hizmet Adı (Örn: Kurulum vb.)"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                {errors.name && <span className="text-rose-500 text-xs mt-1 block">{errors.name}</span>}
                            </div>

                            {/* Süre Alanı */}
                            <div className="md:col-span-3 w-full">
                                <input 
                                    type="number" 
                                    placeholder="Süre (Dakika)"
                                    value={data.duration}
                                    onChange={e => setData('duration', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                {errors.duration && <span className="text-rose-500 text-xs mt-1 block">{errors.duration}</span>}
                            </div>

                            {/* Kaydet Butonu */}
                            <div className="md:col-span-2 w-full">
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl text-sm transition shadow-lg shadow-indigo-100"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>

                {/* Hizmet Listesi Tablosu */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800">Mevcut Hizmetler</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {services.length > 0 ? (
                            services.map((service) => (
                                <div key={service.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">{service.name}</h4>
                                            <p className="text-xs text-slate-400">Süre: {service.duration} Dakika</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(service.id)}
                                        className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                Henüz eklenmiş bir hizmet bulunmuyor. Yukarıdan ilk hizmetinizi ekleyebilirsiniz.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}