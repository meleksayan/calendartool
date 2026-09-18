import React from 'react';
import { Link, router } from '@inertiajs/react';

export default function TechnicalLayout({ user, children }) {
    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Üst Navbar */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-6">
                            <Link href="/technical/tum-randevular" className="text-lg font-bold text-indigo-600">
                                🔧 Teknik Servis Paneli
                            </Link>
                            <div className="hidden sm:flex sm:gap-4">
                                <Link
                                    href="/technical/tum-randevular"
                                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md"
                                >
                                    Tüm Randevular
                                </Link>
                                <Link
                                    href="/technical/panel"
                                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md"
                                >
                                    Panel Ana Sayfa
                                </Link>
                            </div>
                        </div>

                        {/* Kullanıcı / Çıkış */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700 font-medium">
                                {user?.name || 'Teknisyen'}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Çıkış
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sayfa İçeriği */}
            <main>{children}</main>
        </div>
    );
}