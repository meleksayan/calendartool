import React, { useState, useEffect } from 'react';
import { Head, usePage, useForm, router } from '@inertiajs/react';
import { 
    Plus, ChevronLeft, ChevronRight, Menu, Search, X, FileText, Trash2, Edit3 
} from 'lucide-react';
import axios from 'axios';

export default function Index({ appointments = [], services = [], users = [], filters = {} }) {
    const { auth } = usePage().props;
    const currentUser = auth?.user || users[0] || { id: 1, name: 'Melek Şayan' };
    const todayStr = new Date().toISOString().split('T')[0];

    // State'ler
    const [currentView, setCurrentView] = useState('Gün'); // 'Gün' | 'Hafta'
    const [selectedDate, setSelectedDate] = useState(filters.date || todayStr);
    const [selectedUsers, setSelectedUsers] = useState(users.map(u => u.id));
    const [clientSearchQuery, setClientSearchQuery] = useState('');
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date(selectedDate));
    
    // Modal state'leri
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAllAppointmentsModalOpen, setIsAllAppointmentsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [clientHistory, setClientHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Drag-to-Resize state'leri
    const [resizingApp, setResizingApp] = useState(null);

    const slotHeightPx = 20;

    // Inertia Form (Create)
    const { data: createData, setData: setCreateData, post: postCreate, processing: createProcessing, reset: resetCreate, errors: createErrors } = useForm({
        service_id: services[0]?.id || '',
        user_id: currentUser.id,
        client_name: '',
        client_email: '',
        client_phone: '',
        date: selectedDate,
        start_time: '10:00',
        end_time: '11:00',
        notes: '',
    });

    // Inertia Form (Edit)
    const { data: editData, setData: setEditData, patch: patchEdit, processing: editProcessing, errors: editErrors } = useForm({
        service_id: '',
        user_id: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        date: '',
        start_time: '',
        end_time: '',
        notes: '',
    });

    const generateTimeSlots = () => {
        const slots = [];
        for (let h = 10; h <= 17; h++) {
            for (let m = 0; m < 60; m += 10) {
                if (h === 17 && m > 0) break;
                slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            }
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();

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

    const fetchClientHistory = async (email) => {
        if (!email || !email.includes('@')) return;
        setLoadingHistory(true);
        try {
            const response = await axios.get(route('client.history'), { params: { email } });
            setClientHistory(response.data);
        } catch (error) {
            console.error('Geçmiş yüklenemedi', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // --- RESIZE MANTIĞI ---
    const parseMins = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return (h - 10) * 60 + (m || 0);
    };

    const formatMins = (minVal) => {
        const clamped = Math.max(10, Math.min(420, minVal));
        const h = 10 + Math.floor(clamped / 60);
        const m = clamped % 60;
        return `${String(Math.min(17, h)).padStart(2, '0')}:${String(h >= 17 ? 0 : m).padStart(2, '0')}`;
    };

    const handleResizeStart = (e, app) => {
        e.stopPropagation();
        setResizingApp({
            app,
            startY: e.clientY,
            origEndMin: parseMins(app.end_time),
            startMin: parseMins(app.start_time),
            currentEndTime: app.end_time
        });
    };

    useEffect(() => {
        if (!resizingApp) return;

        const handleMouseMove = (e) => {
            const deltaY = e.clientY - resizingApp.startY;
            const deltaMins = Math.round(deltaY / slotHeightPx) * 10;
            const newEndMin = Math.max(resizingApp.startMin + 10, resizingApp.origEndMin + deltaMins);
            const newEndStr = formatMins(newEndMin);
            
            setResizingApp(prev => ({ ...prev, currentEndTime: newEndStr }));
        };

        const handleMouseUp = () => {
            if (resizingApp.currentEndTime && resizingApp.currentEndTime !== resizingApp.app.end_time) {
                router.patch(route('appointments.update', resizingApp.app.id), {
                    end_time: resizingApp.currentEndTime
                }, { preserveScroll: true });
            }
            setResizingApp(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingApp]);
    // -----------------------

    const handleTimeSlotClick = (dateStr, hour) => {
        const [h, m] = hour.split(':').map(Number);
        const totalMin = h * 60 + m + 60;
        const endH = Math.min(17, Math.floor(totalMin / 60));
        const endM = endH === 17 ? 0 : totalMin % 60;
        const nextHour = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        
        setCreateData(prev => ({
            ...prev,
            date: dateStr,
            start_time: hour,
            end_time: nextHour,
            user_id: selectedUsers[0] || currentUser.id
        }));
        setIsCreateModalOpen(true);
    };

    const handleAppointmentClick = (e, app) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setSelectedAppointment(app);
        setIsEditMode(false);
        setEditData({
            service_id: app.service_id || '',
            user_id: app.user_id || '',
            client_name: app.client_name || '',
            client_email: app.client_email || '',
            client_phone: app.client_phone || '',
            date: app.date || '',
            start_time: app.start_time || '',
            end_time: app.end_time || '',
            notes: app.notes || '',
        });
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        postCreate(route('appointments.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                setClientHistory([]);
            }
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        patchEdit(route('appointments.update', selectedAppointment.id), {
            onSuccess: () => {
                setSelectedAppointment(null);
                setIsEditMode(false);
            }
        });
    };

    const handleDelete = (appId) => {
        if (confirm('Bu randevuyu silmek istediğinize emin misiniz?')) {
            router.delete(route('appointments.destroy', appId), {
                onSuccess: () => {
                    setSelectedAppointment(null);
                }
            });
        }
    };

    const calculatePosition = (app) => {
        const targetEndTime = (resizingApp && resizingApp.app.id === app.id) ? resizingApp.currentEndTime : app.end_time;
        const startMin = Math.max(0, parseMins(app.start_time));
        const endMin = parseMins(targetEndTime);
        const durationMin = Math.max(10, endMin - startMin);
        return { 
            top: `${(startMin / 10) * slotHeightPx}px`, 
            height: `${(durationMin / 10) * slotHeightPx}px` 
        };
    };

    const filteredAppointments = appointments.filter(app => {
        const matchesUser = selectedUsers.includes(app.user_id);
        const matchesDate = currentView === 'Gün' ? app.date === selectedDate : weekDays.includes(app.date);
        const matchesSearch = !clientSearchQuery || 
            app.client_name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
            app.client_email?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
            app.client_phone?.toLowerCase().includes(clientSearchQuery.toLowerCase());
        return matchesUser && matchesDate && matchesSearch;
    });

    const allFilteredAppointments = appointments.filter(app => {
        const matchesUser = selectedUsers.includes(app.user_id);
        const matchesSearch = !clientSearchQuery || 
            app.client_name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
            app.client_email?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
            app.client_phone?.toLowerCase().includes(clientSearchQuery.toLowerCase());
        return matchesUser && matchesSearch;
    });

    const formattedDateLabel = currentView === 'Gün' 
        ? new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })
        : `${weekDays[0].split('-').reverse().slice(0,2).join('.')} - ${weekDays[6].split('-').reverse().slice(0,2).join('.')} Hafta`;

    const changeDateNav = (direction) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + (currentView === 'Gün' ? direction : direction * 7));
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
            <Head title="Satış / Randevu Takvimi" />

            {/* ÜST TOOLBAR */}
            <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white sticky top-0 z-30 shadow-xs">
                <div className="flex items-center gap-4">
                    <span className="font-extrabold text-indigo-600 text-lg tracking-tight">SALES</span>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold">
                        {currentUser.name}
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
                    <div className="w-56 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input 
                            type="text" 
                            placeholder="Müşteri/telefon ara..."
                            value={clientSearchQuery}
                            onChange={(e) => setClientSearchQuery(e.target.value)}
                            className="w-full bg-slate-100 border-0 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
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
                </div>
            </header>

            {/* ANA İÇERİK */}
            <div className="flex flex-1 overflow-hidden">
                {/* SOL SIDEBAR */}
                <aside className="w-72 border-r border-slate-200 p-5 flex flex-col gap-5 bg-white overflow-y-auto">
                    <button 
                        onClick={() => { resetCreate(); setIsCreateModalOpen(true); }}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 rounded-xl px-4 py-3 font-bold text-xs transition w-full"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Hızlı Randevu & Satış Notu</span>
                    </button>

                    <button 
                        onClick={() => setIsAllAppointmentsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2.5 font-bold text-xs transition w-full"
                    >
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Tüm Randevuları Listele</span>
                    </button>

                    {/* MİNİ AYLIK TAKVİM WIDGET */}
                    <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                            <span>
                                {currentMonthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                            </span>
                            <div className="flex items-center gap-1">
                                <button 
                                    type="button"
                                    onClick={() => setCurrentMonthDate(new Date(new Date(currentMonthDate).setMonth(currentMonthDate.getMonth() - 1)))}
                                    className="p-1 hover:bg-slate-200/60 rounded-md text-slate-500"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setCurrentMonthDate(new Date(new Date(currentMonthDate).setMonth(currentMonthDate.getMonth() + 1)))}
                                    className="p-1 hover:bg-slate-200/60 rounded-md text-slate-500"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 font-semibold py-1">
                            <span>Pt</span><span>Sa</span><span>Ça</span><span>Pe</span><span>Cu</span><span>Ct</span><span>Pz</span>
                        </div>

                        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                            {miniDays.map((dateStr, idx) => {
                                if (!dateStr) return <div key={idx} />;
                                const dayNum = dateStr.split('-')[2];
                                const isSelected = dateStr === selectedDate;
                                const isToday = dateStr === todayStr;

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => { setSelectedDate(dateStr); setCurrentView('Gün'); }}
                                        className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[11px] font-medium transition ${
                                            isSelected 
                                                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                                                : isToday 
                                                ? 'bg-indigo-100 text-indigo-700 font-bold' 
                                                : 'hover:bg-slate-200/60 text-slate-700'
                                        }`}
                                    >
                                        {dayNum.replace(/^0/, '')}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Personel Seçimi (Filtre) */}
                    <div className="space-y-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Görüntülenen Temsilciler
                        </div>
                        <div className="space-y-2 text-xs">
                            {users.map((user) => (
                                <label key={user.id} className="flex items-center gap-2.5 cursor-pointer bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => setSelectedUsers(prev => 
                                            prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                                        )}
                                        className="rounded text-indigo-600 w-3.5 h-3.5" 
                                    />
                                    <span className="font-semibold text-slate-700 truncate">{user.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* SAĞ ZAMAN IZGARASI */}
                <main className="flex-1 flex flex-col overflow-y-auto bg-white relative">
                    <div className="flex border-b border-slate-200 sticky top-0 bg-white z-20 py-2.5 px-4 text-xs font-bold text-slate-500">
                        <div className="w-20 text-right pr-4 shrink-0">SAAT</div>
                        {currentView === 'Gün' ? (
                            <div className="flex-1 pl-4 text-slate-700">{selectedDate} - Günlük Görünüm (10:00 - 17:00 / 10dk aralıklar, {filteredAppointments.length} kayıt)</div>
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
                        <div className="w-20 border-r border-slate-200 flex flex-col select-none bg-slate-50/50 shrink-0">
                            {timeSlots.map((slot, idx) => {
                                const isHourStart = slot.endsWith(':00');
                                return (
                                    <div 
                                        key={idx} 
                                        style={{ height: `${slotHeightPx}px` }} 
                                        className={`border-b ${isHourStart ? 'border-slate-300 font-mono text-slate-600 font-semibold' : 'border-slate-100 text-slate-300'} text-right pr-2 text-[10px] flex items-center justify-end`}
                                    >
                                        {isHourStart ? slot : ''}
                                    </div>
                                );
                            })}
                        </div>

                        {currentView === 'Gün' ? (
                            <div className="flex-1 relative bg-white">
                                {timeSlots.map((slot, idx) => {
                                    const isHourStart = slot.endsWith(':00');
                                    return (
                                        <div 
                                            key={idx} 
                                            style={{ height: `${slotHeightPx}px` }}
                                            onClick={() => handleTimeSlotClick(selectedDate, slot)}
                                            className={`border-b ${isHourStart ? 'border-slate-200' : 'border-slate-100'} w-full hover:bg-indigo-50/30 cursor-pointer transition`}
                                        />
                                    );
                                })}
                                {filteredAppointments.map((app) => {
                                    const pos = calculatePosition(app);
                                    const displayEnd = (resizingApp && resizingApp.app.id === app.id) ? resizingApp.currentEndTime : app.end_time;
                                    return (
                                        <div 
                                            key={app.id} 
                                            style={{ top: pos.top, height: pos.height }}
                                            onClick={(e) => handleAppointmentClick(e, app)}
                                            className="absolute left-4 right-4 bg-indigo-600 text-white rounded-lg px-2.5 py-1 shadow-sm cursor-pointer hover:bg-indigo-700 transition overflow-hidden z-10 flex flex-col justify-center select-none"
                                        >
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="truncate">{app.service?.name || 'Hizmet'} — {app.client_name} ({app.client_phone})</span>
                                                <span className="text-[9px] bg-indigo-500/80 px-1.5 py-0.5 rounded font-mono shrink-0 ml-2">{app.start_time} - {displayEnd}</span>
                                            </div>
                                            {app.notes && (
                                                <div className="text-[10px] text-indigo-100 truncate flex items-center gap-1 mt-0.5">
                                                    <FileText className="w-2.5 h-2.5 shrink-0" /> {app.notes}
                                                </div>
                                            )}
                                            {/* ALT RESIZE KULPU */}
                                            <div 
                                                className="h-2 w-full cursor-s-resize absolute bottom-0 left-0 bg-transparent hover:bg-white/40 z-30"
                                                onMouseDown={(e) => handleResizeStart(e, app)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex-1 grid grid-cols-7 relative bg-white">
                                {weekDays.map(d => (
                                    <div key={d} className="relative border-r border-slate-100 h-full">
                                        {timeSlots.map((slot, idx) => {
                                            const isHourStart = slot.endsWith(':00');
                                            return (
                                                <div 
                                                    key={idx} 
                                                    style={{ height: `${slotHeightPx}px` }}
                                                    onClick={() => handleTimeSlotClick(d, slot)}
                                                    className={`border-b ${isHourStart ? 'border-slate-200' : 'border-slate-100'} w-full hover:bg-indigo-50/30 cursor-pointer transition`}
                                                />
                                            );
                                        })}
                                        {filteredAppointments.filter(app => app.date === d).map((app) => {
                                            const pos = calculatePosition(app);
                                            const displayEnd = (resizingApp && resizingApp.app.id === app.id) ? resizingApp.currentEndTime : app.end_time;
                                            return (
                                                <div 
                                                    key={app.id} 
                                                    style={{ top: pos.top, height: pos.height }}
                                                    onClick={(e) => handleAppointmentClick(e, app)}
                                                    className="absolute left-1 right-1 bg-indigo-600 text-white rounded-md p-1 shadow-xs cursor-pointer hover:bg-indigo-700 transition overflow-hidden z-10 flex flex-col justify-center select-none"
                                                >
                                                    <div className="text-[9px] font-bold truncate leading-tight">{app.client_name}</div>
                                                    <div className="text-[8px] text-indigo-200 leading-tight">{app.start_time} - {displayEnd}</div>
                                                    <div 
                                                        className="h-1.5 w-full cursor-s-resize absolute bottom-0 left-0 bg-transparent hover:bg-white/40 z-30"
                                                        onMouseDown={(e) => handleResizeStart(e, app)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* OLUŞTURMA MODALI */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-800">Randevu & Satış Takibi Oluştur</h3>
                                <p className="text-xs text-slate-400">Müşteri geçmişini kontrol et, durum/aciliyet notu düş.</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-black text-blue-700 tracking-wider uppercase mb-1">Müşteri Ad Soyad</label>
                                    <input 
                                        type="text" 
                                        value={createData.client_name} 
                                        onChange={e => setCreateData('client_name', e.target.value)}
                                        className="w-full bg-blue-50/40 border-2 border-blue-400 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-600 text-blue-900 font-medium"
                                        required 
                                    />
                                    {createErrors.client_name && <span className="text-rose-500 text-[10px]">{createErrors.client_name}</span>}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-blue-700 tracking-wider uppercase mb-1">Telefon Numarası</label>
                                    <input 
                                        type="tel" 
                                        placeholder="05XX XXX XX XX"
                                        value={createData.client_phone} 
                                        onChange={e => setCreateData('client_phone', e.target.value)}
                                        className="w-full bg-blue-50/40 border-2 border-blue-400 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-600 text-blue-900 font-medium"
                                        required 
                                    />
                                    {createErrors.client_phone && <span className="text-rose-500 text-[10px]">{createErrors.client_phone}</span>}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-blue-700 tracking-wider uppercase mb-1">E-posta</label>
                                    <input 
                                        type="email" 
                                        value={createData.client_email} 
                                        onChange={e => {
                                            setCreateData('client_email', e.target.value);
                                            fetchClientHistory(e.target.value);
                                        }}
                                        className="w-full bg-blue-50/40 border-2 border-blue-400 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-600 text-blue-900 font-medium"
                                    />
                                    {createErrors.client_email && <span className="text-rose-500 text-[10px]">{createErrors.client_email}</span>}
                                </div>
                            </div>

                            {/* Müşteri Geçmişi Özet Önizleme (Create Modal İçinde) */}
                            {loadingHistory && <div className="text-[11px] text-indigo-500 font-medium">Müşteri geçmişi yükleniyor</div>}
                            {clientHistory.length > 0 && (
                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 space-y-2">
                                    <div className="text-[11px] font-bold text-indigo-800">Geçmiş Randevular ({clientHistory.length})</div>
                                    <div className="w-full bg-emerald-50/30 border border-emerald-200/80 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                                        {clientHistory.map(h => (
                                            <div key={h.id} className="flex justify-between text-slate-600">
                                                <span>{h.date} ({h.start_time} - {h.end_time})</span>
                                                <span className="font-semibold">{h.service?.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-black text-blue-700 tracking-wider uppercase mb-1">Hizmet / Konu</label>
                                    <select 
                                        value={createData.service_id} 
                                        onChange={e => setCreateData('service_id', e.target.value)}
                                        className="w-full bg-blue-50/40 border-2 border-blue-400 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-600 text-blue-900 font-medium"
                                    >
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.duration || 60} dk)</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-blue-700 tracking-wider uppercase mb-1">Sorumlu Temsilci</label>
                                    <select 
                                        value={createData.user_id} 
                                        onChange={e => setCreateData('user_id', e.target.value)}
                                        className="w-full bg-blue-50/40 border-2 border-blue-400 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-600 text-blue-900 font-medium"
                                    >
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-black text-blue-700 tracking-wider uppercase mb-1">Tarih Seç</label>
                                    <input 
                                        type="date" 
                                        value={createData.date} 
                                        onChange={e => setCreateData('date', e.target.value)}
                                        className="w-full bg-blue-50/40 border-2 border-blue-400 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-600 text-blue-900 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-blue-700 tracking-wider uppercase mb-1">Başlangıç</label>
                                    <input 
                                        type="time" 
                                        value={createData.start_time} 
                                        onChange={e => setCreateData('start_time', e.target.value)}
                                        className="w-full bg-blue-50/40 border-2 border-blue-400 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-600 text-blue-900 font-medium"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-blue-700 tracking-wider uppercase mb-1">Bitiş</label>
                                    <input 
                                        type="time" 
                                        value={createData.end_time} 
                                        onChange={e => setCreateData('end_time', e.target.value)}
                                        className="w-full bg-blue-50/40 border-2 border-blue-400 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-600 text-blue-900 font-medium"
                                        required 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-blue-700 tracking-wider uppercase mb-1">Satış/Aciliyet Notları</label>
                                <textarea 
                                    rows="3" 
                                    value={createData.notes} 
                                    onChange={e => setCreateData('notes', e.target.value)}
                                    placeholder="Görüşme detayları, bütçe beklentisi veya özel notlar..."
                                    className="w-full bg-blue-50/40 border-2 border-blue-400 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-600 text-blue-900 font-medium"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    İptal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={createProcessing}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-100 disabled:opacity-50"
                                >
                                    {createProcessing ? 'Kaydediliyor...' : 'Randevuyu Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TÜM RANDEVULARI LİSTELE MODALI */}
            {isAllAppointmentsModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="base font-extrabold text-slate-800">Tüm Randevu ve Satış Kayıtları ({allFilteredAppointments.length})</h3>
                                <p className="text-xs text-slate-400">Filtrelere göre eşleşen kayıtların listesi.</p>
                            </div>
                            <button onClick={() => setIsAllAppointmentsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-400">
                                        <th className="py-2.5 px-3 font-bold">Müşteri</th>
                                        <th className="py-2.5 px-3 font-bold">İletişim</th>
                                        <th className="py-2.5 px-3 font-bold">Hizmet</th>
                                        <th className="py-2.5 px-3 font-bold">Tarih / Saat</th>
                                        <th className="py-2.5 px-3 font-bold">Sorumlu</th>
                                        <th className="py-2.5 px-3 font-bold text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allFilteredAppointments.map(app => (
                                        <tr key={app.id} className="hover:bg-slate-50 transition">
                                            <td className="py-3 px-3 font-bold text-slate-800">{app.client_name}</td>
                                            <td className="py-3 px-3 text-slate-600">
                                                <div>{app.client_phone}</div>
                                                <div className="text-[10px] text-slate-400">{app.client_email}</div>
                                            </td>
                                            <td className="py-3 px-3 text-slate-600">{app.service?.name || '-'}</td>
                                            <td className="py-3 px-3 font-mono text-slate-600">
                                                <div>{app.date}</div>
                                                <div className="text-[10px] text-slate-400">{app.start_time} - {app.end_time}</div>
                                            </td>
                                            <td className="py-3 px-3 text-slate-600">
                                                {users.find(u => u.id === app.user_id)?.name || '-'}
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setIsAllAppointmentsModalOpen(false);
                                                            handleAppointmentClick(null, app);
                                                        }}
                                                        className="px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-[11px]"
                                                    >
                                                        Detay / Düzenle
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(app.id)}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {allFilteredAppointments.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-8 text-slate-400">Kayıt bulunamadı.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* RANDEVU DETAY / DÜZENLEME MODALI */}
            {selectedAppointment && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="base font-extrabold text-slate-800">
                                    {isEditMode ? 'Randevuyu Düzenle' : 'Randevu Detayı'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {isEditMode ? 'Bilgileri güncelleyip kaydedin.' : 'Randevu ve müşteri satış notları.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isEditMode && (
                                    <>
                                        <button 
                                            onClick={() => setIsEditMode(true)}
                                            className="p-2 hover:bg-slate-100 rounded-full text-indigo-600"
                                            title="Düzenle"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(selectedAppointment.id)}
                                            className="p-2 hover:bg-slate-100 rounded-full text-rose-500"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => { setSelectedAppointment(null); setIsEditMode(false); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {!isEditMode ? (
                            <div className="space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Müşteri Ad Soyad</span>
                                        <div className="font-bold text-slate-800 text-sm mt-0.5">{selectedAppointment.client_name}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Hizmet</span>
                                        <div className="font-bold text-indigo-600 text-sm mt-0.5">{selectedAppointment.service?.name || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Telefon</span>
                                        <div className="font-medium text-slate-700 mt-0.5">{selectedAppointment.client_phone || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">E-posta</span>
                                        <div className="font-medium text-slate-700 mt-0.5">{selectedAppointment.client_email || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Tarih</span>
                                        <div className="font-medium text-slate-700 mt-0.5">{selectedAppointment.date}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Saat Aralığı</span>
                                        <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedAppointment.start_time} - {selectedAppointment.end_time}</div>
                                    </div>
                                </div>

                                {selectedAppointment.notes && (
                                    <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Notlar</span>
                                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedAppointment.notes}</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Müşteri Ad Soyad</label>
                                        <input 
                                            type="text" 
                                            value={editData.client_name} 
                                            onChange={e => setEditData('client_name', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                            required 
                                        />
                                        {editErrors.client_name && <span className="text-rose-500 text-[10px]">{editErrors.client_name}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Telefon Numarası</label>
                                        <input 
                                            type="tel" 
                                            value={editData.client_phone} 
                                            onChange={e => setEditData('client_phone', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                            required 
                                        />
                                        {editErrors.client_phone && <span className="text-rose-500 text-[10px]">{editErrors.client_phone}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">E-posta</label>
                                        <input 
                                            type="email" 
                                            value={editData.client_email} 
                                            onChange={e => setEditData('client_email', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {editErrors.client_email && <span className="text-rose-500 text-[10px]">{editErrors.client_email}</span>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Hizmet / Konu</label>
                                        <select 
                                            value={editData.service_id} 
                                            onChange={e => setEditData('service_id', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.duration || 60} dk)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Sorumlu Temsilci</label>
                                        <select 
                                            value={editData.user_id} 
                                            onChange={e => setEditData('user_id', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Tarih</label>
                                        <input 
                                            type="date" 
                                            value={editData.date} 
                                            onChange={e => setEditData('date', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Başlangıç</label>
                                        <input 
                                            type="time" 
                                            value={editData.start_time} 
                                            onChange={e => setEditData('start_time', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Bitiş</label>
                                        <input 
                                            type="time" 
                                            value={editData.end_time} 
                                            onChange={e => setEditData('end_time', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                            required 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Satış/Aciliyet Notları</label>
                                    <textarea 
                                        rows="3" 
                                        value={editData.notes} 
                                        onChange={e => setEditData('notes', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditMode(false)}
                                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                        İptal
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={editProcessing}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-100 disabled:opacity-50"
                                    >
                                        {editProcessing ? 'Güncelleniyor' : 'Değişiklikleri Kaydet'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}