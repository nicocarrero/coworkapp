import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Phone, CheckCircle, XCircle, 
  ChevronRight, ChevronLeft, DollarSign, Settings, LogOut, 
  MessageCircle, Sparkles, ShieldAlert, ArrowLeft, Search,
  CalendarDays, Users, Lock, Plus, Edit3, Trash2, HeartPulse, Bell, 
  Clock, Mail, Copy, Calendar as BigCalendar, CheckSquare, Eye, AlertCircle,
  Tag, Palette, Link as LinkIcon, FileText, ClipboardList
} from 'lucide-react';


// --- CONFIGURACIÓN DE API (CLOUDFLARE PAGES FUNCTIONS + D1) ---
const API_URL = '/api/sync';

// --- CONFIGURACIÓN ESTÉTICA (Premium Cozy & Minimalist Slate) ---
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

// --- PALETA DE COLORES PARA CATEGORÍAS Y SERVICIOS (10 OPCIONES) ---
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
  
  const formatDT = (d) => {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, ''); 
  };
  
  const title = encodeURIComponent(`Turno: ${variant?.name || 'Servicio'} - ${appt.clientName}`);
  const details = encodeURIComponent(`Cliente: ${appt.clientName}\nTeléfono: ${appt.clientPhone}\nServicio: ${variant?.name}\nEspecialista: ${prof?.name}\n\nGestión de reservas Cosy Cowork.`);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDT(startDate)}/${formatDT(endDate)}&details=${details}`;
};

// --- SEMILLAS DE DATOS INICIALES ---
const INITIAL_CATEGORIES = [
  { id: 'cat_manicura', name: 'Manicura y pedicura', dot: 'bg-rose-400' },
  { id: 'cat_peinados', name: 'Peinados', dot: 'bg-amber-400' },
  { id: 'cat_capilares', name: 'Tratamientos capilares', dot: 'bg-teal-400' },
  { id: 'cat_hidro', name: 'Hidrofacial', dot: 'bg-sky-400' },
  { id: 'cat_laser', name: 'Depilación láser', dot: 'bg-purple-400' },
];

const INITIAL_VARIANTS = [
  { id: 'v1', categoryId: 'cat_manicura', name: 'Manicura Rusa Express', description: 'Limpieza profunda de cutículas, limado y esmaltado semipermanente monocolor.', price: 12000, duration: 45, colorClass: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-400', profId: 'p1' },
  { id: 'v2', categoryId: 'cat_manicura', name: 'Pedicura Spa Premium', description: 'Exfoliación con sales marinas, tratamiento de durezas, de relajación profunda.', price: 18000, duration: 60, colorClass: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-400', profId: 'p1' },
  { id: 'v3', categoryId: 'cat_peinados', name: 'Peinado Evento de Gala', description: 'Recogidos, ondas al agua o semirecogidos ideales para fiestas.', price: 22000, duration: 50, colorClass: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-400', profId: 'p1' },
  { id: 'v4', categoryId: 'cat_capilares', name: 'Nutrición de Keratina', description: 'Tratamiento anti-frizz hidratante profundo que devuelve el brillo.', price: 26000, duration: 75, colorClass: 'bg-teal-50 text-teal-700 border-teal-100', dot: 'bg-teal-400', profId: 'p1' },
  { id: 'v5', categoryId: 'cat_hidro', name: 'Hidrofacial Revitalizante', description: 'Extracción con espátula ultrasónica, infusión de principios activos.', price: 32000, duration: 60, colorClass: 'bg-sky-50 text-sky-700 border-sky-100', dot: 'bg-sky-400', profId: 'p2' },
  { id: 'v6', categoryId: 'cat_laser', name: 'Soprano Ice - Rostro', description: 'Tecnología indolora apta para todo tipo de pieles.', price: 14000, duration: 30, colorClass: 'bg-purple-50 text-purple-700 border-purple-100', dot: 'bg-purple-400', profId: 'p2' },
];

const INITIAL_PROFESSIONALS = [
  { 
    id: 'p1', 
    name: 'Ana Estévez', 
    role: 'Especialista en Uñas y Cabello', 
    email: 'ana.estevez@gmail.com', 
    phone: '5491122223333',
    googleCalendarSynced: true,
    availability: { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' },
    blockedDates: [],
    blockedTimeSlots: [],
    messageTemplates: {
      confirmation: "¡Hola {Cliente}! Tu turno está agendado con éxito para {Tratamiento} con {Profesional} el {Fecha} a las {Hora} hs. ¡Te esperamos!",
      reminder: "Recordatorio: Mañana tienes tu turno de {Tratamiento} a las {Hora} hs. Por favor, asistir puntualmente."
    }
  },
  { 
    id: 'p2', 
    name: 'Dra. Elena Costa', 
    role: 'Dermatóloga & Estética', 
    email: 'elena.costa.derma@gmail.com', 
    phone: '5491144445555',
    googleCalendarSynced: true,
    availability: { days: [2, 4, 6], start: '10:00', end: '19:00' },
    blockedDates: [],
    blockedTimeSlots: [],
    messageTemplates: {
      confirmation: "Estimada {Cliente}, confirmamos su cita de {Tratamiento} con la {Profesional} para el día {Fecha} a las {Hora} hs.",
      reminder: "Indicaciones previas: Recordar no aplicar cremas con ácidos ni exfoliantes la noche anterior a su sesión."
    }
  }
];

const INITIAL_USERS = {
  'admin': { role: 'manager', password: '123', name: 'Manager General' },
  'ana': { role: 'professional', id: 'p1', password: '123', name: 'Ana Estévez' },
  'elena': { role: 'professional', id: 'p2', password: '123', name: 'Dra. Elena Costa' }
};

const INITIAL_PATIENTS = [
  {
    id: 'pat_1',
    name: 'Sofía Lauren',
    phone: '5491123456789',
    email: 'sofia.lauren@gmail.com',
    // Las notas médicas ahora son un objeto donde la clave es el ID del profesional
    medicalNotes: { 'p1': 'Piel sensible con tendencia a la rosácea en mejillas. Evitar productos con fragancias fuertes y alcoholes.', 'p2': '' },
    createdAt: '2026-01-10'
  },
  {
    id: 'pat_2',
    name: 'Valeria Maza',
    phone: '5491198765432',
    email: 'valeria.maza@yahoo.com',
    medicalNotes: { 'p1': '', 'p2': 'Alergia declarada al níquel y esmaltes acrílicos de baja calidad.' },
    createdAt: '2026-02-15'
  }
];

const INITIAL_APPOINTMENTS = [
  { id: 'a1', patientId: 'pat_1', clientName: 'Sofía Lauren', clientPhone: '5491123456789', profId: 'p1', variantId: 'v1', date: formatDate(today), time: '10:00', status: 'confirmed', price: 12000, customInstructions: '' },
  { id: 'a2', patientId: 'pat_2', clientName: 'Valeria Maza', clientPhone: '5491198765432', profId: 'p2', variantId: 'v5', date: formatDate(today), time: '14:00', status: 'pending', price: 32000, customInstructions: 'Traer rostro sin maquillaje previo' }
];

const INITIAL_HISTORY = [
  {
    id: 'h_1',
    patientId: 'pat_1',
    appointmentId: 'a1',
    profId: 'p1',
    treatmentName: 'Manicura Rusa Express',
    notes: 'Tratamiento exitoso. Se retiró cutícula con torno a velocidad mínima. Se utilizó base niveladora hipoalergénica. No presentó molestias.',
    date: formatDate(today)
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState('client'); 
  const [loggedUser, setLoggedUser] = useState(null);
  const [toast, setToast] = useState(null);
  
  // --- ESTADOS NÚCLEO ---
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [variants, setVariants] = useState(INITIAL_VARIANTS);
  const [professionals, setProfessionals] = useState(INITIAL_PROFESSIONALS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [treatmentHistory, setTreatmentHistory] = useState(INITIAL_HISTORY);

  // --- SINCRONIZACIÓN CON CLOUDFLARE D1 (VÍA PAGES FUNCTIONS) ---
  useEffect(() => {
    // Al cargar la app, trae los datos de la base de datos D1
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error("Backend D1 no disponible");
        return res.json();
      })
      .then(data => {
        if (Object.keys(data).length > 0) {
          if (data.categories) setCategories(data.categories);
          if (data.variants) setVariants(data.variants);
          if (data.professionals) setProfessionals(data.professionals);
          if (data.users) setUsers(data.users);
          if (data.patients) setPatients(data.patients);
          if (data.appointments) setAppointments(data.appointments);
          if (data.treatmentHistory) setTreatmentHistory(data.treatmentHistory);
        }
      })
      .catch(err => {
        console.warn("Usando fallback local. Para persistencia real, despliega en Cloudflare:", err);
        const saved = localStorage.getItem('cowork_d1_fallback');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.categories) setCategories(data.categories);
          if (data.variants) setVariants(data.variants);
          if (data.professionals) setProfessionals(data.professionals);
          if (data.users) setUsers(data.users);
          if (data.patients) setPatients(data.patients);
          if (data.appointments) setAppointments(data.appointments);
          if (data.treatmentHistory) setTreatmentHistory(data.treatmentHistory);
        }
      });
  }, []);

  // Función para enviar datos al backend D1
  const updateCloudState = (key, nextValue) => {
    // 1. Enviar a Cloudflare Pages Function (D1)
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: nextValue })
    }).catch(err => console.warn("Error guardando en D1 (Modo Fallback Activo):", err));

    // 2. Fallback de seguridad en LocalStorage (Evita perder datos si hay corte de red)
    setTimeout(() => {
       const currentState = { categories, variants, professionals, users, patients, appointments, treatmentHistory };
       currentState[key] = nextValue;
       localStorage.setItem('cowork_d1_fallback', JSON.stringify(currentState));
    }, 300);
  };

  const setCategoriesCloud = (action) => setCategories(prev => { const next = typeof action === 'function' ? action(prev) : action; updateCloudState('categories', next); return next; });
  const setVariantsCloud = (action) => setVariants(prev => { const next = typeof action === 'function' ? action(prev) : action; updateCloudState('variants', next); return next; });
  const setProfessionalsCloud = (action) => setProfessionals(prev => { const next = typeof action === 'function' ? action(prev) : action; updateCloudState('professionals', next); return next; });
  const setUsersCloud = (action) => setUsers(prev => { const next = typeof action === 'function' ? action(prev) : action; updateCloudState('users', next); return next; });
  const setPatientsCloud = (action) => setPatients(prev => { const next = typeof action === 'function' ? action(prev) : action; updateCloudState('patients', next); return next; });
  const setAppointmentsCloud = (action) => setAppointments(prev => { const next = typeof action === 'function' ? action(prev) : action; updateCloudState('appointments', next); return next; });
  const setTreatmentHistoryCloud = (action) => setTreatmentHistory(prev => { const next = typeof action === 'function' ? action(prev) : action; updateCloudState('treatmentHistory', next); return next; });

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- REGISTRO INTELIGENTE DE PACIENTES AL RESERVAR ---
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
        medicalNotes: {}, // Inicializa el objeto de notas
        createdAt: newAppt.date
      };
      setPatientsCloud(prev => [...prev, newPatient]);
      showNotification(`¡Paciente nueva registrada! Ficha clínica abierta para ${newAppt.clientName}.`);
    }

    const apptToSave = {
      ...newAppt,
      patientId: finalPatientId
    };

    setAppointmentsCloud(prev => [...prev, apptToSave]);
  };

  return (
    <div className={`font-sans ${COLORS.bg} ${COLORS.textPrimary} min-h-screen relative flex flex-col antialiased selection:bg-neutral-200`}>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-white border border-[#EAE5DC] shadow-xl rounded-2xl p-4 flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-[#F2EFE9] text-black' : 'bg-red-50 text-red-600'}`}>
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold tracking-tight">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 text-sm font-semibold hover:text-black transition-colors">Cerrar</button>
        </div>
      )}

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
          onLogin={(user) => { 
            setLoggedUser(user); 
            setCurrentView('dashboard'); 
            showNotification(`¡Bienvenido, ${user.name}!`);
          }} 
          users={users}
          showNotification={showNotification}
        />
      )}
      
      {currentView === 'dashboard' && loggedUser && (
        <StaffDashboard 
          user={loggedUser} 
          onLogout={() => { 
            setLoggedUser(null); 
            setCurrentView('client'); 
            showNotification("Sesión cerrada");
          }} 
          appointments={appointments} 
          setAppointments={setAppointmentsCloud}
          categories={categories}
          setCategories={setCategoriesCloud}
          variants={variants}
          setVariants={setVariantsCloud}
          professionals={professionals}
          setProfessionals={setProfessionalsCloud}
          users={users}
          setUsers={setUsersCloud}
          patients={patients}
          setPatients={setPatientsCloud}
          treatmentHistory={treatmentHistory}
          setTreatmentHistory={setTreatmentHistoryCloud}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}

// ==========================================
// 1. PORTAL PÚBLICO DEL CLIENTE (MÓVIL-FIRST)
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

    if (selectedProf.blockedDates && selectedProf.blockedDates.includes(dateStr)) {
      return [];
    }

    const profAvail = selectedProf.availability;
    
    if (!profAvail || !profAvail.days.includes(dayOfWeek)) {
      return [];
    }

    const startHour = parseInt(profAvail.start.split(':')[0], 10);
    const endHour = parseInt(profAvail.end.split(':')[0], 10);
    const times = [];
    
    for (let h = startHour; h < endHour; h++) {
      const slot1 = `${h.toString().padStart(2, '0')}:00`;
      const slot2 = `${h.toString().padStart(2, '0')}:30`;

      if (!selectedProf.blockedTimeSlots?.includes(`${dateStr} ${slot1}`)) {
        times.push(slot1);
      }
      if (!selectedProf.blockedTimeSlots?.includes(`${dateStr} ${slot2}`)) {
        times.push(slot2);
      }
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
    setSelectedCategory(null);
    setSelectedVariant(null);
    setSelectedProf(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setFormData({ name: '', phone: '' });
    setAccepted(false);
    setFinishedAppt(null);
    setStep(1);
  };

  if (finishedAppt) {
    const calendarLink = generateGoogleCalendarUrl(finishedAppt, selectedVariant, selectedProf);

    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-[#FAF9F6]">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm max-w-sm w-full text-center border border-[#EAE5DC] animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#EAE5DC]">
            <CheckCircle className="text-neutral-900 w-10 h-10 stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight text-[#1A1A1A]">Cita Solicitada</h2>
          <p className="text-sm text-[#6E6B64] mb-8 leading-relaxed">
            Tu turno para <strong className="text-black font-semibold">{selectedVariant.name}</strong> con <strong className="text-black font-semibold">{selectedProf.name}</strong> está en espera para el <strong className="text-black font-semibold">{selectedDate.toLocaleDateString('es-ES')}</strong> a las <strong className="text-black font-semibold">{selectedTime} hs</strong>.
          </p>

          <a href={calendarLink} target="_blank" rel="noopener noreferrer" 
             className="flex items-center justify-center w-full bg-blue-50 text-blue-700 py-4 rounded-xl font-bold text-sm mb-4 border border-blue-100 hover:bg-blue-100 transition-colors">
            <CalendarIcon className="w-5 h-5 mr-2" /> Agendar en Google Calendar
          </a>

          <button onClick={handleReset} className="w-full bg-black text-white py-4 rounded-xl font-medium text-sm hover:bg-neutral-900 active:scale-[0.98] transition-all">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-28 max-w-lg mx-auto w-full px-6">
      {/* Header Fijo */}
      <header className="py-8 flex justify-between items-center border-b border-[#EAE5DC] mb-8">
        <div className="text-left">
          <h1 className="font-extrabold text-xl tracking-tight flex items-center gap-2 text-[#1A1A1A]">
             <Sparkles className="w-5 h-5 text-[#1A1A1A] fill-[#1A1A1A]"/> COWORK STUDIO
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#6E6B64] font-bold mt-1">Gestión de Turnos</p>
        </div>
        <button onClick={() => onNavigate('login')} className="p-3 bg-white border border-[#EAE5DC] rounded-xl text-neutral-700 hover:bg-[#FAF9F6] active:scale-95 transition-all shadow-sm">
          <Lock size={18} />
        </button>
      </header>

      {/* Indicador de Pasos */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#6E6B64]">
            {step === 1 && "1. Elige una categoría"}
            {step === 2 && `2. Servicio de ${selectedCategory?.name}`}
            {step === 3 && "3. Fecha y Hora"}
            {step === 4 && "4. Datos personales"}
          </span>
          <span className="text-sm font-semibold text-black">{step}/4</span>
        </div>
        <div className="h-1.5 w-full bg-[#EAE5DC] rounded-full overflow-hidden">
          <div className="h-full bg-black rounded-full transition-all duration-300" style={{ width: `${(step/4)*100}%` }} />
        </div>
      </div>

      {/* Contenido Dinámico */}
      <div className="flex-1">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300 text-left">
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">¿Qué servicio buscas hoy?</h2>
            <p className="text-sm text-[#6E6B64] leading-relaxed">Selecciona el área de tu interés para desplegar el catálogo de especialistas.</p>
            <div className="space-y-3">
              {categories.map(cat => {
                const count = variants.filter(v => v.categoryId === cat.id).length;
                return (
                  <button key={cat.id} 
                    onClick={() => { 
                      setSelectedCategory(cat); 
                      setStep(2); 
                    }}
                    className="w-full p-5 rounded-xl border bg-white border-[#EAE5DC] text-left hover:border-black active:scale-[0.99] transition-all flex items-center justify-between shadow-sm group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3.5 h-3.5 rounded-full ${cat.dot || 'bg-neutral-400'}`} />
                      <div>
                        <h3 className="font-bold text-sm text-black">{cat.name}</h3>
                        <p className="text-xs text-[#6E6B64] mt-1">{count} {count === 1 ? 'tratamiento' : 'tratamientos'} disponibles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors" />
                  </button>
                );
              })}
              {categories.length === 0 && (
                <div className="text-center py-12 bg-white border border-[#EAE5DC] rounded-xl text-sm text-[#6E6B64]">
                  No hay categorías registradas en este momento.
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-5 duration-300 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]">{selectedCategory?.name}</h2>
              <button onClick={() => setStep(1)} className="text-xs font-bold text-[#6E6B64] flex items-center bg-white border border-[#EAE5DC] px-4 py-2 rounded-lg hover:text-black transition-colors"><ArrowLeft className="w-4 mr-1.5"/> Volver</button>
            </div>
            
            <div className="space-y-3">
              {activeVariants.map(variant => {
                const prof = professionals.find(p => p.id === variant.profId);
                return (
                  <button key={variant.id} 
                    onClick={() => { 
                      setSelectedVariant(variant); 
                      setSelectedProf(prof); 
                      setStep(3); 
                    }}
                    className="w-full p-6 bg-white rounded-xl border border-[#EAE5DC] hover:border-black text-left active:scale-[0.99] transition-all flex flex-col space-y-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="space-y-2 pr-4">
                        <h3 className="font-extrabold text-sm text-black">{variant.name}</h3>
                        <p className="text-xs text-[#6E6B64] leading-relaxed">{variant.description}</p>
                      </div>
                      <span className="font-bold text-sm text-black whitespace-nowrap bg-neutral-50 px-3 py-1.5 rounded-lg">${variant.price.toLocaleString()}</span>
                    </div>

                    <div className="pt-3 border-t border-[#FAF9F6] flex items-center justify-between text-xs text-[#6E6B64] w-full">
                      <span className="font-semibold">🕒 {variant.duration} minutos</span>
                      {prof && <span className="font-bold bg-neutral-50 border border-[#EAE5DC] px-3 py-1 rounded-full text-black">👩‍⚕️ {prof.name}</span>}
                    </div>
                  </button>
                );
              })}

              {activeVariants.length === 0 && (
                <div className="text-center py-16 text-sm text-[#6E6B64] bg-white rounded-xl border border-[#EAE5DC] space-y-2">
                  <p className="font-bold text-black text-base">Sin propuestas aún</p>
                  <p>Pronto los especialistas agregarán nuevos servicios.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-5 duration-300 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]">Fecha y hora</h2>
              <button onClick={() => setStep(2)} className="text-xs font-bold text-[#6E6B64] flex items-center bg-white border border-[#EAE5DC] px-4 py-2 rounded-lg hover:text-black transition-colors"><ArrowLeft className="w-4 mr-1.5"/> Volver</button>
            </div>

            <InteractiveCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} appointments={appointments} />

            {selectedDate && (
              <div className="space-y-4 pt-5 border-t border-[#EAE5DC] animate-in fade-in">
                <h3 className="font-bold text-xs uppercase tracking-widest text-[#6E6B64]">Horas Disponibles</h3>
                {availableTimes.length === 0 ? (
                  <div className="p-5 bg-red-50 text-red-800 text-center rounded-xl font-semibold text-sm border border-red-100">
                    No hay horarios disponibles para el día seleccionado. Intenta otra fecha.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {availableTimes.map(time => (
                      <button key={time} onClick={() => setSelectedTime(time)}
                              className={`py-3.5 rounded-xl font-bold text-sm transition-all border
                                ${selectedTime === time 
                                  ? 'bg-black text-white border-black scale-105 shadow-md' 
                                  : 'bg-white text-neutral-700 border-[#EAE5DC] hover:bg-neutral-50'}`}>
                        {time} hs
                      </button>
                    ))}
                  </div>
                )}
                
                {availableTimes.length > 0 && (
                  <button disabled={!selectedTime} onClick={() => setStep(4)}
                          className="w-full mt-6 bg-black disabled:bg-neutral-200 disabled:text-neutral-400 text-white py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]">
                    Continuar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-5 duration-300 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]">Confirmación</h2>
              <button onClick={() => setStep(3)} className="text-xs font-bold text-[#6E6B64] flex items-center bg-white border border-[#EAE5DC] px-4 py-2 rounded-lg hover:text-black transition-colors"><ArrowLeft className="w-4 mr-1.5"/> Volver</button>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#EAE5DC] space-y-3.5 text-sm shadow-sm">
              <div className="flex justify-between"><span className="text-[#6E6B64]">Servicio general:</span> <span className="font-bold text-black">{selectedCategory?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#6E6B64]">Variante elegida:</span> <span className="font-bold text-black">{selectedVariant?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#6E6B64]">Profesional:</span> <span className="font-bold text-black">{selectedProf?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#6E6B64]">Fecha y Hora:</span> <span className="font-bold text-black">{selectedDate?.toLocaleDateString('es-ES')} a las {selectedTime} hs</span></div>
              <div className="pt-3.5 border-t border-[#FAF9F6] flex justify-between items-center text-sm font-bold">
                <span className="text-black">Monto Estimado:</span> <span className="text-black font-extrabold text-base">${selectedVariant?.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Nombre Completo</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                       className="w-full p-4 bg-white border border-[#EAE5DC] rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-300" placeholder="Ej: Sofía Lauren" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Móvil de Contacto (WhatsApp)</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                       className="w-full p-4 bg-white border border-[#EAE5DC] rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-300" placeholder="Ej: 549112345678" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-[#EAE5DC] space-y-4">
              <div className="flex space-x-3">
                <ShieldAlert className="w-5 h-5 text-[#1A1A1A] shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-600 leading-relaxed font-semibold">{CLINIC_POLICY}</p>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-xl border border-[#EAE5DC]">
                <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} 
                       className="w-4 h-4 text-black border-neutral-300 rounded focus:ring-black cursor-pointer" />
                <span className="text-xs font-extrabold text-neutral-900">Acepto la política de asistencia</span>
              </label>
            </div>

            <button disabled={!formData.name || !formData.phone || !accepted} onClick={handleBook}
                    className="w-full bg-black disabled:bg-neutral-200 disabled:text-neutral-400 text-white py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]">
              Confirmar Pre-Reserva
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- CALENDARIO INTERACTIVO ADAPTADO A MÓVILES ---
function InteractiveCalendar({ selectedDate, onSelectDate, appointments }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth);
    }
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null); 
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const isToday = (d) => d && d.toDateString() === today.toDateString();
  const isSelected = (d) => d && selectedDate && d.toDateString() === selectedDate.toDateString();
  const isPast = (d) => d && d < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const getHeatmapColor = (d) => {
    if (!d || isPast(d) || d.getDay() === 0) return '';
    const dateStr = formatDate(d);
    const count = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled').length;
    
    if (isSelected(d)) return ''; 

    if (count === 0) return 'bg-[#FAF9F6] hover:bg-[#F2EFE9] text-[#1A1A1A]'; 
    if (count <= 2) return 'bg-[#EAE5DC] hover:bg-[#E2DCD2] text-[#1A1A1A] font-semibold'; 
    return 'bg-[#DDD6C9] hover:bg-[#D2C9B9] text-[#1A1A1A] font-bold'; 
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="w-full bg-white p-5 rounded-xl border border-[#EAE5DC] shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[#FAF9F6] text-neutral-800 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
        <h3 className="font-extrabold text-sm text-[#1A1A1A] uppercase tracking-wider">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[#FAF9F6] text-neutral-800 transition-colors"><ChevronRight className="w-5 h-5"/></button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center mb-3">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
          <div key={i} className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="h-10"></div>;
          
          const disabled = isPast(date) || date.getDay() === 0; 
          const selected = isSelected(date);
          const current = isToday(date);
          const heatClass = getHeatmapColor(date);

          return (
            <button 
              key={idx} 
              disabled={disabled}
              onClick={() => onSelectDate(date)}
              className={`h-10 w-full rounded-lg flex items-center justify-center text-sm transition-all relative
                ${disabled ? 'text-gray-300 cursor-not-allowed opacity-30' : 'border border-transparent'}
                ${selected ? 'bg-black text-white font-bold scale-105 shadow-md' : heatClass}
                ${current && !selected ? 'border-2 border-black font-extrabold' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      
      <div className="mt-5 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#FAF9F6] border border-[#EAE5DC]"></div> Libre</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#EAE5DC]"></div> Medio</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#DDD6C9]"></div> Ocupado</div>
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
    if (user && user.password === password) {
      onLogin(user);
    } else {
      showNotification("Credenciales incorrectas", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full py-16 animate-in fade-in duration-300 text-left">
      <button onClick={() => onNavigate('client')} className="mb-8 text-xs font-bold text-[#6E6B64] flex items-center bg-white border border-[#EAE5DC] px-4 py-2 rounded-xl w-max hover:text-black transition-colors"><ArrowLeft className="w-4 mr-1.5"/> Volver a la web</button>
      
      <div className="bg-white p-8 rounded-[2rem] border border-[#EAE5DC] shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-extrabold text-2xl tracking-tight">Acceso Staff</h1>
          <p className="text-xs font-bold text-[#6E6B64] uppercase tracking-widest mt-1.5">Módulo de Autenticación</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">Usuario</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} 
                   className="w-full p-4 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-black" 
                   placeholder="Ej: ana, elena, admin" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} 
                   className="w-full p-4 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-black" 
                   placeholder="•••••" />
          </div>

          <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm active:scale-95 transition-all mt-4">
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-8 p-4 bg-[#FAF9F6] rounded-xl border border-[#EAE5DC] text-xs text-[#6E6B64] space-y-2">
          <p className="font-extrabold text-black uppercase tracking-wider mb-2">Cuentas disponibles:</p>
          <p>• Admin: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded">admin</code> / <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded">123</code></p>
          <p>• Staff: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded">ana</code> o <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded">elena</code> / <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded">123</code></p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. DASHBOARD PRIVADO (STAFF & ADMIN)
// ==========================================
function StaffDashboard({ 
  user, onLogout, 
  appointments, setAppointments, 
  categories, setCategories, 
  variants, setVariants, 
  professionals, setProfessionals, 
  users, setUsers,
  patients, setPatients,
  treatmentHistory, setTreatmentHistory,
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

  // Filtros de búsqueda para pacientes
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAppointments = useMemo(() => {
    let filtered = appointments.filter(a => a.date === viewDate);
    if (!isManager && profId) {
      filtered = filtered.filter(a => a.profId === profId);
    }
    return filtered.sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, viewDate, isManager, profId]);

  const pendingAppointments = useMemo(() => {
    return appointments.filter(a => {
      const isPending = a.status === 'pending';
      if (isManager) return isPending;
      return isPending && a.profId === profId;
    });
  }, [appointments, isManager, profId]);

  const dayRevenue = useMemo(() => {
    return filteredAppointments.reduce((sum, a) => sum + (a.status !== 'cancelled' ? a.price : 0), 0);
  }, [filteredAppointments]);

  const handleUpdateAppt = (updatedAppt) => {
    setAppointments(prev => prev.map(a => a.id === updatedAppt.id ? { ...a, ...updatedAppt } : a));
    setSelectedAppt(null);
    showNotification("Turno modificado exitosamente");
  };

  const currentProfObj = useMemo(() => {
    if (isManager) return null;
    return professionals.find(p => p.id === user.id);
  }, [professionals, user, isManager]);

  const sendStaffDailySchedule = () => {
    const targetProf = currentProfObj;
    if (!targetProf) return;
    
    let agendaText = `📢 *AGENDA DIARIA DE TURNOS* 📢\n\n🗓️ *Fecha:* ${viewDate}\n👩‍⚕️ *Especialista:* ${targetProf.name}\n\n`;
    
    if (filteredAppointments.length === 0) {
      agendaText += `No posees turnos agendados para este día.`;
    } else {
      filteredAppointments.forEach((a, idx) => {
        const variant = variants.find(v => v.id === a.variantId);
        agendaText += `${idx + 1}. ⏰ *${a.time} hs* - ${a.clientName}\n🔹 *Tratamiento:* ${variant?.name}\n🔹 *Estado:* ${a.status === 'confirmed' ? '✅ Confirmado' : '⏳ Pendiente'}\n\n`;
      });
    }

    const phone = targetProf.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(agendaText)}`, '_blank');
    showNotification("Agenda enviada a tu WhatsApp");
  };

  // --- AGREGAR NOTA AL HISTORIAL CLÍNICO ---
  const handleAddTreatmentRecord = (record) => {
    const newRecord = {
      ...record,
      id: `h_${Date.now()}`
    };
    setTreatmentHistory(prev => [newRecord, ...prev]);
    showNotification("Tratamiento guardado en el historial clínico de la paciente");
  };

  // --- ACTUALIZAR FICHA DE PACIENTE ---
  const handleUpdatePatientInfo = (id, newNote, updatedEmail) => {
    setPatients(prev => prev.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          email: updatedEmail,
          medicalNotes: {
            ...(p.medicalNotes || {}),
            [user.id]: newNote
          }
        };
      }
      return p;
    }));
    showNotification("Ficha clínica de la paciente actualizada");
  };

  return (
    <div className="flex-1 flex flex-col pb-28 max-w-lg mx-auto w-full px-6 pt-5 text-left">
      {/* Header Panel */}
      <header className="py-5 flex justify-between items-center border-b border-[#EAE5DC] mb-5">
        <div className="flex items-center space-x-3">
          <button onClick={() => {
            if (activeTab !== 'agenda') {
              setActiveTab('agenda');
            } else {
              onLogout();
            }
          }} className="p-2.5 bg-white border border-[#EAE5DC] rounded-xl text-[#6E6B64] hover:text-black hover:bg-[#FAF9F6] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-left">
            <h2 className="text-lg font-extrabold tracking-tight text-black">Control Studio</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6E6B64] mt-1">{user.name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl active:scale-95 transition-all">
          <LogOut size={20} />
        </button>
      </header>

      {/* Navegación Interna Adaptada */}
      <div className="flex space-x-2.5 overflow-x-auto pb-4 mb-4 border-b border-[#EAE5DC] no-scrollbar">
        <button onClick={() => setActiveTab('agenda')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'agenda' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64] hover:text-black'}`}>
          📅 Turnos Hoy
        </button>
        {/* Administrador no ve Fichas Clínicas */}
        {!isManager && (
          <button onClick={() => setActiveTab('pacientes')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'pacientes' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64] hover:text-black'} flex items-center space-x-1.5`}>
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>Fichas Clínicas</span>
          </button>
        )}
        <button onClick={() => setActiveTab('pending_broadcast')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'pending_broadcast' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64] hover:text-black'} flex items-center space-x-1.5`}>
          <MessageCircle className="w-4 h-4" />
          <span>Notificaciones ({pendingAppointments.length})</span>
        </button>
        {isManager && (
          <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'categories' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64] hover:text-black'} flex items-center space-x-1.5`}>
            <Tag className="w-4 h-4" />
            <span>Categorías</span>
          </button>
        )}
        <button onClick={() => setActiveTab('treatments')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'treatments' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64] hover:text-black'}`}>
          ✨ Servicios
        </button>
        {!isManager && (
          <>
            <button onClick={() => setActiveTab('availability')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'availability' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
              🕒 Mi Horario
            </button>
            <button onClick={() => setActiveTab('messages')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'messages' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
              💬 Mensajes
            </button>
          </>
        )}
        {isManager && (
          <>
            <button onClick={() => setActiveTab('general_calendar')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'general_calendar' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
              👁️ Semanal
            </button>
            <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'staff' ? 'bg-black text-white' : 'bg-white border border-[#EAE5DC] text-[#6E6B64]'}`}>
              👥 Staff
            </button>
          </>
        )}
      </div>

      {/* Contenido según Tab */}
      <div className="flex-1">
        {activeTab === 'agenda' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Control de Fecha e Ingresos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)}
                       className="p-3 bg-white border border-[#EAE5DC] rounded-xl font-bold text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-black shadow-sm" />
                
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#6E6B64] block uppercase tracking-wider">Total estimado</span>
                  <span className="font-extrabold text-lg text-black">${dayRevenue.toLocaleString()}</span>
                </div>
              </div>

              {!isManager && currentProfObj && (
                <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#EAE5DC] flex justify-between items-center text-sm shadow-sm">
                  <span className="font-bold text-black">Enviar agenda al celular:</span>
                  <button onClick={sendStaffDailySchedule} className="bg-black text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-2 transition-colors">
                     <MessageCircle className="w-4 h-4" />
                     <span>Compartir</span>
                  </button>
                </div>
              )}
            </div>

            {/* Listado de Turnos */}
            <div className="space-y-3">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-14 bg-white rounded-xl border border-[#EAE5DC] text-gray-400 space-y-3 shadow-sm">
                  <CalendarDays className="w-10 h-10 mx-auto text-neutral-300 stroke-[1.5]" />
                  <p className="text-sm font-extrabold text-neutral-600">No hay turnos registrados</p>
                  <p className="text-xs text-neutral-400">Para la fecha seleccionada.</p>
                </div>
              ) : (
                filteredAppointments.map(appt => {
                  const variant = variants.find(v => v.id === appt.variantId);
                  const prof = professionals.find(p => p.id === appt.profId);
                  const patientObj = patients.find(p => p.id === appt.patientId);
                  // Verifica si hay notas escritas por ESE profesional en particular.
                  const hasMyNotes = patientObj?.medicalNotes?.[user.id] && patientObj.medicalNotes[user.id].trim() !== '';

                  const statusMap = {
                    pending: { label: 'Pendiente', color: 'bg-amber-50 text-amber-800 border-amber-100' },
                    confirmed: { label: 'Confirmado', color: 'bg-neutral-50 text-black border-neutral-200' },
                    completed: { label: 'Atendido', color: 'bg-green-50 text-green-800 border-green-100' },
                    cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-100' },
                  };
                  const statusInfo = statusMap[appt.status] || statusMap.pending;

                  return (
                    <div key={appt.id} className="p-5 bg-white rounded-xl border border-[#EAE5DC] hover:border-black active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer shadow-sm animate-in fade-in"
                         onClick={() => setSelectedAppt({ ...appt, variant, prof })}>
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm">{appt.time} hs</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-black flex items-center space-x-1.5">
                          <span>{appt.clientName}</span>
                          {!isManager && hasMyNotes && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Tiene observaciones clínicas tuyas" />
                          )}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">{variant?.name || 'Tratamiento'}</p>
                        {isManager && <p className="text-[10px] text-[#6E6B64] font-bold">Especialista: {prof?.name}</p>}
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-400 font-bold" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* NOTIFICACIONES Y MENSAJES */}
        {activeTab === 'pending_broadcast' && (
          <PendingBroadcastView 
            pendingAppointments={pendingAppointments} 
            variants={variants} 
            professionals={professionals} 
            showNotification={showNotification}
          />
        )}

        {/* FICHAS CLÍNICAS (HISTORIAL DE PACIENTES) */}
        {activeTab === 'pacientes' && !isManager && (
          <PatientsTabView 
            user={user}
            patients={patients}
            treatmentHistory={treatmentHistory}
            appointments={appointments}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setEditPatientInfo={setEditPatientInfo}
            setViewHistoryPatient={setViewHistoryPatient}
          />
        )}

        {/* CATEGORÍAS (SÓLO PARA ADMINISTRADOR) */}
        {activeTab === 'categories' && isManager && (
          <CategoriesTabView 
            categories={categories}
            setCategories={setCategories}
            variants={variants}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'treatments' && (
          <TreatmentsTabView 
            user={user} 
            variants={variants} 
            setVariants={setVariants} 
            professionals={professionals} 
            categories={categories}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'staff' && isManager && (
          <StaffTabView 
            professionals={professionals} 
            setProfessionals={setProfessionals} 
            users={users} 
            setUsers={setUsers} 
            showNotification={showNotification}
          />
        )}

        {activeTab === 'availability' && !isManager && (
          <AvailabilityTabView 
            prof={currentProfObj} 
            setProfessionals={setProfessionals} 
            showNotification={showNotification} 
          />
        )}

        {activeTab === 'messages' && !isManager && (
          <MessageTemplatesView 
            prof={currentProfObj} 
            setProfessionals={setProfessionals} 
            showNotification={showNotification} 
          />
        )}

        {activeTab === 'general_calendar' && isManager && (
          <GeneralCalendarView 
            appointments={appointments} 
            professionals={professionals} 
            variants={variants} 
          />
        )}
      </div>

      {/* Botonera de Navegación Fija Inferior */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#EAE5DC] py-4 px-8 flex justify-around items-center z-40 max-w-lg mx-auto">
        <button onClick={() => setActiveTab('agenda')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'agenda' ? 'text-black' : 'text-neutral-300'}`}>
          <CalendarDays className="w-6 h-6" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Hoy</span>
        </button>
        {!isManager && (
          <button onClick={() => setActiveTab('pacientes')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'pacientes' ? 'text-black' : 'text-neutral-300'}`}>
            <HeartPulse className={`w-6 h-6 ${activeTab === 'pacientes' ? 'text-rose-500' : ''}`} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Fichas</span>
          </button>
        )}
        <button onClick={() => setActiveTab('pending_broadcast')} className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'pending_broadcast' ? 'text-black' : 'text-neutral-300'}`}>
          <MessageCircle className="w-6 h-6" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Avisos</span>
          {pendingAppointments.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-black text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{pendingAppointments.length}</span>
          )}
        </button>
        {isManager ? (
          <button onClick={() => setActiveTab('categories')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'categories' ? 'text-black' : 'text-neutral-300'}`}>
            <Tag className="w-6 h-6" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Secciones</span>
          </button>
        ) : (
          <button onClick={() => setActiveTab('availability')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'availability' ? 'text-black' : 'text-neutral-300'}`}>
            <Clock className="w-6 h-6" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Horarios</span>
          </button>
        )}
      </footer>

      {/* Modal de Detalle/Edición de Turno */}
      {selectedAppt && (
        <AppointmentDetailModal 
          appt={selectedAppt} 
          user={user}
          onClose={() => setSelectedAppt(null)} 
          onSave={handleUpdateAppt} 
          isManager={isManager} 
          onCompleteAndAddEvol={(apptData) => {
            // Se marca el turno como completado
            setAppointments(prev => prev.map(a => a.id === apptData.id ? { ...a, status: 'completed' } : a));
            setSelectedAppt(null);
            // Abrimos modal de evolución clínica
            setAddEvolModal({
              patientId: apptData.patientId,
              appointmentId: apptData.id,
              profId: apptData.profId,
              treatmentName: apptData.variant?.name || 'Tratamiento Especial',
              notes: '',
              date: apptData.date
            });
          }}
          patients={patients}
        />
      )}

      {/* 1. MODAL: AGREGAR EVOLUCIÓN TRATAMIENTO */}
      {addEvolModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white border border-[#EAE5DC] w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-gray-150">
              <h4 className="text-sm font-black uppercase tracking-widest text-[#6E6B64] flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Evolución de Sesión</span>
              </h4>
              <button onClick={() => setAddEvolModal(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-1.5 bg-amber-50/50 p-4 rounded-xl text-xs text-amber-800 border border-amber-100/50">
              <p className="font-bold">Paciente: {patients.find(p => p.id === addEvolModal.patientId)?.name}</p>
              <p>Servicio: <strong>{addEvolModal.treatmentName}</strong></p>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Observaciones Clínicas / Notas</label>
              <textarea 
                rows={5}
                placeholder="Escribe el reporte del tratamiento aplicado, fórmulas, reacciones de la piel y sugerencias para la próxima sesión..."
                value={addEvolModal.notes}
                onChange={(e) => setAddEvolModal({ ...addEvolModal, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-black resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-150">
              <button onClick={() => setAddEvolModal(null)} className="px-5 py-3 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors rounded-xl text-sm font-bold">Descartar</button>
              <button 
                onClick={() => {
                  if (!addEvolModal.notes.trim()) return;
                  handleAddTreatmentRecord(addEvolModal);
                  setAddEvolModal(null);
                }} 
                disabled={!addEvolModal.notes.trim()}
                className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
              >
                Guardar Notas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL: DETALLE DEL HISTORIAL COMPLETO */}
      {viewHistoryPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white border border-[#EAE5DC] w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col text-left">
            <div className="flex justify-between items-center pb-3 border-b border-gray-150">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600">Historial Clínico Permanente</h4>
                <h3 className="text-lg font-extrabold text-black mt-1">{viewHistoryPatient.name}</h3>
              </div>
              <button onClick={() => setViewHistoryPatient(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Fórmulas Médicas de la profesional */}
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-md">Contraindicaciones / Notas Propias</span>
              <p className="text-sm text-rose-950 mt-2 font-medium leading-relaxed italic">
                "{viewHistoryPatient.medicalNotes?.[user.id] || 'Sin notas tuyas declaradas.'}"
              </p>
            </div>

            {/* Sesiones pasadas (filtradas para este profesional o globales) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Sesiones Realizadas</h5>
              
              {treatmentHistory.filter(h => h.patientId === viewHistoryPatient.id).length > 0 ? (
                treatmentHistory
                  .filter(h => h.patientId === viewHistoryPatient.id)
                  .sort((a,b) => b.date.localeCompare(a.date))
                  .map((record) => {
                    const prof = professionals.find(p => p.id === record.profId);
                    // Destaque visual si la nota la hizo esta misma profesional
                    const isMyNote = record.profId === user.id;
                    return (
                      <div key={record.id} className={`border rounded-xl p-4 space-y-2.5 relative ${isMyNote ? 'bg-white border-black' : 'bg-[#F9F8F6] border-[#EAE5DC]'}`}>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-black">{record.treatmentName}</span>
                          <span className="text-[10px] text-[#7A7571] font-bold bg-white px-2 py-0.5 rounded border border-gray-100">📅 {record.date}</span>
                        </div>
                        <p className={`text-sm leading-relaxed p-3 rounded-lg border whitespace-pre-wrap ${isMyNote ? 'text-black bg-neutral-50 border-neutral-200 font-medium' : 'text-[#6E6B64] bg-white border-gray-100'}`}>
                          {record.notes}
                        </p>
                        <div className="text-[10px] text-right text-gray-400">
                          Especialista: <strong className={isMyNote ? 'text-black' : ''}>{prof?.name || 'Staff'}</strong>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl space-y-3">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-bold text-gray-400">No hay tratamientos históricos cargados todavía.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-150 flex justify-end">
              <button onClick={() => setViewHistoryPatient(null)} className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors">
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL: EDITAR INFORMACIÓN DE PACIENTE */}
      {editPatientInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white border border-[#EAE5DC] w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl text-left animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-gray-150">
              <h4 className="text-sm font-black uppercase tracking-widest text-[#6E6B64]">Editar Ficha del Paciente</h4>
              <button onClick={() => setEditPatientInfo(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Nombre del Paciente</label>
                <input type="text" value={editPatientInfo.name} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-500" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Email de Contacto</label>
                <input 
                  type="email" 
                  value={editPatientInfo.email || ''} 
                  onChange={(e) => setEditPatientInfo({ ...editPatientInfo, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center space-x-1.5 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Alergias, Fórmulas & Notas Privadas (Visibles solo para ti)</span>
                </label>
                <textarea 
                  rows={5}
                  value={editPatientInfo.medicalNotes?.[user.id] || ''} 
                  onChange={(e) => setEditPatientInfo({ 
                    ...editPatientInfo, 
                    medicalNotes: {
                      ...editPatientInfo.medicalNotes,
                      [user.id]: e.target.value 
                    }
                  })}
                  placeholder="Ej: Alergia al esmalte acrílico, piel sensible, cliente prefiere poca charla..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-150">
              <button onClick={() => setEditPatientInfo(null)} className="px-5 py-3 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors rounded-xl text-sm font-bold">Cancelar</button>
              <button 
                onClick={() => {
                  handleUpdatePatientInfo(editPatientInfo.id, editPatientInfo.medicalNotes[user.id], editPatientInfo.email);
                  setEditPatientInfo(null);
                }}
                className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// SUBVISTA: BUSCADOR & GESTIÓN DE PACIENTES
// ==========================================
function PatientsTabView({ user, patients, treatmentHistory, appointments, searchQuery, setSearchQuery, setEditPatientInfo, setViewHistoryPatient }) {
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.phone.includes(query)
    );
  }, [patients, searchQuery]);

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-300">
      <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 flex flex-col gap-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o móvil..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium text-right">
          Total de fichas: <strong className="text-black text-sm">{patients.length}</strong>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-10 bg-white border border-[#EAE5DC] rounded-xl text-sm text-[#6E6B64] font-medium">
            No se encontraron pacientes para la búsqueda.
          </div>
        ) : (
          filteredPatients.map(patient => {
            const history = treatmentHistory.filter(h => h.patientId === patient.id);
            const activeAppts = appointments.filter(a => a.patientId === patient.id && (a.status === 'confirmed' || a.status === 'pending'));
            
            // Obtener solo mis notas
            const myNote = patient.medicalNotes?.[user.id] || 'Sin notas registradas aún.';

            return (
              <div key={patient.id} className="p-5 bg-white border border-[#EAE5DC] rounded-xl space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-black">{patient.name}</h4>
                    <p className="text-xs text-gray-500 flex items-center space-x-1.5 mt-1 font-medium">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{patient.phone}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-neutral-100 text-neutral-500 px-3 py-1 rounded-lg uppercase">
                    Alta: {patient.createdAt}
                  </span>
                </div>

                {/* Notas clínicas generales de alergias / tipo de piel DE ESTA PROFESIONAL */}
                <div className="bg-rose-50/70 border border-rose-100/70 p-4 rounded-xl">
                  <div className="flex items-center space-x-1.5 text-rose-800 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Mis Notas y Restricciones</span>
                  </div>
                  <p className="text-xs text-rose-950 font-medium italic leading-relaxed">
                    "{myNote}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500">
                  <div className="bg-neutral-50 p-3 rounded-xl text-center font-medium border border-[#EAE5DC]">
                    🔬 Historial: <strong className="text-black text-sm block mt-0.5">{history.length} sesiones</strong>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-xl text-center font-medium border border-[#EAE5DC]">
                    📅 Activos: <strong className="text-black text-sm block mt-0.5">{activeAppts.length} turnos</strong>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-dashed border-[#EAE5DC]">
                  <button 
                    onClick={() => setEditPatientInfo(patient)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#1A1A1A] rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar Ficha</span>
                  </button>

                  <button 
                    onClick={() => setViewHistoryPatient(patient)}
                    className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <ClipboardList className="w-4 h-4 text-amber-300" />
                    <span>Evolución ({history.length})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// SUBVISTA: ADMINISTRACIÓN DE CATEGORÍAS (ADMIN ONLY)
// ==========================================
function CategoriesTabView({ categories, setCategories, variants, showNotification }) {
  const [name, setName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setName('');
    setSelectedColorIdx(0);
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification("Por favor especifica un nombre para la categoría", "error");
      return;
    }

    const palette = PALETTE_OPTIONS[selectedColorIdx];

    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? {
        ...c,
        name: name.trim(),
        dot: palette.dot
      } : c));
      showNotification("Categoría modificada correctamente");
    } else {
      const newCategory = {
        id: `cat_${Date.now()}`,
        name: name.trim(),
        dot: palette.dot
      };
      setCategories(prev => [...prev, newCategory]);
      showNotification("Nueva categoría integrada");
    }
    resetForm();
  };

  const handleStartEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    const colorIdx = PALETTE_OPTIONS.findIndex(p => p.dot === cat.dot);
    setSelectedColorIdx(colorIdx >= 0 ? colorIdx : 0);
    setShowForm(true);
  };

  const handleDeleteCategory = (id) => {
    const associated = variants.some(v => v.categoryId === id);
    if (associated) {
      showNotification("No se puede eliminar. Hay servicios activos vinculados a esta categoría.", "error");
      return;
    }

    setCategories(prev => prev.filter(c => c.id !== id));
    showNotification("Categoría eliminada del catálogo");
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-lg text-black">Categorías de Servicios</h3>
          <p className="text-xs text-[#6E6B64] font-medium mt-1">Gestiona las agrupaciones del portal de reservas.</p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> <span>{showForm ? 'Cancelar' : 'Añadir'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveCategory} className="bg-white p-5 rounded-2xl border border-[#EAE5DC] space-y-4 shadow-sm animate-in slide-in-from-top-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-black">{editingCategory ? "Modificar Categoría" : "Añadir Categoría"}</h4>
          
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Nombre de Categoría</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
                   className="w-full p-3 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black font-semibold text-black" placeholder="Ej: Tratamientos Capilares" />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-2 uppercase">Color Distintivo</label>
            <div className="grid grid-cols-5 gap-3">
              {PALETTE_OPTIONS.map((p, idx) => (
                <button type="button" key={p.id} onClick={() => setSelectedColorIdx(idx)}
                        className={`w-9 h-9 rounded-full ${p.dot} border-2 transition-all mx-auto ${selectedColorIdx === idx ? 'border-black scale-110' : 'border-transparent'}`} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={resetForm} className="flex-1 py-3 bg-neutral-100 text-[#6E6B64] rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors">Descartar</button>
            <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-sm active:scale-95 transition-all">Guardar</button>
          </div>
        </form>
      )}

      {/* Listado de Categorías */}
      <div className="space-y-3">
        {categories.map(cat => {
          const serviceCount = variants.filter(v => v.categoryId === cat.id).length;
          return (
            <div key={cat.id} className="p-4 bg-white border border-[#EAE5DC] rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${cat.dot}`} />
                <div>
                  <h4 className="font-extrabold text-sm text-black">{cat.name}</h4>
                  <span className="text-[10px] bg-neutral-50 px-2.5 py-1 rounded-md border border-[#EAE5DC] text-neutral-500 font-medium inline-block mt-1">{serviceCount} servicios asociados</span>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button onClick={() => handleStartEdit(cat)} className="p-2 text-blue-500 hover:bg-neutral-50 rounded-lg transition-colors">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-500 hover:bg-neutral-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// SUBVISTA: NOTIFICACIONES Y MENSAJERÍA WHATSAPP
// ==========================================
function PendingBroadcastView({ pendingAppointments, variants, professionals, showNotification }) {
  
  const handleSendTemplate = (appt, type) => {
    const prof = professionals.find(p => p.id === appt.profId);
    const variant = variants.find(v => v.id === appt.variantId);
    
    if (!prof) {
      showNotification("No se localizó el especialista", "error");
      return;
    }

    const templates = prof.messageTemplates;
    let text = "";

    if (type === 'generic') {
      text = templates?.confirmation || "¡Hola {Cliente}! Confirmamos tu turno de {Tratamiento} con {Profesional} el {Fecha} a las {Hora} hs. ¡Te esperamos!";
    } else {
      text = templates?.reminder || "Recordatorio: Mañana es tu sesión de {Tratamiento} con {Profesional} a las {Hora} hs. Recordar indicaciones previas.";
    }

    const [y, m, d] = appt.date.split('-');
    const formattedDate = `${d}/${m}/${y}`;

    const completedText = text
      .replace(/{Cliente}/g, appt.clientName)
      .replace(/{Tratamiento}/g, variant?.name || "tratamiento")
      .replace(/{Profesional}/g, prof.name)
      .replace(/{Fecha}/g, formattedDate)
      .replace(/{Hora}/g, appt.time);

    const targetPhone = appt.clientPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(completedText)}`, '_blank');
    showNotification("Mensaje preparado en WhatsApp");
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-left">
      <div>
        <h3 className="font-extrabold text-lg text-black">Turnos por Confirmar</h3>
        <p className="text-xs text-[#6E6B64] font-medium mt-1">Envía recordatorios individuales o confirmaciones.</p>
      </div>

      {pendingAppointments.length === 0 ? (
        <div className="p-10 text-center bg-white border border-[#EAE5DC] rounded-xl text-sm text-[#6E6B64] font-medium shadow-sm">
          No existen solicitudes de pre-reserva pendientes de confirmación.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingAppointments.map(appt => {
            const variant = variants.find(v => v.id === appt.variantId);
            const prof = professionals.find(p => p.id === appt.profId);
            return (
              <div key={appt.id} className="p-5 bg-white border border-[#EAE5DC] rounded-xl space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-black">{appt.clientName}</h4>
                    <p className="text-xs text-neutral-500 font-bold mt-1">{appt.date} • {appt.time} hs</p>
                    <p className="text-xs text-[#6E6B64] font-medium mt-0.5">{variant?.name}</p>
                    <p className="text-[10px] text-neutral-400 font-bold mt-1 bg-neutral-50 inline-block px-2 py-0.5 rounded border border-gray-100">Especialista: {prof?.name}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase bg-amber-50 text-amber-800 border border-amber-100">Pendiente</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dashed border-[#FAF9F6]">
                  <button onClick={() => handleSendTemplate(appt, 'generic')} 
                          className="py-2.5 bg-[#25D366] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all">
                    <MessageCircle className="w-4 h-4" />
                    <span>Confirmación</span>
                  </button>
                  <button onClick={() => handleSendTemplate(appt, 'custom')} 
                          className="py-2.5 bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Recordatorio</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// SUBVISTA: DISPONIBILIDAD AVANZADA (PROFESIONAL)
// ==========================================
function AvailabilityTabView({ prof, setProfessionals, showNotification }) {
  if (!prof) return null;

  const [startTime, setStartTime] = useState(prof.availability?.start || '09:00');
  const [endTime, setEndTime] = useState(prof.availability?.end || '18:00');
  const [workingDays, setWorkingDays] = useState(prof.availability?.days || [1, 2, 3, 4, 5]);

  const [blockDateStr, setBlockDateStr] = useState('');
  
  const [blockSlotDate, setBlockSlotDate] = useState('');
  const [blockSlotTime, setBlockSlotTime] = useState('12:00');

  const daysList = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
  ];

  const toggleDay = (dayVal) => {
    if (workingDays.includes(dayVal)) {
      setWorkingDays(workingDays.filter(d => d !== dayVal));
    } else {
      setWorkingDays([...workingDays, dayVal].sort());
    }
  };

  const saveAvailability = () => {
    setProfessionals(prev => prev.map(p => {
      if (p.id === prof.id) {
        return {
          ...p,
          availability: {
            days: workingDays,
            start: startTime,
            end: endTime
          }
        };
      }
      return p;
    }));
    showNotification("Rango de horarios modificado");
  };

  const handleAddBlockedDate = () => {
    if (!blockDateStr) return;
    if (prof.blockedDates?.includes(blockDateStr)) {
      showNotification("Esta fecha ya se encuentra inhabilitada", "error");
      return;
    }
    setProfessionals(prev => prev.map(p => {
      if (p.id === prof.id) {
        return {
          ...p,
          blockedDates: [...(p.blockedDates || []), blockDateStr]
        };
      }
      return p;
    }));
    setBlockDateStr('');
    showNotification("Día bloqueado correctamente");
  };

  const handleRemoveBlockedDate = (date) => {
    setProfessionals(prev => prev.map(p => {
      if (p.id === prof.id) {
        return {
          ...p,
          blockedDates: p.blockedDates.filter(d => d !== date)
        };
      }
      return p;
    }));
    showNotification("Día desbloqueado con éxito");
  };

  const handleAddBlockedTimeSlot = () => {
    if (!blockSlotDate || !blockSlotTime) return;
    const combinedKey = `${blockSlotDate} ${blockSlotTime}`;
    if (prof.blockedTimeSlots?.includes(combinedKey)) {
      showNotification("Este horario ya está deshabilitado", "error");
      return;
    }
    setProfessionals(prev => prev.map(p => {
      if (p.id === prof.id) {
        return {
          ...p,
          blockedTimeSlots: [...(p.blockedTimeSlots || []), combinedKey]
        };
      }
      return p;
    }));
    showNotification("Bloqueo de horario programado");
  };

  const handleRemoveBlockedTimeSlot = (slot) => {
    setProfessionals(prev => prev.map(p => {
      if (p.id === prof.id) {
        return {
          ...p,
          blockedTimeSlots: p.blockedTimeSlots.filter(s => s !== slot)
        };
      }
      return p;
    }));
    showNotification("Horario re-habilitado");
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in">
      
      {/* Horario Laboral */}
      <div className="bg-white p-5 rounded-xl border border-[#EAE5DC] space-y-5 shadow-sm">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-black">Parámetros Horarios Semanales</h3>
          <p className="text-xs text-[#6E6B64] mt-1">Determina tus días y horas hábiles base.</p>
        </div>

        <div className="space-y-3">
          <label className="block text-[10px] font-bold uppercase text-[#6E6B64] tracking-wider">Días laborables</label>
          <div className="grid grid-cols-3 gap-3">
            {daysList.map(d => {
              const isChecked = workingDays.includes(d.value);
              return (
                <button key={d.value} onClick={() => toggleDay(d.value)}
                        className={`p-3 rounded-xl text-sm font-bold border transition-all ${isChecked ? 'bg-black text-white border-black shadow-md scale-105' : 'bg-[#FAF9F6] text-neutral-700 border-[#EAE5DC]'}`}>
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#6E6B64] tracking-wider mb-2">Entrada</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                   className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm font-bold text-center focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#6E6B64] tracking-wider mb-2">Salida</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                   className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm font-bold text-center focus:outline-none" />
          </div>
        </div>

        <button onClick={saveAvailability} className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm hover:bg-neutral-900 active:scale-95 transition-all">
          Guardar Calendario Base
        </button>
      </div>

      {/* Bloqueo de Días Completos */}
      <div className="bg-white p-5 rounded-xl border border-[#EAE5DC] space-y-5 shadow-sm">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-red-700 flex items-center gap-1.5"><AlertCircle className="w-5 h-5"/> Excluir Días Completos</h3>
          <p className="text-xs text-[#6E6B64] mt-1">Las fechas marcadas no se encontrarán disponibles para reservas.</p>
        </div>

        <div className="flex gap-3">
          <input type="date" value={blockDateStr} onChange={e => setBlockDateStr(e.target.value)}
                 className="flex-1 p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm font-bold focus:outline-none focus:ring-1 focus:ring-black" />
          <button onClick={handleAddBlockedDate} className="px-5 py-3 bg-black text-white text-sm font-bold rounded-xl active:scale-95 transition-all">
            Inhabilitar
          </button>
        </div>

        {prof.blockedDates && prof.blockedDates.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-dashed border-[#FAF9F6]">
            <p className="text-[10px] font-bold text-[#6E6B64] uppercase">Bloqueos Registrados:</p>
            <div className="flex flex-wrap gap-2">
              {prof.blockedDates.map(date => (
                <span key={date} className="px-3 py-1.5 bg-neutral-100 border border-[#EAE5DC] text-black rounded-lg text-xs font-bold flex items-center space-x-1.5">
                  <span>{date}</span>
                  <button onClick={() => handleRemoveBlockedDate(date)} className="text-red-500 font-bold ml-2 hover:text-red-700 text-base">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bloqueo de Horas Concretas */}
      <div className="bg-white p-5 rounded-xl border border-[#EAE5DC] space-y-5 shadow-sm">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-black flex items-center gap-1.5"><Clock className="w-5 h-5"/> Bloquear Horas Específicas</h3>
          <p className="text-xs text-[#6E6B64] mt-1">Ej: Bloquear un turno puntual de descanso.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={blockSlotDate} onChange={e => setBlockSlotDate(e.target.value)}
                 className="p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm font-bold focus:outline-none" />
          <select value={blockSlotTime} onChange={e => setBlockSlotTime(e.target.value)}
                  className="p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm font-bold focus:outline-none">
            {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'].map(t => (
              <option key={t} value={t}>{t} hs</option>
            ))}
          </select>
        </div>

        <button onClick={handleAddBlockedTimeSlot} className="w-full bg-neutral-100 border border-[#EAE5DC] text-black py-3.5 rounded-xl text-sm font-bold hover:bg-neutral-200 active:scale-95 transition-all">
          Inhabilitar Horario Seleccionado
        </button>

        {prof.blockedTimeSlots && prof.blockedTimeSlots.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-dashed border-[#FAF9F6]">
            <p className="text-[10px] font-bold text-[#6E6B64] uppercase">Bloqueos de Turno:</p>
            <div className="flex flex-wrap gap-2">
              {prof.blockedTimeSlots.map(slot => (
                <span key={slot} className="px-3 py-1.5 bg-neutral-100 border border-[#EAE5DC] text-black rounded-lg text-xs font-bold flex items-center space-x-1.5">
                  <span>{slot} hs</span>
                  <button onClick={() => handleRemoveBlockedTimeSlot(slot)} className="text-red-500 font-bold ml-2 hover:text-red-700 text-base">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ==========================================
// SUBVISTA: MENSAJES AUTOMÁTICOS DE WHATSAPP
// ==========================================
function MessageTemplatesView({ prof, setProfessionals, showNotification }) {
  if (!prof) return null;

  const [confirmationMsg, setConfirmationMsg] = useState(prof.messageTemplates?.confirmation || '');
  const [reminderMsg, setReminderMsg] = useState(prof.messageTemplates?.reminder || '');

  const saveTemplates = () => {
    setProfessionals(prev => prev.map(p => {
      if (p.id === prof.id) {
        return {
          ...p,
          messageTemplates: {
            confirmation: confirmationMsg,
            reminder: reminderMsg
          }
        };
      }
      return p;
    }));
    showNotification("Plantillas actualizadas");
  };

  return (
    <div className="space-y-5 bg-white p-6 rounded-xl border border-[#EAE5DC] text-left animate-in fade-in shadow-sm">
      <div>
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-black">Gestión de Notificaciones</h3>
        <p className="text-xs text-[#6E6B64] mt-1">Configura el texto que se generará al presionar el botón de WhatsApp.</p>
      </div>

      <div className="p-4 bg-neutral-50 rounded-xl border border-[#EAE5DC] text-xs text-neutral-600 space-y-2">
        <p className="font-bold text-black">✨ Palabras clave dinámicas:</p>
        <p className="leading-relaxed">Escribe <code className="font-extrabold bg-white px-1.5 py-0.5 rounded border border-neutral-200">{`{Cliente}`}</code>, <code className="font-extrabold bg-white px-1.5 py-0.5 rounded border border-neutral-200">{`{Tratamiento}`}</code>, <code className="font-extrabold bg-white px-1.5 py-0.5 rounded border border-neutral-200">{`{Profesional}`}</code>, <code className="font-extrabold bg-white px-1.5 py-0.5 rounded border border-neutral-200">{`{Fecha}`}</code> y <code className="font-extrabold bg-white px-1.5 py-0.5 rounded border border-neutral-200">{`{Hora}`}</code> para cargarse en tiempo real.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase text-[#6E6B64] tracking-wider">1. Plantilla de Confirmación Directa</label>
        <textarea value={confirmationMsg} onChange={e => setConfirmationMsg(e.target.value)}
                  className="w-full p-4 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm h-28 focus:outline-none resize-none font-medium text-neutral-800 leading-relaxed focus:ring-1 focus:ring-black animate-none" />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase text-[#6E6B64] tracking-wider">2. Plantilla de Recordatorio Previo</label>
        <textarea value={reminderMsg} onChange={e => setReminderMsg(e.target.value)}
                  className="w-full p-4 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm h-28 focus:outline-none resize-none font-medium text-neutral-800 leading-relaxed focus:ring-1 focus:ring-black animate-none" />
      </div>

      <button onClick={saveTemplates} className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm mt-3 hover:bg-neutral-900 active:scale-95 transition-all">
        Guardar Configuración
      </button>
    </div>
  );
}

// ==========================================
// SUBVISTA: SERVICIOS / TRATAMIENTOS
// ==========================================
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

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const filteredVariants = useMemo(() => {
    return variants.filter(v => v.profId === selectedProfId);
  }, [variants, selectedProfId]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDuration('60');
    setCategoryId(categories[0]?.id || '');
    setSelectedColorIdx(0);
    setShowAddForm(false);
    setEditingVariant(null);
  };

  const handleSaveVariant = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !price || !duration || !categoryId) {
      showNotification("Por favor completa todos los parámetros obligatorios", "error");
      return;
    }

    const palette = PALETTE_OPTIONS[selectedColorIdx];

    if (editingVariant) {
      setVariants(prev => prev.map(v => v.id === editingVariant.id ? {
        ...v,
        categoryId,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        duration: Number(duration),
        colorClass: `${palette.bg} ${palette.text} ${palette.border}`,
        dot: palette.dot
      } : v));
      showNotification("Tratamiento modificado correctamente");
    } else {
      const newVariant = {
        id: `v_${Date.now()}`,
        categoryId,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        duration: Number(duration),
        colorClass: `${palette.bg} ${palette.text} ${palette.border}`,
        dot: palette.dot,
        profId: selectedProfId
      };
      setVariants(prev => [...prev, newVariant]);
      showNotification("Nuevo tratamiento incorporado");
    }
    resetForm();
  };

  const handleStartEdit = (v) => {
    setEditingVariant(v);
    setCategoryId(v.categoryId);
    setName(v.name);
    setDescription(v.description);
    setPrice(v.price.toString());
    setDuration(v.duration.toString());
    const cIdx = PALETTE_OPTIONS.findIndex(p => p.dot === v.dot);
    setSelectedColorIdx(cIdx >= 0 ? cIdx : 0);
    setShowAddForm(true);
  };

  const handleDeleteVariant = (id) => {
    setVariants(prev => prev.filter(v => v.id !== id));
    showNotification("Tratamiento cancelado del catálogo");
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-lg text-black">Servicios Ofrecidos</h3>
          <p className="text-xs text-[#6E6B64] font-medium mt-1">Define los servicios de la cartera de turnos.</p>
        </div>
        <button onClick={() => { if (showAddForm) resetForm(); else setShowAddForm(true); }} className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> <span>{showAddForm ? 'Cancelar' : 'Añadir'}</span>
        </button>
      </div>

      {isManager && (
        <div className="bg-white p-4 rounded-xl border border-[#EAE5DC] space-y-2 shadow-sm">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Filtrar por Profesional</label>
          <select value={selectedProfId} onChange={e => setSelectedProfId(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold focus:outline-none text-black">
            {professionals.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSaveVariant} className="bg-white p-5 rounded-2xl border border-[#EAE5DC] space-y-4 shadow-sm animate-in slide-in-from-top-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-black">{editingVariant ? "Modificar Tratamiento" : "Nuevo Servicio"}</h4>
          
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Área / Categoría</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-sm font-bold focus:outline-none">
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Denominación</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
                   className="w-full p-3 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-sm focus:outline-none font-semibold text-black" placeholder="Ej: Peeling Químico Express" />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Descripción del tratamiento</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)}
                   className="w-full p-3 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-sm focus:outline-none h-20 resize-none font-medium text-black" placeholder="Ej: Tratamiento exfoliante no invasivo..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Precio ($)</label>
              <input required type="number" value={price} onChange={e => setPrice(e.target.value)}
                     className="w-full p-3 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-sm focus:outline-none font-semibold" placeholder="25000" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Duración (minutos)</label>
              <input required type="number" value={duration} onChange={e => setDuration(e.target.value)}
                     className="w-full p-3 bg-neutral-50 border border-[#EAE5DC] rounded-xl text-sm focus:outline-none font-semibold" placeholder="60" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-2 uppercase">Color Identificador</label>
            <div className="grid grid-cols-5 gap-3">
              {PALETTE_OPTIONS.map((p, idx) => (
                <button type="button" key={p.id} onClick={() => setSelectedColorIdx(idx)}
                        className={`w-9 h-9 rounded-full ${p.dot} border-2 transition-all mx-auto ${selectedColorIdx === idx ? 'border-black scale-110' : 'border-transparent'}`} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={resetForm} className="flex-1 py-3 bg-neutral-100 text-[#6E6B64] rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors">Descartar</button>
            <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-sm active:scale-95 transition-all">Guardar</button>
          </div>
        </form>
      )}

      {/* Lista de Variantes */}
      <div className="space-y-4">
        {filteredVariants.length === 0 ? (
          <div className="text-center py-10 bg-white border border-[#EAE5DC] rounded-xl text-sm text-[#6E6B64] font-medium shadow-sm">
            Ningún tratamiento registrado para la cuenta actual.
          </div>
        ) : (
          filteredVariants.map(v => {
            const cat = categories.find(c => c.id === v.categoryId);
            return (
              <div key={v.id} className="p-5 bg-white rounded-xl border border-[#EAE5DC] flex flex-col space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${v.dot || 'bg-neutral-400'}`} />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{cat?.name || 'Sección'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button onClick={() => handleStartEdit(v)} className="p-2 text-blue-500 hover:bg-neutral-50 rounded-lg transition-colors">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDeleteVariant(v.id)} className="p-2 text-red-500 hover:bg-neutral-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1.5 text-left">
                  <h4 className="font-extrabold text-sm text-black">{v.name}</h4>
                  <p className="text-xs text-[#6E6B64] leading-relaxed">{v.description}</p>
                </div>

                <div className="pt-3 border-t border-[#FAF9F6] flex justify-between items-center text-xs font-bold">
                  <span className="text-[#6E6B64]">🕒 {v.duration} min</span>
                  <span className="text-black font-extrabold bg-neutral-50 border border-[#EAE5DC] px-3 py-1 rounded-md text-sm">${v.price.toLocaleString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// SUBVISTA: STAFF (ADMIN ONLY)
// ==========================================
function StaffTabView({ professionals, setProfessionals, users, setUsers, showNotification }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [editingProf, setEditingProf] = useState(null);

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !username.trim() || !password.trim() || !email.trim() || !phone.trim()) {
      showNotification("Por favor completa los campos del staff", "error");
      return;
    }

    const nextId = `p_${Date.now()}`;
    const newProf = {
      id: nextId,
      name: name.trim(),
      role: role.trim(),
      email: email.trim(),
      phone: phone.trim(),
      googleCalendarSynced: true,
      availability: {
        days: [1, 2, 3, 4, 5],
        start: '09:00',
        end: '18:00'
      },
      blockedDates: [],
      blockedTimeSlots: [],
      messageTemplates: {
        confirmation: "¡Hola {Cliente}! Tu turno está agendado con éxito con {Profesional} el {Fecha} a las {Hora} hs. ¡Muchas gracias!",
        reminder: "Recordatorio: Mañana tienes tu turno de {Tratamiento} a las {Hora} hs."
      }
    };

    setProfessionals(prev => [...prev, newProf]);
    setUsers(prev => ({
      ...prev,
      [username.toLowerCase().trim()]: {
        role: 'professional',
        id: nextId,
        password: password.trim(),
        name: name.trim()
      }
    }));

    setName('');
    setRole('');
    setUsername('');
    setPassword('');
    setEmail('');
    setPhone('');
    setShowForm(false);
    showNotification("Miembro integrado correctamente");
  };

  const handleDeleteStaff = (id, profName) => {
    setProfessionals(prev => prev.filter(p => p.id !== id));
    const updatedUsers = { ...users };
    const userKey = Object.keys(updatedUsers).find(key => updatedUsers[key].id === id);
    if (userKey) {
      delete updatedUsers[userKey];
      setUsers(updatedUsers);
    }
    showNotification(`Especialista ${profName} removido`);
  };

  const startEdit = (p) => {
    const userKey = Object.keys(users).find(key => users[key].id === p.id) || '';
    const userPass = users[userKey]?.password || '123';

    setEditingProf({
      ...p,
      username: userKey,
      password: userPass
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingProf.name.trim() || !editingProf.role.trim() || !editingProf.email.trim() || !editingProf.phone.trim()) {
      showNotification("Campos obligatorios inconclusos", "error");
      return;
    }

    setProfessionals(prev => prev.map(p => p.id === editingProf.id ? { 
      ...p, 
      name: editingProf.name, 
      role: editingProf.role,
      email: editingProf.email,
      phone: editingProf.phone
    } : p));

    const updatedUsers = { ...users };
    const oldKey = Object.keys(updatedUsers).find(key => updatedUsers[key].id === editingProf.id);
    if (oldKey) {
      delete updatedUsers[oldKey];
    }
    updatedUsers[editingProf.username.toLowerCase().trim()] = {
      role: 'professional',
      id: editingProf.id,
      password: editingProf.password,
      name: editingProf.name
    };
    setUsers(updatedUsers);

    setEditingProf(null);
    showNotification("Staff modificado correctamente");
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-lg text-black">Miembros de Staff</h3>
          <p className="text-xs text-[#6E6B64] mt-1">Acceso y permisos del espacio coworking.</p>
        </div>
        {!editingProf && (
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> <span>Alta</span>
          </button>
        )}
      </div>

      {showForm && !editingProf && (
        <form onSubmit={handleAddStaff} className="bg-white p-5 rounded-2xl border border-[#EAE5DC] space-y-4 shadow-sm animate-in slide-in-from-top-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-black">Alta de Especialista</h4>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Nombre Completo</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
                   className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none" placeholder="Ej: Dr. Lucas Rivas" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Especialidad</label>
            <input required type="text" value={role} onChange={e => setRole(e.target.value)}
                   className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none" placeholder="Ej: Especialista Facial" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                     className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none" placeholder="lucas@gmail.com" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">WhatsApp</label>
              <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                     className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none" placeholder="54911000000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Usuario de acceso</label>
              <input required type="text" value={username} onChange={e => setUsername(e.target.value)}
                     className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none" placeholder="lucas" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Contraseña</label>
              <input required type="text" value={password} onChange={e => setPassword(e.target.value)}
                     className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none" placeholder="123" />
            </div>
          </div>
          <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm mt-3">Crear Acceso</button>
        </form>
      )}

      {editingProf && (
        <form onSubmit={handleSaveEdit} className="bg-white p-5 rounded-2xl border border-dashed border-gray-400 space-y-4 shadow-sm animate-in zoom-in-95">
          <h4 className="font-bold text-sm uppercase tracking-wider text-black flex justify-between">
            <span>Editar Profesional</span>
            <span className="text-[10px] font-mono text-gray-400">ID: {editingProf.id}</span>
          </h4>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Nombre Completo</label>
            <input required type="text" value={editingProf.name} onChange={e => setEditingProf({...editingProf, name: e.target.value})}
                   className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none font-semibold text-black" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Especialidad</label>
            <input required type="text" value={editingProf.role} onChange={e => setEditingProf({...editingProf, role: e.target.value})}
                   className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none font-semibold text-black" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Email</label>
              <input required type="email" value={editingProf.email} onChange={e => setEditingProf({...editingProf, email: e.target.value})}
                     className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">WhatsApp</label>
              <input required type="tel" value={editingProf.phone} onChange={e => setEditingProf({...editingProf, phone: e.target.value})}
                     className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Usuario Acceso</label>
              <input required type="text" value={editingProf.username} onChange={e => setEditingProf({...editingProf, username: e.target.value})}
                     className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase">Contraseña</label>
              <input required type="text" value={editingProf.password} onChange={e => setEditingProf({...editingProf, password: e.target.value})}
                     className="w-full p-3 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditingProf(null)} className="flex-1 py-3 bg-neutral-100 text-[#6E6B64] rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors">Descartar</button>
            <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-sm active:scale-95 transition-all">Guardar</button>
          </div>
        </form>
      )}

      {/* LISTADO DE STAFF */}
      <div className="space-y-3">
        {professionals.map(p => (
          <div key={p.id} className="p-4 bg-white rounded-xl border border-[#EAE5DC] flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center font-extrabold text-sm text-neutral-800">
                {p.name.charAt(0)}
              </div>
              <div className="text-left">
                <h4 className="font-extrabold text-sm text-black">{p.name}</h4>
                <p className="text-xs text-neutral-500 font-medium">{p.role}</p>
                <p className="text-[10px] text-[#6E6B64] font-bold flex items-center mt-1.5"><Mail className="w-3 h-3 mr-1.5" />{p.email || 'Sin Correo'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button onClick={() => startEdit(p)} className="p-2.5 text-gray-500 hover:bg-neutral-50 rounded-xl transition-colors" title="Editar">
                <Edit3 size={18} />
              </button>
              <button onClick={() => handleDeleteStaff(p.id, p.name)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SUBVISTA: VISTA SEMANAL DE CALENDARIO (SÓLO ADMIN)
// ==========================================
function GeneralCalendarView({ appointments, professionals, variants }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  });

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push({
        dateStr: formatDate(d),
        label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        rawDate: d
      });
    }
    return days;
  }, [currentWeekStart]);

  const changeWeek = (direction) => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(next);
  };

  return (
    <div className="space-y-5 bg-white p-6 rounded-xl border border-[#EAE5DC] text-left animate-in fade-in shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-black flex items-center gap-1.5"><BigCalendar className="w-5 h-5 text-black"/> Calendario Semanal</h3>
          <p className="text-xs text-[#6E6B64] mt-1 font-medium">Monitorea las reservas globales de la semana.</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => changeWeek(-1)} className="p-2.5 bg-neutral-50 border border-[#EAE5DC] rounded-xl hover:bg-neutral-100 transition-all">
            <ChevronLeft className="w-5 h-5"/>
          </button>
          <button onClick={() => changeWeek(1)} className="p-2.5 bg-neutral-50 border border-[#EAE5DC] rounded-xl hover:bg-neutral-100 transition-all">
            <ChevronRight className="w-5 h-5"/>
          </button>
        </div>
      </div>

      <div className="space-y-5 pt-3">
        {weekDays.map(day => {
          const dayAppointments = appointments
            .filter(a => a.date === day.dateStr && a.status !== 'cancelled')
            .sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div key={day.dateStr} className="border-b border-[#FAF9F6] pb-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-black bg-neutral-100 px-3 py-1.5 rounded-lg">
                  {day.label}
                </span>
                <span className="text-xs text-[#6E6B64] font-bold">
                  {dayAppointments.length} turnos
                </span>
              </div>

              {dayAppointments.length === 0 ? (
                <p className="text-xs text-gray-400 italic pl-1 font-medium">Sin turnos agendados.</p>
              ) : (
                <div className="space-y-3 pl-1">
                  {dayAppointments.map(appt => {
                    const variant = variants.find(v => v.id === appt.variantId);
                    const prof = professionals.find(p => p.id === appt.profId);

                    return (
                      <div key={appt.id} className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EAE5DC] flex flex-col space-y-1.5 text-sm shadow-xs">
                        <div className="flex justify-between font-extrabold">
                          <span className="text-black">⏰ {appt.time} hs</span>
                          <span className="text-gray-500 uppercase text-[10px]">👤 {prof?.name.split(' ')[0]}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 font-bold">
                          <span>{appt.clientName}</span>
                          <span className="text-xs text-black font-extrabold">${appt.price.toLocaleString()}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-bold block truncate mt-1">{variant?.name}</span>
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
// MODAL DETALLE DE TURNO (ESTILO BOTTOM SHEET MÓVIL)
// ==========================================
function AppointmentDetailModal({ appt, user, onClose, onSave, isManager, onCompleteAndAddEvol, patients }) {
  const [status, setStatus] = useState(appt.status);
  const [customInstructions, setCustomInstructions] = useState(appt.customInstructions || '');

  const sendWhatsApp = (type = 'confirmation') => {
    const profTemplates = appt.prof?.messageTemplates;
    let templateText = "";

    if (type === 'confirmation') {
      templateText = profTemplates?.confirmation || "¡Hola {Cliente}! Tu turno está agendado con éxito. Te esperamos para {Tratamiento} con {Profesional} el {Fecha} a las {Hora} hs. ¡Muchas gracias!";
    } else {
      templateText = profTemplates?.reminder || "Recordatorio para {Cliente}: Tu turno para {Tratamiento} es mañana a las {Hora} hs. {Indicaciones}";
    }

    const [y, m, d] = appt.date.split('-');
    const formattedDate = `${d}/${m}/${y}`;

    let msg = templateText
      .replace(/{Cliente}/g, appt.clientName)
      .replace(/{Tratamiento}/g, appt.variant?.name || "tratamiento")
      .replace(/{Profesional}/g, appt.prof?.name || "especialista")
      .replace(/{Fecha}/g, formattedDate)
      .replace(/{Hora}/g, appt.time)
      .replace(/{Indicaciones}/g, customInstructions.trim() || "Asistir puntualmente.");

    const phone = appt.clientPhone.replace(/\D/g, ''); 
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const calendarLink = generateGoogleCalendarUrl(appt, appt.variant, appt.prof);
  const patientObj = patients.find(p => p.id === appt.patientId);

  // Filtrar notas clínicas para que sólo vea las suyas.
  const myNote = patientObj?.medicalNotes?.[user.id];
  const hasNote = myNote && myNote.trim() !== '' && myNote !== 'Sin notas médicas registradas aún.';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 flex flex-col space-y-5 text-left">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-[#EAE5DC] pb-5">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Resumen de Turno</span>
            <h3 className="font-extrabold text-xl text-black">{appt.clientName}</h3>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-neutral-100 rounded-full font-bold text-xs text-[#6E6B64] hover:text-black transition-colors">Cerrar</button>
        </div>

        {/* Botón Guardar en Google Calendar */}
        <a href={calendarLink} target="_blank" rel="noopener noreferrer" 
           className="w-full bg-blue-50 text-blue-700 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 border border-blue-100 hover:bg-blue-100 transition-colors">
          <CalendarIcon className="w-5 h-5" /> <span>Agendar en mi Google Calendar</span>
        </a>

        {/* Alerta de Contraindicaciones Clínicas de la Ficha permanente (Solo si la profesional actual tiene notas de este paciente) */}
        {!isManager && hasNote && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block mb-1">⚠️ Mi Nota Privada / Restricción Activa</span>
            <p className="text-sm text-rose-950 mt-1 italic font-medium">"{myNote}"</p>
          </div>
        )}

        {/* Resumen */}
        <div className="bg-[#FAF9F6] p-5 rounded-xl border border-[#EAE5DC] text-sm space-y-3">
          <div className="flex justify-between"><span className="text-neutral-500 font-medium">Servicio:</span> <span className="font-bold text-black">{appt.variant?.name}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500 font-medium">Profesional:</span> <span className="font-bold text-black">{appt.prof?.name}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500 font-medium">Contacto:</span> <span className="font-bold text-black">{appt.clientPhone}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500 font-medium">Fecha y Hora:</span> <span className="font-bold text-black">{appt.date} | {appt.time} hs</span></div>
          <div className="pt-3 border-t border-dashed border-[#EAE5DC] flex justify-between font-bold text-base">
            <span>Cobro Estimado:</span> <span className="font-extrabold">${appt.price.toLocaleString()}</span>
          </div>
        </div>

        {/* Cambiar Estado */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6B64] mb-2">Cambiar Estado</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full p-4 bg-white border border-[#EAE5DC] rounded-xl text-sm font-bold focus:outline-none">
            <option value="pending">⏳ En Espera</option>
            <option value="confirmed">✅ Confirmar</option>
            <option value="completed">🎉 Atendido / Finalizado</option>
            <option value="cancelled">❌ Cancelar Turno</option>
          </select>
        </div>

        {/* Indicaciones */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6B64] mb-2">Notas / Indicaciones previas</label>
          <textarea value={customInstructions} onChange={e => setCustomInstructions(e.target.value)}
                    placeholder="Ej: Acudir con el rostro lavado y sin cremas previas."
                    className="w-full p-4 bg-[#FAF9F6] border border-[#EAE5DC] rounded-xl text-sm h-20 focus:outline-none resize-none font-medium text-black" />
        </div>

        {/* Notificaciones Automatizadas */}
        <div className="space-y-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6B64]">Acción de WhatsApp Directa</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => sendWhatsApp('confirmation')}
                    className="py-3 bg-[#25D366] text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm">
              <MessageCircle className="w-4 h-4" /> <span>Confirmación</span>
            </button>
            <button onClick={() => sendWhatsApp('reminder')}
                    className="py-3 bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm">
              <Bell className="w-4 h-4 text-yellow-400" /> <span>Recordatorio</span>
            </button>
          </div>
        </div>

        {/* Guardar */}
        <div className="pt-3 border-t border-[#EAE5DC] flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 py-4 bg-neutral-100 text-neutral-500 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors">Descartar</button>
          
          {status === 'completed' ? (
            <button onClick={() => onCompleteAndAddEvol({ ...appt, status, customInstructions })} 
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all">
              Atendido & Evolucionar
            </button>
          ) : (
            <button onClick={() => onSave({ ...appt, status, customInstructions })} 
                    className="flex-1 py-4 bg-black text-white rounded-xl font-bold text-sm active:scale-95 transition-all">
              Confirmar Cambios
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
