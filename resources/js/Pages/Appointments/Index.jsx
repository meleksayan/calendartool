import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ auth, services, users, appointments = [] }) {
    // Bugünün tarihi (Bugünün yılı ve ayı varsayılan başlangıç)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        service_id: '',
        user_id: auth.user.id,
        client_name: '',
        client_email: '',
        client_phone: '',
        date: '',
        start_time: '10:00',
        end_time: '11:00',
        notes: '',
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

    // Sadece gelecekteki aylara gitmeye izin ver (Geçmiş aylara gitmek engellendi)
    const handlePrevMonth = () => {
        const prevMonthDate = new Date(year, month - 1, 1);
        const currentMonthOnly = new Date(today.getFullYear(), today.getMonth(), 1);
        
        if (prevMonthDate >= currentMonthOnly) {
            setCurrentDate(prevMonthDate);
        }
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const isCurrentOrPastMonth = year === today.getFullYear() && month === today.getMonth();

    const handleSlotClick = (dateString, hour) => {
        const startTimeFormatted = `${String(hour).padStart(2, '0')}:00`;
        const endTimeFormatted = `${String(hour + 1).padStart(2, '0')}:00`;
        
        setData(prev => ({
            ...prev,
            date: dateString,
            start_time: startTimeFormatted,
            end_time: endTimeFormatted
        }));
        setIsCreateModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('appointments.store'), {
            onSuccess: () => {
                reset('client_name', 'client_email', 'client_phone', 'date', 'notes');
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleCancel = (id) => {
        if (confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) {
            router.patch(route('appointments.cancel', id));
        }
    };

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const firstDayIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArray = Array.from({ length: totalDaysInMonth }, (_, index) => {
        const dayNum = index + 1;
        const dateObj = new Date(year, month, dayNum);
        const dayOfWeek = dateObj.getDay();
        return { dayNum, isSunday: dayOfWeek === 0 };
    }).filter(d => !d.isSunday);

    const workingHours = [9, 10, 11, 12, 13, 14, 15, 16];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Randevu Takvimi</h2>
                    
                    <button
                        onClick={() => {
                            setData('date', '');
                            setIsCreateModalOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition flex items-center gap-2"
                    >
                        <span>➕</span> Yeni Randevu Oluştur
                    </button>
                </div>
            }
        >
            <Head title="Randevu Takvimi" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="p-6 bg-white shadow-sm sm:rounded-xl border border-gray-100">
                        {/* Ay ve İleri/Geri Butonları */}
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-bold text-gray-950 min-w-[150px]">
                                    {monthNames[month]} {year}
                                </h3>
                                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                                    <button 
                                        onClick={handlePrevMonth} 
                                        disabled={isCurrentOrPastMonth}
                                        className={`px-3 py-1 text-xs font-semibold rounded transition ${
                                            isCurrentOrPastMonth 
                                                ? 'text-gray-300 cursor-not-allowed' 
                                                : 'text-gray-600 hover:bg-white'
                                        }`}
                                    >
                                        ◀ Önceki
                                    </button>
                                    <button onClick={handleNextMonth} className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-white rounded transition">Sonraki ▶</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-6 gap-2 text-center font-semibold text-gray-500 mb-2 text-xs uppercase tracking-wider">
                            <div className="py-2">Pzt</div>
                            <div className="py-2">Sal</div>
                            <div className="py-2">Çar</div>
                            <div className="py-2">Per</div>
                            <div className="py-2">Cum</div>
                            <div className="py-2">Cmt</div>
                        </div>

                        <div className="grid grid-cols-6 gap-3">
                            {Array.from({ length: firstDayIndex === 6 ? 0 : firstDayIndex }).map((_, index) => (
                                <div key={`empty-${index}`} className="h-48 border border-gray-100 rounded-lg bg-gray-50/30"></div>
                            ))}

                            {daysArray.map(({ dayNum }) => {
                                const formattedDay = String(dayNum).padStart(2, '0');
                                const formattedMonth = String(month + 1).padStart(2, '0');
                                const dateString = `${year}-${formattedMonth}-${formattedDay}`;

                                const cellDate = new Date(year, month, dayNum);
                                cellDate.setHours(0, 0, 0, 0);

                                const isPastDay = cellDate < today;
                                const dayAppointments = appointments.filter(app => app.date === dateString);

                                return (
                                    <div 
                                        key={dayNum} 
                                        className={`h-48 border rounded-lg p-2 flex flex-col overflow-hidden transition ${
                                            isPastDay 
                                                ? 'bg-gray-50/70 border-gray-200 opacity-60' 
                                                : 'bg-white border-gray-200 shadow-2xs hover:border-indigo-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center pb-1 border-b border-gray-100 mb-1.5">
                                            <span className={`text-xs font-bold ${isPastDay ? 'text-gray-400' : 'text-gray-700'}`}>
                                                {dayNum} {monthNames[month]}
                                            </span>
                                            {dayAppointments.length > 0 && (
                                                <span className="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                                    {dayAppointments.length} randevu
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1 mb-2 max-h-16 overflow-y-auto custom-scrollbar">
                                            {dayAppointments.map(app => (
                                                <div 
                                                    key={app.id} 
                                                    className={`group/item relative text-[10px] p-1 rounded flex justify-between items-center ${
                                                        app.status === 'cancelled' 
                                                            ? 'bg-red-50 text-red-700 line-through' 
                                                            : 'bg-indigo-50 text-indigo-900 border-l-2 border-indigo-500'
                                                    }`}
                                                >
                                                    <div className="truncate">
                                                        <span className="font-bold">{app.start_time}</span> {app.client_name}
                                                    </div>
                                                    {app.status !== 'cancelled' && !isPastDay && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCancel(app.id);
                                                            }}
                                                            className="text-gray-400 hover:text-red-600 font-bold px-1 ml-1"
                                                            title="İptal Et"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto pt-1 border-t border-gray-100">
                                            <p className="text-[10px] text-gray-400 mb-1 font-medium">
                                                {isPastDay ? 'Geçmiş Gün' : 'Hızlı Saat Seç:'}
                                            </p>
                                            <div className="grid grid-cols-4 gap-1">
                                                {workingHours.map(hour => {
                                                    const timeStr = `${String(hour).padStart(2, '0')}:00`;
                                                    const isBooked = dayAppointments.some(app => app.start_time.startsWith(String(hour).padStart(2, '0')) && app.status !== 'cancelled');
                                                    const isDisabled = isPastDay || isBooked;

                                                    return (
                                                        <button
                                                            key={hour}
                                                            disabled={isDisabled}
                                                            onClick={() => handleSlotClick(dateString, hour)}
                                                            className={`text-[10px] py-0.5 px-1 rounded font-medium transition ${
                                                                isDisabled 
                                                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                                                    : 'bg-gray-50 text-gray-600 hover:bg-indigo-600 hover:text-white border border-gray-200'
                                                            }`}
                                                            title={isPastDay ? 'Geçmiş tarihlere randevu eklenemez' : (isBooked ? 'Bu saat dolu' : `${timeStr} için randevu oluştur`)}
                                                        >
                                                            {hour}:00
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">Yeni Randevu Oluştur</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">İlgilenen Temsilci</label>
                                <select 
                                    value={data.user_id} 
                                    onChange={e => setData('user_id', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                >
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} {u.id === auth.user.id ? '(Siz)' : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Hizmet Seçin</label>
                                <select 
                                    value={data.service_id} 
                                    onChange={e => setData('service_id', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Seçiniz...</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.duration} dk)</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Müşteri Adı Soyadı</label>
                                <input 
                                    type="text" 
                                    value={data.client_name}
                                    onChange={e => setData('client_name', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Örn: Ahmet Yılmaz"
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">E-Posta</label>
                                    <input 
                                        type="email" 
                                        value={data.client_email}
                                        onChange={e => setData('client_email', e.target.value)}
                                        className="w-full border-gray-300 rounded-lg text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="ornek@mail.com"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Telefon</label>
                                    <input 
                                        type="text" 
                                        value={data.client_phone}
                                        onChange={e => setData('client_phone', e.target.value)}
                                        className="w-full border-gray-300 rounded-lg text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="0555..."
                                        required 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tarih</label>
                                <input 
                                    type="date" 
                                    value={data.date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setData('date', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Başlangıç Saati</label>
                                    <input 
                                        type="time" 
                                        value={data.start_time}
                                        onChange={e => setData('start_time', e.target.value)}
                                        className="w-full border-gray-300 rounded-lg text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Bitiş Saati</label>
                                    <input 
                                        type="time" 
                                        value={data.end_time}
                                        onChange={e => setData('end_time', e.target.value)}
                                        className="w-full border-gray-300 rounded-lg text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    İptal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
                                >
                                    Randevuyu Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}