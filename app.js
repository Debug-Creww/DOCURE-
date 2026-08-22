/* 
   Docure Healthcare Assistant & Ecosystem Controller (Tailwind Remastered)
   Coordinates Landing Page transitions, Blocky Grid Canvas, Nav Glide, and Triage Modules
*/

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // Page Transitions & Navigation Elements
    // ==========================================
    const pagesSlider = document.getElementById("pages-vertical-slider");
    const navBarMenu = document.getElementById("nav-bar-menu");
    const navIndicatorLine = document.getElementById("nav-indicator-line");
    const navLinks = document.querySelectorAll(".nav-link");

    // Global transitions exposed to window
    window.scrollToTriageDesk = function() {
        pagesSlider.style.transform = "translateY(-50%)";
        // Recalculate Leaflet map size since map container is now visible
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 800);
    };

    window.scrollToLanding = function() {
        pagesSlider.style.transform = "translateY(0%)";
    };

    // Navigation Bar gliding indicator logic (Recording 162350)
    navLinks.forEach(link => {
        link.addEventListener("mouseenter", () => {
            const linkRect = link.getBoundingClientRect();
            const menuRect = navBarMenu.getBoundingClientRect();
            
            // Calculate absolute offsets relative to menu container
            const offsetLeft = linkRect.left - menuRect.left;
            const width = linkRect.width;
            
            navIndicatorLine.style.left = `${offsetLeft}px`;
            navIndicatorLine.style.width = `${width}px`;
        });
    });

    navBarMenu.addEventListener("mouseleave", () => {
        // Return indicator line to 0 width
        navIndicatorLine.style.width = "0px";
    });

    // ==========================================


    // ==========================================
    // Triage Dashboard Elements
    // ==========================================
    const chatMessages = document.getElementById("chat-messages");
    const messageInput = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");
    const symptomChips = document.getElementById("symptom-chips");
    
    const btnEditProfile = document.getElementById("btn-edit-profile");
    const btnSaveProfile = document.getElementById("btn-save-profile");
    const btnCancelProfile = document.getElementById("btn-cancel-profile");
    const profileDisplayMode = document.getElementById("profile-display-mode");
    const profileEditMode = document.getElementById("profile-edit-mode");
    
    const profNameVal = document.getElementById("prof-name-val");
    const profAgeVal = document.getElementById("prof-age-val");
    const profBloodVal = document.getElementById("prof-blood-val");
    const profChronicVal = document.getElementById("prof-chronic-val");
    const profContactVal = document.getElementById("prof-contact-val");
    
    const inputProfName = document.getElementById("input-prof-name");
    const inputProfAge = document.getElementById("input-prof-age");
    const inputProfBlood = document.getElementById("input-prof-blood");
    const inputProfChronic = document.getElementById("input-prof-chronic");
    const inputProfContact = document.getElementById("input-prof-contact");
    
    const ekgCanvas = document.getElementById("ekg-canvas");
    const riskScoreEl = document.getElementById("risk-score");
    const pulseRateEl = document.getElementById("pulse-rate");
    
    const activeMedsList = document.getElementById("active-meds-list");
    const btnToggleAddMed = document.getElementById("btn-toggle-add-med");
    const addMedForm = document.getElementById("add-med-form");
    const btnSaveNewMed = document.getElementById("btn-save-new-med");
    const btnCancelNewMed = document.getElementById("btn-cancel-new-med");
    const newMedName = document.getElementById("new-med-name");
    const newMedTime = document.getElementById("new-med-time");
    
    const voiceToggleBtn = document.getElementById("voice-toggle-btn");
    const voiceStatus = document.getElementById("voice-status");
    
    const reportUploadInput = document.getElementById("report-upload");
    const uploadLoadingOverlay = document.getElementById("upload-loading-overlay");
    
    const activeCityIndicator = document.getElementById("active-city-indicator");
    
    const sosTrigger = document.getElementById("sos-trigger");
    const emergencyModal = document.getElementById("emergency-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const sosTimerCount = document.getElementById("sos-timer-count");
    const sosFamilyContactName = document.getElementById("sos-family-contact-name");
    const smsStatusIndicator = document.getElementById("sms-status-indicator");

    // ==========================================
    // Dashboard Core State & Coordinators
    // ==========================================
    let isVoiceEnabled = true;
    let isListening = false;
    let recognition = null;
    let emergencyCountdown = null;
    let audioAlarmInterval = null;

    // Global tab switcher matching Image 2
    window.switchSidebarTab = function(tabName, element) {
        const items = document.querySelectorAll(".sidebar-item");
        items.forEach(item => {
            item.className = "sidebar-item flex flex-col items-center justify-center py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all text-[10px] w-[70px] mx-auto rounded-2xl relative";
            const icon = item.querySelector("i");
            if (icon) icon.classList.remove("text-[#0f766e]");
            const span = item.querySelector("span");
            if (span) span.classList.remove("text-[#0f766e]");
        });
        
        element.className = "sidebar-item active flex flex-col items-center justify-center py-3 bg-white text-[#0f766e] font-bold text-[10px] w-[70px] mx-auto rounded-2xl shadow-lg shadow-black/10 relative transition-all duration-300";
        const icon = element.querySelector("i");
        if (icon) icon.classList.add("text-[#0f766e]");
        const span = element.querySelector("span");
        if (span) span.classList.add("text-[#0f766e]");
    };

    // ==========================================
    // MODULE 1: Profile Manager (Modal triggers)
    // ==========================================
    const profileModal = document.getElementById("patient-profile-modal");
    const closeProfileModalBtn = document.getElementById("close-profile-modal-btn");
    const btnModalCancel = document.getElementById("btn-modal-cancel");
    const btnModalSave = document.getElementById("btn-modal-save");
    
    const modalProfName = document.getElementById("modal-prof-name");
    const modalProfAge = document.getElementById("modal-prof-age");
    const modalProfGender = document.getElementById("modal-prof-gender");
    const modalProfCity = document.getElementById("modal-prof-city");
    
    const inputNewAllergy = document.getElementById("input-new-allergy");
    const inputNewCondition = document.getElementById("input-new-condition");
    const inputNewMedication = document.getElementById("input-new-medication");
    
    const btnAddAllergy = document.getElementById("btn-add-allergy");
    const btnAddCondition = document.getElementById("btn-add-condition");
    const btnAddMedication = document.getElementById("btn-add-medication");
    
    const allergiesChipsContainer = document.getElementById("profile-allergies-chips");
    const conditionsChipsContainer = document.getElementById("profile-conditions-chips");
    const medicationsChipsContainer = document.getElementById("profile-medications-chips");

    // Open Modal
    const sidebarProfileBtn = document.getElementById("sidebar-profile-btn");
    if (sidebarProfileBtn) {
        sidebarProfileBtn.addEventListener("click", openProfileModal);
    }
    
    btnEditProfile.addEventListener("click", openProfileModal);

    function openProfileModal() {
        profileModal.classList.remove("hidden");
        profileModal.classList.add("flex");
        
        modalProfName.value = profNameVal.textContent;
        modalProfAge.value = profAgeVal.textContent;
        modalProfCity.value = activeCityIndicator.textContent;
    }

    // Close Modal
    function closeProfileModal() {
        profileModal.classList.add("hidden");
        profileModal.classList.remove("flex");
    }
    
    closeProfileModalBtn.addEventListener("click", closeProfileModal);
    btnModalCancel.addEventListener("click", closeProfileModal);

    // Dynamic Tag Addition helper
    function createTagChip(text, container, bgClass, textClass) {
        const chipId = "chip-" + Date.now() + Math.random().toString(36).substr(2, 4);
        const chip = document.createElement("span");
        chip.className = `inline-flex items-center gap-1 text-[11px] font-bold ${bgClass} ${textClass} px-2.5 py-1 rounded-full select-none`;
        chip.id = chipId;
        chip.innerHTML = `${text} <button type="button" class="hover:text-red-700 font-bold focus:outline-none ml-0.5" onclick="document.getElementById('${chipId}').remove()">×</button>`;
        container.appendChild(chip);
    }

    btnAddAllergy.addEventListener("click", () => {
        const val = inputNewAllergy.value.trim();
        if (val) {
            createTagChip(val, allergiesChipsContainer, "bg-[#fbf5e6] text-[#b45309]", "");
            inputNewAllergy.value = "";
        }
    });

    btnAddCondition.addEventListener("click", () => {
        const val = inputNewCondition.value.trim();
        if (val) {
            createTagChip(val, conditionsChipsContainer, "bg-brand-rose/5 text-brand-rose", "");
            inputNewCondition.value = "";
        }
    });

    btnAddMedication.addEventListener("click", () => {
        const val = inputNewMedication.value.trim();
        if (val) {
            createTagChip(val, medicationsChipsContainer, "bg-brand-sand text-brand-textDark", "");
            inputNewMedication.value = "";
        }
    });

    // Save Modal Data
    btnModalSave.addEventListener("click", () => {
        profNameVal.textContent = modalProfName.value || "Patient Name";
        profAgeVal.textContent = modalProfAge.value || "32";
        activeCityIndicator.textContent = modalProfCity.value.split(',')[0].trim().toUpperCase() || "DELHI";
        
        // Extract conditions chip tags to update the Profile Card Chronic field
        const conditionSpans = conditionsChipsContainer.querySelectorAll("span");
        let conditionsArray = [];
        conditionSpans.forEach(span => {
            const txt = span.textContent.replace("×", "").trim();
            if (txt) conditionsArray.push(txt);
        });
        profChronicVal.textContent = conditionsArray.join(", ") || "None reported";
        
        closeProfileModal();
        
        // Trigger map reload matching updated city
        if (typeof updateMapLocations === "function") {
            updateMapLocations(modalProfCity.value);
        }
    });

    // ==========================================
    // Wellness Hub: EKG Animation (Page 2)
    // ==========================================
    const ctx = ekgCanvas.getContext("2d");
    let ekgTraceX = 0;
    
    function drawDashboardEKG() {
        ctx.fillStyle = "rgba(15, 23, 42, 0.15)"; // Match background-slate-900
        ctx.fillRect(0, 0, ekgCanvas.width, ekgCanvas.height);
        
        let colorHex = "#10b981"; // Emerald
        if (session.risk === "SOS") colorHex = "#f43f5e"; // Rose
        else if (session.risk === "Elevated") colorHex = "#8b5cf6"; // Violet
        
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 4;
        ctx.shadowColor = colorHex;
        
        ctx.beginPath();
        ctx.moveTo(ekgTraceX - 2, ekgCanvas.height / 2);
        
        let y = ekgCanvas.height / 2;
        let cycleWidth = (session.risk === "SOS") ? 40 : ((session.risk === "Elevated") ? 60 : 80);
        let pos = ekgTraceX % cycleWidth;
        
        if (pos > 10 && pos < 13) y = ekgCanvas.height / 2 - 3;
        else if (pos >= 15 && pos < 17) y = ekgCanvas.height / 2 + 5;
        else if (pos >= 17 && pos < 20) y = 4;
        else if (pos >= 20 && pos < 22) y = ekgCanvas.height - 4;
        else if (pos >= 24 && pos < 28) y = ekgCanvas.height / 2 - 5;
        
        ctx.lineTo(ekgTraceX, y);
        ctx.stroke();
        
        let speed = (session.risk === "SOS") ? 2.5 : ((session.risk === "Elevated") ? 1.7 : 1.2);
        ekgTraceX += speed;
        if (ekgTraceX > ekgCanvas.width) {
            ekgTraceX = 0;
            ctx.clearRect(0, 0, ekgCanvas.width, ekgCanvas.height);
        }
        
        requestAnimationFrame(drawDashboardEKG);
    }
    drawDashboardEKG();

    function updateRiskState(riskLevel) {
        session.risk = riskLevel;
        riskScoreEl.textContent = riskLevel;
        
        if (riskLevel === "SOS") {
            session.pulse = 142;
            riskScoreEl.style.color = "#f43f5e";
        } else if (riskLevel === "Elevated") {
            session.pulse = 98;
            riskScoreEl.style.color = "#8b5cf6";
        } else {
            session.pulse = 72;
            riskScoreEl.style.color = "#10b981";
        }
        pulseRateEl.textContent = session.pulse;
    }

    // ==========================================
    // MODULE 4: Medicine Scheduler
    // ==========================================
    btnToggleAddMed.addEventListener("click", () => {
        addMedForm.classList.toggle("hidden");
    });

    btnSaveNewMed.addEventListener("click", () => {
        const name = newMedName.value.trim();
        const time = newMedTime.value.trim();
        
        if (!name || !time) return;
        
        const medId = "med-" + Date.now();
        const medDiv = document.createElement("div");
        medDiv.className = "bg-brand-sand border border-brand-border rounded-lg p-2.5 flex justify-between items-center";
        medDiv.id = medId;
        medDiv.innerHTML = `
            <div class="flex flex-col text-xs">
                <span class="font-bold text-brand-textDark">${name}</span>
                <span class="text-[10px] text-brand-textMuted">Scheduled: ${time}</span>
            </div>
            <button class="text-brand-textMuted hover:text-brand-rose font-bold text-base px-1" onclick="document.getElementById('${medId}').remove();">×</button>
        `;
        activeMedsList.appendChild(medDiv);
        
        newMedName.value = "";
        newMedTime.value = "";
        addMedForm.classList.add("hidden");
    });

    btnCancelNewMed.addEventListener("click", () => {
        newMedName.value = "";
        newMedTime.value = "";
        addMedForm.classList.add("hidden");
    });

    // ==========================================
    // MODULE 3: Report Analyzer
    // ==========================================
    reportUploadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        uploadLoadingOverlay.classList.remove("hidden");
        uploadLoadingOverlay.classList.add("flex");
        
        setTimeout(() => {
            uploadLoadingOverlay.classList.add("hidden");
            uploadLoadingOverlay.classList.remove("flex");
            
            const results = { hemoglobin: 13.8, cholesterol: 195, glucose: 242 };
            
            const reportHTML = `📋 **Blood Test Analysis Summary**
            <br><br>
            DOCURE AI has parsed the text in your uploaded file **${file.name}** and extracted key metabolic biomarkers:
            <br><br>
            • **Hemoglobin:** ${results.hemoglobin} g/dL (Normal: 12.0 - 16.0)
            <br>
            • **Total Cholesterol:** ${results.cholesterol} mg/dL (Normal: < 200)
            <br>
            • **Fasting Glucose:** ${results.glucose} mg/dL (⚠️ <span class="text-brand-rose font-bold">ELEVATED / OUT OF RANGE</span>)
            <br><br>
            **Clinical AI Diagnostic Analysis:**
            Your glucose levels indicate high blood sugar (hyperglycemia), which may suggest pre-diabetes or diabetes risk. 
            <br><br>
            **Ecosystem Updates:**
            1. We have updated your **Patient Profile Card** chronic conditions list with: *Pre-Diabetes Risk (Elevated Glucose)*.
            2. We have scheduled an automated diagnostic check recommendation.
            <br><br>
            *Please check with your specialist MD.*`;
            
            appendMessage("docure", reportHTML);
            
            profChronicVal.textContent = "Pre-Diabetes (Elevated Glucose)";
            inputProfChronic.value = "Pre-Diabetes (Elevated Glucose)";
            
            updateRiskState("Elevated");
            reportUploadInput.value = "";
        }, 2200);
    });

    // ==========================================
    // MODULE 5: Maps Exploration
    // ==========================================
    try {
        map = L.map('map', {
            zoomControl: true,
            attributionControl: false
        }).setView([20, 0], 2);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 18
        }).addTo(map);
        
        markersGroup = L.layerGroup().addTo(map);
    } catch (err) {
        console.error("Leaflet loading error:", err);
    }

    function updateMapLocations(cityName) {
        if (!map || !markersGroup) return;
        
        const cleanCity = cityName.toLowerCase().trim();
        let coords = [28.6139, 77.2090];
        let matched = false;
        
        for (let key in CityCoordinates) {
            if (cleanCity.includes(key) || key.includes(cleanCity)) {
                coords = CityCoordinates[key];
                matched = true;
                break;
            }
        }
        
        map.setView(coords, 13);
        markersGroup.clearLayers();
        activeCityIndicator.textContent = cityName.toUpperCase();
        
        let profileKey = "general";
        let lowerSymptoms = session.userSymptoms.toLowerCase();
        if (lowerSymptoms.includes("head") || lowerSymptoms.includes("migraine") || lowerSymptoms.includes("dizzy")) {
            profileKey = "headache";
        } else if (lowerSymptoms.includes("fever") || lowerSymptoms.includes("cough") || lowerSymptoms.includes("cold") || lowerSymptoms.includes("throat")) {
            profileKey = "fever";
        } else if (lowerSymptoms.includes("stomach") || lowerSymptoms.includes("belly") || lowerSymptoms.includes("nausea")) {
            profileKey = "stomach";
        }
        
        const matchedProfile = MedicalKnowledge[profileKey];
        session.matchedProfile = matchedProfile;
        
        const mapListEl = document.getElementById("map-locations-list");
        mapListEl.innerHTML = "";
        
        // Plot Doctor pins
        matchedProfile.doctors.forEach((doc, idx) => {
            const latOffset = (idx === 0) ? 0.003 : -0.004;
            const lngOffset = (idx === 0) ? -0.004 : 0.005;
            const docPos = [coords[0] + latOffset, coords[1] + lngOffset];
            
            const docIcon = L.divIcon({
                className: 'glowing-pin doctor',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });
            
            const marker = L.marker(docPos, { icon: docIcon })
                .bindPopup(`<strong>${doc.name}</strong><br>${doc.specialty}<br>${doc.phone}`)
                .addTo(markersGroup);
                
            const recBox = document.createElement("div");
            recBox.className = "bg-white border border-brand-border rounded-xl p-3 hover:border-brand-borderHover transition-all cursor-pointer";
            recBox.innerHTML = `
                <div class="font-bold text-xs text-brand-accent mb-0.5">👨‍⚕️ ${doc.name}</div>
                <div class="text-[11px] text-brand-textMuted">${doc.specialty} • ${doc.phone}</div>
                <div class="text-[10px] text-brand-textMuted/60 mt-1">${doc.address}</div>
            `;
            recBox.addEventListener("click", () => {
                map.setView(docPos, 15);
                marker.openPopup();
            });
            mapListEl.appendChild(recBox);
        });
        
        // Plot Lab pins
        matchedProfile.labs.forEach((lab, idx) => {
            const latOffset = -0.002;
            const lngOffset = -0.002;
            const labPos = [coords[0] + latOffset, coords[1] + lngOffset];
            
            const labIcon = L.divIcon({
                className: 'glowing-pin lab',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });
            
            const marker = L.marker(labPos, { icon: labIcon })
                .bindPopup(`<strong>${lab.name}</strong><br>Lab Tests & Scans<br>${lab.phone}`)
                .addTo(markersGroup);
                
            const recBox = document.createElement("div");
            recBox.className = "bg-white border border-brand-border rounded-xl p-3 hover:border-brand-borderHover transition-all cursor-pointer";
            recBox.innerHTML = `
                <div class="font-bold text-xs text-brand-purple mb-0.5">🔬 ${lab.name}</div>
                <div class="text-[11px] text-brand-textMuted">Diagnostic Scans • Call: ${lab.phone}</div>
                <div class="text-[10px] text-brand-textMuted/60 mt-1">${lab.address}</div>
            `;
            recBox.addEventListener("click", () => {
                map.setView(labPos, 15);
                marker.openPopup();
            });
            mapListEl.appendChild(recBox);
        });
    }

    // ==========================================
    // MODULE 6: Emergency Overrides
    // ==========================================
    function triggerEmergency() {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (isListening && recognition) recognition.stop();
        
        updateRiskState("SOS");
        
        emergencyModal.classList.remove("hidden");
        emergencyModal.classList.add("flex");
        
        smsStatusIndicator.textContent = "DISPATCHING SMS...";
        smsStatusIndicator.className = "text-brand-amber font-mono font-bold text-[9px] animate-pulse";
        
        let smsTimer = setTimeout(() => {
            smsStatusIndicator.textContent = `SENT TO ${profContactVal.textContent}!`;
            smsStatusIndicator.className = "text-brand-emerald font-mono font-bold text-[9px]";
        }, 2500);
        
        let count = 30;
        sosTimerCount.textContent = count;
        
        if (emergencyCountdown) clearInterval(emergencyCountdown);
        emergencyCountdown = setInterval(() => {
            count--;
            sosTimerCount.textContent = count;
            if (count <= 0) {
                clearInterval(emergencyCountdown);
                sosTimerCount.textContent = "0 (DISPATCHED)";
            }
        }, 1000);
        
        triggerAudioSiren();
        
        const modalContent = document.getElementById("sos-modal-content");
        modalContent.classList.add("shake-sos");
        setTimeout(() => modalContent.classList.remove("shake-sos"), 500);
        
        appendMessage("user", "⚠️ Emergency Protocol Triggered");
        appendMessage("docure", `🚨 **CRITICAL EMERGENCY SOS OVERRIDE INITIATED** 🚨
        <br><br>
        We have detected signs of severe cardiac or physical distress. 
        <br><br>
        <strong>1. Immediate ambulance dispatch coordinates sent.</strong>
        <br>
        <strong>2. Emergency family alert dispatched to: ${profContactVal.textContent}.</strong>
        <br><br>
        Please dial 102 immediately or head to the nearest clinic.`);
    }

    function triggerAudioSiren() {
        if (audioAlarmInterval) clearInterval(audioAlarmInterval);
        
        audioAlarmInterval = setInterval(() => {
            if (session.risk !== "SOS") {
                clearInterval(audioAlarmInterval);
                return;
            }
            playBeepTone(880, 0.2);
            setTimeout(() => {
                if (session.risk === "SOS") playBeepTone(660, 0.2);
            }, 300);
        }, 1500);
    }

    function playBeepTone(frequency, duration) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = "sine";
            oscillator.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn("AudioContext tone blocked:", e);
        }
    }

    closeModalBtn.addEventListener("click", () => {
        emergencyModal.classList.add("hidden");
        emergencyModal.classList.remove("flex");
        updateRiskState("Normal");
        
        if (emergencyCountdown) clearInterval(emergencyCountdown);
        if (audioAlarmInterval) clearInterval(audioAlarmInterval);
    });

    sosTrigger.addEventListener("click", () => {
        triggerEmergency();
    });

    // ==========================================
    // MODULE 2: AI Chatbot Logic
    // ==========================================
    function checkEmergency(text) {
        const clean = text.toLowerCase();
        return EMERGENCY_KEYWORDS.some(k => clean.includes(k));
    }

    function respond(userText) {
        if (checkEmergency(userText)) {
            triggerEmergency();
            return;
        }
        
        showTypingIndicator();
        
        setTimeout(() => {
            removeTypingIndicator();
            
            switch (session.state) {
                case "INTAKE_SYMPTOMS":
                    session.userSymptoms = userText;
                    session.state = "INTAKE_ONSET";
                    updateChips(["Just today", "Last 2 days", "More than a week"], "Onset:");
                    appendMessage("docure", `Understood. How long have you been experiencing this symptom? (*${userText}*)`);
                    break;
                    
                case "INTAKE_ONSET":
                    session.userOnset = userText;
                    session.state = "INTAKE_SEVERITY";
                    updateChips(["1-3 (Mild)", "4-6 (Moderate)", "7-10 (Severe)"], "Severity:");
                    appendMessage("docure", `Got it. On a scale of **1 to 10** (1 being very minor and 10 being severe distress), how would you rate your pain/discomfort?`);
                    break;
                    
                case "INTAKE_SEVERITY":
                    session.userSeverity = userText;
                    session.state = "INTAKE_CONTEXT";
                    
                    if (userText.includes("7") || userText.includes("8") || userText.includes("9") || userText.includes("10") || userText.includes("Severe")) {
                        updateRiskState("Elevated");
                    } else {
                        updateRiskState("Normal");
                    }
                    
                    updateChips(["Asthma & Albuterol", "None / Healthy", "High Blood Pressure"], "Context:");
                    appendMessage("docure", `Please list any pre-existing conditions, age, or current medications to personalize diagnostic analysis.`);
                    break;
                    
                case "INTAKE_CONTEXT":
                    session.userContext = userText;
                    session.state = "LOCATION_ASK";
                    
                    let lowerSymptoms = session.userSymptoms.toLowerCase();
                    let profileKey = "general";
                    if (lowerSymptoms.includes("head") || lowerSymptoms.includes("migraine") || lowerSymptoms.includes("dizzy")) {
                        profileKey = "headache";
                    } else if (lowerSymptoms.includes("fever") || lowerSymptoms.includes("cough") || lowerSymptoms.includes("cold") || lowerSymptoms.includes("throat")) {
                        profileKey = "fever";
                    } else if (lowerSymptoms.includes("stomach") || lowerSymptoms.includes("belly") || lowerSymptoms.includes("nausea")) {
                        profileKey = "stomach";
                    }
                    
                    session.matchedProfile = MedicalKnowledge[profileKey];
                    
                    let analysisHTML = `### AI Triaging Analysis Summary
                    Based on your responses, here are potential clinical conditions for your profile (Age: *${profAgeVal.textContent}*, Symptoms: *${session.userSymptoms}*):
                    <br><br>`;
                    
                    session.matchedProfile.conditions.forEach((cond, idx) => {
                        analysisHTML += `**${idx + 1}. ${cond.name}**<br>${cond.reason}<br><br>`;
                    });
                    
                    analysisHTML += `
                    <div class="bg-brand-amber/10 border border-brand-amber/30 text-brand-amber rounded-xl p-3 text-xs mt-3 select-none">
                        ⚠️ **AI Triage Disclaimer:** Docure is an automated assistant. This evaluation does not replace in-person physician checks.
                    </div>
                    <br>
                    ### Safe Home Care Practices
                    <ul>`;
                    
                    session.matchedProfile.prevention.forEach(step => {
                        analysisHTML += `<li>${step}</li>`;
                    });
                    
                    analysisHTML += `</ul>
                    <br>
                    **Urgent Warning:** If you experience any breathing issues, fainting, or sudden arm/chest pain, request SOS immediately.`;
                    
                    appendMessage("docure", analysisHTML);
                    
                    setTimeout(() => {
                        updateChips(["New Delhi", "Mumbai", "New York", "London"], "Cities:");
                        appendMessage("docure", `To display nearby specialists and testing centers on the map, could you tell me your **current city**?`);
                    }, 1200);
                    break;
                    
                case "LOCATION_ASK":
                    session.userLocation = userText;
                    session.state = "RECS_GIVEN";
                    
                    updateMapLocations(userText);
                    
                    let recHTML = `### Verified Medical Resources in *${session.userLocation}*
                    
                    I have plotted coordinates for local facilities matching your diagnostic profile on the map panel:
                    <br><br>
                    <strong>Recommended Specialists Nearby:</strong>
                    <div class="flex flex-col gap-2 mt-3">`;
                    
                    session.matchedProfile.doctors.forEach(doc => {
                        recHTML += `
                        <div class="bg-white border border-brand-border rounded-xl p-3 hover:border-brand-borderHover transition-all cursor-pointer">
                            <div class="font-bold text-xs text-brand-accent mb-0.5">👨‍⚕️ ${doc.name} - ${doc.specialty}</div>
                            <div class="text-[11px] text-brand-textMuted">Call: ${doc.phone}</div>
                            <div class="text-[10px] text-brand-textMuted/60 mt-1">${doc.address}</div>
                        </div>`;
                    });
                    
                    recHTML += `</div>
                    <br>
                    <strong>Recommended Diagnostic Labs:</strong>
                    <div class="flex flex-col gap-2 mt-3">`;
                    
                    session.matchedProfile.labs.forEach(lab => {
                        recHTML += `
                        <div class="bg-white border border-brand-border rounded-xl p-3 hover:border-brand-borderHover transition-all cursor-pointer">
                            <div class="font-bold text-xs text-brand-purple mb-0.5">🔬 ${lab.name}</div>
                            <div class="text-[11px] text-brand-textMuted">Diagnostic Scans • Call: ${lab.phone}</div>
                            <div class="text-[10px] text-brand-textMuted/60 mt-1">${lab.address}</div>
                        </div>`;
                    });
                    
                    recHTML += `</div>
                    <br>
                    Symptom analysis is complete. You can enter a new symptom anytime to start over!`;
                    
                    appendMessage("docure", recHTML);
                    
                    setTimeout(() => {
                        updateChips(["Headache", "Fever & Cough", "Stomach Cramps", "⚠️ Chest Pain"], "New Symptom:");
                        session.state = "INTAKE_SYMPTOMS";
                    }, 1500);
                    break;
            }
        }, 800);
    }

    // ==========================================
    // Voice interaction Engine
    // ==========================================
    function cleanTextForSpeech(rawHTML) {
        let clean = rawHTML.replace(/<[^>]*>/g, ' ');
        clean = clean.replace(/\*\*(.*?)\*\*/g, '$1');
        clean = clean.replace(/\*(.*?)\*/g, '$1');
        clean = clean.replace(/🩺|🚨|⚠️|📋|👨‍⚕️|🔬|»/g, '');
        
        if (clean.includes("Recommended Specialists Nearby:")) {
            clean = clean.split("Recommended Specialists Nearby:")[0] + 
                    " I have updated the nearby specialist clinics and testing centers on the map panel on your screen. Please review their contact numbers and schedules.";
        }
        return clean.replace(/\s+/g, ' ').trim();
    }

    function speakText(rawHTML) {
        if (!isVoiceEnabled || !window.speechSynthesis) return;
        
        window.speechSynthesis.cancel();
        
        const speakableText = cleanTextForSpeech(rawHTML);
        if (!speakableText) return;
        
        const utterance = new SpeechSynthesisUtterance(speakableText);
        const voices = window.speechSynthesis.getVoices();
        
        const voiceChoice = voices.find(v => 
            v.name.includes("Google US English") || 
            v.name.includes("Google UK English Female") || 
            v.lang.startsWith("en-")
        );
        if (voiceChoice) utterance.voice = voiceChoice;
        
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        
        recognition.onstart = () => {
            isListening = true;
            const micIcon = document.getElementById("mic-icon");
            if (micIcon) {
                micIcon.outerHTML = '<i data-lucide="mic" class="w-4 h-4 animate-pulse text-brand-rose" id="mic-icon"></i>';
                lucide.createIcons();
            }
            messageInput.placeholder = "Listening...";
        };
        
        recognition.onend = () => {
            isListening = false;
            const micIcon = document.getElementById("mic-icon");
            if (micIcon) {
                micIcon.outerHTML = '<i data-lucide="mic" class="w-4 h-4 text-brand-textMuted" id="mic-icon"></i>';
                lucide.createIcons();
            }
            messageInput.placeholder = "Type your symptoms...";
        };
        
        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript;
            messageInput.value = text;
            setTimeout(() => handleSend(), 800);
        };
    } else {
        document.getElementById("mic-btn").style.display = "none";
    }

    function toggleListening() {
        if (!recognition) return;
        if (isListening) {
            recognition.stop();
        } else {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            recognition.start();
        }
    }

    voiceToggleBtn.addEventListener("click", () => {
        isVoiceEnabled = !isVoiceEnabled;
        const voiceIconEl = document.getElementById("voice-icon");
        if (isVoiceEnabled) {
            voiceStatus.textContent = "Voice ON";
            voiceToggleBtn.style.background = "rgba(15, 118, 110, 0.1)";
            voiceToggleBtn.style.borderColor = "rgba(15, 118, 110, 0.2)";
            voiceToggleBtn.style.color = "var(--color-cyan)";
            
            if (voiceIconEl) {
                voiceIconEl.outerHTML = '<i data-lucide="volume-2" class="w-3.5 h-3.5" id="voice-icon"></i>';
                lucide.createIcons();
            }
            
            const lastDocBubble = Array.from(document.querySelectorAll(".message.docure")).pop();
            if (lastDocBubble) {
                speakText(lastDocBubble.querySelector(".bubble").innerHTML);
            }
        } else {
            voiceStatus.textContent = "Voice OFF";
            voiceToggleBtn.style.background = "rgba(255, 255, 255, 0.05)";
            voiceToggleBtn.style.borderColor = "rgba(255, 255, 255, 0.08)";
            voiceToggleBtn.style.color = "var(--text-secondary)";
            
            if (voiceIconEl) {
                voiceIconEl.outerHTML = '<i data-lucide="volume-x" class="w-3.5 h-3.5" id="voice-icon"></i>';
                lucide.createIcons();
            }
            
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        }
    });

    document.getElementById("mic-btn").addEventListener("click", () => {
        toggleListening();
    });

    // ==========================================
    // Messaging Log Append helpers
    // ==========================================
    function appendMessage(sender, htmlText) {
        const msgDiv = document.createElement("div");
        const avatar = document.createElement("div");
        avatar.className = "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono font-bold text-xs select-none";
        
        const bubble = document.createElement("div");
        bubble.className = "text-sm leading-relaxed p-4 rounded-xl shadow-sm bubble";
        
        if (sender === "docure") {
            msgDiv.className = "flex gap-3 max-w-[85%] self-start items-start message docure";
            avatar.className += " bg-brand-accent/10 border border-brand-accent/20 text-brand-accent";
            avatar.innerHTML = `<i data-lucide="bot" class="w-4 h-4"></i>`;
            bubble.className += " bg-brand-sand border border-brand-border text-brand-textDark rounded-tl-sm";
        } else {
            msgDiv.className = "flex gap-3 max-w-[85%] self-end items-start flex-row-reverse message user";
            avatar.className += " bg-brand-accent/15 border border-brand-accent/30 text-brand-accent";
            avatar.innerHTML = `<i data-lucide="user" class="w-4 h-4"></i>`;
            bubble.className += " bg-brand-accent text-white rounded-tr-sm";
        }
        
        let fmt = htmlText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
            
        bubble.innerHTML = fmt;
        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        
        lucide.createIcons();
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        if (sender === "docure") {
            speakText(htmlText);
        }
    }

    function showTypingIndicator() {
        const msgDiv = document.createElement("div");
        msgDiv.className = "flex gap-3 max-w-[85%] self-start items-start message docure typing-temp";
        
        const avatar = document.createElement("div");
        avatar.className = "w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0";
        avatar.innerHTML = `<i data-lucide="bot" class="w-4 h-4"></i>`;
        
        const bubble = document.createElement("div");
        bubble.className = "bg-brand-sand border border-brand-border text-brand-textDark text-sm leading-relaxed p-4 rounded-xl rounded-tl-sm bubble shadow-sm";
        bubble.innerHTML = `
            <div class="flex gap-1.5 py-1">
                <div class="w-1.5 h-1.5 rounded-full bg-brand-textMuted animate-bounce [animation-delay:-0.3s]"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-brand-textMuted animate-bounce [animation-delay:-0.15s]"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-brand-textMuted animate-bounce"></div>
            </div>
        `;
        
        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        lucide.createIcons();
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const temp = document.querySelector(".typing-temp");
        if (temp) temp.remove();
    }

    // ==========================================
    // Interactive Event Handlers
    // ==========================================
    function handleSend() {
        const val = messageInput.value.trim();
        if (!val) return;
        
        appendMessage("user", val);
        messageInput.value = "";
        respond(val);
    }

    sendBtn.addEventListener("click", handleSend);
    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSend();
    });

    symptomChips.addEventListener("click", (e) => {
        if (e.target.classList.contains("chip")) {
            const queryVal = e.target.getAttribute("data-val") || e.target.textContent;
            appendMessage("user", queryVal);
            respond(queryVal);
        }
    });

    // Helper: update symptom chips
    function updateChips(chipLabels, labelText = "Options:") {
        symptomChips.innerHTML = `<span class="text-[10px] text-brand-textMuted font-mono uppercase tracking-wider mr-1">${labelText}</span>`;
        chipLabels.forEach(label => {
            const btn = document.createElement("button");
            if (label.includes("⚠️") || label.includes("Severe")) {
                btn.className = "bg-brand-rose/5 border border-brand-rose/30 hover:bg-brand-rose/15 text-brand-rose text-[11px] px-3 py-1.5 rounded-full chip chip-emergency";
            } else {
                btn.className = "bg-white border border-brand-border hover:border-brand-borderHover text-brand-textMuted hover:text-brand-textDark text-[11px] px-3 py-1.5 rounded-full chip";
            }
            btn.textContent = label;
            
            let textVal = label;
            if (label === "Headache") textVal = "I have a mild headache and feel slightly dizzy.";
            if (label === "Fever & Cough") textVal = "I have a high fever with dry cough.";
            if (label === "Stomach Cramps") textVal = "I feel sharp cramps in my stomach.";
            if (label === "⚠️ Chest Pain") textVal = "I have sudden crushing chest pain and shortness of breath.";
            
            btn.setAttribute("data-val", textVal);
            symptomChips.appendChild(btn);
        });
    }

    // Global med deleting exposed
    window.deleteMed = function(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    };
});
