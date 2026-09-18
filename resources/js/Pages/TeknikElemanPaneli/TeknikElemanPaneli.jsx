import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { 
    Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, User, Trash2, X, Plus, Trash 
} from 'lucide-react';

import { Link } from '@inertiajs/react';

export default function TeknikElemanPaneli({ appointments = [], technician = null, initialAvailability = [] }) {
    const { auth } = usePage().props;
    const currentTech = technician || auth?.user || { id: 1, name: 'Teknik Personel' };
    const todayStr = new Date().toISOString().split('T')[0];

    const [activeTab, setActiveTab] = useState('takvim'); 
    const [currentView, setCurrentView] = useState('Hafta'); 
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date(selectedDate));
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const slotHeightPx = 30;
    const timeSlots = [];
    for (let h = 9; h <= 18; h++) {
        timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    }

    const daysOfWeek = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    
    const [availability, setAvailability] = useState(() => {
        if (initialAvailability.length > 0) return initialAvailability;
        return daysOfWeek.map(day => ({
            day,
            enabled: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].includes(day),
            slots: [
                { start: '09:00', end: '12:00' },
                { start: '13:00', end: '18:00' }
            ]
        }));
    });

    const myAppointments = appointments.filter(app => Number(app.technician_id || app.user_id) === Number(currentTech.id));

    const getWeekDays = (baseDateStr) => {
        const d = new Date(baseDateStr);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const week = [];
        for (let i = 0; i < 7; i++) {
            const current = new Date(monday);
            current.setDate(monday.getDate() + i);
            week.push(current.toISOString().split('T')[0]);
        }
        return week;
    };

    const weekDays = getWeekDays(selectedDate);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay();
        const adjustedFirstDay = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);
        const days = [];
        for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i).toISOString().split('T')[0]);
        return days;
    };

    const miniDays = getDaysInMonth(currentMonthDate);

    const parseMins = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return (h - 9) * 60 + (m || 0);
    };

    const calculatePosition = (app) => {
        const startMin = Math.max(0, parseMins(app.start_time));
        const endMin = parseMins(app.end_time);
        const durationMin = Math.max(30, endMin - startMin);
        return { 
            top: `${(startMin / 30) * slotHeightPx}px`, 
            height: `${(durationMin / 30) * slotHeightPx}px` 
        };
    };

    const handleCancelAppointment = (id) => {
        if (confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) {
            router.post(`/technical/appointments/${id}/cancel`, {}, { 
                preserveScroll: true,
                onSuccess: () => setSelectedAppointment(null)
            });
        }
    };

    const handleToggleDay = (index) => {
        setAvailability(prev => prev.map((item, i) => i === index ? { ...item, enabled: !item.enabled } : item));
    };

    const handleSlotChange = (dayIdx, slotIdx, field, value) => {
        setAvailability(prev => prev.map((item, i) => {
            if (i !== dayIdx) return item;
            const updatedSlots = item.slots.map((s, si) => si === slotIdx ? { ...s, [field]: value } : s);
            return { ...item, slots: updatedSlots };
        }));
    };

    const handleAddSlot = (dayIdx) => {
        setAvailability(prev => prev.map((item, i) => {
            if (i !== dayIdx) return item;
            return { ...item, slots: [...item.slots, { start: '13:00', end: '17:00' }] };
        }));
    };

    const handleRemoveSlot = (dayIdx, slotIdx) => {
        setAvailability(prev => prev.map((item, i) => {
            if (i !== dayIdx || item.slots.length <= 1) return item;
            return { ...item, slots: item.slots.filter((_, si) => si !== slotIdx) };
        }));
    };

    const applyStandardHours = () => {
        setAvailability(prev => prev.map(item => ({
            ...item,
            enabled: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].includes(item.day),
            slots: [
                { start: '09:00', end: '12:00' },
                { start: '13:00', end: '18:00' }
            ]
        })));
    };

    const saveAvailability = () => {
        router.post('/technical/availability', { availability }, { preserveScroll: true });
        alert('Aralıklı müsaitlik saatleriniz kaydedildi.');
    };

    const changeDateNav = (direction) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + (currentView === 'Gün' ? direction : direction * 7));
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const formattedDateLabel = currentView === 'Gün' 
        ? new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })
        : `${weekDays[0].split('-').reverse().slice(0,2).join('.')} - ${weekDays[6].split('-').reverse().slice(0,2).join('.')} Hafta`;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
            <Head title="Teknik Eleman Takvimi" />

            {/* ÜST TOOLBAR */}
            <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white sticky top-0 z-30 shadow-xs">
                <div className="flex items-center gap-3">
                    <span className="font-extrabold text-indigo-600 text-lg tracking-tight">TEKNİK DESTEK</span>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold">
                        {currentTech.name}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setSelectedDate(todayStr)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50"
                    >
                        Bugün
                    </button>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button onClick={() => changeDateNav(-1)} className="p-1.5 hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => changeDateNav(1)} className="p-1.5 hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <span className="text-sm font-bold text-slate-800 min-w-[210px] text-center capitalize">
                        {formattedDateLabel}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                        <button 
                            onClick={() => setActiveTab('takvim')} 
                            className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === 'takvim' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                        >
                            Takvim
                        </button>
                        <button 
                            onClick={() => setActiveTab('musaitlik')} 
                            className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === 'musaitlik' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                        >
                            Müsaitlik
                        </button>
                    </div>
                    {activeTab === 'takvim' && (
                        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                            <button 
                                onClick={() => setCurrentView('Gün')} 
                                className={`px-3 py-1 rounded-lg transition ${currentView === 'Gün' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                            >
                                Gün
                            </button>
                            <button 
                                onClick={() => setCurrentView('Hafta')} 
                                className={`px-3 py-1 rounded-lg transition ${currentView === 'Hafta' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                            >
                                Hafta
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* ANA İÇERİK */}
            <div className="flex flex-1 overflow-hidden">
                {activeTab === 'takvim' ? (
                    <>
                        {/* SOL SIDEBAR */}
                        <aside className="w-64 border-r border-slate-200 p-4 flex flex-col gap-5 bg-white overflow-y-auto">
                            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                                    <span>{currentMonthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentMonthDate(new Date(new Date(currentMonthDate).setMonth(currentMonthDate.getMonth() - 1)))} className="p-1 hover:bg-slate-200/60 rounded-md text-slate-500"><ChevronLeft className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setCurrentMonthDate(new Date(new Date(currentMonthDate).setMonth(currentMonthDate.getMonth() + 1)))} className="p-1 hover:bg-slate-200/60 rounded-md text-slate-500"><ChevronRight className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 font-semibold py-1">
                                    <span>Pt</span><span>Sa</span><span>Ça</span><span>Pe</span><span>Cu</span><span>Ct</span><span>Pz</span>
                                </div>
                                <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                                    {miniDays.map((dateStr, idx) => {
                                        if (!dateStr) return <div key={idx} />;
                                        const dayNum = Number(dateStr.split('-')[2]);
                                        const isSelected = dateStr === selectedDate;
                                        const isToday = dateStr === todayStr;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => { setSelectedDate(dateStr); setCurrentView('Gün'); }}
                                                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[11px] font-medium transition ${
                                                    isSelected ? 'bg-indigo-600 text-white font-bold shadow-xs' : isToday ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-slate-200/60 text-slate-700'
                                                }`}
                                            >
                                                {dayNum}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* YENİ EKLENEN NAVİGASYON ALANI */}
                           <nav className="space-y-1">
                              <Link
                                href="/technical/tum-randevular"
                                className="flex items-center px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition"
                              >
                            Randevuları Listele
                              </Link>
                            </nav>
                        </aside>

                        {/* SAĞ ZAMAN GRID */}
                        <main className="flex-1 flex flex-col overflow-y-auto bg-white relative">
                            <div className="flex border-b border-slate-200 sticky top-0 bg-white z-20 py-2.5 px-4 text-xs font-bold text-slate-500">
                                <div className="w-16 text-right pr-4 shrink-0">SAAT</div>
                                {currentView === 'Gün' ? (
                                    <div className="flex-1 pl-4 text-slate-700">Günlük Görünüm (09:00 - 18:00)</div>
                                ) : (
                                    <div className="flex-1 grid grid-cols-7 gap-1">
                                        {weekDays.map(d => (
                                            <div key={d} className={`text-center py-1 rounded-lg ${d === todayStr ? 'bg-indigo-50 text-indigo-600 font-extrabold' : ''}`}>
                                                {new Date(d).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-1 relative" style={{ minHeight: `${timeSlots.length * slotHeightPx}px` }}>
                                <div className="w-16 border-r border-slate-200 flex flex-col select-none bg-slate-50/50 shrink-0">
                                    {timeSlots.map((slot, idx) => (
                                        <div key={idx} style={{ height: `${slotHeightPx}px` }} className="border-b border-slate-100 text-right pr-2 text-[10px] text-slate-400 flex items-center justify-end font-mono">
                                            {slot}
                                        </div>
                                    ))}
                                </div>

                                {currentView === 'Gün' ? (
                                    <div className="flex-1 relative bg-white">
                                        {timeSlots.map((slot, idx) => (
                                            <div key={idx} style={{ height: `${slotHeightPx}px` }} className="border-b border-slate-100 w-full" />
                                        ))}
                                        {myAppointments.filter(app => app.date === selectedDate).map((app) => {
                                            const pos = calculatePosition(app);
                                            const isCancelled = app.status === 'iptal';
                                            return (
                                                <div 
                                                    key={app.id} 
                                                    style={{ top: pos.top, height: pos.height }}
                                                    onClick={() => setSelectedAppointment(app)}
                                                    className={`absolute left-4 right-4 text-white rounded-lg px-2.5 py-1 shadow-sm cursor-pointer transition overflow-hidden z-10 flex flex-col justify-center select-none ${
                                                        isCancelled ? 'bg-red-400/80 line-through' : 'bg-indigo-600 hover:bg-indigo-700'
                                                    }`}
                                                >
                                                    <div className="text-[11px] font-bold truncate">{app.client_name} ({app.start_time}-{app.end_time})</div>
                                                    <div className="text-[9px] text-indigo-100 truncate">{app.service_name || 'Teknik Servis'}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex-1 grid grid-cols-7 relative bg-white">
                                        {weekDays.map(d => (
                                            <div key={d} className="relative border-r border-slate-100 h-full">
                                                {timeSlots.map((slot, idx) => (
                                                    <div key={idx} style={{ height: `${slotHeightPx}px` }} className="border-b border-slate-100 w-full" />
                                                ))}
                                                {myAppointments.filter(app => app.date === d).map((app) => {
                                                    const pos = calculatePosition(app);
                                                    const isCancelled = app.status === 'iptal';
                                                    return (
                                                        <div 
                                                            key={app.id} 
                                                            style={{ top: pos.top, height: pos.height }}
                                                            onClick={() => setSelectedAppointment(app)}
                                                            className={`absolute left-1 right-1 text-white rounded-md p-1 shadow-xs cursor-pointer transition overflow-hidden z-10 flex flex-col justify-center select-none ${
                                                                isCancelled ? 'bg-red-400/80 line-through' : 'bg-indigo-600 hover:bg-indigo-700'
                                                            }`}
                                                        >
                                                            <div className="text-[9px] font-bold truncate leading-tight">{app.client_name}</div>
                                                            <div className="text-[8px] text-indigo-100 leading-tight">{app.start_time}-{app.end_time}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </main>
                    </>
                ) : (
                    /* ARALIKLI / ÖĞLE ARASI DESTEKLİ MÜSAİTLİK YÖNETİMİ */
                    <main className="flex-1 max-w-4xl w-full mx-auto p-6 overflow-y-auto">
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-800">Aralıklı Müsaitlik / Mola Yönetimi</h2>
                                    <p className="text-xs text-slate-400">Örn: 09:00-12:00 ve 13:00-18:00 gibi çoklu saat blokları ekleyin.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={applyStandardHours} 
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                                    >
                                        H.İçi Öğle Aralıklı Yap
                                    </button>
                                    <button onClick={saveAvailability} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100">
                                        Kaydet
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {availability.map((item, dayIdx) => (
                                    <div 
                                        key={item.day} 
                                        className={`p-4 rounded-2xl border transition space-y-3 ${
                                            item.enabled ? 'bg-indigo-50/20 border-indigo-200' : 'bg-slate-50 border-slate-200 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={item.enabled} 
                                                    onChange={() => handleToggleDay(dayIdx)} 
                                                    className="rounded text-indigo-600 w-4 h-4 cursor-pointer" 
                                                />
                                                <span className="font-extrabold text-slate-700 text-sm w-28">{item.day}</span>
                                            </label>

                                            {item.enabled && (
                                                <button 
                                                    onClick={() => handleAddSlot(dayIdx)}
                                                    className="text-xs text-indigo-600 font-bold hover:bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Aralık Ekle
                                                </button>
                                            )}
                                        </div>

                                        {item.enabled && (
                                            <div className="pl-7 space-y-2">
                                                {item.slots.map((slot, slotIdx) => (
                                                    <div key={slotIdx} className="flex items-center gap-2">
                                                        <input 
                                                            type="time" 
                                                            value={slot.start} 
                                                            onChange={(e) => handleSlotChange(dayIdx, slotIdx, 'start', e.target.value)} 
                                                            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-mono" 
                                                        />
                                                        <span className="text-slate-400 text-xs">→</span>
                                                        <input 
                                                            type="time" 
                                                            value={slot.end} 
                                                            onChange={(e) => handleSlotChange(dayIdx, slotIdx, 'end', e.target.value)} 
                                                            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-mono" 
                                                        />
                                                        {item.slots.length > 1 && (
                                                            <button 
                                                                onClick={() => handleRemoveSlot(dayIdx, slotIdx)}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            >
                                                                <Trash className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                )}
            </div>

            {/* DETAY / İPTAL MODALI */}
            {selectedAppointment && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-extrabold text-slate-800">Randevu Detayı</h3>
                            <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-slate-400">Müşteri:</span><span className="font-bold">{selectedAppointment.client_name}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Telefon:</span><span className="font-bold">{selectedAppointment.client_phone || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Tarih / Saat:</span><span className="font-bold">{selectedAppointment.date} | {selectedAppointment.start_time} - {selectedAppointment.end_time}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Durum:</span><span className="font-bold">{selectedAppointment.status === 'iptal' ? 'İptal Edildi' : 'Aktif'}</span></div>
                            {selectedAppointment.notes && (
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 mt-2">
                                    <span className="font-bold block mb-0.5">Not:</span> {selectedAppointment.notes}
                                </div>
                            )}
                        </div>
                        {selectedAppointment.status !== 'iptal' && (
                            <div className="flex justify-end pt-2 border-t border-slate-100">
                                <button onClick={() => handleCancelAppointment(selectedAppointment.id)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center gap-1">
                                    <Trash2 className="w-3.5 h-3.5" /> Randevuyu İptal Et
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}