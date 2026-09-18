import React from 'react';
import AdminLayout from '@/Layouts/adminLayout';
import { Head, Link } from '@inertiajs/react';
// İkonlarımızı lucide-react kütüphanesinden import ediyoruz
import { Users, Calendar, ShieldCheck, Clock, ArrowRight } from 'lucide-react';

export default function AdminDashboard({ auth, stats }) {
    return (
        <AdminLayout user={auth.user}>
            <Head title="Yönetim Paneli" />

            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                
                {/* Karşılama Kartı */}
                <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Hoş Geldiniz, {auth.user.name} </h1>
                        <p className="text-indigo-200 text-sm font-medium mt-1">Sistem genelindeki istatistikleri ve operasyonları buradan yönetebilirsiniz.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-100 border border-white/10">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Yetkili Oturumu
                        </span>
                    </div>
                </div>

                {/* İstatistik / Özet Kartları (Emojiler Yerine İkonlar) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Kart 1: Kullanıcılar */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
                        <div>
                            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Toplam Kullanıcı</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-2">{stats?.users_count || 0}</h3>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Users className="w-7 h-7" />
                        </div>
                    </div>

                    {/* Kart 2: Randevular */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
                        <div>
                            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Aktif Randevular</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-2">{stats?.appointments_count || 0}</h3>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Calendar className="w-7 h-7" />
                        </div>
                    </div>

                    {/* Kart 3: Sistem Durumu */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
                        <div>
                            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Sistem Durumu</p>
                            <h3 className="text-xl font-black text-emerald-600 mt-2 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Aktif & Stabil
                            </h3>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <Clock className="w-7 h-7" />
                        </div>
                    </div>

                </div>

                {/* Hızlı İşlemler Alanı */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                    <h2 className="text-lg font-black text-slate-800">Hızlı Yönetim Alanları</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <Link 
                            href="/admin/users" 
                            className="group p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-100 transition flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Kullanıcılar ve Roller</h4>
                                    <p className="text-xs text-slate-400 font-medium">Kullanıcı yetkilerini ve rollerini düzenle</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
                        </Link>

                        <Link 
                            href="/admin/appointments" 
                            className="group p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-100 transition flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Randevu Yönetimi</h4>
                                    <p className="text-xs text-slate-400 font-medium">Tüm randevuları listele ve yönet</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
                        </Link>

                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}