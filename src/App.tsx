import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Phone, CheckCircle, XCircle, 
  ChevronRight, ChevronLeft, DollarSign, Settings, LogOut, 
  MessageCircle, Sparkles, ShieldAlert, ArrowLeft, Search,
  CalendarDays, Users, Lock, Plus, Edit3, Trash2, HeartPulse, Bell, 
  Clock, Mail, Copy, Calendar as BigCalendar, CheckSquare, Eye, AlertCircle,
  Tag, Palette, Link as LinkIcon, FileText, ClipboardList
} from 'lucide-react';


// --- CONFIGURACIÓN ESTÉTICA ---
const COLORS = {
  bg: 'bg-[#FAF9F6]', 
  card: 'bg-white',
  textPrimary: 'text-[#1A1A1A]',
  textSecondary: 'text-[#6E6B64]',
  accent: '#1A1A1A',
  border: 'border-[#EAE5DC]',
};

// --- POLÍTICA DE CANCELACIÓN ---
const CLINIC_POLICY = "Política de Cancelación: Toda reserva cancelada el mismo día del turno deberá abonar el 100% del valor. Al reservar, aceptas estas condiciones.";

// --- PALETA DE COLORES ---
const PALETTE_OPTIONS = [
  { id: 'rose', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-400', label: 'Rosa' },
  { id: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-400', label: 'Esmeralda' },
  { id: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-400', label: 'Azul' },
  { id: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400', label: 'Ámbar' },
  { id: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', dot: 'bg-purple-400', label: 'Púrpura' },
  { id: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', dot: 'bg-indigo-400', label: 'Cobalto' },
  { id: 'violet', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', dot: 'bg-violet-400', label: 'Violeta' },
  { id: 'teal', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', dot: 'bg-teal-400', label: 'Té' },
  { id: 'orange', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', dot: 'bg-orange-400', label: 'Coral' },
  { id: 'yellow', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100', dot: 'bg-yellow-400', label: 'Oro' },
];

// --- UTILIDADES ---
const formatDate = (date) => date ? date.toISOString().split('T')[0] : '';
const today = new Date();

// GENERADOR DE URL REAL PARA GOOGLE CALENDAR
const generateGoogleCalendarUrl = (appt, variant, prof) => {
  if (!appt || !appt.date || !appt.time) return '#';
  
  const [year, month, day] = appt.date.split('-');
  const [hour, minute] = appt.time.split(':');
  
  const startDate = new Date(year, month - 1, day, hour, minute);
  const durationMins = variant?.duration || 60;
  const endDate = new Date(startDate.getTime() + durationMins * 60000);
  
  const formatDT = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, ''); 
  
  const title = encodeURIComponent(`Turno: ${variant?.name || 'Servicio'} - ${appt.clientName}`);
  const details = encodeURIComponent(`Cliente: ${appt.clientName}\nTeléfono: ${appt.clientPhone}\nServicio: ${variant?.name}\nEspecialista: ${prof?.name}\n\nGestión de reservas Cosy Cowork.`);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDT(startDate)}/${formatDT(endDate)}&details=${details}`;
};

// --- SEMILLAS DE DATOS INICIALES ---
const INITIAL_CATEGORIES = [
  { id: 'cat_manicura', name: 'Manicura y pedicura', dot: 'bg-rose-400' },
  { id: 'cat_hidro', name: 'Hidrofacial', dot: 'bg-sky-400' }
];

const INITIAL_VARIANTS = [
  { id: 'v1', categoryId: 'cat_manicura', name: 'Manicura Rusa Express', description: 'Limpieza profunda de cutículas y esmaltado.', price: 12000, duration: 45, dot: 'bg-rose-400', profId: 'p1' },
  { id: 'v5', categoryId: 'cat_hidro', name: 'Hidrofacial Revitalizante', description: 'Extracción con espátula ultrasónica.', price: 32000, duration: 60, dot: 'bg-sky-400', profId: 'p2' }
];

const INITIAL_PROFESSIONALS = [
  { 
    id: 'p1', name: 'Ana Estévez', role: 'Especialista en Uñas', email: 'ana@gmail.com', phone: '5491122223333',
    availability: { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }, blockedDates: [], blockedTimeSlots: [],
    messageTemplates: { confirmation: "¡Hola {Cliente}! Tu turno de {Tratamiento} el {Fecha} a las {Hora} hs está agendado.", reminder: "Recordatorio: Mañana tienes turno a las {Hora} hs." }
  },
  { 
    id: 'p2', name: 'Dra. Elena Costa', role: 'Dermatóloga & Estética', email: 'elena@gmail.com', phone: '5491144445555',
    availability: { days: [2, 4, 6], start: '10:00', end: '19:00' }, blockedDates: [], blockedTimeSlots: [],
    messageTemplates: { confirmation: "Estimada {Cliente}, confirmamos su cita para el {Fecha} a las {Hora} hs.", reminder: "Recuerde no aplicar cremas con ácidos antes de su sesión." }
  }
];

const INITIAL_USERS = {
  'admin': { role: 'manager', password: '123', name: 'Manager General' },
  'ana': { role: 'professional', id: 'p1', password: '123', name: 'Ana Estévez' },
  'elena': { role: 'professional', id: 'p2', password: '123', name: 'Dra. Elena Costa' }
};

const INITIAL_PATIENTS = [
  {
    id: 'pat_1', name: 'Sofía Lauren', phone: '5491123456789', email: 'sofia@gmail.com', createdAt: '2026-01-10',
    medicalNotes: { 'p1': 'Piel sensible en manos.', 'p2': '' } // Notas independientes por profesional
  }
];

const INITIAL_APPOINTMENTS = [
  { id: 'a1', patientId: 'pat_1', clientName: 'Sofía Lauren', clientPhone: '5491123456789', profId: 'p1', variantId: 'v1', date: formatDate(today), time: '10:00', status: 'confirmed', price: 12000, customInstructions: '' }
];

const INITIAL_HISTORY = [
  { id: 'h_1', patientId: 'pat_1', appointmentId: 'a1', profId: 'p1', treatmentName: 'Manicura Rusa Express', notes: 'Tratamiento exitoso sin molestias.', date: formatDate(today) }
];


// ==========================================
// COMPONENTE PRINCIPAL (APP)
// ==========================================
export default function App() {
  const [currentView, setCurrentView] = useState('client'); 
  const [loggedUser, setLoggedUser] = useState(null);
  const [toast, setToast] = useState(null);
  
  // --- ESTADOS CON RESPALDO DE LOCALSTORAGE ---
  const [categories, setCategories] = useState(() => { const saved = localStorage.getItem('cw_categories'); return saved ? JSON.parse(saved) : INITIAL_CATEGORIES; });
  const [variants, setVariants] = useState(() => { const saved = localStorage.getItem('cw_variants'); return saved ? JSON.parse(saved) : INITIAL_VARIANTS; });
  const [professionals, setProfessionals] = useState(() => { const saved = localStorage.getItem('cw_professionals'); return saved ? JSON.parse(saved) : INITIAL_PROFESSIONALS; });
  const [users, setUsers] = useState(() => { const saved = localStorage.getItem('cw_users'); return saved ? JSON.parse(saved) : INITIAL_USERS; });
  const [patients, setPatients] = useState(() => { const saved = localStorage.getItem('cw_patients'); return saved ? JSON.parse(saved) : INITIAL_PATIENTS; });
  const [appointments, setAppointments] = useState(() => { const saved = localStorage.getItem('cw_appointments'); return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS; });
  const [treatmentHistory, setTreatmentHistory] = useState(() => { const saved = localStorage.getItem('cw_history'); return saved ? JSON.parse(saved) : INITIAL_HISTORY; });

  // Sincronización LocalStorage
  useEffect(() => { localStorage.setItem('cw_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('cw_variants', JSON.stringify(variants)); }, [variants]);
  useEffect(() => { localStorage.setItem('cw_professionals', JSON.stringify(professionals)); }, [professionals]);
  useEffect(() => { localStorage.setItem('cw_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('cw_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('cw_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('cw_history', JSON.stringify(treatmentHistory)); }, [treatmentHistory]);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- CARGA INICIAL DESDE CLOUDFLARE D1 ---
  useEffect(() => {
    async function loadData() {
      try {
        const [apptsRes, patsRes, histRes, catsRes] = await Promise.all([
          fetch('/api/appointments').catch(() => null),
          fetch('/api/patients').catch(() => null),
          fetch('/api/history').catch(() => null),
          fetch('/api/categories').catch(() => null)
        ]);

        if (apptsRes?.ok) {
          const data = await apptsRes.json();
          if (data && data.length > 0) setAppointments(data);
        }
        if (patsRes?.ok) {
          const data = await patsRes.json();
          // Decodificar el JSON de notas
          if (data && data.length > 0) {
             const parsedPatients = data.map(p => ({
               ...p,
               medicalNotes: (typeof p.notes === 'string' && p.notes.startsWith('{')) ? JSON.parse(p.notes) : { 'default': p.notes || '' }
             }));
             setPatients(parsedPatients);
          }
        }
        if (histRes?.ok) {
          const data = await histRes.json();
          if (data && data.length > 0) setTreatmentHistory(data);
        }
        if (catsRes?.ok) {
          const data = await catsRes.json();
          if (data && data.length > 0) setCategories(data);
        }
      } catch (error) {
        console.warn("D1 no disponible o error de red. Usando LocalStorage.", error);
      }
    }
    loadData();
  }, []);

  // --- FUNCIONES DE SINCRONIZACIÓN CON D1 ---
  const syncToD1 = async (endpoint, data) => {
    try {
      await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn(`Error al guardar en D1 (${endpoint}). Se guardó localmente.`, e);
    }
  };

  const updateAppointment = (apptData) => {
    setAppointments(prev => {
      const isEdit = prev.some(a => a.id === apptData.id);
      return isEdit ? prev.map(a => a.id === apptData.id ? apptData : a) : [...prev, apptData];
    });
    syncToD1('appointments', apptData);
  };

  const updatePatient = (patientData) => {
    setPatients(prev => {
      const isEdit = prev.some(p => p.id === patientData.id);
      return isEdit ? prev.map(p => p.id === patientData.id ? patientData : p) : [...prev, patientData];
    });
    // Preparar carga para D1 (convertir objeto notes a string JSON)
    const payload = { ...patientData, notes: JSON.stringify(patientData.medicalNotes) };
    syncToD1('patients', payload);
  };

  const addTreatmentRecord = (record) => {
    setTreatmentHistory(prev => [record, ...prev]);
    syncToD1('history', record);
  };

  const updateCategoriesList = (cats) => {
    setCategories(cats);
    syncToD1('categories', cats); // El backend espera un array
  };

  // --- REGISTRO DE TURNOS (CLIENTE) ---
  const handleAddAppointment = (newAppt) => {
    const cleanPhone = newAppt.clientPhone.replace(/\D/g, '');
    const existingPatient = patients.find(p => p.phone.replace(/\D/g, '') === cleanPhone);
    let finalPatientId = '';

    if (existingPatient) {
      finalPatientId = existingPatient.id;
      showNotification(`¡Qué bueno verte de nuevo, ${existingPatient.name}! Turno registrado.`);
    } else {
      const newPatientId = `pat_${Date.now()}`;
      finalPatientId = newPatientId;
      const newPatient = {
        id: newPatientId,
        name: newAppt.clientName,
        phone: newAppt.clientPhone,
        email: '',
        medicalNotes: {},
        createdAt: newAppt.date
      };
      updatePatient(newPatient); // Guarda local y en D1
      showNotification(`¡Paciente nueva registrada!`);
    }

    const apptToSave = { ...newAppt, patientId: finalPatientId };
    updateAppointment(apptToSave); // Guarda local y en D1
  };

  return (
    <div className={`font-sans ${COLORS.bg} ${COLORS.textPrimary} min-h-screen relative flex flex-col antialiased selection:bg-neutral-200`}>
      
      {/* Notificaciones (Toast) */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-white border border-[#EAE5DC] shadow-xl rounded-2xl p-4 flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-[#F2EFE9] text-black' : 'bg-red-50 text-red-600'}`}>
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold tracking-tight">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 text-xs font-semibold hover:text-black transition-colors">Cerrar</button>
        </div>
      )}

      {/* Ruteador de Vistas */}
      {currentView === 'client' && (
        <ClientPortal 
          onNavigate={setCurrentView} 
          categories={categories}
          variants={variants}
          professionals={professionals}
          appointments={appointments}
          addAppointment={handleAddAppointment} 
        />
      )}
      
      {currentView === 'login' && (
        <LoginScreen 
          onNavigate={setCurrentView} 
          onLogin={(user) => { setLoggedUser(user); setCurrentView('dashboard'); showNotification(`¡Bienvenido, ${user.name}!`); }} 
          users={users}
          showNotification={showNotification}
        />
      )}
      
      {currentView === 'dashboard' && loggedUser && (
        <StaffDashboard 
          user={loggedUser} 
          onLogout={() => { setLoggedUser(null); setCurrentView('client'); showNotification("Sesión cerrada"); }} 
          
          appointments={appointments} 
          updateAppointment={updateAppointment}
          
          categories={categories}
          updateCategories={updateCategoriesList}
          
          variants={variants}
          setVariants={setVariants}
          
          professionals={professionals}
          setProfessionals={setProfessionals}
          
          users={users}
          setUsers={setUsers}
          
          patients={patients}
          updatePatient={updatePatient}
          
          treatmentHistory={treatmentHistory}
          addTreatmentRecord={addTreatmentRecord}
          
          showNotification={showNotification}
        />
      )}
    </div>
  );
}

// ==========================================
// 1. PORTAL PÚBLICO DEL CLIENTE
// ==========================================
function ClientPortal({ onNavigate, categories, variants, professionals, appointments, addAppointment }) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedProf, setSelectedProf] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [accepted, setAccepted] = useState(false);
  
  const [finishedAppt, setFinishedAppt] = useState(null);

  const activeVariants = useMemo(() => {
    if (!selectedCategory) return [];
    return variants.filter(v => v.categoryId === selectedCategory.id);
  }, [selectedCategory, variants]);

  const availableTimes = useMemo(() => {
    if (!selectedProf || !selectedDate) return [];
    const dayOfWeek = selectedDate.getDay(); 
    const dateStr = formatDate(selectedDate);
    if (selectedProf.blockedDates?.includes(dateStr)) return [];

    const profAvail = selectedProf.availability;
    if (!profAvail || !profAvail.days.includes(dayOfWeek)) return [];

    const startHour = parseInt(profAvail.start.split(':')[0], 10);
    const endHour = parseInt(profAvail.end.split(':')[0], 10);
    const times = [];
    
    for (let h = startHour; h < endHour; h++) {
      const slot1 = `${h.toString().padStart(2, '0')}:00`;
      const slot2 = `${h.toString().padStart(2, '0')}:30`;
      if (!selectedProf.blockedTimeSlots?.includes(`${dateStr} ${slot1}`)) times.push(slot1);
      if (!selectedProf.blockedTimeSlots?.includes(`${dateStr} ${slot2}`)) times.push(slot2);
    }
    return times;
  }, [selectedProf, selectedDate]);

  const handleBook = () => {
    const newAppt = {
      id: `appt_${Date.now()}`,
      clientName: formData.name,
      clientPhone: formData.phone,
      profId: selectedProf.id,
      variantId: selectedVariant.id,
      date: formatDate(selectedDate),
      time: selectedTime,
      status: 'pending',
      customInstructions: '',
      price: selectedVariant.price
    };
    addAppointment(newAppt);
    setFinishedAppt(newAppt);
  };

  const handleReset = () => {
    setSelectedCategory(null); setSelectedVariant(null); setSelectedProf(null); setSelectedDate(null); setSelectedTime(null);
    setFormData({ name: '', phone: '' }); setAccepted(false); setFinishedAppt(null); setStep(1);
  };

  if (finishedAppt) {
    const calendarLink = generateGoogleCalendarUrl(finishedAppt, selectedVariant, selectedProf);
    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-[#FAF9F6]">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm max-w-sm w-full text-center border border-[#EAE5DC] animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#EAE5DC]">
            <CheckCircle className="text-neutral-900 w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="text-xl font-bold mb-3 tracking-tight text-[#1A1A1A]">Cita Solicitada</h2>
          <p className="text-xs text-[#6E6B64] mb-6 leading-relaxed">
            Tu turno para <strong className="text-black">{selectedVariant.name}</strong> con <strong className="text-black">{selectedProf.name}</strong> está en espera para el <strong className="text-black">{selectedDate.toLocaleDateString('es-ES')}</strong> a las <strong className="text-black">{selectedTime} hs</strong>.
          </p>
          <a href={calendarLink} target="_blank" rel="noopener noreferrer" 
             className="flex items-center justify-center w-full bg-blue-50 text-blue-700 py-3.5 rounded-xl font-bold text-xs mb-3 border border-blue-100 hover:bg-blue-100 transition-colors">
            <CalendarIcon className="w-4 h-4 mr-2" /> Agendar en Google Calendar
          </a>
          <button onClick={handleReset} className="w-full bg-black text-white py-4 rounded-xl font-medium text-xs hover:bg-neutral-900 active:scale-[0.98] transition-all">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-24 max-w-md mx-auto w-full px-5">
      {/* Header Fijo */}
      <header className="py-6 flex justify-between items-center border-b border-[#EAE5DC] mb-6">
        <div className="text-left">
          <h1 className="font-bold text-lg tracking-tight flex items-center gap-1.5 text-[#1A1A1A]">
             <Sparkles className="w-4 h-4 text-[#1A1A1A] fill-[#1A1A1A]"/> COWORK STUDIO
          </h1>
          <p className="text-[9px] uppercase tracking-widest text-[#6E6B64] font-bold mt-0.5">Gestión de Turnos</p>
        </div>
        <button onClick={() => onNavigate('login')} className="p-2.5 bg-white border border-[#EAE5DC] rounded-xl text-neutral-700 hover:bg-[#FAF9F6] active:scale-95 transition-all shadow-sm">
          <Lock size={15} />
        </button>
      </header>

      {/* Indicador de Pasos */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#6E6B64]">
            {step === 1 && "1. Elige una categoría"}
            {step === 2 && `2. Servicio de ${selectedCategory?.name}`}
            {step === 3 && "3. Fecha y Hora"}
            {step === 4 && "4. Datos personales"}
          </span>
          <span className="text-xs font-semibold text-black">{step}/4</span>
        </div>
        <div className="h-1 w-full bg-[#EAE5DC] rounded-full overflow-hidden">
          <div className="h-full bg-black rounded-full transition-all duration-300" style={{ width: `${(step/4)*100}%` }} />
        </div>
      </div>

      {/* Contenido Dinámico */}
      <div className="flex-1">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300 text-left">
            <h2 className="text-lg font-bold tracking-tight text-[#1A1A1A]">¿Qué servicio buscas hoy?</h2>
            <div className="space-y-2.5">
              {categories.map(cat => {
                const count = variants.filter(v => v.categoryId === cat.id).length;
                return (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="w-full p-4 rounded-xl border bg-white border-[#EAE5DC] text-left hover:border-black active:scale-[0.99] transition-all flex items-center justify-between shadow-sm group">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${cat.dot || 'bg-neutral-400'}`} />
                      <div>
                        <h3 className="font-semibold text-xs text-black">{cat.name}</h3>
                        <p className="text-[10px] text-[#6E6B64] mt-0.5">{count} tratamientos disponibles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-5 duration-300 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-[#1A1A1A]">{selectedCategory?.name}</h2>
              <button onClick={() => setStep(1)} className="text-[10px] font-semibold text-[#6E6B64] flex items-center bg-white border border-[#EAE5DC] px-3 py-1.5 rounded-lg hover:text-black transition-colors"><ArrowLeft className="w-3 mr-1"/> Volver</button>
            </div>
            <div className="space-y-2.5">
              {activeVariants.map(variant => {
                const prof = professionals.find(p => p.id === variant.profId);
                return (
                  <button key={variant.id} onClick={() => { setSelectedVariant(variant); setSelectedProf(prof); setStep(3); }} className="w-full p-5 bg-white rounded-xl border border-[#EAE5DC] hover:border-black text-left active:scale-[0.99] transition-all flex flex-col space-y-3 shadow-sm">
                    <div className="flex justify-between items-start w-full">
                      <div className="space-y-1 pr-4">
                        <h3 className="font-bold text-xs text-black">{variant.name}</h3>
                        <p className="text-[11px] text-[#6E6B64] leading-relaxed">{variant.description}</p>
                      </div>
                      <span className="font-semibold text-xs text-black whitespace-nowrap bg-neutral-50 px-2 py-1 rounded-md">${variant.price.toLocaleString()}</span>
                    </div>
                    <div className="pt-2.5 border-t border-[#FAF9F6] flex items-center justify-between text-[10px] text-[#6E6B64] w-full">
                      <span className="font-medium">🕒 {variant.duration} minutos</span>
                      {prof && <span className="font-semibold bg-neutral-50 border border-[#EAE5DC] px-2 py-0.5 rounded-full text-black">👩‍⚕️ {prof.name}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-right-5 duration-300 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-[#1A1A1A]">Fecha y hora</h2>
              <button onClick={() => setStep(2)} className="text-[10px] font-semibold text-[#6E6B64] flex items-center bg-white border border-[#EAE5DC] px-3 py-1.5 rounded-lg hover:text-black transition-colors"><ArrowLeft className="w-3 mr-1"/> Volver</button>
            </div>

            <InteractiveCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} appointments={appointments} />

            {selectedDate && (
              <div className="space-y-3 pt-4 border-t border-[#EAE5DC] animate-in fade-in">
                <h3 className="font-bold text-[9px] uppercase tracking-widest text-[#6E6B64]">Horas Disponibles</h3>
                <div className="grid grid-cols-3 gap-2">
                  {availableTimes.map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)} className={`py-2.5 rounded-xl font-semibold text-xs transition-all border ${selectedTime === time ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-[#EAE5DC] hover:bg-neutral-50'}`}>
                      {time} hs
                    </button>
                  ))}
                </div>
                {availableTimes.length > 0 && (
                  <button disabled={!selectedTime} onClick={() => setStep(4)} className="w-full mt-4 bg-black disabled:bg-neutral-200 disabled:text-neutral-400 text-white py-3.5 rounded-xl font-semibold text-xs transition-all active:scale-[0.98]">
                    Continuar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in slide-in-from-right-5 duration-300 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-[#1A1A1A]">Confirmación</h2>
              <button onClick={() => setStep(3)} className="text-[10px] font-semibold text-[#6E6B64] flex items-center bg-white border border-[#EAE5DC] px-3 py-1.5 rounded-lg hover:text-black transition-colors"><ArrowLeft className="w-3 mr-1"/> Volver</button>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#EAE5DC] space-y-2.5 text-xs shadow-sm">
              <div className="flex justify-between"><span className="text-[#6E6B64]">Servicio:</span> <span className="font-semibold text-black">{selectedVariant?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#6E6B64]">Especialista:</span> <span className="font-semibold text-black">{selectedProf?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#6E6B64]">Fecha y Hora:</span> <span className="font-semibold text-black">{selectedDate?.toLocaleDateString('es-ES')} a las {selectedTime} hs</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Nombre Completo</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-white border border-[#EAE5DC] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Móvil (WhatsApp)</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-white border border-[#EAE5DC] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-[#EAE5DC] space-y-3">
              <div className="flex space-x-2">
                <ShieldAlert className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
                <p className="text-[10px] text-neutral-600 leading-normal font-medium">{CLINIC_POLICY}</p>
              </div>
              <label className="flex items-center space-x-2.5 cursor-pointer p-2 bg-white rounded-lg border border-[#EAE5DC]">
                <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="w-3.5 h-3.5 text-black border-neutral-300 rounded focus:ring-black cursor-pointer" />
                <span className="text-[10px] font-bold text-neutral-900">Acepto la política de asistencia</span>
              </label>
            </div>

            <button disabled={!formData.name || !formData.phone || !accepted} onClick={handleBook} className="w-full bg-black disabled:bg-neutral-200 disabled:text-neutral-400 text-white py-3.5 rounded-xl font-semibold text-xs transition-all active:scale-[0.98]">
              Confirmar Pre-Reserva
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- CALENDARIO INTERACTIVO ---
function InteractiveCalendar({ selectedDate, onSelectDate, appointments }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) setCurrentMonth(newMonth);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null); 
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const isPast = (d) => d && d < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-[#EAE5DC] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[#FAF9F6] text-neutral-800 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
        <h3 className="font-bold text-xs text-[#1A1A1A] uppercase tracking-wider">{['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[#FAF9F6] text-neutral-800 transition-colors"><ChevronRight className="w-4 h-4"/></button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
          <div key={i} className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="h-9"></div>;
          const disabled = isPast(date) || date.getDay() === 0; 
          const selected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
          return (
            <button 
              key={idx} disabled={disabled} onClick={() => onSelectDate(date)}
              className={`h-9 w-full rounded-lg flex items-center justify-center text-xs transition-all relative
                ${disabled ? 'text-gray-300 cursor-not-allowed opacity-30' : 'border border-transparent hover:bg-neutral-100'}
                ${selected ? 'bg-black text-white font-bold scale-[1.02]' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 2. PANTALLA DE LOGIN (STAFF)
// ==========================================
function LoginScreen({ onNavigate, onLogin, users, showNotification }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = users[username.toLowerCase().trim()];
    if (user && user.password === password) onLogin(user);
    else showNotification("Credenciales incorrectas", "error");
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-5 max-w-sm mx-auto w-full py-12 animate-in fade-in duration-300 text-left">
      <button onClick={() => onNavigate('client')} className="mb-6 text-[10px] font-bold text-[#6E6B64] flex items-center bg-white border border-[#EAE5DC] px-3 py-1.5 rounded-lg w-max hover:text-black transition-colors"><ArrowLeft className="w-3.5 mr-1"/> Volver a la web</button>
      
      <div className="bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-sm">
        <div className="text-center mb-6">
          <h1 className="font-bold text-lg tracking-tight">Acceso Staff</h1>
          <p className="text-[9px] font-bold text-[#6E6B64] uppercase tracking-widest mt-0.5">Módulo de Autenticación</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Usuario</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-semibold text-xs active:scale-95 transition-all mt-2">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. DASHBOARD PRIVADO (STAFF & ADMIN)
// ==========================================
function StaffDashboard({ 
  user, onLogout, 
  appointments, updateAppointment, 
  categories, updateCategories, 
  variants, setVariants, 
  professionals, setProfessionals, 
  users, setUsers,
  patients, updatePatient,
  treatmentHistory, addTreatmentRecord,
  showNotification 
}) {
  const isManager = user.role === 'manager';
  const profId = isManager ? null : user.id;

  const [activeTab, setActiveTab] = useState('agenda'); 
  const [viewDate, setViewDate] = useState(formatDate(today));
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Estados modales de Ficha de Pacientes
  const [viewHistoryPatient, setViewHistoryPatient] = useState(null);
  const [editPatientInfo, setEditPatientInfo] = useState(null);
  const [addEvolModal, setAddEvolModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAppointments = useMemo(() => {
    let filtered = appointments.filter(a => a.date === viewDate);
    if (!isManager && profId) filtered = filtered.filter(a => a.profId === profId);
    return filtered.sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, viewDate, isManager, profId]);

  const pendingAppointments = useMemo(() => appointments.filter(a => a.status === 'pending' && (isManager || a.profId === profId)), [appointments, isManager, profId]);
  const dayRevenue = useMemo(() => filteredAppointments.reduce((sum, a) => sum + (a.status !== 'cancelled' ? a.price : 0), 0), [filteredAppointments]);

  const currentProfObj = useMemo(() => isManager ? null : professionals.find(p => p.id === user.id), [professionals, user, isManager]);

  const sendStaffDailySchedule = () => {
    if (!currentProfObj) return;
    let agendaText = `📢 *AGENDA DIARIA DE TURNOS* 📢\n\n🗓️ *Fecha:* ${viewDate}\n👩‍⚕️ *Especialista:* ${currentProfObj.name}\n\n`;
    if (filteredAppointments.length === 0) {
      agendaText += `No posees turnos agendados para este día.`;
    } else {
      filteredAppointments.forEach((a, idx) => {
        const variant = variants.find(v => v.id === a.variantId);
        agendaText += `${idx + 1}. ⏰ *${a.time} hs* - ${a.clientName}\n🔹 *Tratamiento:* ${variant?.name}\n🔹 *Estado:* ${a.status === 'confirmed' ? '✅ Confirmado' : '⏳ Pendiente'}\n\n`;
      });
    }
    const phone = currentProfObj.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(agendaText)}`, '_blank');
  };

  const handleUpdatePatientInfo = (id, newNote, updatedEmail) => {
    const p = patients.find(x => x.id === id);
    if(p) {
        // Guarda la nota en el key del profesional (privacidad)
        const updatedNotes = { ...(p.medicalNotes || {}), [user.id]: newNote };
        updatePatient({ ...p, email: updatedEmail, medicalNotes: updatedNotes });
        showNotification("Ficha clínica actualizada");
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-24 max-w-md mx-auto w-full px-5 pt-4 text-left">
      <header className="py-4 flex justify-between items-center border-b border-[#EAE5DC] mb-4">
        <div className="flex items-center space-x-2">
          <button onClick={() => { activeTab !== 'agenda' ? setActiveTab('agenda') : onLogout() }} className="p-2 bg-white border border-[#EAE5DC] rounded-xl text-[#6E6B64] hover:text-black transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-left">
            <h2 className="text-base font-bold tracking-tight text-black">Control Studio</h2>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#6E6B64] mt-0.5">{user.name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl active:scale-95 transition-all">
          <LogOut size={16} />
        </button>
      </header>

      {/* Navegación Interna */}
      <div className="flex space-x-2 overflow-x-auto pb-3 mb-3 border-b border-[#EAE5DC] no-scrollbar">
        <button onClick={() => setActiveTab('agenda')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'agenda' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
          📅 Turnos
        </button>
        {!isManager && (
          <button onClick={() => setActiveTab('pacientes')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'pacientes' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'} flex items-center space-x-1`}>
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> <span>Fichas Clínicas</span>
          </button>
        )}
        <button onClick={() => setActiveTab('pending_broadcast')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'pending_broadcast' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
          Notificaciones ({pendingAppointments.length})
        </button>
        {isManager && (
          <button onClick={() => setActiveTab('categories')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'categories' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
            Categorías
          </button>
        )}
        <button onClick={() => setActiveTab('treatments')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'treatments' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
          Servicios
        </button>
        {!isManager && (
          <button onClick={() => setActiveTab('availability')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'availability' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
            Mi Horario
          </button>
        )}
        {!isManager && (
          <button onClick={() => setActiveTab('messages')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'messages' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
            Mensajes
          </button>
        )}
        {isManager && (
          <button onClick={() => setActiveTab('staff')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'staff' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
            Staff
          </button>
        )}
        {isManager && (
          <button onClick={() => setActiveTab('general_calendar')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'general_calendar' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
            Semanal
          </button>
        )}
      </div>

      <div className="flex-1">
        {activeTab === 'agenda' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="p-2.5 bg-white border border-[#EAE5DC] rounded-xl font-bold text-xs" />
                <div className="text-right">
                  <span className="text-[9px] font-bold text-[#6E6B64] block uppercase">Total estimado</span>
                  <span className="font-extrabold text-sm text-black">${dayRevenue.toLocaleString()}</span>
                </div>
              </div>
              {!isManager && currentProfObj && (
                <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#EAE5DC] flex justify-between items-center text-xs shadow-sm">
                  <span className="font-semibold text-black">Enviar agenda al celular:</span>
                  <button onClick={sendStaffDailySchedule} className="bg-black text-white font-semibold py-1.5 px-3 rounded-lg text-[10px] flex items-center space-x-1.5">
                     <MessageCircle className="w-3.5 h-3.5" /> <span>Compartir</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-[#EAE5DC] text-gray-400 space-y-2 shadow-sm">
                  <CalendarDays className="w-8 h-8 mx-auto text-neutral-300 stroke-[1.5]" />
                  <p className="text-xs font-bold text-neutral-600">No hay turnos registrados</p>
                </div>
              ) : (
                filteredAppointments.map(appt => {
                  const variant = variants.find(v => v.id === appt.variantId);
                  const prof = professionals.find(p => p.id === appt.profId);
                  const patientObj = patients.find(p => p.id === appt.patientId);
                  const hasNote = patientObj?.medicalNotes?.[user.id] && patientObj.medicalNotes[user.id].trim() !== '';

                  const statusMap = {
                    pending: { label: 'Pendiente', color: 'bg-amber-50 text-amber-800 border-amber-100' },
                    confirmed: { label: 'Confirmado', color: 'bg-neutral-50 text-black border-neutral-200' },
                    completed: { label: 'Atendido', color: 'bg-green-50 text-green-800 border-green-100' },
                    cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-100' },
                  };
                  const statusInfo = statusMap[appt.status] || statusMap.pending;

                  return (
                    <div key={appt.id} className="p-4 bg-white rounded-xl border border-[#EAE5DC] hover:border-black active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer shadow-sm animate-in fade-in"
                         onClick={() => setSelectedAppt({ ...appt, variant, prof })}>
                      <div className="space-y-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs">{appt.time} hs</span>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase border ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                        <h4 className="font-bold text-xs text-black flex items-center space-x-1">
                          <span>{appt.clientName}</span>
                          {!isManager && hasNote && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Tiene observaciones clínicas tuyas" />}
                        </h4>
                        <p className="text-[10px] text-gray-500">{variant?.name || 'Tratamiento'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 font-bold" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* RESTO DE PESTAÑAS (COMPONENTE MODULAR) */}
        {activeTab === 'pacientes' && !isManager && (
          <PatientsTabView user={user} patients={patients} treatmentHistory={treatmentHistory} appointments={appointments} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setEditPatientInfo={setEditPatientInfo} setViewHistoryPatient={setViewHistoryPatient} />
        )}
        {activeTab === 'categories' && isManager && (
          <CategoriesTabView categories={categories} setCategories={updateCategories} variants={variants} showNotification={showNotification} />
        )}
        {activeTab === 'pending_broadcast' && (
          <PendingBroadcastView pendingAppointments={pendingAppointments} variants={variants} professionals={professionals} showNotification={showNotification} />
        )}
        {activeTab === 'treatments' && (
          <TreatmentsTabView user={user} variants={variants} setVariants={setVariants} professionals={professionals} categories={categories} showNotification={showNotification} />
        )}
        {activeTab === 'staff' && isManager && (
          <StaffTabView professionals={professionals} setProfessionals={setProfessionals} users={users} setUsers={setUsers} showNotification={showNotification} />
        )}
        {activeTab === 'availability' && !isManager && (
          <AvailabilityTabView prof={currentProfObj} setProfessionals={setProfessionals} showNotification={showNotification} />
        )}
        {activeTab === 'messages' && !isManager && (
          <MessageTemplatesView prof={currentProfObj} setProfessionals={setProfessionals} showNotification={showNotification} />
        )}
        {activeTab === 'general_calendar' && isManager && (
          <GeneralCalendarView appointments={appointments} professionals={professionals} variants={variants} />
        )}

      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#EAE5DC] py-4 px-8 flex justify-around items-center z-40 max-w-md mx-auto">
        <button onClick={() => setActiveTab('agenda')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'agenda' ? 'text-black' : 'text-neutral-300'}`}>
          <CalendarDays className="w-5 h-5" /> <span className="text-[8px] font-bold uppercase tracking-widest">Hoy</span>
        </button>
        {!isManager && (
          <button onClick={() => setActiveTab('pacientes')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'pacientes' ? 'text-black' : 'text-neutral-300'}`}>
            <HeartPulse className="w-5 h-5 text-rose-400" /> <span className="text-[8px] font-bold uppercase tracking-widest">Fichas</span>
          </button>
        )}
        <button onClick={() => setActiveTab('pending_broadcast')} className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'pending_broadcast' ? 'text-black' : 'text-neutral-300'}`}>
          <MessageCircle className="w-5 h-5" /> <span className="text-[8px] font-bold uppercase tracking-widest">Avisos</span>
          {pendingAppointments.length > 0 && <span className="absolute -top-1 -right-2 bg-black text-white font-black text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">{pendingAppointments.length}</span>}
        </button>
        {isManager ? (
          <button onClick={() => setActiveTab('categories')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'categories' ? 'text-black' : 'text-neutral-300'}`}>
            <Tag className="w-5 h-5" /> <span className="text-[8px] font-bold uppercase tracking-widest">Secciones</span>
          </button>
        ) : (
          <button onClick={() => setActiveTab('availability')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'availability' ? 'text-black' : 'text-neutral-300'}`}>
            <Clock className="w-5 h-5" /> <span className="text-[8px] font-bold uppercase tracking-widest">Horarios</span>
          </button>
        )}
      </footer>

      {selectedAppt && (
        <AppointmentDetailModal 
          user={user}
          appt={selectedAppt} 
          onClose={() => setSelectedAppt(null)} 
          onSave={updateAppointment} 
          isManager={isManager} 
          onCompleteAndAddEvol={(apptData) => {
            updateAppointment({ ...apptData, status: 'completed' });
            setSelectedAppt(null);
            setAddEvolModal({
              patientId: apptData.patientId, appointmentId: apptData.id, profId: apptData.profId, treatmentName: apptData.variant?.name || 'Tratamiento Especial', notes: '', date: apptData.date
            });
          }}
          patients={patients}
        />
      )}

      {/* MODAL AGREGAR EVOLUCIÓN */}
      {addEvolModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#EAE5DC] w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-gray-150">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#6E6B64] flex items-center space-x-1">
                <Sparkles className="w-4 h-4 text-amber-400" /> <span>Evolución de Sesión</span>
              </h4>
              <button onClick={() => setAddEvolModal(null)} className="p-1 hover:bg-gray-100 rounded-full"><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-1 bg-amber-50/50 p-3 rounded-xl text-[10px] text-amber-800">
              <p className="font-bold">Paciente: {patients.find(p => p.id === addEvolModal.patientId)?.name}</p>
              <p>Servicio: <strong>{addEvolModal.treatmentName}</strong></p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-500 block">Observaciones Clínicas / Notas</label>
              <textarea rows={5} placeholder="Reporte del tratamiento aplicado..." value={addEvolModal.notes} onChange={(e) => setAddEvolModal({ ...addEvolModal, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-black resize-none" />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-150">
              <button onClick={() => setAddEvolModal(null)} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold">Descartar</button>
              <button onClick={() => { if (!addEvolModal.notes.trim()) return; addTreatmentRecord(addEvolModal); setAddEvolModal(null); showNotification("Evolución guardada"); }} disabled={!addEvolModal.notes.trim()} className="px-5 py-2 bg-black text-white rounded-xl text-xs font-bold disabled:opacity-50">Guardar Notas</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE HISTORIAL (LECTURA) */}
      {viewHistoryPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#EAE5DC] w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col text-left">
            <div className="flex justify-between items-center pb-2 border-b border-gray-150">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600">Historial Clínico Permanente</h4>
                <h3 className="text-md font-extrabold text-black mt-0.5">{viewHistoryPatient.name}</h3>
              </div>
              <button onClick={() => setViewHistoryPatient(null)} className="p-1 hover:bg-gray-100 rounded-full"><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
              <span className="text-[8px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">Mis Notas Privadas / Alergias</span>
              <p className="text-[10px] text-rose-950 mt-1.5 font-medium leading-relaxed italic">"{viewHistoryPatient.medicalNotes?.[user.id] || 'Sin notas tuyas declaradas.'}"</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sesiones y Evoluciones</h5>
              {treatmentHistory.filter(h => h.patientId === viewHistoryPatient.id).length > 0 ? (
                treatmentHistory.filter(h => h.patientId === viewHistoryPatient.id).sort((a,b) => b.date.localeCompare(a.date)).map((record) => {
                  const prof = professionals.find(p => p.id === record.profId);
                  const isMyNote = record.profId === user.id;
                  return (
                    <div key={record.id} className={`border rounded-xl p-3 space-y-2 relative ${isMyNote ? 'bg-white border-black' : 'bg-[#F9F8F6] border-[#EAE5DC]'}`}>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-extrabold text-black">{record.treatmentName}</span>
                        <span className="text-[9px] text-[#7A7571] font-bold">📅 {record.date}</span>
                      </div>
                      <p className={`text-[10px] leading-relaxed p-2.5 rounded-lg border whitespace-pre-wrap ${isMyNote ? 'text-black bg-neutral-50 border-neutral-200 font-medium' : 'text-[#6E6B64] bg-white border-gray-100'}`}>
                        {record.notes}
                      </p>
                      <div className="text-[8px] text-right text-gray-400">Especialista: <strong>{prof?.name || 'Staff'}</strong></div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl space-y-2">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-[10px] text-gray-400">No hay tratamientos históricos cargados.</p>
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-gray-150 flex justify-end">
              <button onClick={() => setViewHistoryPatient(null)} className="px-5 py-2 bg-black text-white rounded-xl text-xs font-bold">Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL: EDITAR PACIENTE (NOTAS PRIVADAS) */}
      {editPatientInfo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#EAE5DC] w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl text-left">
            <div className="flex justify-between items-center pb-2 border-b border-gray-150">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#6E6B64]">Editar Ficha del Paciente</h4>
              <button onClick={() => setEditPatientInfo(null)} className="p-1 hover:bg-gray-100 rounded-full"><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold uppercase text-gray-500">Nombre del Paciente</label>
                <input type="text" value={editPatientInfo.name} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-500" />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-gray-500">Email de Contacto</label>
                <input type="email" value={editPatientInfo.email || ''} onChange={(e) => setEditPatientInfo({ ...editPatientInfo, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black" />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-rose-700 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> <span>Tus Notas Clínicas Privadas</span>
                </label>
                <textarea rows={4} value={editPatientInfo.medicalNotes?.[user.id] || ''} onChange={(e) => setEditPatientInfo({ ...editPatientInfo, medicalNotes: { ...editPatientInfo.medicalNotes, [user.id]: e.target.value } })} placeholder="Alergia al esmalte acrílico, etc..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-black resize-none" />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-150">
              <button onClick={() => setEditPatientInfo(null)} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={() => { handleUpdatePatientInfo(editPatientInfo.id, editPatientInfo.medicalNotes[user.id], editPatientInfo.email); setEditPatientInfo(null); }} className="px-5 py-2 bg-black text-white rounded-xl text-xs font-bold">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// SUBVISTAS DE PESTAÑAS (TABS)
// ==========================================

function PatientsTabView({ user, patients, treatmentHistory, appointments, searchQuery, setSearchQuery, setEditPatientInfo, setViewHistoryPatient }) {
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(query) || (p.phone && p.phone.includes(query)));
  }, [patients, searchQuery]);

  return (
    <div className="space-y-4 text-left animate-in fade-in duration-300">
      <div className="bg-white border border-[#EAE5DC] rounded-xl p-4 flex flex-col gap-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o móvil..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black" />
        </div>
        <div className="text-[10px] text-gray-500 font-medium text-right">Total de fichas: <strong className="text-black">{patients.length}</strong></div>
      </div>
      <div className="space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-8 bg-white border border-[#EAE5DC] rounded-xl text-xs text-[#6E6B64]">No se encontraron pacientes para la búsqueda.</div>
        ) : (
          filteredPatients.map(patient => {
            const history = treatmentHistory.filter(h => h.patientId === patient.id);
            const activeAppts = appointments.filter(a => a.patientId === patient.id && (a.status === 'confirmed' || a.status === 'pending'));
            const myNote = patient.medicalNotes?.[user.id] || 'Sin contraindicaciones declaradas.';

            return (
              <div key={patient.id} className="p-4 bg-white border border-[#EAE5DC] rounded-xl space-y-3.5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-xs text-black">{patient.name}</h4>
                    <p className="text-[10px] text-gray-500 flex items-center space-x-1.5 mt-0.5"><Phone className="w-3.5 h-3.5 text-gray-400" /><span>{patient.phone}</span></p>
                  </div>
                  <span className="text-[8px] font-bold bg-neutral-100 text-neutral-500 px-2.5 py-0.5 rounded-full uppercase">Alta: {patient.createdAt}</span>
                </div>
                <div className="bg-rose-50/50 border border-rose-100/50 p-3 rounded-lg">
                  <div className="flex items-center space-x-1 text-rose-800 text-[9px] font-bold uppercase tracking-wider mb-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> <span>Mis Notas Privadas & Alergias</span>
                  </div>
                  <p className="text-[10px] text-rose-950 font-medium italic">"{myNote}"</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500">
                  <div className="bg-neutral-50 p-2 rounded-lg text-center font-medium">🔬 Historial: <strong className="text-black">{history.length} sesiones</strong></div>
                  <div className="bg-neutral-50 p-2 rounded-lg text-center font-medium">📅 Activos: <strong className="text-black">{activeAppts.length} turnos</strong></div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-dashed border-[#EAE5DC]">
                  <button onClick={() => setEditPatientInfo(patient)} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-[#1A1A1A] rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-colors"><Edit3 className="w-3.5 h-3.5" /> <span>Editar Ficha</span></button>
                  <button onClick={() => setViewHistoryPatient(patient)} className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 shadow-sm active:scale-95 transition-all"><ClipboardList className="w-3.5 h-3.5 text-amber-300" /> <span>Evolución ({history.length})</span></button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CategoriesTabView({ categories, setCategories, variants, showNotification }) {
  const [name, setName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => { setName(''); setSelectedColorIdx(0); setEditingCategory(null); setShowForm(false); };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!name.trim()) return showNotification("Especifica un nombre", "error");
    const palette = PALETTE_OPTIONS[selectedColorIdx];
    
    let newCats;
    if (editingCategory) {
      newCats = categories.map(c => c.id === editingCategory.id ? { ...c, name: name.trim(), dot: palette.dot } : c);
      showNotification("Categoría modificada");
    } else {
      newCats = [...categories, { id: `cat_${Date.now()}`, name: name.trim(), dot: palette.dot }];
      showNotification("Nueva categoría integrada");
    }
    setCategories(newCats);
    resetForm();
  };

  const handleStartEdit = (cat) => {
    setEditingCategory(cat); setName(cat.name);
    const colorIdx = PALETTE_OPTIONS.findIndex(p => p.dot === cat.dot);
    setSelectedColorIdx(colorIdx >= 0 ? colorIdx : 0);
    setShowForm(true);
  };

  const handleDeleteCategory = (id) => {
    if (variants.some(v => v.categoryId === id)) return showNotification("No se puede eliminar. Hay servicios vinculados.", "error");
    setCategories(categories.filter(c => c.id !== id));
    showNotification("Categoría eliminada");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-base text-black">Categorías de Servicios</h3>
          <p className="text-[10px] text-[#6E6B64] font-medium">Gestiona las agrupaciones.</p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold flex items-center space-x-1"><Plus className="w-3.5 h-3.5" /> <span>{showForm ? 'Cancelar' : 'Añadir'}</span></button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveCategory} className="bg-white p-4 rounded-xl border border-[#EAE5DC] space-y-3 shadow-sm">
          <h4 className="font-bold text-xs uppercase tracking-wider text-black">{editingCategory ? "Modificar" : "Añadir"} Categoría</h4>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Nombre de Categoría</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Color Distintivo</label>
            <div className="grid grid-cols-5 gap-2">
              {PALETTE_OPTIONS.map((p, idx) => (
                <button type="button" key={p.id} onClick={() => setSelectedColorIdx(idx)} className={`w-7 h-7 rounded-full ${p.dot} border-2 transition-all mx-auto ${selectedColorIdx === idx ? 'border-black scale-110' : 'border-transparent'}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={resetForm} className="flex-1 py-2 bg-neutral-100 text-[#6E6B64] rounded-lg font-bold text-xs">Descartar</button>
            <button type="submit" className="flex-1 py-2 bg-black text-white rounded-lg font-bold text-xs">Guardar</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {categories.map(cat => {
          const count = variants.filter(v => v.categoryId === cat.id).length;
          return (
            <div key={cat.id} className="p-3.5 bg-white border border-[#EAE5DC] rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className={`w-3.5 h-3.5 rounded-full ${cat.dot}`} />
                <div><h4 className="font-bold text-xs text-black">{cat.name}</h4><span className="text-[9px] bg-neutral-50 px-2 py-0.5 rounded-md border border-[#EAE5DC] text-neutral-500">{count} servicios</span></div>
              </div>
              <div className="flex items-center space-x-1">
                <button onClick={() => handleStartEdit(cat)} className="p-1.5 text-blue-500 hover:bg-neutral-50 rounded-lg transition-colors"><Edit3 size={13} /></button>
                <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PendingBroadcastView({ pendingAppointments, variants, professionals, showNotification }) {
  const handleSendTemplate = (appt, type) => {
    const prof = professionals.find(p => p.id === appt.profId);
    const variant = variants.find(v => v.id === appt.variantId);
    if (!prof) return showNotification("No se localizó el especialista", "error");
    
    let text = type === 'generic' ? (prof.messageTemplates?.confirmation || "Confirmamos tu turno...") : (prof.messageTemplates?.reminder || "Recordatorio...");
    const [y, m, d] = appt.date.split('-');
    const completedText = text.replace(/{Cliente}/g, appt.clientName).replace(/{Tratamiento}/g, variant?.name || "tratamiento").replace(/{Profesional}/g, prof.name).replace(/{Fecha}/g, `${d}/${m}/${y}`).replace(/{Hora}/g, appt.time);
    window.open(`https://wa.me/${appt.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(completedText)}`, '_blank');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 text-left">
      <div>
        <h3 className="font-bold text-base text-black">Turnos por Confirmar</h3>
        <p className="text-[10px] text-[#6E6B64] font-medium">Envía recordatorios o confirmaciones.</p>
      </div>
      {pendingAppointments.length === 0 ? (
        <div className="p-8 text-center bg-white border border-[#EAE5DC] rounded-xl text-xs text-[#6E6B64] shadow-sm">No existen solicitudes pendientes.</div>
      ) : (
        <div className="space-y-2.5">
          {pendingAppointments.map(appt => {
            const variant = variants.find(v => v.id === appt.variantId);
            const prof = professionals.find(p => p.id === appt.profId);
            return (
              <div key={appt.id} className="p-4 bg-white border border-[#EAE5DC] rounded-xl space-y-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-xs text-black">{appt.clientName}</h4>
                    <p className="text-[10px] text-neutral-500 font-semibold">{appt.date} • {appt.time} hs</p>
                    <p className="text-[10px] text-[#6E6B64] font-medium">{variant?.name}</p>
                    <p className="text-[9px] text-neutral-400 font-semibold mt-0.5">Especialista: {prof?.name}</p>
                  </div>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-50 text-amber-800 border border-amber-100">Pendiente</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-[#FAF9F6]">
                  <button onClick={() => handleSendTemplate(appt, 'generic')} className="py-2 bg-[#25D366] text-white font-bold text-[9px] rounded-lg flex items-center justify-center space-x-1 active:scale-95"><MessageCircle className="w-3.5 h-3.5" /> <span>Confirmación</span></button>
                  <button onClick={() => handleSendTemplate(appt, 'custom')} className="py-2 bg-black text-white font-bold text-[9px] rounded-lg flex items-center justify-center space-x-1 active:scale-95"><Bell className="w-3.5 h-3.5 text-amber-400" /> <span>Recordatorio</span></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TreatmentsTabView({ user, variants, setVariants, professionals, categories, showNotification }) {
  const isManager = user.role === 'manager';
  const [selectedProfId, setSelectedProfId] = useState(isManager ? (professionals[0]?.id || '') : user.id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('60');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const filteredVariants = useMemo(() => variants.filter(v => v.profId === selectedProfId), [variants, selectedProfId]);

  const resetForm = () => { setName(''); setDescription(''); setPrice(''); setDuration('60'); setCategoryId(categories[0]?.id || ''); setSelectedColorIdx(0); setShowAddForm(false); setEditingVariant(null); };

  const handleSaveVariant = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !price || !duration || !categoryId) return showNotification("Completa los parámetros", "error");
    const palette = PALETTE_OPTIONS[selectedColorIdx];
    const newVar = {
        id: editingVariant ? editingVariant.id : `v_${Date.now()}`,
        categoryId, name: name.trim(), description: description.trim(), price: Number(price), duration: Number(duration),
        dot: palette.dot, profId: selectedProfId
    };
    
    if (editingVariant) {
      setVariants(prev => prev.map(v => v.id === newVar.id ? newVar : v));
      showNotification("Tratamiento modificado");
    } else {
      setVariants(prev => [...prev, newVar]);
      showNotification("Tratamiento incorporado");
    }
    resetForm();
  };

  const handleStartEdit = (v) => {
    setEditingVariant(v); setCategoryId(v.categoryId); setName(v.name); setDescription(v.description); setPrice(v.price.toString()); setDuration(v.duration.toString());
    const cIdx = PALETTE_OPTIONS.findIndex(p => p.dot === v.dot); setSelectedColorIdx(cIdx >= 0 ? cIdx : 0); setShowAddForm(true);
  };

  const handleDeleteVariant = (id) => { setVariants(prev => prev.filter(v => v.id !== id)); showNotification("Tratamiento eliminado"); };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-base text-black">Servicios Ofrecidos</h3>
          <p className="text-[10px] text-[#6E6B64] font-medium">Define los servicios de la cartera de turnos.</p>
        </div>
        <button onClick={() => { if (showAddForm) resetForm(); else setShowAddForm(true); }} className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 active:scale-95 transition-all">
          <Plus className="w-3.5 h-3.5" /> <span>{showAddForm ? 'Cancelar' : 'Añadir'}</span>
        </button>
      </div>

      {isManager && (
        <div className="bg-white p-3.5 rounded-xl border border-[#EAE5DC] space-y-1 shadow-sm">
          <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">Filtrar por Profesional</label>
          <select value={selectedProfId} onChange={e => setSelectedProfId(e.target.value)} className="w-full bg-transparent text-xs font-semibold focus:outline-none text-black">
            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSaveVariant} className="bg-white p-4 rounded-xl border border-[#EAE5DC] space-y-3 shadow-sm">
          <h4 className="font-bold text-xs uppercase tracking-wider text-black">{editingVariant ? "Modificar" : "Nuevo"} Servicio</h4>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Área / Categoría</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2.5 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-xs font-bold focus:outline-none">
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Denominación</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-xs focus:outline-none font-semibold text-black" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Descripción</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2.5 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-xs focus:outline-none h-16 resize-none font-medium text-black" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Precio ($)</label>
              <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2.5 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-xs focus:outline-none font-semibold" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Duración (min)</label>
              <input required type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-2.5 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-xs focus:outline-none font-semibold" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Color Identificador</label>
            <div className="grid grid-cols-5 gap-2">
              {PALETTE_OPTIONS.map((p, idx) => <button type="button" key={p.id} onClick={() => setSelectedColorIdx(idx)} className={`w-7 h-7 rounded-full ${p.dot} border-2 transition-all mx-auto ${selectedColorIdx === idx ? 'border-black scale-110' : 'border-transparent'}`} />)}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={resetForm} className="flex-1 py-2 bg-neutral-100 text-[#6E6B64] rounded-lg font-bold text-xs">Descartar</button>
            <button type="submit" className="flex-1 py-2 bg-black text-white rounded-lg font-bold text-xs">Guardar</button>
          </div>
        </form>
      )}

      <div className="space-y-2.5">
        {filteredVariants.length === 0 ? (
          <div className="text-center py-8 bg-white border border-[#EAE5DC] rounded-xl text-xs text-[#6E6B64] shadow-sm">Ningún tratamiento registrado para la cuenta actual.</div>
        ) : (
          filteredVariants.map(v => {
            const cat = categories.find(c => c.id === v.categoryId);
            return (
              <div key={v.id} className="p-4 bg-white rounded-xl border border-[#EAE5DC] flex flex-col space-y-2.5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${v.dot || 'bg-neutral-400'}`} />
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{cat?.name || 'Sección'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button onClick={() => handleStartEdit(v)} className="p-1.5 text-blue-500 hover:bg-neutral-50 rounded-lg transition-colors"><Edit3 size={13} /></button>
                    <button onClick={() => handleDeleteVariant(v.id)} className="p-1.5 text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-xs text-black">{v.name}</h4>
                  <p className="text-[11px] text-[#6E6B64] leading-relaxed">{v.description}</p>
                </div>
                <div className="pt-2 border-t border-[#FAF9F6] flex justify-between items-center text-[10px] font-semibold">
                  <span className="text-[#6E6B64]">🕒 {v.duration} min</span>
                  <span className="text-black font-bold bg-neutral-50 border border-[#EAE5DC] px-2 py-0.5 rounded-md">${v.price.toLocaleString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StaffTabView({ professionals, setProfessionals, users, setUsers, showNotification }) {
  const [name, setName] = useState(''); const [role, setRole] = useState(''); const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const [showForm, setShowForm] = useState(false); const [editingProf, setEditingProf] = useState(null);

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !username.trim() || !password.trim() || !email.trim() || !phone.trim()) return showNotification("Completa los campos", "error");
    const nextId = `p_${Date.now()}`;
    const newProf = { id: nextId, name: name.trim(), role: role.trim(), email: email.trim(), phone: phone.trim(), availability: { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }, blockedDates: [], blockedTimeSlots: [], messageTemplates: {} };
    setProfessionals(prev => [...prev, newProf]);
    setUsers(prev => ({ ...prev, [username.toLowerCase().trim()]: { role: 'professional', id: nextId, password: password.trim(), name: name.trim() } }));
    setName(''); setRole(''); setUsername(''); setPassword(''); setEmail(''); setPhone(''); setShowForm(false); showNotification("Miembro integrado");
  };

  const startEdit = (p) => { const userKey = Object.keys(users).find(key => users[key].id === p.id) || ''; setEditingProf({ ...p, username: userKey, password: users[userKey]?.password || '123' }); };
  const handleDeleteStaff = (id, profName) => { setProfessionals(prev => prev.filter(p => p.id !== id)); const updatedUsers = { ...users }; const userKey = Object.keys(updatedUsers).find(key => updatedUsers[key].id === id); if (userKey) { delete updatedUsers[userKey]; setUsers(updatedUsers); } showNotification(`Staff ${profName} removido`); };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setProfessionals(prev => prev.map(p => p.id === editingProf.id ? { ...p, name: editingProf.name, role: editingProf.role, email: editingProf.email, phone: editingProf.phone } : p));
    const updatedUsers = { ...users };
    const oldKey = Object.keys(updatedUsers).find(key => updatedUsers[key].id === editingProf.id);
    if (oldKey) delete updatedUsers[oldKey];
    updatedUsers[editingProf.username.toLowerCase().trim()] = { role: 'professional', id: editingProf.id, password: editingProf.password, name: editingProf.name };
    setUsers(updatedUsers);
    setEditingProf(null); showNotification("Staff modificado");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 text-left">
      <div className="flex justify-between items-center">
        <div><h3 className="font-bold text-base text-black">Miembros de Staff</h3><p className="text-[10px] text-[#6E6B64]">Acceso y permisos.</p></div>
        {!editingProf && <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 active:scale-95 transition-all"><Plus className="w-3.5 h-3.5" /> <span>Alta</span></button>}
      </div>
      {showForm && !editingProf && (
        <form onSubmit={handleAddStaff} className="bg-white p-4 rounded-xl border border-[#EAE5DC] space-y-3 shadow-sm animate-in slide-in-from-top-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-black">Alta de Especialista</h4>
          <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" placeholder="Nombre (Ej: Dr. Lucas Rivas)" />
          <input required type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" placeholder="Especialidad" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" placeholder="Email" />
            <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" placeholder="Tel/WhatsApp" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" placeholder="Usuario de acceso" />
            <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" placeholder="Contraseña" />
          </div>
          <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold text-xs mt-2">Crear Acceso</button>
        </form>
      )}
      {editingProf && (
        <form onSubmit={handleSaveEdit} className="bg-white p-4 rounded-xl border border-dashed border-gray-400 space-y-3 shadow-sm animate-in zoom-in-95">
          <h4 className="font-bold text-xs uppercase tracking-wider text-black">Editar Profesional</h4>
          <input required type="text" value={editingProf.name} onChange={e => setEditingProf({...editingProf, name: e.target.value})} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs font-semibold text-black focus:outline-none" />
          <input required type="text" value={editingProf.role} onChange={e => setEditingProf({...editingProf, role: e.target.value})} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs font-semibold text-black focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="email" value={editingProf.email} onChange={e => setEditingProf({...editingProf, email: e.target.value})} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" />
            <input required type="tel" value={editingProf.phone} onChange={e => setEditingProf({...editingProf, phone: e.target.value})} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required type="text" value={editingProf.username} onChange={e => setEditingProf({...editingProf, username: e.target.value})} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" />
            <input required type="text" value={editingProf.password} onChange={e => setEditingProf({...editingProf, password: e.target.value})} className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs focus:outline-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setEditingProf(null)} className="flex-1 py-2 bg-neutral-100 text-[#6E6B64] rounded-lg font-bold text-xs">Descartar</button>
            <button type="submit" className="flex-1 py-2 bg-black text-white rounded-lg font-bold text-xs">Guardar</button>
          </div>
        </form>
      )}
      <div className="space-y-2">
        {professionals.map(p => (
          <div key={p.id} className="p-3.5 bg-white rounded-xl border border-[#EAE5DC] flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center font-bold text-xs text-neutral-800">{p.name.charAt(0)}</div>
              <div><h4 className="font-bold text-xs text-black">{p.name}</h4><p className="text-[10px] text-neutral-500">{p.role}</p><p className="text-[9px] text-[#6E6B64] flex items-center mt-1"><Mail className="w-2.5 h-2.5 mr-1" />{p.email || 'Sin Correo'}</p></div>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => startEdit(p)} className="p-2 text-gray-500 hover:bg-neutral-50 rounded-xl transition-colors"><Edit3 size={13} /></button>
              <button onClick={() => handleDeleteStaff(p.id, p.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AvailabilityTabView({ prof, setProfessionals, showNotification }) {
  if (!prof) return null;
  const [startTime, setStartTime] = useState(prof.availability?.start || '09:00');
  const [endTime, setEndTime] = useState(prof.availability?.end || '18:00');
  const [workingDays, setWorkingDays] = useState(prof.availability?.days || [1, 2, 3, 4, 5]);
  const [blockDateStr, setBlockDateStr] = useState('');
  const [blockSlotDate, setBlockSlotDate] = useState('');
  const [blockSlotTime, setBlockSlotTime] = useState('12:00');

  const daysList = [{ value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' }, { value: 3, label: 'Miércoles' }, { value: 4, label: 'Jueves' }, { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' }];
  const toggleDay = (dayVal) => { workingDays.includes(dayVal) ? setWorkingDays(workingDays.filter(d => d !== dayVal)) : setWorkingDays([...workingDays, dayVal].sort()); };

  const saveAvailability = () => { setProfessionals(prev => prev.map(p => p.id === prof.id ? { ...p, availability: { days: workingDays, start: startTime, end: endTime } } : p)); showNotification("Rango modificado"); };
  const handleAddBlockedDate = () => { if (!blockDateStr) return; if (prof.blockedDates?.includes(blockDateStr)) return showNotification("Ya inhabilitada", "error"); setProfessionals(prev => prev.map(p => p.id === prof.id ? { ...p, blockedDates: [...(p.blockedDates || []), blockDateStr] } : p)); setBlockDateStr(''); showNotification("Día bloqueado"); };
  const handleRemoveBlockedDate = (date) => { setProfessionals(prev => prev.map(p => p.id === prof.id ? { ...p, blockedDates: p.blockedDates.filter(d => d !== date) } : p)); showNotification("Día desbloqueado"); };
  const handleAddBlockedTimeSlot = () => { if (!blockSlotDate || !blockSlotTime) return; const combined = `${blockSlotDate} ${blockSlotTime}`; if (prof.blockedTimeSlots?.includes(combined)) return showNotification("Horario ya bloqueado", "error"); setProfessionals(prev => prev.map(p => p.id === prof.id ? { ...p, blockedTimeSlots: [...(p.blockedTimeSlots || []), combined] } : p)); showNotification("Bloqueo programado"); };
  const handleRemoveBlockedTimeSlot = (slot) => { setProfessionals(prev => prev.map(p => p.id === prof.id ? { ...p, blockedTimeSlots: p.blockedTimeSlots.filter(s => s !== slot) } : p)); showNotification("Horario habilitado"); };

  return (
    <div className="space-y-4 text-left animate-in fade-in">
      <div className="bg-white p-4 rounded-xl border border-[#EAE5DC] space-y-4 shadow-sm">
        <div><h3 className="font-bold text-xs uppercase tracking-wider text-black">Parámetros Semanales</h3></div>
        <div className="grid grid-cols-3 gap-2">
          {daysList.map(d => {
            const isChecked = workingDays.includes(d.value);
            return <button key={d.value} onClick={() => toggleDay(d.value)} className={`p-2 rounded-lg text-xs font-bold border transition-all ${isChecked ? 'bg-black text-white border-black' : 'bg-[#FAF9F6] text-neutral-700 border-[#EAE5DC]'}`}>{d.label}</button>;
          })}
        </div>
        <div className="grid grid-cols-2 gap-3"><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs font-bold focus:outline-none" /><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs font-bold focus:outline-none" /></div>
        <button onClick={saveAvailability} className="w-full bg-black text-white py-3 rounded-xl font-bold text-xs hover:bg-neutral-900 active:scale-95 transition-all">Guardar Calendario Base</button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#EAE5DC] space-y-4 shadow-sm">
        <div><h3 className="font-bold text-xs uppercase tracking-wider text-red-700 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Excluir Días Completos</h3></div>
        <div className="flex gap-2">
          <input type="date" value={blockDateStr} onChange={e => setBlockDateStr(e.target.value)} className="flex-1 p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black" />
          <button onClick={handleAddBlockedDate} className="px-4 py-2.5 bg-black text-white text-xs font-semibold rounded-xl active:scale-95 transition-all">Inhabilitar</button>
        </div>
        {prof.blockedDates?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dashed border-[#FAF9F6]">
            {prof.blockedDates.map(date => <span key={date} className="px-2 py-1 bg-neutral-100 border border-[#EAE5DC] text-black rounded-lg text-[10px] font-semibold flex items-center space-x-1"><span>{date}</span><button onClick={() => handleRemoveBlockedDate(date)} className="text-red-500 font-bold ml-1.5 hover:text-red-700">×</button></span>)}
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#EAE5DC] space-y-4 shadow-sm">
        <div><h3 className="font-bold text-xs uppercase tracking-wider text-black flex items-center gap-1"><Clock className="w-4 h-4"/> Bloquear Horas Específicas</h3></div>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={blockSlotDate} onChange={e => setBlockSlotDate(e.target.value)} className="p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs font-bold focus:outline-none" />
          <select value={blockSlotTime} onChange={e => setBlockSlotTime(e.target.value)} className="p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs font-bold focus:outline-none">
            {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(t => <option key={t} value={t}>{t} hs</option>)}
          </select>
        </div>
        <button onClick={handleAddBlockedTimeSlot} className="w-full bg-neutral-100 border border-[#EAE5DC] text-black py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-all">Inhabilitar Horario</button>
        {prof.blockedTimeSlots?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dashed border-[#FAF9F6]">
            {prof.blockedTimeSlots.map(slot => <span key={slot} className="px-2 py-1 bg-neutral-100 border border-[#EAE5DC] text-black rounded-lg text-[10px] font-semibold flex items-center space-x-1"><span>{slot} hs</span><button onClick={() => handleRemoveBlockedTimeSlot(slot)} className="text-red-500 font-bold ml-1.5 hover:text-red-700">×</button></span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageTemplatesView({ prof, setProfessionals, showNotification }) {
  if (!prof) return null;
  const [confirmationMsg, setConfirmationMsg] = useState(prof.messageTemplates?.confirmation || '');
  const [reminderMsg, setReminderMsg] = useState(prof.messageTemplates?.reminder || '');

  const saveTemplates = () => { setProfessionals(prev => prev.map(p => p.id === prof.id ? { ...p, messageTemplates: { confirmation: confirmationMsg, reminder: reminderMsg } } : p)); showNotification("Plantillas actualizadas"); };

  return (
    <div className="space-y-4 bg-white p-5 rounded-xl border border-[#EAE5DC] text-left animate-in fade-in shadow-sm">
      <div><h3 className="font-bold text-xs uppercase tracking-wider text-black">Gestión de Notificaciones</h3><p className="text-[10px] text-[#6E6B64]">Configura el texto de WhatsApp.</p></div>
      <div className="p-3 bg-neutral-50 rounded-xl border border-[#EAE5DC] text-[9px] text-neutral-600 space-y-1"><p className="font-semibold text-black">Palabras clave dinámicas (usar con llaves):</p><p>{`{Cliente}, {Tratamiento}, {Profesional}, {Fecha}, {Hora}`}</p></div>
      <div className="space-y-1.5"><label className="block text-[9px] font-bold uppercase text-[#6E6B64] tracking-wider">Plantilla Confirmación</label><textarea value={confirmationMsg} onChange={e => setConfirmationMsg(e.target.value)} className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs h-24 focus:outline-none resize-none" /></div>
      <div className="space-y-1.5"><label className="block text-[9px] font-bold uppercase text-[#6E6B64] tracking-wider">Plantilla Recordatorio</label><textarea value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs h-24 focus:outline-none resize-none" /></div>
      <button onClick={saveTemplates} className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-xs mt-2 active:scale-95 transition-all">Guardar Configuración</button>
    </div>
  );
}

function GeneralCalendarView({ appointments, professionals, variants }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => { const d = new Date(today); const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1); return new Date(d.setDate(diff)); });
  const weekDays = useMemo(() => { const days = []; for (let i = 0; i < 7; i++) { const d = new Date(currentWeekStart); d.setDate(currentWeekStart.getDate() + i); days.push({ dateStr: formatDate(d), label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }), rawDate: d }); } return days; }, [currentWeekStart]);
  const changeWeek = (direction) => { const next = new Date(currentWeekStart); next.setDate(currentWeekStart.getDate() + (direction * 7)); setCurrentWeekStart(next); };

  return (
    <div className="space-y-4 bg-white p-5 rounded-xl border border-[#EAE5DC] text-left animate-in fade-in shadow-sm">
      <div className="flex justify-between items-center">
        <div><h3 className="font-bold text-xs uppercase tracking-wider text-black flex items-center gap-1.5"><BigCalendar className="w-4 h-4 text-black"/> Calendario Semanal</h3></div>
        <div className="flex space-x-1"><button onClick={() => changeWeek(-1)} className="p-2 bg-neutral-50 border border-[#EAE5DC] rounded-xl hover:bg-neutral-100 transition-all"><ChevronLeft className="w-4 h-4"/></button><button onClick={() => changeWeek(1)} className="p-2 bg-neutral-50 border border-[#EAE5DC] rounded-xl hover:bg-neutral-100 transition-all"><ChevronRight className="w-4 h-4"/></button></div>
      </div>
      <div className="space-y-4 pt-2">
        {weekDays.map(day => {
          const dayAppointments = appointments.filter(a => a.date === day.dateStr && a.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={day.dateStr} className="border-b border-[#FAF9F6] pb-4">
              <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold uppercase tracking-wider text-black bg-neutral-100 px-2.5 py-1 rounded-lg">{day.label}</span><span className="text-[10px] text-[#6E6B64] font-medium">{dayAppointments.length} turnos</span></div>
              {dayAppointments.length === 0 ? <p className="text-[11px] text-gray-400 italic pl-1">Sin turnos agendados.</p> : (
                <div className="space-y-2 pl-1">
                  {dayAppointments.map(appt => {
                    const variant = variants.find(v => v.id === appt.variantId); const prof = professionals.find(p => p.id === appt.profId);
                    return (
                      <div key={appt.id} className="p-2.5 bg-[#FAF9F6] rounded-xl border border-[#EAE5DC] flex flex-col space-y-1 text-xs shadow-xs">
                        <div className="flex justify-between font-bold"><span className="text-black">⏰ {appt.time} hs</span><span className="text-gray-500 uppercase text-[9px]">👤 {prof?.name.split(' ')[0]}</span></div>
                        <div className="flex justify-between text-gray-500 font-semibold"><span>{appt.clientName}</span><span className="text-[10px] text-black font-extrabold">${appt.price.toLocaleString()}</span></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// MODAL DETALLE DE TURNO
// ==========================================
function AppointmentDetailModal({ user, appt, onClose, onSave, isManager, onCompleteAndAddEvol, patients }) {
  const [status, setStatus] = useState(appt.status);
  const [customInstructions, setCustomInstructions] = useState(appt.customInstructions || '');

  const sendWhatsApp = (type = 'confirmation') => {
    const profTemplates = appt.prof?.messageTemplates;
    let text = type === 'confirmation' ? (profTemplates?.confirmation || "Confirmamos...") : (profTemplates?.reminder || "Recordatorio...");
    const [y, m, d] = appt.date.split('-');
    const msg = text.replace(/{Cliente}/g, appt.clientName).replace(/{Tratamiento}/g, appt.variant?.name || "tratamiento").replace(/{Profesional}/g, appt.prof?.name || "especialista").replace(/{Fecha}/g, `${d}/${m}/${y}`).replace(/{Hora}/g, appt.time).replace(/{Indicaciones}/g, customInstructions.trim());
    window.open(`https://wa.me/${appt.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const patientObj = patients.find(p => p.id === appt.patientId);
  const myNote = patientObj?.medicalNotes?.[user.id];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-[2rem] w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 flex flex-col space-y-4 text-left">
        <div className="flex justify-between items-center border-b border-[#EAE5DC] pb-4">
          <div><span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Resumen de Turno</span><h3 className="font-bold text-base text-black">{appt.clientName}</h3></div>
          <button onClick={onClose} className="px-3.5 py-1 bg-neutral-100 rounded-full font-bold text-[10px] text-[#6E6B64] hover:text-black">Cerrar</button>
        </div>

        {!isManager && myNote && myNote !== 'Sin notas médicas registradas aún.' && (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
            <span className="text-[8px] font-bold uppercase tracking-wider text-rose-700 block">⚠️ Tus Notas Privadas</span>
            <p className="text-[10px] text-rose-950 mt-1 italic font-medium">"{myNote}"</p>
          </div>
        )}

        <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#EAE5DC] text-xs space-y-2">
          <div className="flex justify-between"><span className="text-neutral-500">Servicio:</span> <span className="font-bold text-black">{appt.variant?.name}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Profesional:</span> <span className="font-bold text-black">{appt.prof?.name}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Contacto:</span> <span className="font-bold text-black">{appt.clientPhone}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Fecha / Hora:</span> <span className="font-bold text-black">{appt.date} | {appt.time} hs</span></div>
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wider text-[#6E6B64] mb-1">Cambiar Estado</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-3 bg-white border border-[#EAE5DC] rounded-xl text-xs font-bold focus:outline-none">
            <option value="pending">⏳ En Espera</option><option value="confirmed">✅ Confirmar</option><option value="completed">🎉 Atendido / Finalizado</option><option value="cancelled">❌ Cancelar Turno</option>
          </select>
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wider text-[#6E6B64] mb-1">Notas previas</label>
          <textarea value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} placeholder="Ej: Venir con rostro lavado." className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-xs h-16 focus:outline-none resize-none" />
        </div>

        <div className="space-y-2">
          <label className="block text-[9px] font-bold uppercase tracking-wider text-[#6E6B64]">Acción de WhatsApp Directa</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => sendWhatsApp('confirmation')} className="py-2.5 bg-[#25D366] text-white rounded-xl font-bold text-[10px] flex items-center justify-center space-x-1.5 active:scale-95 transition-all"><MessageCircle className="w-3.5 h-3.5" /> <span>Confirmación</span></button>
            <button onClick={() => sendWhatsApp('reminder')} className="py-2.5 bg-black text-white rounded-xl font-bold text-[10px] flex items-center justify-center space-x-1.5 active:scale-95 transition-all"><Bell className="w-3.5 h-3.5 text-yellow-400" /> <span>Recordatorio</span></button>
          </div>
        </div>

        <div className="pt-2 border-t border-[#EAE5DC] flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 bg-neutral-100 text-neutral-500 rounded-xl font-bold text-xs">Descartar</button>
          {status === 'completed' ? (
            <button onClick={() => onCompleteAndAddEvol({ ...appt, status, customInstructions })} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors">Atendido & Evolucionar</button>
          ) : (
            <button onClick={() => onSave({ ...appt, status, customInstructions })} className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-xs">Confirmar Cambios</button>
          )}
        </div>
      </div>
    </div>
  );
}