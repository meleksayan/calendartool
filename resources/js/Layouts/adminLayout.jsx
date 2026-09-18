import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function AdminLayout({ children }) {
    const { url } = usePage();
    const isActive = (path) => url.startsWith(path);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            
            {/* Sol Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-100 flex flex-col justify-between hidden lg:flex shrink-0">
                <div className="p-6">
                    <div className="flex items-center gap-3 px-2 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-100">
                            A
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Yönetim Paneli</h2>
                            <p className="text-xs font-semibold text-slate-400">Admin Yetki Alanı</p>
                        </div>
                    </div>

                    <nav className="space-y-1.5">
                        <Link
                            href="/admin/dashboard"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition duration-200 ${
                                isActive('/admin/dashboard')
                                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Genel Özet
                        </Link>

                        <Link
                            href="/admin/users"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition duration-200 ${
                                isActive('/admin/users')
                                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Kullanıcı Yönetimi & Roller
                        </Link>

                        <Link
                            href="/admin/appointments"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition duration-200 ${
                                isActive('/admin/appointments')
                                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Tüm Randevular
                        </Link>

                        <Link
                            href="/admin/services"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition duration-200 ${
                                isActive('/admin/services')
                                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Hizmet Yönetimi
                        </Link>
                    </nav>
                </div>

                <div className="p-6 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-400 text-center">
                        Admin Paneli v1.0
                    </div>
                </div>
            </aside>

            {/* Sağ Alan */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-100 h-20 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm/50">
                    <h1 className="text-lg font-black text-slate-800 tracking-tight">Kontrol Merkezi</h1>
                    <span className="inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm">
                        Yetkili Oturumu
                    </span>
                </header>

                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}