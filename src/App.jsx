import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Activity, LineChart, BarChart3, ClipboardList, 
  Settings, UserCog, User, MapPin, X, Bot, Bell, 
  Phone, Trash2, Send, Mic, Volume2, VolumeX, ShieldAlert 
} from 'lucide-react';

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

export default function App() {
  // Page routing
  const [activePage, setActivePage] = useState('landing');
  const [activeTab, setActiveTab] = useState('reduce');
  
  // Profile settings state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
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
  const [medications, setMedications] = useState(["Albuterol inhaler (as needed)"]);

  // Tags input temporary strings
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState("");

  // Prescriptions list
  const [prescriptions, setPrescriptions] = useState([
    { id: 1, name: "Paracetamol (500mg)", time: "08:00 AM • Every 8h" }
  ]);
  const [newPrescName, setNewPrescName] = useState("");
  const [newPrescTime, setNewPrescTime] = useState("");
  const [prescFormOpen, setPrescFormOpen] = useState(false);

  // Wellness Heartbeat params
  const [risk, setRisk] = useState('Normal');
  const [pulse, setPulse] = useState(72);
  const ekgCanvasRef = useRef(null);

  // Map settings
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

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

  // Leaflet Maps loader
  const loadMapMarkers = (city) => {
    if (!window.L || !mapInstanceRef.current || !markersGroupRef.current) return;
    
    const cleanCity = city.toLowerCase().trim();
    let coords = [28.6139, 77.2090]; // Delhi default
    let matched = false;
    
    for (let key in CityCoordinates) {
      if (cleanCity.includes(key) || key.includes(cleanCity)) {
        coords = CityCoordinates[key];
        matched = true;
        break;
      }
    }
    
    mapInstanceRef.current.setView(coords, 13);
    markersGroupRef.current.clearLayers();
    
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
    
    const activeProf = MedicalKnowledge[profileKey];
    setMatchedProfile(activeProf);
    
    // doctor markers
    activeProf.doctors.forEach((doc, idx) => {
      const latOffset = (idx === 0) ? 0.003 : -0.004;
      const lngOffset = (idx === 0) ? -0.004 : 0.005;
      const docPos = [coords[0] + latOffset, coords[1] + lngOffset];
      
      const docIcon = window.L.divIcon({
        className: 'glowing-pin doctor',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      
      window.L.marker(docPos, { icon: docIcon })
        .bindPopup(`<strong>${doc.name}</strong><br>${doc.specialty}<br>${doc.phone}`)
        .addTo(markersGroupRef.current);
    });
    
    // lab markers
    activeProf.labs.forEach((lab) => {
      const latOffset = -0.002;
      const lngOffset = -0.002;
      const labPos = [coords[0] + latOffset, coords[1] + lngOffset];
      
      const labIcon = window.L.divIcon({
        className: 'glowing-pin lab',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      
      window.L.marker(labPos, { icon: labIcon })
        .bindPopup(`<strong>${lab.name}</strong><br>Lab Tests & Scans<br>${lab.phone}`)
        .addTo(markersGroupRef.current);
    });
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
            loadMapMarkers(profile.city);
          } catch (e) {
            console.error("Leaflet init error:", e);
          }
        }
      }, 200);
    }
  }, [activePage]);

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
  const handleAddPrescription = () => {
    if (!newPrescName.trim() || !newPrescTime.trim()) return;
    setPrescriptions([...prescriptions, {
      id: Date.now(),
      name: newPrescName.trim(),
      time: newPrescTime.trim()
    }]);
    setNewPrescName("");
    setNewPrescTime("");
    setPrescFormOpen(false);
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
      <div 
        className="w-full h-[200vh] flex flex-col slide-transition z-10 relative"
        style={{ transform: activePage === 'dashboard' ? 'translateY(-100vh)' : 'translateY(0)' }}
      >
        {/* ==========================================
             PAGE 1: PREMIUM LANDING PAGE (Hero)
             ========================================== */}
        <section className="w-full h-screen flex flex-col justify-between p-6 select-none relative z-10">
          {/* Navigation Header */}
          <header className="flex justify-between items-center relative z-20">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
              onClick={() => setActivePage('dashboard')}
            >
              <img src="assets/logo_original.png?v=5" alt="DOCURE Logo" className="h-10 w-auto mix-blend-multiply" />
              <h2 className="font-mono text-xl font-bold tracking-tight text-brand-accent">DOCURE</h2>
            </div>
            
            <nav className="hidden md:flex items-center gap-8 relative py-2">
              <a href="#" className="text-xs font-semibold text-brand-textMuted hover:text-brand-textDark transition-all px-1">Overview</a>
              <a href="#" className="text-xs font-semibold text-brand-textMuted hover:text-brand-textDark transition-all px-1">Triage Checker</a>
              <a href="#" className="text-xs font-semibold text-brand-textMuted hover:text-brand-textDark transition-all px-1">Biomarkers</a>
              <a href="#" className="text-xs font-semibold text-brand-textMuted hover:text-brand-textDark transition-all px-1">Local Maps</a>
              <a href="#" className="text-xs font-semibold text-brand-textMuted hover:text-brand-textDark transition-all px-1">Emergency SOS</a>
            </nav>

            <button 
              className="bg-brand-textDark text-white px-5 py-2.5 text-xs font-bold rounded-xl shadow-md hover:bg-brand-accent active:scale-95 transition-all"
              onClick={() => setActivePage('dashboard')}
            >
              Access Triage Desk
            </button>
          </header>

          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 max-w-7xl mx-auto w-full relative z-20">
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              <span className="inline-flex items-center gap-1.5 self-start text-[10px] font-mono font-bold px-3 py-1 bg-brand-glowingGreen/10 text-brand-glowingGreen border border-brand-glowingGreen/20 rounded-full">
                <span className="w-1.5 h-1.5 bg-brand-glowingGreen rounded-full animate-ping"></span>
                Now in public beta
              </span>
              
              <h1 className="font-serif text-[64px] leading-[1.08] text-brand-textDark font-extrabold tracking-tight">
                Your symptoms,<br />
                understood.<br />
                Your care, connected.
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

            {/* Right Side Mascot vector */}
            <div className="lg:col-span-5 flex justify-center items-center h-full relative">
              <div className="relative w-80 h-80 animate-bunny-float select-none">
                <svg viewBox="0 0 200 240" fill="none" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
                      <stop offset="50%" stopColor="#ef4444" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Left Wiggling Ear */}
                  <g className="animate-ear-left origin-[82px_60px]">
                    <path d="M72 60 C63 25 73 5 80 5 C87 5 85 25 80 60" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
                    <path d="M74 54 C68 28 75 14 78 14 C81 14 80 28 77 54" fill="#fda4af" />
                  </g>

                  {/* Right Wiggling Ear */}
                  <g className="animate-ear-right origin-[118px_60px]">
                    <path d="M128 60 C137 25 127 5 120 5 C113 5 115 25 120 60" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
                    <path d="M126 54 C132 28 125 14 122 14 C119 14 120 28 123 54" fill="#fda4af" />
                  </g>

                  {/* Antenna */}
                  <rect x="98" y="44" width="4" height="18" fill="#94a3b8" />
                  <circle cx="100" cy="40" r="5" fill="#10b981" className="animate-eye-glow" />

                  {/* Thruster Engine Jet Flames */}
                  <path d="M77 182 L83 218 L89 182 Z" fill="url(#flameGrad)" className="animate-flame origin-[83px_182px]" />
                  <path d="M111 182 L117 218 L123 182 Z" fill="url(#flameGrad)" className="animate-flame origin-[117px_182px]" />

                  {/* Thruster Feet (Left/Right) */}
                  <rect x="75" y="172" width="16" height="12" rx="4" fill="#64748b" stroke="#475569" strokeWidth="2.5" />
                  <rect x="109" y="172" width="16" height="12" rx="4" fill="#64748b" stroke="#475569" strokeWidth="2.5" />

                  {/* Hovering Robot Body */}
                  <rect x="64" y="112" width="72" height="64" rx="20" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="4" />

                  {/* Chest ECG Heart Screen */}
                  <rect x="77" y="124" width="46" height="34" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                  <path d="M81 141 H89 L92 131 L96 151 L100 138 L103 144 L106 141 H119" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="pulse-active" />

                  {/* Dangling Stethoscope */}
                  <path d="M72 106 C72 124 128 124 128 106" stroke="#475569" strokeWidth="3" fill="none" />
                  <circle cx="100" cy="118" r="4.5" fill="#94a3b8" />

                  {/* Robot Head */}
                  <rect x="68" y="58" width="64" height="54" rx="18" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="4" />

                  {/* Digital Face Screen */}
                  <rect x="75" y="65" width="50" height="40" rx="12" fill="#0f172a" />

                  {/* Glowing Digital Eyes */}
                  <circle cx="88" cy="82" r="5.5" fill="#10b981" className="animate-eye-glow" />
                  <circle cx="112" cy="82" r="5.5" fill="#10b981" className="animate-eye-glow" />

                  {/* Smiling Mouth */}
                  <path d="M94 92 Q100 97 106 92" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                  {/* Waving Robot Arms (Left & Right) */}
                  <g className="animate-arm-left origin-[64px_128px]">
                    <rect x="36" y="122" width="28" height="11" rx="5.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
                  </g>
                  <g className="animate-arm-right origin-[136px_128px]">
                    <rect x="136" y="122" width="28" height="11" rx="5.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Footer blocks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-20">
            <div className="bg-white/40 border border-brand-border rounded-2xl p-4 text-left backdrop-blur-sm">
              <span className="text-xs text-brand-textMuted">Symptom Chat</span>
              <p className="text-[10px] text-brand-textMuted mt-1">Triage health issues</p>
            </div>
            <div className="bg-white/40 border border-brand-border rounded-2xl p-4 text-left backdrop-blur-sm">
              <span className="text-xs text-brand-textMuted">Medical Maps</span>
              <p className="text-[10px] text-brand-textMuted mt-1">Clinics & labs search</p>
            </div>
            <div className="bg-white/40 border border-brand-border rounded-2xl p-4 text-left backdrop-blur-sm">
              <span className="text-xs text-brand-textMuted">Report Scanner</span>
              <p className="text-[10px] text-brand-textMuted mt-1">Summarize pdf scans</p>
            </div>
            <div className="bg-white/40 border border-brand-border rounded-2xl p-4 text-left backdrop-blur-sm">
              <span className="text-xs text-brand-textMuted">Emergency Desk</span>
              <p className="text-[10px] text-brand-textMuted mt-1">Get immediate contact</p>
            </div>
          </div>
        </section>

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
              >
                <LineChart className="w-5 h-5 mb-1" />
                <span>Analyze</span>
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
            </div>
            
            {/* Bottom Actions */}
            <div className="flex flex-col w-full relative gap-2.5 mt-auto">
              <button 
                className={`sidebar-item flex flex-col items-center justify-center py-3 text-[10px] w-[70px] mx-auto rounded-2xl relative transition-all duration-300 ${activeTab === 'settings' ? 'bg-white text-[#0f766e] font-bold shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab('settings')}
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

          {/* Left Aside Diagnostic panel */}
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
              
              <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                {prescriptions.map(med => (
                  <div key={med.id} className="bg-brand-sand border border-brand-border rounded-lg p-2.5 flex justify-between items-center">
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-brand-textDark">{med.name}</span>
                      <span className="text-[10px] text-brand-textMuted">{med.time}</span>
                    </div>
                    <button 
                      className="text-brand-textMuted hover:text-brand-rose font-bold text-base px-1"
                      onClick={() => setPrescriptions(prescriptions.filter(p => p.id !== med.id))}
                    >
                      ×
                    </button>
                  </div>
                ))}
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

          {/* Center Chat Panel */}
          <main className="flex-1 flex flex-col bg-white relative border-r border-brand-border">
            <header className="h-[70px] bg-brand-sand border-b border-brand-border flex justify-between items-center px-6 shrink-0 select-none">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-brand-glowingGreen rounded-full shadow-[0_0_10px_#10b981] pulse-active"></div>
                <div>
                  <h3 class="text-sm font-semibold">Triage Desk Diagnostic Assistant</h3>
                  <p class="text-[10px] text-brand-textMuted">Triage state parsing engine connected</p>
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

          {/* Right Map Panel */}
          <aside className="w-[360px] bg-brand-sand border-l border-brand-border flex flex-col shrink-0">
            <div className="h-[70px] border-b border-brand-border flex items-center gap-2 px-5">
              <MapPin className="w-4.5 h-4.5 text-brand-accent" />
              <h3 className="text-sm font-semibold">Verified Maps Finder</h3>
            </div>
            
            {/* Map container */}
            <div className="h-64 border-b border-brand-border relative">
              <div ref={mapRef} className="w-full h-full bg-slate-200"></div>
            </div>
            
            {/* Specialist listings */}
            <div className="flex-1 flex flex-col p-5 overflow-y-auto">
              <div className="flex justify-between items-center mb-4 select-none">
                <h4 className="text-[10px] font-mono tracking-widest text-brand-textMuted uppercase font-bold">Specialists Near You</h4>
                <span className="text-[9px] font-mono text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 rounded-full uppercase">
                  {profile.city.split(',')[0]}
                </span>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {matchedProfile.doctors.map((doc, i) => (
                  <div key={i} className="bg-white border border-brand-border rounded-xl p-3 hover:border-brand-borderHover transition-all cursor-pointer">
                    <div className="font-bold text-xs text-brand-accent mb-0.5">👨‍⚕️ {doc.name}</div>
                    <div className="text-[11px] text-brand-textMuted">{doc.specialty} • {doc.phone}</div>
                    <div className="text-[10px] text-brand-textMuted/60 mt-1">{doc.address}</div>
                  </div>
                ))}
                {matchedProfile.labs.map((lab, i) => (
                  <div key={i} className="bg-white border border-brand-border rounded-xl p-3 hover:border-brand-borderHover transition-all cursor-pointer">
                    <div className="font-bold text-xs text-purple-700 mb-0.5">🔬 {lab.name}</div>
                    <div className="text-[11px] text-brand-textMuted">Diagnostic Labs • {lab.phone}</div>
                    <div className="text-[10px] text-brand-textMuted/60 mt-1">{lab.address}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {/* ==========================================
           MODALS OVERLAYS
           ========================================== */}
      
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

    </div>
  );
}
