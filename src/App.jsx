import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Activity, LineChart, BarChart3, ClipboardList, 
  Settings, UserCog, User, MapPin, X, Bot, Bell, 
  Phone, Trash2, Send, Mic, Volume2, VolumeX, ShieldAlert, Menu,
  Mail, ShieldCheck, Globe, Compass, Pill, Navigation, ExternalLink, RefreshCw,
  LocateFixed, Building2, Stethoscope, TestTube2, PhoneCall, Navigation2
} from 'lucide-react';
import MedicineReminder from './components/MedicineReminder/MedicineReminder';
import InAppToast from './components/MedicineReminder/InAppToast';
import MedicalRadarNode from './components/MedicalRadar/MedicalRadarNode';
import LabReportAnalyzerNode from './components/LabReport/LabReportAnalyzerNode';
import { startNotificationScheduler } from './services/notificationScheduler';
import { getDefaultUserId } from './firebase';
import { subscribeReminders, addReminder, deleteReminder } from './services/firestoreReminders';
import { 
  getUserLocation, 
  reverseGeocodeCity, 
  fetchNearbyMedicalPlaces 
} from './services/medicalPlacesService';

// Maps coordinates
const CityCoordinates = {
  "delhi": [28.6139, 77.2090],
  "noida": [28.5355, 77.3910],
  "greater noida": [28.4744, 77.5030],
  "mumbai": [19.0760, 72.8777],
  "bengaluru": [12.9716, 77.5946],
  "new york": [40.7128, -74.0060],
  "london": [51.5074, -0.1278]
};

// Medical knowledge engine profiles
const MedicalKnowledge = {
  "headache": {
    conditions: [
      { name: "Tension Headache", reason: "Symptom matching indicates bilateral mild tightening pain often related to stress or sleep patterns." },
      { name: "Migraine with Aura", reason: "Elevated dizziness alongside headache suggests visual/sensory migraine triggers." }
    ],
    prevention: [
      "Rest in a quiet, dark clinical room.",
      "Stay hydrated (drink 3L water daily).",
      "Avoid excess screen brightness and caffeine triggers."
    ],
    doctors: [
      { name: "Dr. Alok Sharma", specialty: "Consultant Neurologist", phone: "+91 99991-23456", address: "Neuro Clinic, Sector 62, Noida" },
      { name: "Dr. Ritu Verma", specialty: "Clinical Headache Expert", phone: "+91 88882-34567", address: "Fortis Triage Hospital, Noida" }
    ],
    labs: [
      { name: "Noida Neuro Diagnostics Lab", phone: "+91 77773-45678", address: "Sector 18, Noida" }
    ]
  },
  "fever": {
    conditions: [
      { name: "Viral Pyrexia", reason: "High fever accompanied by dry cough suggests acute respiratory clinical exposure." },
      { name: "Influenza (Flu)", reason: "Onset within 48 hours points to viral influenza strains currently active in Greater Noida." }
    ],
    prevention: [
      "Frequent saline warm water gargling.",
      "Monitor body temperature every 4 hours.",
      "Take Paracetamol as prescribed by your doctor."
    ],
    doctors: [
      { name: "Dr. Sandeep Gupta", specialty: "Senior Physician", phone: "+91 99112-23344", address: "Alpha Diagnostics Center, Greater Noida" },
      { name: "Dr. Nidhi Malhotra", specialty: "Respiratory Specialist", phone: "+91 98100-55667", address: "Max Wellness Clinic, Noida" }
    ],
    labs: [
      { name: "Apollo Pathological Lab", phone: "+91 78901-23456", address: "Beta 1 Market, Greater Noida" }
    ]
  },
  "stomach": {
    conditions: [
      { name: "Acute Gastroenteritis", reason: "Sharp cramps alongside stomach nausea points to foodborne viral stomach inflammation." },
      { name: "Gastric Hyperacidity", reason: "Localized belly burning indicates acid reflux exacerbated by spicy meals." }
    ],
    prevention: [
      "Stick to a plain clinical diet (rice, toast).",
      "Sip coconut water or ORS liquid frequently.",
      "Avoid raw milk and dairy items for 48 hours."
    ],
    doctors: [
      { name: "Dr. Vikram Seth", specialty: "Gastroenterologist MD", phone: "+91 95400-88990", address: "Sharda Health University, Greater Noida" },
      { name: "Dr. Poonam Singhal", specialty: "Consultant Gastrologist", phone: "+91 87654-32109", address: "Sector 50 Health Hub, Noida" }
    ],
    labs: [
      { name: "Lal PathLabs Diagnostics", phone: "+91 800-258-5000", address: "G-Block Market, Greater Noida" }
    ]
  },
  "general": {
    conditions: [
      { name: "Mild Somatic Fatigue", reason: "Non-specific diagnostics indicate sleep deficit or standard muscular strain." }
    ],
    prevention: [
      "Aim for 8 hours of deep clinical rest.",
      "Engage in mild walking or stretching exercises."
    ],
    doctors: [
      { name: "Dr. Amit Roy", specialty: "Primary General Practitioner", phone: "+91 99990-11122", address: "Docure Clinic Sector 110, Noida" }
    ],
    labs: [
      { name: "Docure Central Lab Testing", phone: "+91 99990-22233", address: "Knowledge Park 3, Greater Noida" }
    ]
  }
};

// Transparent WebM video player with auto-unmute and no button overlays
const ChromaKeyVideo = ({ src }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt to play unmuted on load
    video.muted = false;
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay with audio blocked: fallback to muted autoplay so she keeps moving
        video.muted = true;
        video.play().catch(() => {});
      });
    }

    // Unmute on first user interaction anywhere on the document
    const handleUserInteraction = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(() => {});
      }
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [src]);

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-visible">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        playsInline
        className="w-full h-full object-contain overflow-visible filter contrast-[1.02]"
        style={{ mixBlendMode: 'multiply' }}
      />
    </div>
  );
};

// Premium 3D Rotating About Flashcards Carousel
const AboutCarousel = () => {
  const [activeIndex, setActiveIndex] = React.useState(4); // Start centered at index 4 (5th card)
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev === 9 ? 0 : prev + 1));
    }, 1000); // Changes every 1 second
    return () => clearInterval(interval);
  }, [isHovered]);

  const cards = [
    {
      id: "01",
      title: "Clinically Calibrated",
      tagline: "ALGORITHM",
      desc: "Designed to bridge the gap between patient concerns and professional triage using logical symptoms pathing. The system processes inputs against structured clinical matrices to guide users toward the most appropriate care level.",
      color: "from-teal-500/5 to-teal-500/15",
      accent: "text-[#0f766e] border-[#0f766e]/10 bg-[#0f766e]/5"
    },
    {
      id: "02",
      title: "Secure Health Sandbox",
      tagline: "PRIVACY",
      desc: "Client-side encryption and locally stored records. We align with industry standards to keep data private. Patient information is compiled directly inside your local environment, ensuring that diagnostic insights remain entirely under your ownership.",
      color: "from-emerald-500/5 to-emerald-500/15",
      accent: "text-emerald-600 border-emerald-500/15 bg-emerald-500/5"
    },
    {
      id: "03",
      title: "Interactive Care Mascot",
      tagline: "EXPERIENCE",
      desc: "An intuitive clinical mascot that reacts dynamically to UI state. Voice guidance loops keep users engaged. By providing visual prompts and vocal indicators, the mascot simplifies navigation and reduces patient anxiety during triage.",
      color: "from-indigo-500/5 to-indigo-500/15",
      accent: "text-indigo-600 border-indigo-500/15 bg-indigo-500/5"
    },
    {
      id: "04",
      title: "Biomarker Scanning",
      tagline: "COMPUTER VISION",
      desc: "Instantly parse blood panels and clinical lab reports using computer vision to flag out-of-range indicators. The OCR system reads structured metrics and maps them to normal medical intervals to highlight anomalies safely.",
      color: "from-rose-500/5 to-rose-500/15",
      accent: "text-rose-600 border-rose-500/15 bg-rose-500/5"
    },
    {
      id: "05",
      title: "Verified Referrals",
      tagline: "REFERRALS",
      desc: "Direct integration with accredited city clinics and diagnostic lab networks. Find verified local specialists in Greater Noida with matching coordinates, enabling immediate scheduling and direct communication.",
      color: "from-amber-500/5 to-amber-500/15",
      accent: "text-amber-600 border-amber-500/15 bg-amber-500/5"
    },
    {
      id: "06",
      title: "Cognitive AI Engine",
      tagline: "ANALYSIS",
      desc: "Extract clinical symptoms severity, affected anatomical systems, and priority flags via advanced AI parsing. The cognitive parsing module flags critical concerns and helps categorize patient records for efficient triage.",
      color: "from-violet-500/5 to-violet-500/15",
      accent: "text-violet-600 border-violet-500/15 bg-violet-500/5"
    },
    {
      id: "07",
      title: "Emergency Desk SOS",
      tagline: "SAFETY DESK",
      desc: "Trigger emergency coordinates and broadcast patient info to emergency links on critical severity classification. The instant safety desk ensures family links and nearby care networks receive real-time notifications.",
      color: "from-red-500/5 to-red-500/15",
      accent: "text-red-600 border-red-500/15 bg-red-500/5"
    },
    {
      id: "08",
      title: "Interactive Mapping",
      tagline: "FACILITIES MAP",
      desc: "Geospatial search of verified health practitioners, clinics, and laboratories matching diagnostic coordinates. Visual markers display clinic status, working hours, and specialist credentials for easy local selection.",
      color: "from-cyan-500/5 to-cyan-500/15",
      accent: "text-cyan-600 border-cyan-500/15 bg-cyan-500/5"
    },
    {
      id: "09",
      title: "Local Records Vault",
      tagline: "ENCRYPTION KEYS",
      desc: "Secure storage sandbox for client history files, allowing user-authorized records downloads or wipes. Decryption keys are stored strictly client-side, giving you absolute authority over when your history is stored or erased.",
      color: "from-sky-500/5 to-sky-500/15",
      accent: "text-sky-600 border-sky-500/15 bg-sky-500/5"
    },
    {
      id: "10",
      title: "Diagnostic Trackers",
      tagline: "RECORDS",
      desc: "Keep history logs of all clinical triage outputs and test reports analysis for comprehensive health timelines. The records interface tracks trends in biomarkers, symptom occurrences, and clinic visits over time.",
      color: "from-fuchsia-500/5 to-fuchsia-500/15",
      accent: "text-fuchsia-600 border-fuchsia-500/15 bg-fuchsia-500/5"
    }
  ];

  const handlePrev = () => {
    setActiveIndex(prev => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full flex flex-col items-center py-20 relative z-20 overflow-visible mt-8">
      {/* Dynamic Background Spotlight */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0">
        <div className="w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-700 bg-emerald-500/5" />
      </div>

      {/* Title */}
      <div className="text-center mb-16 relative z-10">
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#0f766e]/80 uppercase px-3 py-1 bg-[#0f766e]/5 border border-[#0f766e]/10 rounded-full">
          Selected Pillars
        </span>
        <h2 className="font-serif text-4xl font-extrabold text-brand-textDark mt-3 tracking-tight">
          Selected principles, <span className="text-brand-accent italic">framed in light</span>
        </h2>
      </div>

      {/* 3D Perspective Card Slider Wrapper (Full width max-w-7xl, height adjusted to 300px) */}
      <div 
        className="relative w-full max-w-7xl h-[300px] flex items-center justify-center overflow-visible z-10 px-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {cards.map((card, idx) => {
          const diff = idx - activeIndex;
          const isActive = idx === activeIndex;
          
          // Calculate 3D perspective translations with expanded spacing (320px separation)
          const translateX = diff * 320; // Spaced further apart horizontally
          const scale = 1 - Math.abs(diff) * 0.1; // scale step
          const translateZ = -Math.abs(diff) * 100; // depth translation
          const rotateY = diff * -15; // 3D Y-axis angle (subtle curved layout)
          const opacity = 1 - Math.abs(diff) * 0.28; // keeps neighboring cards visible
          
          return (
            <div
              key={card.id}
              onClick={() => setActiveIndex(idx)}
              className="absolute w-[285px] h-[260px] rounded-[32px] p-6 flex flex-col justify-start gap-4 transition-all duration-700 ease-out cursor-pointer shadow-2xl select-none animate-card-glow"
              style={{
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(244, 252, 251, 0.8) 100%)`,
                border: isActive ? '2.5px solid #0f766e' : '1px solid rgba(15, 118, 110, 0.15)',
                boxShadow: isActive 
                  ? '0 20px 40px rgba(15, 118, 110, 0.15), 0 0 20px rgba(15, 118, 110, 0.08)'
                  : '0 8px 24px rgba(0, 0, 0, 0.03)',
                transform: `perspective(1000px) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity: opacity >= 0 ? opacity : 0,
                zIndex: 50 - Math.abs(diff),
                backdropFilter: 'blur(20px)',
                pointerEvents: Math.abs(diff) > 2 ? 'none' : 'auto'
              }}
            >
              {/* Card Top Details */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className={`text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 border rounded-full uppercase ${card.accent}`}>
                    {card.tagline}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#0f766e] mt-3 leading-snug">
                  {card.title}
                </h3>
              </div>

              {/* Card Bottom Description */}
              <p className="text-[12px] text-slate-600 leading-relaxed font-sans">
                {card.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Carousel Navigation, Caption and Index Indicators */}
      <div className="w-full max-w-xl flex items-center justify-between mt-12 z-20 px-6">
        {/* Caption Info Left */}
        <div className="text-left">
          <span className="text-[9px] font-mono text-brand-textMuted tracking-wider uppercase block">Active Principle</span>
          <span className="font-mono text-sm font-black text-[#0f766e] tracking-tight transition-all duration-300">
            {cards[activeIndex].title}
          </span>
        </div>

        {/* Indicators Dots and Arrows Right */}
        <div className="flex items-center gap-6">
          <div className="flex gap-1.5">
            {cards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-6 bg-[#0f766e]' : 'w-1.5 bg-[#0f766e]/20'}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-white border border-[#0f766e]/15 flex items-center justify-center text-[#0f766e] hover:bg-[#0f766e]/5 transition-all active:scale-95 shadow-sm text-sm"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-white border border-[#0f766e]/15 flex items-center justify-center text-[#0f766e] hover:bg-[#0f766e]/5 transition-all active:scale-95 shadow-sm text-sm"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Premium Landing Multi-column Footer
const LandingFooter = ({ setActivePage, setActiveTab }) => {
  return (
    <footer className="w-full bg-gradient-to-b from-transparent to-[#0f766e]/[0.03] border-t border-[#0f766e]/15 py-20 px-10 relative z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
        {/* Brand Column */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <img src="assets/logo_original.png?v=5" alt="DOCURE Logo" className="h-9 w-auto mix-blend-multiply hover:scale-105 transition-transform duration-300" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[22px] font-black tracking-[0.18em] text-[#0f766e]">DOCURE</span>
              <span className="text-[8px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded-full uppercase leading-none">v2.0</span>
            </div>
          </div>
          <p className="text-[11px] text-brand-textMuted leading-relaxed max-w-xs">
            Advanced clinical intelligence interface built on locally encrypted sandboxes. Providing diagnostic triage clarity, biometric parsing, and specialized care routing.
          </p>
        </div>

        {/* Column 2: Platform Links */}
        <div>
          <h4 className="font-mono text-xs font-extrabold text-[#0f766e] tracking-[0.15em] uppercase mb-5 relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-5 after:h-[1.5px] after:bg-[#0f766e]/30">Platform</h4>
          <ul className="flex flex-col gap-3 text-[11px] text-brand-textMuted font-sans">
            <li>
              <button 
                onClick={() => { setActivePage('dashboard'); setActiveTab('reduce'); }} 
                className="flex items-center gap-2 hover:text-[#0f766e] hover:translate-x-1 transition-all duration-300 text-left group"
              >
                <span className="w-1 h-1 rounded-full bg-[#0f766e]/30 group-hover:bg-[#0f766e] transition-colors" />
                <span>Symptom Chat (Triage Desk)</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setActivePage('dashboard'); setActiveTab('maps'); }} 
                className="flex items-center gap-2 hover:text-[#0f766e] hover:translate-x-1 transition-all duration-300 text-left group"
              >
                <span className="w-1 h-1 rounded-full bg-[#0f766e]/30 group-hover:bg-[#0f766e] transition-colors" />
                <span>Clinic & Laboratory Directory</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setActivePage('dashboard'); setActiveTab('report'); }} 
                className="flex items-center gap-2 hover:text-[#0f766e] hover:translate-x-1 transition-all duration-300 text-left group"
              >
                <span className="w-1 h-1 rounded-full bg-[#0f766e]/30 group-hover:bg-[#0f766e] transition-colors" />
                <span>Blood Panel Scanner</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setActivePage('dashboard'); setActiveTab('settings'); }} 
                className="flex items-center gap-2 hover:text-[#0f766e] hover:translate-x-1 transition-all duration-300 text-left group"
              >
                <span className="w-1 h-1 rounded-full bg-[#0f766e]/30 group-hover:bg-[#0f766e] transition-colors" />
                <span>Patient Health Records</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact & Support */}
        <div>
          <h4 className="font-mono text-xs font-extrabold text-[#0f766e] tracking-[0.15em] uppercase mb-5 relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-5 after:h-[1.5px] after:bg-[#0f766e]/30">Contact & Support</h4>
          <ul className="flex flex-col gap-3 text-[11px] text-brand-textMuted font-sans">
            <li className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-[#0f766e]/70 shrink-0 mt-0.5" />
              <div>
                <span className="text-brand-textDark font-semibold block text-[10px] uppercase tracking-wider">NCR Desk</span>
                <span className="text-[#0f766e]/85 font-mono">contact@docure.in</span>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-[#0f766e]/70 shrink-0 mt-0.5" />
              <div>
                <span className="text-brand-textDark font-semibold block text-[10px] uppercase tracking-wider">Emergency SOS Desk</span>
                <span className="text-rose-600 font-mono font-medium">112</span>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-[#0f766e]/70 shrink-0 mt-0.5" />
              <a href="#" className="hover:text-[#0f766e] hover:translate-x-0.5 transition-all duration-300">Clinical Safety Protocols</a>
            </li>
          </ul>
        </div>

        {/* Column 4: Compliance Certificates */}
        <div>
          <h4 className="font-mono text-xs font-extrabold text-[#0f766e] tracking-[0.15em] uppercase mb-5 relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-5 after:h-[1.5px] after:bg-[#0f766e]/30">Compliance</h4>
          <ul className="flex flex-col gap-2.5 text-[11px] text-brand-textMuted font-sans">
            <li className="flex items-center gap-2 hover:text-[#0f766e] transition-colors cursor-default">
              <ShieldCheck className="w-4 h-4 text-[#0f766e]/80 shrink-0" />
              <span>HIPAA Aligned Sandbox</span>
            </li>
            <li className="flex items-center gap-2 hover:text-[#0f766e] transition-colors cursor-default">
              <ShieldCheck className="w-4 h-4 text-[#0f766e]/80 shrink-0" />
              <span>Client-Side Data Sanitization</span>
            </li>
            <li className="flex items-center gap-2 hover:text-[#0f766e] transition-colors cursor-default">
              <ShieldCheck className="w-4 h-4 text-[#0f766e]/80 shrink-0" />
              <span>ISO 27001 Security Standard</span>
            </li>
            <li className="flex items-center gap-2 hover:text-[#0f766e] transition-colors cursor-default">
              <ShieldCheck className="w-4 h-4 text-[#0f766e]/80 shrink-0" />
              <span>Verified Local Clinic Network</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto h-[1px] bg-[#0f766e]/10 my-8" />

      {/* Copyright row */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-brand-textMuted font-mono">
        <span>© 2026 DOCURE Health Technologies Inc. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-[#0f766e] hover:underline transition-all">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-[#0f766e] hover:underline transition-all">Terms of Use</a>
          <span>•</span>
          <a href="#" className="hover:text-[#0f766e] hover:underline transition-all">Security Standards</a>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  // Page routing
  const [activePage, setActivePage] = useState('landing');
  const [activeTab, setActiveTab] = useState('reduce');
  Phone, Trash2, Send, Mic, Volume2, VolumeX, ShieldAlert, Menu,
  Mail, ShieldCheck, Globe, Compass, Pill, Navigation, ExternalLink, RefreshCw,
  LocateFixed, Building2, Stethoscope, TestTube2, PhoneCall, Navigation2
  
  // Profile settings state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "Anushka Pandey",
    age: 21,
    gender: "Female",
    blood: "B+",
    contact: "+1 (555) 019-9988",
    city: "GREATER NOIDA",
    chronic: "Mild Asthma"
  });

  // Dynamic tags managers
  const [allergies, setAllergies] = useState(["Penicillin"]);
  const [conditions, setConditions] = useState(["Mild Asthma"]);
  const [medications, setMedications] = useState([]);

  // Tags input temporary strings
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState("");

  // Prescriptions list
  const [prescriptions, setPrescriptions] = useState([]);
  const [newPrescName, setNewPrescName] = useState("");
  const [newPrescTime, setNewPrescTime] = useState("");
  const [prescFormOpen, setPrescFormOpen] = useState(false);

  // Wellness Heartbeat params
  const [risk, setRisk] = useState('Normal');
  const [pulse, setPulse] = useState(72);
  const ekgCanvasRef = useRef(null);

  // Map settings & Live Geolocation State
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const placesMarkersMapRef = useRef(new Map());

  const [userCoords, setUserCoords] = useState({ lat: 28.4744, lng: 77.5030 }); // Default Greater Noida / NCR
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState('all'); // 'all' | 'hospital' | 'doctor' | 'lab' | 'pharmacy'
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationAddress, setLocationAddress] = useState('Greater Noida, UP');

  // File upload indicator state
  const [uploadingReport, setUploadingReport] = useState(false);

  // Chat message engine state
  const [chat, setChat] = useState([
    {
      sender: "docure",
      text: "Hello! I am **DOCURE**, your AI health assistant. 🩺\n\nI can analyze **symptoms**, check **pill reminders**, and parse your **blood test reports**.\n\nPlease describe the **symptoms** you are experiencing or upload a report below!"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatState, setChatState] = useState("INTAKE_SYMPTOMS");
  
  // User triaging temp parameters
  const [userSymptoms, setUserSymptoms] = useState("");
  const [userOnset, setUserOnset] = useState("");
  const [userSeverity, setUserSeverity] = useState("");
  const [userContext, setUserContext] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [matchedProfile, setMatchedProfile] = useState(MedicalKnowledge.general);
  const [isTyping, setIsTyping] = useState(false);

  // Speech configurations
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // SOS Emergency details
  const [sosOpen, setSosOpen] = useState(false);
  const [sosTimer, setSosTimer] = useState(30);
  const [smsStatus, setSmsStatus] = useState("DISPATCHING SMS...");
  const sosCountdownRef = useRef(null);
  const sirenIntervalRef = useRef(null);

  // Quick symptoms chips options
  const [symptomOptions, setSymptomOptions] = useState({
    title: "Quick Symptoms:",
    items: [
      { label: "Headache", full: "I have a mild headache and feel slightly dizzy." },
      { label: "Fever & Cough", full: "I have a high fever with dry cough." },
      { label: "Stomach Cramps", full: "I feel sharp cramps in my stomach." },
      { label: "⚠️ Chest Pain", full: "I have sudden crushing chest pain and shortness of breath." }
    ]
  });

  // Handle voice synthesis
  const speakText = (text) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Clean markdown
    let clean = text.replace(/<[^>]*>/g, ' ')
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/🩺|🚨|⚠️|📋|👨‍⚕️|🔬|»/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                    
    if (clean.includes("Recommended Specialists Nearby:")) {
      clean = clean.split("Recommended Specialists Nearby:")[0] + 
              " I have updated the nearby specialist clinics and testing centers on the map panel on your screen. Please review their contact numbers and schedules.";
    }
    
    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const voiceChoice = voices.find(v => 
      v.name.includes("Google US English") || 
      v.name.includes("Google UK English Female") || 
      v.lang.startsWith("en-")
    );
    if (voiceChoice) utterance.voice = voiceChoice;
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Heartbeat canvas animation loop
  useEffect(() => {
    if (!ekgCanvasRef.current) return;
    const canvas = ekgCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let ekgTraceX = 0;
    let frameId;
    
    const render = () => {
      ctx.fillStyle = "rgba(15, 23, 42, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      let colorHex = "#10b981";
      if (risk === "SOS") colorHex = "#f43f5e";
      else if (risk === "Elevated") colorHex = "#8b5cf6";
      
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 4;
      ctx.shadowColor = colorHex;
      
      ctx.beginPath();
      ctx.moveTo(ekgTraceX - 2, canvas.height / 2);
      
      let y = canvas.height / 2;
      let cycleWidth = (risk === "SOS") ? 40 : ((risk === "Elevated") ? 60 : 80);
      let pos = ekgTraceX % cycleWidth;
      
      if (pos > 10 && pos < 13) y = canvas.height / 2 - 3;
      else if (pos >= 15 && pos < 17) y = canvas.height / 2 + 5;
      else if (pos >= 17 && pos < 20) y = 4;
      else if (pos >= 20 && pos < 22) y = canvas.height - 4;
      else if (pos >= 24 && pos < 28) y = canvas.height / 2 - 5;
      
      ctx.lineTo(ekgTraceX, y);
      ctx.stroke();
      
      let speed = (risk === "SOS") ? 2.5 : ((risk === "Elevated") ? 1.7 : 1.2);
      ekgTraceX += speed;
      if (ekgTraceX > canvas.width) {
        ekgTraceX = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      frameId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(frameId);
  }, [risk]);

  Phone, Trash2, Send, Mic, Volume2, VolumeX, ShieldAlert, Menu,
  Mail, ShieldCheck, Globe, Compass, Pill, Navigation, ExternalLink, RefreshCw,
  LocateFixed, Building2, Stethoscope, TestTube2, PhoneCall, Navigation2
    markersGroupRef.current.clearLayers();
    placesMarkersMapRef.current.clear();

    const uLat = userLocation?.lat || userCoords.lat;
    const uLng = userLocation?.lng || userCoords.lng;

    // Plot User's live location radar pin
    if (uLat && uLng) {
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch(e) {}
      }
      const userIcon = window.L.divIcon({
        className: 'user-live-pin',
        html: '<div style="position:relative; width:20px; height:20px; display:flex; align-items:center; justify-content:center;"><div style="position:absolute; width:20px; height:20px; border-radius:50%; background:#2563eb; opacity:0.35; animation:pulse-status 1.5s infinite;"></div><div style="width:12px; height:12px; border-radius:50%; background:#2563eb; border:2.5px solid white; box-shadow:0 0 10px rgba(37,99,235,0.9);"></div></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      userMarkerRef.current = window.L.marker([uLat, uLng], { icon: userIcon })
        .bindPopup(`<div style="font-family:sans-serif; font-size:11px;"><strong>📍 Your Current Location</strong><br><span style="color:#64748b;">${locationAddress || 'Detected GPS'}</span></div>`)
        .addTo(mapInstanceRef.current);
    }

    // Plot each nearby doctor/hospital/lab/pharmacy pin
    places.forEach((place) => {
      if (!place.lat || !place.lng) return;

      let bgColor = '#0f766e';
      let shadowColor = 'rgba(15,118,110,0.6)';
      let pulseColor = 'rgba(15,118,110,0.25)';
      let emoji = '🏥';
      let tagLabel = 'HOSPITAL';

      if (place.type === 'doctor') {
        bgColor = '#2563eb';
        shadowColor = 'rgba(37,99,235,0.6)';
        pulseColor = 'rgba(37,99,235,0.25)';
        emoji = '👨‍⚕️';
        tagLabel = 'DOCTOR / CLINIC';
      } else if (place.type === 'lab') {
        bgColor = '#8b5cf6';
        shadowColor = 'rgba(139,92,246,0.6)';
        pulseColor = 'rgba(139,92,246,0.25)';
        emoji = '🔬';
        tagLabel = 'DIAGNOSTIC LAB';
      } else if (place.type === 'pharmacy') {
        bgColor = '#10b981';
        shadowColor = 'rgba(16,185,129,0.6)';
        pulseColor = 'rgba(16,185,129,0.25)';
        emoji = '💊';
        tagLabel = 'PHARMACY';
      }

      const iconHtml = `
        <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="${place.name}">
          <div style="position:absolute; width:32px; height:32px; border-radius:50%; background:${pulseColor}; animation:pulse-status 2s infinite;"></div>
          <div style="width:26px; height:26px; border-radius:50%; background:${bgColor}; border:2.5px solid white; box-shadow:0 3px 10px ${shadowColor}; display:flex; align-items:center; justify-content:center; font-size:12px; transform:translateZ(0); text-shadow:0 1px 2px rgba(0,0,0,0.2);">
            ${emoji}
          </div>
        </div>
      `;

      const icon = window.L.divIcon({
        className: `custom-medical-pin ${place.type}-pin`,
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; min-width: 210px; color: #0f172a; padding: 2px;">
          <div style="font-size: 9px; font-weight: 700; color: ${bgColor}; text-transform: uppercase; margin-bottom: 2px; display:flex; align-items:center; gap:4px;">
            <span>${emoji}</span>
            <span>${tagLabel}</span>
          </div>
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 3px; line-height: 1.25; color:#0f172a;">${place.name}</div>
          <div style="color: #64748b; font-size: 10px; margin-bottom: 4px; line-height: 1.3;">${place.address}</div>
          <div style="font-weight: 600; color: #0f766e; font-size: 11px; margin-bottom: 6px;">📏 ${place.distanceKm} (${place.drivingTime})</div>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <a href="tel:${place.phone}" style="flex: 1; text-align: center; background: #0f766e; color: white; padding: 6px 8px; border-radius: 8px; text-decoration: none; font-size: 10px; font-weight: 700;">📞 Call</a>
            <a href="${place.directionsUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #2563eb; color: white; padding: 6px 8px; border-radius: 8px; text-decoration: none; font-size: 10px; font-weight: 700;">🗺️ Route</a>
          </div>
        </div>
      `;

      const marker = window.L.marker([place.lat, place.lng], { icon })
        .bindPopup(popupContent)
        .addTo(markersGroupRef.current);
      
      placesMarkersMapRef.current.set(place.id, marker);
    });
  };

  // Fetch real-time nearby medical places from TomTom service
  const loadRealNearbyPlaces = async (lat, lng, category = 'all') => {
    if (!lat || !lng) return;
    try {
      const places = await fetchNearbyMedicalPlaces(lat, lng, category);
      setNearbyPlaces(places);
      plotPlacesOnMap(places, { lat, lng });
    } catch (err) {
      console.error('Error loading nearby places:', err);
    }
  };

  // Detect user's live GPS location and refresh nearby facilities
  const handleDetectUserLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await getUserLocation();
      if (loc && loc.lat && loc.lng) {
        setUserCoords({ lat: loc.lat, lng: loc.lng });
        
        // Reverse geocode to readable address
        const geoInfo = await reverseGeocodeCity(loc.lat, loc.lng);
        setLocationAddress(geoInfo.formattedAddress || geoInfo.city);
        setProfile(prev => ({ ...prev, city: geoInfo.city }));

        // Center map on user location
        if (mapInstanceRef.current && window.L) {
          mapInstanceRef.current.setView([loc.lat, loc.lng], 14);
        }

        // Fetch real-time medical places around user
        await loadRealNearbyPlaces(loc.lat, loc.lng, selectedPlaceCategory);
      }
    } catch (err) {
      console.error('Location detection failed:', err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Center map on place card click
  const handlePlaceCardClick = (place) => {
    if (!mapInstanceRef.current || !place.lat || !place.lng) return;
    mapInstanceRef.current.flyTo([place.lat, place.lng], 16, { animate: true, duration: 0.8 });
    const marker = placesMarkersMapRef.current.get(place.id);
    if (marker) {
      setTimeout(() => marker.openPopup(), 500);
    }
  };

  // Handle category filter change (all, hospital, doctor, lab, pharmacy)
  const handleCategoryFilterChange = async (cat) => {
    setSelectedPlaceCategory(cat);
    const lat = userCoords?.lat || 28.4744;
    const lng = userCoords?.lng || 77.5030;
    await loadRealNearbyPlaces(lat, lng, cat);
  };

  // Fallback / legacy map loader compatibility
  const loadMapMarkers = (city) => {
    handleDetectUserLocation();
  };

  // Initialize Leaflet Map once dashboard displays
  useEffect(() => {
    if (activePage === 'dashboard') {
      setTimeout(() => {
        if (!window.L) return;
        if (mapRef.current && !mapInstanceRef.current) {
          try {
            const inst = window.L.map(mapRef.current, {
              zoomControl: true,
              attributionControl: false
            }).setView([28.4744, 77.5030], 13);
            
            window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
              maxZoom: 18
            }).addTo(inst);
            
            markersGroupRef.current = window.L.layerGroup().addTo(inst);
            mapInstanceRef.current = inst;
            
            // Auto detect user location and load real nearby medical places
            handleDetectUserLocation();
          } catch (e) {
            console.error("Leaflet init error:", e);
          }
        }
      }, 200);
    }
  }, [activePage]);

  // Cursor tracking for interactive spotlight background
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Audio tone generation for siren
  const playBeepTone = (frequency, duration) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("AudioContext tone blocked:", e);
    }
  };

  // Trigger Emergency Override
  const triggerEmergency = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    setRisk("SOS");
    setPulse(142);
    setSosOpen(true);
    setSmsStatus("DISPATCHING SMS...");
    
    // SMS countdown simulation
    setTimeout(() => {
      setSmsStatus(`SENT TO ${profile.contact}!`);
    }, 2500);
    
    setSosTimer(30);
    if (sosCountdownRef.current) clearInterval(sosCountdownRef.current);
    sosCountdownRef.current = setInterval(() => {
      setSosTimer((prev) => {
        if (prev <= 1) {
          clearInterval(sosCountdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Siren sound loop
    if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
    sirenIntervalRef.current = setInterval(() => {
      playBeepTone(880, 0.2);
      setTimeout(() => playBeepTone(660, 0.2), 300);
    }, 1500);
    
    // Add messages logs
    setChat(prev => [
      ...prev,
      { sender: "user", text: "⚠️ Emergency Protocol Triggered" },
      {
        sender: "docure",
        text: `🚨 **CRITICAL EMERGENCY SOS OVERRIDE INITIATED** 🚨\n\nWe have detected signs of severe cardiac or physical distress. \n\n**1. Immediate ambulance dispatch coordinates sent.**\n**2. Emergency family alert dispatched to: ${profile.contact}.**\n\nPlease dial 102 immediately or head to the nearest clinic.`
      }
    ]);
  };

  // Stop Emergency Siren
  const stopEmergency = () => {
    setSosOpen(false);
    setRisk("Normal");
    setPulse(72);
    if (sosCountdownRef.current) clearInterval(sosCountdownRef.current);
    if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
  };

  // Chat message engine logic
  const handleSendMessage = (textToSend) => {
    const query = textToSend || chatInput.trim();
    if (!query) return;
    
    setChat(prev => [...prev, { sender: "user", text: query }]);
    setChatInput("");
    
    // Check emergency override keywords
    const keywords = ["chest pain", "breathing issue", "heart attack", "choking", "unconscious", "sos", "stroke"];
    if (keywords.some(k => query.toLowerCase().includes(k))) {
      triggerEmergency();
      return;
    }
    
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      
      switch (chatState) {
        case "INTAKE_SYMPTOMS":
          setUserSymptoms(query);
          setChatState("INTAKE_ONSET");
          setSymptomOptions({
            title: "Onset:",
            items: [
              { label: "Just today", full: "Just today" },
              { label: "Last 2 days", full: "Last 2 days" },
              { label: "More than a week", full: "More than a week" }
            ]
          });
          appendBotResponse(`Understood. How long have you been experiencing this symptom? (*${query}*)`);
          break;
          
        case "INTAKE_ONSET":
          setUserOnset(query);
          setChatState("INTAKE_SEVERITY");
          setSymptomOptions({
            title: "Severity:",
            items: [
              { label: "1-3 (Mild)", full: "1-3 (Mild)" },
              { label: "4-6 (Moderate)", full: "4-6 (Moderate)" },
              { label: "7-10 (Severe)", full: "7-10 (Severe)" }
            ]
          });
          appendBotResponse(`Got it. On a scale of **1 to 10** (1 being very minor and 10 being severe distress), how would you rate your pain/discomfort?`);
          break;
          
        case "INTAKE_SEVERITY":
          setUserSeverity(query);
          setChatState("INTAKE_CONTEXT");
          if (query.includes("7") || query.includes("8") || query.includes("9") || query.includes("10") || query.includes("Severe")) {
            setRisk("Elevated");
            setPulse(98);
          } else {
            setRisk("Normal");
            setPulse(72);
          }
          setSymptomOptions({
            title: "Context:",
            items: [
              { label: "Asthma & Albuterol", full: "Asthma & Albuterol" },
              { label: "None / Healthy", full: "None / Healthy" },
              { label: "High Blood Pressure", full: "High Blood Pressure" }
            ]
          });
          appendBotResponse(`Please list any pre-existing conditions, age, or current medications to personalize diagnostic analysis.`);
          break;
          
        case "INTAKE_CONTEXT":
          setUserContext(query);
          setChatState("LOCATION_ASK");
          
          let lowerSymptoms = userSymptoms.toLowerCase();
          let profileKey = "general";
          if (lowerSymptoms.includes("head") || lowerSymptoms.includes("migraine") || lowerSymptoms.includes("dizzy")) {
            profileKey = "headache";
          } else if (lowerSymptoms.includes("fever") || lowerSymptoms.includes("cough") || lowerSymptoms.includes("cold") || lowerSymptoms.includes("throat")) {
            profileKey = "fever";
          } else if (lowerSymptoms.includes("stomach") || lowerSymptoms.includes("belly") || lowerSymptoms.includes("nausea")) {
            profileKey = "stomach";
          }
          
          const targetProf = MedicalKnowledge[profileKey];
          setMatchedProfile(targetProf);
          
          let analysisHTML = `### AI Triaging Analysis Summary\nBased on your responses, here are potential clinical conditions for your profile (Age: *${profile.age}*, Symptoms: *${userSymptoms}*):\n\n`;
          targetProf.conditions.forEach((cond, idx) => {
            analysisHTML += `**${idx + 1}. ${cond.name}**\n${cond.reason}\n\n`;
          });
          analysisHTML += `\n⚠️ **AI Triage Disclaimer:** DOCURE is an automated assistant. This evaluation does not replace in-person physician checks.\n\n### Safe Home Care Practices\n`;
          targetProf.prevention.forEach(step => {
            analysisHTML += `• ${step}\n`;
          });
          analysisHTML += `\n**Urgent Warning:** If you experience any breathing issues, fainting, or sudden arm/chest pain, request SOS immediately.`;
          
          appendBotResponse(analysisHTML);
          
          setTimeout(() => {
            setSymptomOptions({
              title: "Cities:",
              items: [
                { label: "New Delhi", full: "New Delhi" },
                { label: "Mumbai", full: "Mumbai" },
                { label: "New York", full: "New York" },
                { label: "London", full: "London" }
              ]
            });
            appendBotResponse(`To display nearby specialists and testing centers on the map, could you tell me your **current city**?`);
          }, 1200);
          break;
          
        case "LOCATION_ASK":
          setUserLocation(query);
          setChatState("RECS_GIVEN");
          loadMapLocationsDynamic(query);
          break;
      }
    }, 800);
  };

  const loadMapLocationsDynamic = (cityText) => {
    loadMapMarkers(cityText);
    
    // Choose appropriate profile
    let profileKey = "general";
    let lowerSymptoms = userSymptoms.toLowerCase();
    if (lowerSymptoms.includes("head") || lowerSymptoms.includes("migraine") || lowerSymptoms.includes("dizzy")) {
      profileKey = "headache";
    } else if (lowerSymptoms.includes("fever") || lowerSymptoms.includes("cough") || lowerSymptoms.includes("cold") || lowerSymptoms.includes("throat")) {
      profileKey = "fever";
    } else if (lowerSymptoms.includes("stomach") || lowerSymptoms.includes("belly") || lowerSymptoms.includes("nausea")) {
      profileKey = "stomach";
    }
    const currentProf = MedicalKnowledge[profileKey];
    
    let recHTML = `### Verified Medical Resources in *${cityText}*\nI have plotted coordinates for local facilities matching your diagnostic profile on the map panel:\n\n**Recommended Specialists Nearby:**\n`;
    currentProf.doctors.forEach(doc => {
      recHTML += `• **${doc.name}** - ${doc.specialty} (Call: ${doc.phone})\n  *${doc.address}*\n`;
    });
    recHTML += `\n**Recommended Diagnostic Labs:**\n`;
    currentProf.labs.forEach(lab => {
      recHTML += `• **${lab.name}** - Diagnostics & Scans (Call: ${lab.phone})\n  *${lab.address}*\n`;
    });
    recHTML += `\nSymptom analysis is complete. You can enter a new symptom anytime to start over!`;
    
    appendBotResponse(recHTML);
    
    setTimeout(() => {
      setSymptomOptions({
        title: "New Symptom:",
        items: [
          { label: "Headache", full: "I have a mild headache and feel slightly dizzy." },
          { label: "Fever & Cough", full: "I have a high fever with dry cough." },
          { label: "Stomach Cramps", full: "I feel sharp cramps in my stomach." },
          { label: "⚠️ Chest Pain", full: "I have sudden crushing chest pain and shortness of breath." }
        ]
      });
      setChatState("INTAKE_SYMPTOMS");
    }, 1800);
  };

  const appendBotResponse = (text) => {
    setChat(prev => [...prev, { sender: "docure", text: text }]);
    speakText(text);
  };

  // File upload simulation
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingReport(true);
    
    setTimeout(() => {
      setUploadingReport(false);
      setRisk("Elevated");
      setPulse(98);
      
      const fileReport = `📋 **Blood Test Analysis Summary**\n\nDOCURE AI has parsed the text in your uploaded file **${file.name}** and extracted key metabolic biomarkers:\n\n• **Hemoglobin:** 13.8 g/dL (Normal: 12.0 - 16.0)\n• **Total Cholesterol:** 195 mg/dL (Normal: < 200)\n• **Fasting Glucose:** 242 mg/dL (⚠️ **ELEVATED / OUT OF RANGE**)\n\n**Clinical AI Diagnostic Analysis:**\nYour glucose levels indicate high blood sugar (hyperglycemia), which may suggest pre-diabetes or diabetes risk. \n\n**Ecosystem Updates:**\n1. We have updated your **Patient Profile Card** chronic conditions list with: *Pre-Diabetes Risk (Elevated Glucose)*.\n2. We have scheduled an automated diagnostic check recommendation.\n\n*Please check with your specialist MD.*`;
      
      setProfile(prev => ({ ...prev, chronic: "Pre-Diabetes (Elevated Glucose)" }));
      setConditions(["Mild Asthma", "Pre-Diabetes (Elevated Glucose)"]);
      appendBotResponse(fileReport);
    }, 2200);
  };

  // Mic/Speech recognition toggle
  const toggleSpeechInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser.");
      return;
    }
    
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    
    rec.onstart = () => {
      setIsListening(true);
    };
    
    rec.onend = () => {
      setIsListening(false);
    };
    
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setChatInput(transcript);
      setTimeout(() => handleSendMessage(transcript), 800);
    };
    
    recognitionRef.current = rec;
    rec.start();
  };

  // Tags managers functions
  const addTag = (category) => {
    if (category === 'allergy' && newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    } else if (category === 'condition' && newCondition.trim()) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition("");
    } else if (category === 'medication' && newMedication.trim()) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication("");
    }
  };

  const removeTag = (category, idx) => {
    if (category === 'allergy') {
      setAllergies(allergies.filter((_, i) => i !== idx));
    } else if (category === 'condition') {
      setConditions(conditions.filter((_, i) => i !== idx));
    } else if (category === 'medication') {
      setMedications(medications.filter((_, i) => i !== idx));
    }
  };

  // Prescriptions managers
  const handleAddPrescription = async () => {
    if (!newPrescName.trim() || !newPrescTime.trim()) return;
    try {
      await addReminder(currentUserId, {
        medicineName: newPrescName.trim(),
        dosage: '1 Dose',
        daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        doseTimes: [newPrescTime.trim()],
        syncGoogleCalendar: false,
        notes: ''
      });
      setNewPrescName("");
      setNewPrescTime("");
      setPrescFormOpen(false);
    } catch (e) {
      console.error('Error adding prescription:', e);
    }
  };

  // Save Modal Profile details
  const saveProfileData = () => {
    setProfile(prev => ({
      ...prev,
      chronic: conditions.join(", ") || "None reported"
    }));
    setProfileModalOpen(false);
    loadMapMarkers(profile.city);
  };

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {/* Interactive cursor spotlight tracking background glow */}
      <div className="fixed inset-0 cursor-spotlight z-0 pointer-events-none"></div>

      <div 
        className="w-full h-[200vh] flex flex-col slide-transition z-10 relative"
        style={{ transform: activePage === 'dashboard' ? 'translateY(-100vh)' : 'translateY(0)' }}
      >
        {/* Scrollable Container wrapping Hero, About Carousel and Footer */}
        <div className="w-full h-screen overflow-y-auto overflow-x-hidden relative scroll-smooth bg-transparent select-none z-10">
          <section className="w-full min-h-screen flex flex-col justify-between pt-2 pb-4 px-6 relative z-10">
          {/* Navigation Header with Glassmorphism Bar */}
          <header className="flex justify-between items-center px-8 py-3 mx-auto my-1.5 w-full max-w-[80%] bg-[#0f766e]/5 backdrop-blur-md border border-[#0f766e]/15 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03),_0_0_15px_rgba(15,118,110,0.05)] relative z-20">
            {/* Brand Logo and Name - slightly inset because of padding */}
            <div 
              className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-all"
              onClick={() => setActivePage('landing')}
            >
              <img src="assets/logo_original.png?v=5" alt="DOCURE Logo" className="h-9 w-auto mix-blend-multiply transition-transform duration-300 group-hover:scale-105" />
              <h2 className="font-mono text-[22px] font-black tracking-wider text-[#0f766e] group-hover:text-brand-accent transition-colors duration-300">DOCURE</h2>
            </div>

            {/* Right side buttons: Settings and Red Circular SOS/Alert */}
            <div className="flex items-center gap-3">
              {/* Settings button */}
              <button 
                className="w-10 h-10 rounded-full bg-white/50 hover:bg-[#0f766e]/10 border border-[#0f766e]/10 flex items-center justify-center text-brand-accent transition-all active:scale-95 shadow-sm"
                onClick={() => setSettingsModalOpen(true)}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Red Circular Alert button with Exclamation Mark */}
              <button 
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all active:scale-95 shadow-md shadow-red-200/50"
                onClick={triggerEmergency}
                title="Emergency SOS"
              >
                <span className="font-mono font-bold text-xl leading-none">!</span>
              </button>
            </div>
          </header>

          {/* Static Green Highlights Gradient behind text */}
          <div className="absolute top-[25%] left-[5%] w-[450px] h-[450px] bg-[#10b981]/8 rounded-full blur-[100px] pointer-events-none z-0"></div>

          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 max-w-7xl mx-auto w-full relative z-20">
            {/* Left Column: Text Details (Original Alignment - 6 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-4 text-left">
              <span className="inline-flex items-center gap-1.5 self-start text-[10px] font-mono font-bold px-3 py-1 bg-brand-glowingGreen/10 text-brand-glowingGreen border border-brand-glowingGreen/20 rounded-full">
                <span className="w-1.5 h-1.5 bg-brand-glowingGreen rounded-full animate-ping"></span>
                Now in public beta
              </span>
              
              <h1 className="font-serif text-[64px] leading-[1.08] text-brand-textDark font-extrabold tracking-tight">
                Your symptoms,<br />
                understood.<br />
                <span className="text-brand-accent">Your care, connected.</span>
              </h1>
              
              <p className="text-sm text-brand-textMuted max-w-lg leading-relaxed font-sans">
                An intelligent, safe assistant for symptom triage, medical analysis, and instant referrals to verified local specialists and diagnostic laboratories.
              </p>

              <div className="flex gap-4 mt-2">
                <button 
                  className="bg-brand-textDark hover:bg-brand-accent text-white px-6 py-3.5 text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95"
                  onClick={() => setActivePage('dashboard')}
                >
                  Start free triage
                </button>
                <button className="bg-brand-sand hover:bg-brand-border/10 text-brand-textDark border border-brand-border px-6 py-3.5 text-xs font-bold rounded-xl transition-all">
                  See how it works
                </button>
              </div>
            </div>

            {/* Right Column: Animated Bunny MVP Video (Expanded 6 cols, Large Frame) */}
            <div className="lg:col-span-6 flex justify-center items-center h-full relative overflow-visible">
              <div className="relative w-full max-w-[550px] aspect-[9/16] max-h-[66vh] animate-bunny-float select-none flex items-center justify-center overflow-visible">
                {/* Floating shadow below the video */}
                <div className="w-[220px] h-[12px] bg-[#0f766e]/12 rounded-full blur-[4px] absolute bottom-0 left-1/2 -translate-x-1/2 pulse-active" />
                
                <ChromaKeyVideo src="assets/bunny_mvp.webm?v=3" />
              </div>
            </div>
          </div>

          {/* Footer blocks / Premium Interactive Shortcut Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-20 w-full max-w-7xl mx-auto mt-4 px-4">
            {/* Card 1: Symptom Chat */}
            <div 
              className="bg-white/30 backdrop-blur-md border border-[#0f766e]/10 hover:border-[#0f766e]/30 rounded-3xl p-5 text-left flex items-start gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(15,118,110,0.1)] cursor-pointer group"
              onClick={() => { setActivePage('dashboard'); setActiveTab('reduce'); }}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0f766e]/10 border border-[#0f766e]/10 flex items-center justify-center text-brand-accent group-hover:bg-[#0f766e]/20 transition-all">
                <Bot className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-brand-textDark group-hover:text-brand-accent transition-all block mb-1">Symptom Chat</span>
                <p className="text-[11px] text-brand-textMuted leading-relaxed">Describe symptoms to start automated triage with clinical guidance.</p>
              </div>
            </div>

            {/* Card 2: Medical Maps */}
            <div 
              className="bg-white/30 backdrop-blur-md border border-[#0f766e]/10 hover:border-[#0f766e]/30 rounded-3xl p-5 text-left flex items-start gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(15,118,110,0.1)] cursor-pointer group"
              onClick={() => { setActivePage('dashboard'); }}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0f766e]/10 border border-[#0f766e]/10 flex items-center justify-center text-brand-accent group-hover:bg-[#0f766e]/20 transition-all">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-brand-textDark group-hover:text-brand-accent transition-all block mb-1">Medical Maps</span>
                <p className="text-[11px] text-brand-textMuted leading-relaxed">Locate verified specialists and diagnostic testing centers near you.</p>
              </div>
            </div>

            {/* Card 3: Report Scanner */}
            <div 
              className="bg-white/30 backdrop-blur-md border border-[#0f766e]/10 hover:border-[#0f766e]/30 rounded-3xl p-5 text-left flex items-start gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(15,118,110,0.1)] cursor-pointer group"
              onClick={() => { setActivePage('dashboard'); setActiveTab('report'); }}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0f766e]/10 border border-[#0f766e]/10 flex items-center justify-center text-brand-accent group-hover:bg-[#0f766e]/20 transition-all">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-brand-textDark group-hover:text-brand-accent transition-all block mb-1">Report Scanner</span>
                <p className="text-[11px] text-brand-textMuted leading-relaxed">Scan blood test reports to extract and check key biomarkers.</p>
              </div>
            </div>

            {/* Card 4: Emergency Desk */}
            <div 
              className="bg-white/30 backdrop-blur-md border border-[#f43f5e]/10 hover:border-[#f43f5e]/30 rounded-3xl p-5 text-left flex items-start gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(244,63,94,0.12)] cursor-pointer group"
              onClick={() => { setActivePage('dashboard'); triggerEmergency(); }}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center text-rose-500 group-hover:bg-rose-500/20 transition-all">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-brand-textDark group-hover:text-rose-500 transition-all block mb-1">Emergency Desk</span>
                <p className="text-[11px] text-brand-textMuted leading-relaxed">Trigger immediate SOS alerts and coordinates to family links.</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section: 3D Flashcards Carousel */}
        <AboutCarousel />

        {/* Footer Section */}
        <LandingFooter setActivePage={setActivePage} setActiveTab={setActiveTab} />
      </div>

      {/* ==========================================
           PAGE 2: CLINICAL TRIAGE DESK (Dashboard)
           ========================================== */}
        <section className="w-full h-screen flex border-t border-brand-border z-20 relative bg-brand-bg">
          {/* Sleek Glass Sidebar Menu Bar */}
          <div className="w-[85px] my-4 ml-4 rounded-[32px] bg-gradient-to-b from-[#0a6d5c]/95 to-[#043d33]/95 backdrop-blur-md shadow-2xl flex flex-col items-center py-6 gap-5 shrink-0 relative z-30 select-none border border-white/10">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white mb-2 hover:scale-105 transition-all">
              <img 
                src="assets/logo_original.png?v=5" 
                alt="DOCURE Logo" 
                className="w-8 h-8 object-contain" 
                style={{ filter: "invert(1) brightness(2.5)", mixBlendMode: "screen" }} 
              />
            </div>
            
            {/* Menu Items */}
            <div className="flex flex-col w-full relative gap-2.5" id="sidebar-menu">
              <button 
                className={`sidebar-item flex flex-col items-center justify-center py-3 text-[10px] w-[70px] mx-auto rounded-2xl relative transition-all duration-300 ${activeTab === 'home' ? 'bg-white text-[#0f766e] font-bold shadow-lg shadow-black/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab('home')}
              >
                <Activity className="w-5 h-5 mb-1" />
                <span>Home</span>
              </button>
              <button 
                className={`sidebar-item flex flex-col items-center justify-center py-3 text-[10px] w-[70px] mx-auto rounded-2xl relative transition-all duration-300 ${activeTab === 'measure' ? 'bg-white text-[#0f766e] font-bold shadow-lg shadow-black/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab('measure')}
              >
                <Activity className="w-5 h-5 mb-1" />
                <span>Measure</span>
              </button>
              <button 
                className={`sidebar-item flex flex-col items-center justify-center py-3 text-[10px] w-[70px] mx-auto rounded-2xl relative transition-all duration-300 ${activeTab === 'analyze' ? 'bg-white text-[#0f766e] font-bold shadow-lg shadow-black/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab('analyze')}
                title="Spatial Care Radar & Medical Maps"
              >
                <Compass className="w-5 h-5 mb-1" />
                <span>Radar</span>
              </button>
              <button 
                className={`sidebar-item flex flex-col items-center justify-center py-3 text-[10px] w-[70px] mx-auto rounded-2xl relative transition-all duration-300 ${activeTab === 'reduce' ? 'bg-white text-[#0f766e] font-bold shadow-lg shadow-black/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab('reduce')}
              >
                <BarChart3 className="w-5 h-5 mb-1" />
                <span>Reduce</span>
              </button>
              <button 
                className={`sidebar-item flex flex-col items-center justify-center py-3 text-[10px] w-[70px] mx-auto rounded-2xl relative transition-all duration-300 ${activeTab === 'report' ? 'bg-white text-[#0f766e] font-bold shadow-lg shadow-black/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab('report')}
              >
                <ClipboardList className="w-5 h-5 mb-1" />
                <span>Report</span>
              </button>
              <button 
                className={`sidebar-item flex flex-col items-center justify-center py-3 text-[10px] w-[70px] mx-auto rounded-2xl relative transition-all duration-300 ${activeTab === 'reminders' ? 'bg-white text-[#0f766e] font-bold shadow-lg shadow-black/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab('reminders')}
              >
                <Pill className="w-5 h-5 mb-1" />
                <span>Meds</span>
              </button>
            </div>
            
            {/* Bottom Actions */}
            <div className="flex flex-col w-full relative gap-2.5 mt-auto">
              <button 
                className={`sidebar-item flex flex-col items-center justify-center py-3 text-[10px] w-[70px] mx-auto rounded-2xl relative transition-all duration-300 ${settingsModalOpen ? 'bg-white text-[#0f766e] font-bold shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                onClick={() => setSettingsModalOpen(true)}
              >
                <Settings className="w-5 h-5 mb-1" />
                <span>Settings</span>
              </button>
              <button 
                className="sidebar-item flex flex-col items-center justify-center py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all text-[10px] w-[70px] mx-auto rounded-2xl relative"
                onClick={() => setProfileModalOpen(true)}
              >
                <UserCog className="w-5 h-5 mb-1" />
                <span>Profile</span>
              </button>
            </div>
          </div>

          {/* Left Aside Diagnostic panel (Hidden on standalone Node views like Radar, Reminders & Report) */}
          {activeTab !== 'analyze' && activeTab !== 'reminders' && activeTab !== 'report' && (
            <aside className="w-80 bg-brand-sand border-r border-brand-border flex flex-col p-5 gap-4 overflow-y-auto shrink-0 select-none">
              <div className="flex items-center gap-2">
                <button 
                  className="text-brand-textMuted hover:text-brand-textDark text-xs font-semibold flex items-center gap-1"
                  onClick={() => setActivePage('landing')}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Home
                </button>
              </div>

              {/* Wellness Pulse graph */}
              <div className="bg-white border border-brand-border rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 hover:border-brand-borderHover">
                <div className="flex items-center gap-2 text-brand-accent">
                  <Activity className="w-4 h-4 text-brand-glowingGreen animate-pulse" />
                  <h4 className="text-[11px] font-mono font-bold tracking-wider uppercase">Wellness Heartbeat</h4>
                </div>
                <canvas ref={ekgCanvasRef} width="240" height="50" className="bg-slate-900 border border-slate-800 rounded-lg w-full"></canvas>
                <div className="flex justify-between text-xs font-mono">
                  <span>Pulse: <strong>{pulse}</strong> BPM</span>
                  <span>Risk: <strong style={{ color: risk === 'SOS' ? '#f43f5e' : (risk === 'Elevated' ? '#8b5cf6' : '#10b981') }}>{risk}</strong></span>
                </div>
              </div>

              {/* Prescriptions reminders scheduler */}
              <div className="bg-white border border-brand-border rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 hover:border-brand-borderHover">
                <div className="flex items-center gap-2 text-brand-accent">
                  <ClipboardList className="w-4 h-4" />
                  <h4 className="text-[11px] font-mono font-bold tracking-wider uppercase">Active Prescriptions</h4>
                </div>
                
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
                  {liveReminders.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-1 text-center">No prescriptions scheduled yet.</p>
                  ) : (
                    liveReminders.map(med => (
                      <div key={med.id} className="bg-brand-sand border border-brand-border rounded-lg p-2 flex justify-between items-center">
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-brand-textDark flex items-center gap-1">
                            <span>{med.medIcon || '💊'}</span> {med.medicineName}
                          </span>
                          <span className="text-[10px] text-brand-textMuted">
                            {med.dosage} • {Array.isArray(med.doseTimes) ? med.doseTimes.join(', ') : med.time || ''}
                          </span>
                        </div>
                        <button 
                          className="text-brand-textMuted hover:text-brand-rose font-bold text-base px-1.5 hover:bg-black/5 rounded"
                          onClick={() => deleteReminder(med.id, currentUserId, med)}
                          title="Delete prescription"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  <button 
                    className="w-full py-1 bg-brand-sand border border-brand-border hover:bg-brand-border/10 text-xs font-semibold rounded-lg"
                    onClick={() => setPrescFormOpen(!prescFormOpen)}
                  >
                    + Add Prescription
                  </button>
                  
                  {prescFormOpen && (
                    <div className="flex flex-col gap-2 border-t border-brand-border pt-2">
                      <input 
                        type="text" 
                        placeholder="Pill Name" 
                        value={newPrescName}
                        onChange={e => setNewPrescName(e.target.value)}
                        className="border border-brand-border rounded px-2 py-1 outline-none text-xs focus:border-brand-accent bg-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Dose Time (e.g. 08:00 AM)" 
                        value={newPrescTime}
                        onChange={e => setNewPrescTime(e.target.value)}
                        className="border border-brand-border rounded px-2 py-1 outline-none text-xs focus:border-brand-accent bg-white"
                      />
                      <div className="flex gap-2">
                        <button 
                          className="flex-1 py-1 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-xs font-bold rounded-lg"
                          onClick={handleAddPrescription}
                        >
                          Add
                        </button>
                        <button 
                          className="flex-1 py-1 bg-transparent text-brand-textMuted text-xs font-bold rounded-lg"
                          onClick={() => setPrescFormOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setActiveTab('reminders')}
                    className="w-full py-1.5 bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/30 text-brand-accent text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <Pill className="w-3 h-3" />
                    <span>Full Medication Schedules →</span>
                  </button>
                </div>
              </div>

              {/* Emergency SOS override button */}
              <div className="mt-auto">
                <button 
                  className="w-full py-3 bg-brand-rose hover:bg-red-600 text-white font-mono font-bold text-xs tracking-wider rounded-xl shadow-lg shadow-rose-200/50"
                  onClick={triggerEmergency}
                >
                  🚨 EMERGENCY SOS TRIGGER
                </button>
              </div>
            </aside>
          )}

          {/* Main Area: Render dedicated Node tabs */}
          {activeTab === 'reminders' ? (
            <MedicineReminder userId={currentUserId} />
          ) : activeTab === 'analyze' ? (
            <MedicalRadarNode 
              defaultCity={profile.city} 
              onOpenEmergency={triggerEmergency} 
              onBackHome={() => setActivePage('landing')} 
            />
          ) : activeTab === 'report' ? (
            <LabReportAnalyzerNode 
              onBackHome={() => setActivePage('landing')} 
            />
          ) : (
            <>
              {/* Center Chat Panel */}
              <main className="flex-1 flex flex-col bg-white relative border-r border-brand-border">
                <header className="h-[70px] bg-brand-sand border-b border-brand-border flex justify-between items-center px-6 shrink-0 select-none">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-brand-glowingGreen rounded-full shadow-[0_0_10px_#10b981] pulse-active"></div>
                    <div>
                      <h3 className="text-sm font-semibold">Triage Desk Diagnostic Assistant</h3>
                      <p className="text-[10px] text-brand-textMuted">Triage state parsing engine connected</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      className="bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/20 text-brand-accent text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
                      onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    >
                      {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>Voice {isVoiceEnabled ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                </header>

                {/* Message History logs */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4" id="chat-messages">
                  {chat.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex gap-3 max-w-[85%] items-start ${msg.sender === 'docure' ? 'self-start message docure' : 'self-end flex-row-reverse message user'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono font-bold text-xs ${msg.sender === 'docure' ? 'bg-brand-accent/10 border border-brand-accent/20 text-brand-accent' : 'bg-brand-accent/15 border border-brand-accent/30 text-brand-accent'}`}>
                        {msg.sender === 'docure' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div 
                        className={`text-sm leading-relaxed p-4 rounded-xl shadow-sm bubble ${msg.sender === 'docure' ? 'bg-brand-sand border border-brand-border text-brand-textDark rounded-tl-sm' : 'bg-brand-accent text-white rounded-tr-sm'}`}
                        dangerouslySetInnerHTML={{ 
                          __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                          .replace(/\n/g, '<br>') 
                        }}
                      />
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3 max-w-[85%] self-start items-start message docure">
                      <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-brand-sand border border-brand-border text-brand-textDark text-sm leading-relaxed p-4 rounded-xl rounded-tl-sm bubble shadow-sm">
                        <div className="flex gap-1.5 py-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-textMuted animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-textMuted animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-textMuted animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div className="border-t border-brand-border p-5 bg-brand-sand flex flex-col gap-3 shrink-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] text-brand-textMuted font-mono uppercase tracking-wider mr-1">{symptomOptions.title}</span>
                    {symptomOptions.items.map((opt, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSendMessage(opt.full)}
                        className={`text-[11px] px-3 py-1.5 rounded-full chip transition-all ${opt.label.includes("⚠️") ? 'bg-brand-rose/5 border border-brand-rose/30 hover:bg-brand-rose/15 text-brand-rose font-semibold' : 'bg-white border border-brand-border hover:border-brand-borderHover text-brand-textMuted hover:text-brand-textDark'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex gap-3 relative items-center">
                    {/* File upload button */}
                    <label className="w-10 h-10 rounded-xl bg-white border border-brand-border flex items-center justify-center text-brand-textMuted hover:text-brand-textDark cursor-pointer hover:border-brand-borderHover active:scale-95 transition-all">
                      <ClipboardList className="w-4.5 h-4.5" />
                      <input type="file" className="hidden" accept=".txt,.pdf,.jpg,.png" onChange={handleFileUpload} />
                    </label>

                    {/* Text input */}
                    <input 
                      type="text"
                      placeholder="Describe your symptoms or ask clinical helper..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                      className="flex-1 bg-white border border-brand-border rounded-xl px-4 py-2.5 outline-none text-xs focus:border-brand-accent pr-12 text-brand-textDark placeholder-brand-textMuted/60"
                    />

                    {/* Speak Mic button */}
                    <button 
                      className={`absolute right-16 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isListening ? 'text-brand-rose animate-pulse' : 'text-brand-textMuted hover:text-brand-textDark'}`}
                      onClick={toggleSpeechInput}
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {/* Send Button */}
                    <button 
                      className="w-10 h-10 rounded-xl bg-brand-textDark hover:bg-brand-accent text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
                      onClick={() => handleSendMessage()}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </main>

              {/* Right Map Panel: Real-Time Medical Radar */}
              <aside className="w-[380px] bg-brand-sand border-l border-brand-border flex flex-col shrink-0">
                {/* Radar Header */}
                <div className="p-4 border-b border-brand-border flex flex-col gap-2.5 bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#0f766e]/10 border border-[#0f766e]/20 flex items-center justify-center text-[#0f766e]">
                        <Compass className="w-4 h-4 animate-spin-slow" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-brand-textDark">Medical Radar</h3>
                        <p className="text-[10px] text-brand-textMuted flex items-center gap-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Live GPS Radius: 10 km
                        </p>
                      </div>
                    </div>

                    {/* Auto Detect GPS Button */}
                    <button
                      onClick={handleDetectUserLocation}
                      disabled={isDetectingLocation}
                      className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d645e] disabled:opacity-50 text-white rounded-xl text-[10px] font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                      title="Detect My Current GPS Location"
                    >
                      {isDetectingLocation ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Detecting...</span>
                        </>
                      ) : (
                        <>
                          <LocateFixed className="w-3 h-3 text-emerald-300 animate-pulse" />
                          <span>Locate Me</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Detected Address pill */}
                  <div className="flex items-center justify-between text-[10px] bg-slate-100/80 px-2.5 py-1 rounded-lg text-slate-600 font-mono">
                    <span className="truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#0f766e] shrink-0" />
                      <strong className="text-slate-800 font-bold">{locationAddress || profile.city}</strong>
                    </span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold shrink-0 ml-1">
                      GPS ACTIVE
                    </span>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { id: 'all', label: 'All Places', emoji: '🌟' },
                      { id: 'hospital', label: 'Hospitals', emoji: '🏥' },
                      { id: 'doctor', label: 'Doctors', emoji: '👨‍⚕️' },
                      { id: 'lab', label: 'Labs', emoji: '🔬' },
                      { id: 'pharmacy', label: 'Pharmacy', emoji: '💊' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryFilterChange(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                          selectedPlaceCategory === cat.id
                            ? 'bg-[#0f766e] text-white shadow-sm'
                            : 'bg-white border border-brand-border text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Interactive Leaflet Map container */}
                <div className="h-56 border-b border-brand-border relative">
                  <div ref={mapRef} className="w-full h-full bg-slate-100"></div>
                  
                  {/* Floating Map Hint */}
                  <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-sm border border-slate-200 px-2 py-0.5 rounded text-[9px] font-mono text-slate-600 shadow-sm pointer-events-none">
                    💡 Click card below to focus marker
                  </div>
                </div>
                
                {/* Real-time Places Listings */}
                <div className="flex-1 flex flex-col p-4 overflow-y-auto gap-3">
                  <div className="flex justify-between items-center select-none">
                    <h4 className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold flex items-center gap-1">
                      <span>Nearby Medical Places</span>
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                        {nearbyPlaces.length} Found
                      </span>
                    </h4>
                    <span className="text-[9px] font-mono text-slate-400">
                      Real-Time Radar
                    </span>
                  </div>
                  
                  {nearbyPlaces.length === 0 ? (
                    <div className="bg-white border border-brand-border rounded-2xl p-6 text-center text-slate-400 text-xs">
                      <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#0f766e]" />
                      Scanning radius for verified facilities...
                    </div>
                  ) : (
                    nearbyPlaces.map((place) => {
                      let typeBadge = 'bg-teal-50 text-[#0f766e] border-teal-200';
                      let typeLabel = 'HOSPITAL';
                      let typeEmoji = '🏥';

                      if (place.type === 'doctor') {
                        typeBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                        typeLabel = 'DOCTOR / CLINIC';
                        typeEmoji = '👨‍⚕️';
                      } else if (place.type === 'lab') {
                        typeBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                        typeLabel = 'DIAGNOSTIC LAB';
                        typeEmoji = '🔬';
                      } else if (place.type === 'pharmacy') {
                        typeBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        typeLabel = 'PHARMACY';
                        typeEmoji = '💊';
                      }

  Phone, Trash2, Send, Mic, Volume2, VolumeX, ShieldAlert, Menu,
  Mail, ShieldCheck, Globe, Compass, Pill, Navigation, ExternalLink, RefreshCw,
  LocateFixed, Building2, Stethoscope, TestTube2, PhoneCall, Navigation2
        </section>
      </div>

      {/* ==========================================
           MODALS OVERLAYS
           ========================================== */}
      
      {/* Settings & Preferences Modal Overlay */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-[#04060c]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-brand-sand border border-brand-border/40 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <button className="absolute right-4 top-4 text-brand-textMuted hover:text-brand-textDark font-bold text-lg" onClick={() => setSettingsModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0f766e]/10 border border-[#0f766e]/30 flex items-center justify-center text-[#0f766e] shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-brand-textDark">Settings & Preferences</h3>
                <p className="text-[10px] text-brand-textMuted">Manage your clinical profile, voice assistant, and alarms</p>
              </div>
            </div>

            <hr className="border-brand-border" />

            {/* Modal Body Settings Content */}
            <div className="flex flex-col gap-6 select-none">
              {/* Personal Medical Profile Box */}
              <div className="bg-white border border-brand-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm text-left">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-brand-textDark">Personal Medical Profile</h4>
                  <button 
                    onClick={() => {
                      setSettingsModalOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-[#0f766e] bg-[#0f766e]/5 hover:bg-[#0f766e]/10 border border-[#0f766e]/15 px-3.5 py-1.5 rounded-xl transition-all"
                  >
                    Open Full Profile Modal
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-brand-textMuted uppercase tracking-wider">Patient Name</label>
                    <input 
                      type="text" 
                      value={profile.name} 
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="border border-brand-border rounded-xl px-3 py-2 outline-none text-xs focus:border-brand-accent bg-brand-sand/30 font-medium text-brand-textDark"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-brand-textMuted uppercase tracking-wider">City / Area</label>
                    <input 
                      type="text" 
                      value={profile.city} 
                      onChange={e => {
                        const newCity = e.target.value;
                        setProfile({ ...profile, city: newCity });
                        if (typeof loadMapMarkers === 'function') loadMapMarkers(newCity);
                      }}
                      className="border border-brand-border rounded-xl px-3 py-2 outline-none text-xs focus:border-brand-accent bg-brand-sand/30 font-medium text-brand-textDark"
                    />
                  </div>
                </div>
              </div>

              {/* Voice & Audio Preferences Box */}
              <div className="bg-white border border-brand-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm text-left">
                <h4 className="text-xs font-bold text-brand-textDark">Voice & Audio Preferences</h4>
                <div className="border border-brand-border rounded-xl p-3 flex justify-between items-center bg-brand-sand/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0f766e]/10 border border-[#0f766e]/15 flex items-center justify-center text-[#0f766e] shrink-0">
                      <Volume2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-brand-textDark block mb-0.5">Audio Speech Synthesis</span>
                      <span className="text-[9px] text-brand-textMuted block">Read diagnostic responses and answers aloud</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`text-[10px] font-bold px-4 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 ${isVoiceEnabled ? 'bg-[#0f766e] text-white hover:bg-[#0d635c]' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                  >
                    {isVoiceEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Emergency SOS Hotline Config Box */}
              <div className="bg-white border border-brand-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm text-left">
                <h4 className="text-xs font-bold text-brand-textDark">Emergency SOS Hotline Config</h4>
                <div className="border border-brand-border rounded-xl p-3 flex justify-between items-center bg-brand-sand/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100/80 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                      <Phone className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-brand-textDark block mb-0.5">Primary Emergency Hotline</span>
                      <span className="text-[9px] text-brand-textMuted block">Default National Emergency dispatch: 112 / 102</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200/50 px-3 py-1.5 rounded-lg">
                    112 / +91 99990-11122
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2 border-t border-brand-border pt-4">
              <button 
                className="px-5 py-2 bg-white border border-brand-border hover:bg-brand-border/10 text-brand-textDark text-xs font-bold rounded-xl" 
                onClick={() => setSettingsModalOpen(false)}
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Medical Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-[#04060c]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-brand-sand border border-brand-border/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <button className="absolute right-4 top-4 text-brand-textMuted hover:text-brand-textDark font-bold text-lg" onClick={() => setProfileModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-textDark">Patient Medical Profile</h3>
                <p className="text-[10px] text-brand-textMuted">Personalize AI symptom assessment & intake context</p>
              </div>
            </div>

            <hr className="border-brand-border" />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-textDark uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="border border-brand-border rounded-xl px-3 py-2 outline-none text-xs focus:border-brand-accent bg-white" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-textDark uppercase tracking-wider">Age</label>
                <input 
                  type="number" 
                  value={profile.age} 
                  onChange={e => setProfile({ ...profile, age: e.target.value })}
                  className="border border-brand-border rounded-xl px-3 py-2 outline-none text-xs focus:border-brand-accent bg-white" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-textDark uppercase tracking-wider">Gender</label>
                <select 
                  value={profile.gender}
                  onChange={e => setProfile({ ...profile, gender: e.target.value })}
                  className="border border-brand-border rounded-xl px-3 py-2 outline-none text-xs focus:border-brand-accent bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-textDark uppercase tracking-wider">Default City / Area</label>
                <div className="relative flex items-center bg-white border border-brand-border rounded-xl focus-within:border-brand-accent">
                  <span className="absolute left-3 text-brand-textMuted"><MapPin className="w-3.5 h-3.5" /></span>
                  <input 
                    type="text" 
                    value={profile.city} 
                    onChange={e => setProfile({ ...profile, city: e.target.value })}
                    className="w-full bg-transparent border-none outline-none pl-8 pr-3 py-2 text-xs" 
                  />
                </div>
              </div>
            </div>

            {/* Allergies tag manager */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-brand-textDark uppercase tracking-wider">🚫 Known Allergies</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add allergy..." 
                  value={newAllergy}
                  onChange={e => setNewAllergy(e.target.value)}
                  className="flex-1 border border-brand-border rounded-xl px-3 py-2 outline-none text-xs focus:border-brand-accent bg-white" 
                />
                <button className="bg-brand-sand border border-brand-border hover:bg-brand-border/10 text-brand-textDark px-4 py-2 text-xs font-bold rounded-xl" onClick={() => addTag('allergy')}>Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {allergies.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#fbf5e6] text-[#b45309] px-2.5 py-1 rounded-full">
                    {tag} 
                    <button className="hover:text-red-700 font-bold ml-0.5" onClick={() => removeTag('allergy', i)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Pre-existing chronic conditions */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-brand-textDark uppercase tracking-wider">❤️ Pre-existing Chronic Conditions</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add condition..." 
                  value={newCondition}
                  onChange={e => setNewCondition(e.target.value)}
                  className="flex-1 border border-brand-border rounded-xl px-3 py-2 outline-none text-xs focus:border-brand-accent bg-white" 
                />
                <button className="bg-brand-sand border border-brand-border hover:bg-brand-border/10 text-brand-textDark px-4 py-2 text-xs font-bold rounded-xl" onClick={() => addTag('condition')}>Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {conditions.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] font-bold bg-brand-rose/5 text-brand-rose px-2.5 py-1 rounded-full">
                    {tag} 
                    <button className="hover:text-red-700 font-bold ml-0.5" onClick={() => removeTag('condition', i)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Daily Medications */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-brand-textDark uppercase tracking-wider">💊 Current Daily Medications</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add medication..." 
                  value={newMedication}
                  onChange={e => setNewMedication(e.target.value)}
                  className="flex-1 border border-brand-border rounded-xl px-3 py-2 outline-none text-xs focus:border-brand-accent bg-white" 
                />
                <button className="bg-brand-sand border border-brand-border hover:bg-brand-border/10 text-brand-textDark px-4 py-2 text-xs font-bold rounded-xl" onClick={() => addTag('medication')}>Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {medications.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] font-bold bg-brand-sand border border-brand-border text-brand-textDark px-2.5 py-1 rounded-full">
                    {tag} 
                    <button className="hover:text-red-700 font-bold ml-0.5" onClick={() => removeTag('medication', i)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2 border-t border-brand-border pt-4">
              <button className="px-5 py-2.5 bg-white border border-brand-border hover:bg-brand-border/10 text-brand-textDark text-xs font-bold rounded-xl" onClick={() => setProfileModalOpen(false)}>Cancel</button>
              <button className="px-5 py-2.5 bg-[#b45309] hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-md" onClick={saveProfileData}>✓ Save Patient Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Red Flag SOS Modal Overlay */}
      {sosOpen && (
        <div className="fixed inset-0 bg-[#04060c]/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-gradient-to-b from-[#180509] to-[#0a0204] border-2 border-brand-rose rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_35px_rgba(244,63,94,0.3)] flex flex-col gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-rose/10 border border-brand-rose flex items-center justify-center text-brand-rose mx-auto shadow-[0_0_12px_#f43f5e] relative">
              <Bell className="w-6.5 h-6.5 animate-ping absolute duration-1000" />
              <Bell className="w-6.5 h-6.5 relative" />
            </div>
            
            <h2 className="font-mono text-lg font-bold text-brand-rose tracking-wider">EMERGENCY SOS OVERRIDE</h2>
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              DOCURE has detected critical indicators of clinical distress. Real-time parameters have overridden standard triaging loops.
            </p>
            
            <div className="my-1">
              <a href="tel:102" className="inline-flex w-full py-3.5 bg-gradient-to-r from-brand-rose to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-mono font-bold text-xs tracking-wider rounded-xl justify-center items-center gap-1.5 transition-all">
                <Phone className="w-3.5 h-3.5" />
                📞 DIAL EMERGENCY MEDICAL LINE (102)
              </a>
            </div>

            <div className="bg-white/[0.02] border border-brand-border rounded-xl p-3.5 text-left flex flex-col gap-1.5">
              <h3 className="text-[10px] font-bold text-white tracking-wide font-mono uppercase">Pre-Saved Family Contacts:</h3>
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Contact: Family Link</span>
                <span className="text-brand-amber font-mono font-bold text-[9px] animate-pulse">{smsStatus}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              Forwarding coordinates to global dispatch in <strong className="text-white font-mono">{sosTimer}</strong>s...
            </div>

            <button className="w-full py-1.5 bg-transparent hover:bg-white/5 border border-brand-border text-slate-400 hover:text-white font-mono text-[10px] rounded-lg" onClick={stopEmergency}>
              CANCEL SOS OVERRIDE
            </button>
          </div>
        </div>
      )}

      {/* Report Analyzer Loading overlay */}
      {uploadingReport && (
        <div className="fixed inset-0 bg-[#04060c]/80 z-[99999] flex items-center justify-center">
          <div className="text-center flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-brand-accent animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-3 h-3 rounded-full bg-brand-accent animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-3 h-3 rounded-full bg-brand-accent animate-bounce"></div>
            </div>
            <p className="text-[10px] font-mono text-brand-accent uppercase tracking-widest mt-1">Parsing lab biomarkers with DOCURE AI...</p>
          </div>
        </div>
      )}

      {/* Helper DOM-compatible hidden container to prevent app.js dependency errors if any exist */}
      <div className="hidden">
        <span id="prof-name-val">{profile.name}</span>
        <span id="prof-age-val">{profile.age}</span>
        <span id="prof-blood-val">{profile.blood}</span>
        <span id="prof-chronic-val">{profile.chronic}</span>
        <span id="prof-contact-val">{profile.contact}</span>
        <span id="active-city-indicator">{profile.city}</span>
        <button id="btn-edit-profile">Edit</button>
      </div>

      {/* In-App Toast Alert Layer for 20s Background Notification Scheduler */}
      <InAppToast />

    </div>
  );
}
