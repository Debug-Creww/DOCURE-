// src/components/HealthAnalytics/HealthAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, TrendingUp, ShieldCheck, Thermometer, 
  Calendar, CheckCircle2, Clock, AlertTriangle, Pill, 
  Bell, Plus, Check, RefreshCw, Sparkles, Award, 
  CheckCircle, Droplet, Scale, Gauge, TestTube2, Stethoscope
} from 'lucide-react';
import { 
  subscribeAnalytics, 
  approveDoseOnTime, 
  updateDailyVitals, 
  formatDateKey,
  recordNotificationDoseTaken
} from '../../services/healthAnalyticsService';

export default function HealthAnalytics({ userId = 'user_active', userSymptoms = '' }) {
  const [analyticsData, setAnalyticsData] = useState({});
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));
  const [chartMode, setChartMode] = useState('sugar'); // 'sugar' | 'adherence' | 'hb' | 'rbc' | 'score'
  const [showLogModal, setShowLogModal] = useState(false);
  
  // Modal form states
  const [formSugar, setFormSugar] = useState(98);
  const [formRbc, setFormRbc] = useState(4.85);
  const [formHb, setFormHb] = useState(13.8);
  const [formBp, setFormBp] = useState('120/80');
  const [formWeight, setFormWeight] = useState(64.5);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeAnalytics((data) => {
      setAnalyticsData(data);
    });
    return unsubscribe;
  }, []);

  const daysList = Object.values(analyticsData).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const activeDay = analyticsData[selectedDateKey] || daysList[daysList.length - 1] || null;

  useEffect(() => {
    if (activeDay) {
      setFormSugar(activeDay.sugarLevel || 98);
      setFormRbc(activeDay.rbcLevel || 4.85);
      setFormHb(activeDay.haemoglobin || 13.8);
      setFormBp(activeDay.bloodPressure || '120/80');
      setFormWeight(activeDay.weight || 64.5);
    }
  }, [selectedDateKey, activeDay]);

  const showFeedback = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApproveDose = (doseId) => {
    approveDoseOnTime(selectedDateKey, doseId, userId);
    showFeedback('✅ Dose verified & marked as taken on time! Adherence chart updated.');
  };

  const handleSimulateAlarm = () => {
    const doseTimes = ['08:00 AM', '01:00 PM', '08:00 PM'];
    const randomTime = doseTimes[Math.floor(Math.random() * doseTimes.length)];
    recordNotificationDoseTaken('Metformin Hydrochloride', randomTime, userId);
    showFeedback(`🔔 Alarm triggered & approved: Metformin taken for ${randomTime}!`);
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();
    updateDailyVitals(selectedDateKey, {
      sugarLevel: formSugar,
      rbcLevel: formRbc,
      haemoglobin: formHb,
      bloodPressure: formBp,
      weight: formWeight
    });
    setShowLogModal(false);
    showFeedback(`🩺 Vitals saved for ${activeDay?.dayFull || 'today'}! Daily analytics updated.`);
  };

  if (!activeDay) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-brand-textMuted">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading Health & Prescription Analytics...
      </div>
    );
  }

  // Adherence calculation for active day
  const totalDoses = activeDay.doses?.length || 1;
  const takenDoses = activeDay.doses?.filter(d => d.status === 'taken').length || 0;
  const currentAdherence = Math.round((takenDoses / totalDoses) * 100);

  // 7-day averages
  const avgAdherence = daysList.length > 0 
    ? Math.round(daysList.reduce((acc, d) => {
        const t = d.doses?.length || 1;
        const tk = d.doses?.filter(x => x.status === 'taken').length || 0;
        return acc + (tk / t) * 100;
      }, 0) / daysList.length)
    : 100;

  const avgSugar = daysList.length > 0
    ? Math.round(daysList.reduce((acc, d) => acc + (d.sugarLevel || 98), 0) / daysList.length)
    : 98;

  const avgHb = daysList.length > 0
    ? (daysList.reduce((acc, d) => acc + (d.haemoglobin || 13.8), 0) / daysList.length).toFixed(1)
    : '13.8';

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto relative">
      {/* Toast alert banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[99999] bg-slate-900/95 backdrop-blur text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-300">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="h-[70px] bg-brand-sand border-b border-brand-border flex justify-between items-center px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-textDark">Day-wise Clinical Vitals & Prescription Analytics</h3>
            <p className="text-xs text-brand-textMuted">Real-time daily tracking of Sugar, RBC, Haemoglobin, Blood Pressure & Weight</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSimulateAlarm}
            className="px-3.5 py-1.5 bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/30 text-brand-accent text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Trigger alarm notification & approve dose immediately"
          >
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>Test Alarm & Approve</span>
          </button>
          
          <button 
            onClick={() => setShowLogModal(true)}
            className="px-3.5 py-1.5 bg-brand-accent hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log / Update Vitals</span>
          </button>
        </div>
      </header>

      <div className="p-8 flex flex-col gap-6 max-w-6xl mx-auto w-full">
        {/* =========================================================
            1. DAY-WISE CALENDAR / WEEKDAY SELECTOR
            ========================================================= */}
        <div className="bg-brand-sand/40 border border-brand-border rounded-3xl p-4">
          <div className="flex justify-between items-center mb-3 px-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-accent" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-textDark">
                Selected Day: <span className="text-brand-accent">{activeDay.dayFull}, {activeDay.dateNumber} {activeDay.monthShort}</span>
              </span>
            </div>
            <span className="text-[11px] font-mono text-brand-textMuted">
              7-Day Continuous Monitoring Window
            </span>
          </div>

          {/* 7 Days Carousel Buttons */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {daysList.map((day) => {
              const isSelected = day.dateKey === selectedDateKey;
              const dTotal = day.doses?.length || 1;
              const dTaken = day.doses?.filter(d => d.status === 'taken').length || 0;
              const dayAdherence = Math.round((dTaken / dTotal) * 100);

              return (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedDateKey(day.dateKey)}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-between gap-1.5 transition-all duration-200 border text-center relative ${
                    isSelected
                      ? 'bg-brand-accent text-white border-brand-accent shadow-lg shadow-teal-900/15 scale-[1.03]'
                      : 'bg-white border-brand-border hover:border-brand-accent/50 text-brand-textDark hover:bg-brand-sand/50'
                  }`}
                >
                  {day.isToday && (
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full mb-0.5 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-brand-accent/10 text-brand-accent'
                    }`}>
                      Today
                    </span>
                  )}
                  
                  <span className={`text-[10px] font-mono uppercase font-bold ${isSelected ? 'text-white/80' : 'text-brand-textMuted'}`}>
                    {day.dayShort}
                  </span>
                  
                  <span className="text-base font-bold font-mono leading-none">
                    {day.dateNumber}
                  </span>

                  {/* Adherence dot / badge */}
                  <div className="mt-1 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${
                      dayAdherence === 100 ? 'bg-emerald-400' : (dayAdherence >= 50 ? 'bg-amber-400' : 'bg-rose-400')
                    }`}></span>
                    <span className={`text-[9px] font-mono font-bold ${isSelected ? 'text-white/90' : 'text-brand-textMuted'}`}>
                      {dayAdherence}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================
            2. REPLACED CLINICAL METRICS SECTION (SUGAR, RBC, HB, BP, WEIGHT)
            ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. Sugar Level Card */}
          <div className="bg-white border border-brand-border rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:border-brand-borderHover transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-brand-textMuted uppercase">Sugar Level</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-bold text-brand-textDark">{activeDay.sugarLevel}</span>
                  <span className="text-[11px] font-mono text-brand-textMuted">mg/dL</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <Droplet className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeDay.sugarLevel <= 100 ? 'bg-emerald-50 text-emerald-700' : (activeDay.sugarLevel <= 125 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')
              }`}>
                {activeDay.sugarLevel <= 100 ? 'Normal Fasting' : (activeDay.sugarLevel <= 125 ? 'Pre-diabetic Range' : 'Elevated')}
              </span>
              <span className="text-[9px] font-mono text-brand-textMuted">70-110 mg/dL</span>
            </div>
          </div>

          {/* 2. RBC Level Card */}
          <div className="bg-white border border-brand-border rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:border-brand-borderHover transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-brand-textMuted uppercase">RBC Level</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-bold text-brand-textDark">{activeDay.rbcLevel}</span>
                  <span className="text-[11px] font-mono text-brand-textMuted">M/µL</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                <TestTube2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Healthy Count
              </span>
              <span className="text-[9px] font-mono text-brand-textMuted">4.2-5.4 M/µL</span>
            </div>
          </div>

          {/* 3. Haemoglobin Card */}
          <div className="bg-white border border-brand-border rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:border-brand-borderHover transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-brand-textMuted uppercase">Haemoglobin</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-bold text-brand-textDark">{activeDay.haemoglobin}</span>
                  <span className="text-[11px] font-mono text-brand-textMuted">g/dL</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Optimal Oxygen
              </span>
              <span className="text-[9px] font-mono text-brand-textMuted">12.0-16.0 g/dL</span>
            </div>
          </div>

          {/* 4. Blood Pressure Card */}
          <div className="bg-white border border-brand-border rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:border-brand-borderHover transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-brand-textMuted uppercase">Blood Pressure</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-bold text-brand-textDark">{activeDay.bloodPressure}</span>
                  <span className="text-[11px] font-mono text-brand-textMuted">mmHg</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-brand-accent border border-brand-accent/20 flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Standard Normotensive
              </span>
              <span className="text-[9px] font-mono text-brand-textMuted">&lt; 120/80</span>
            </div>
          </div>

          {/* 5. Weight Card */}
          <div className="bg-white border border-brand-border rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:border-brand-borderHover transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-brand-textMuted uppercase">Body Weight</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-bold text-brand-textDark">{activeDay.weight}</span>
                  <span className="text-[11px] font-mono text-brand-textMuted">kg</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                BMI: 22.1 (Normal)
              </span>
              <span className="text-[9px] font-mono text-brand-textMuted">Target: 64.0 kg</span>
            </div>
          </div>
        </div>

        {/* =========================================================
            3. DAY-WISE PRESCRIPTION ADHERENCE & DOSE TIMELINE
            ========================================================= */}
        <div className="bg-white border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-brand-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-brand-accent flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-brand-textDark">
                  Prescription Dose Schedule & Adherence for {activeDay.dayFull}
                </h4>
              </div>
              <p className="text-xs text-brand-textMuted mt-0.5">
                Alarms notify on scheduled times. Approving a dose marks it taken on time & updates health analytics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-brand-sand px-3 py-1.5 rounded-xl border border-brand-border">
                <span className="text-xs text-brand-textMuted">Adherence Rate:</span>
                <span className="font-mono font-extrabold text-sm text-brand-accent">{currentAdherence}%</span>
                <span className="text-[11px] text-brand-textMuted">({takenDoses}/{totalDoses} doses)</span>
              </div>
            </div>
          </div>

          {/* Doses Timeline List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {activeDay.doses?.map((dose) => {
              const isTaken = dose.status === 'taken';
              const isMissed = dose.status === 'missed';

              return (
                <div 
                  key={dose.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isTaken 
                      ? 'bg-emerald-50/60 border-emerald-200' 
                      : (isMissed ? 'bg-rose-50/60 border-rose-200' : 'bg-brand-sand/40 border-brand-border hover:border-brand-accent')
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                        isTaken ? 'bg-emerald-500 text-white' : (isMissed ? 'bg-rose-500 text-white' : 'bg-brand-accent/10 text-brand-accent')
                      }`}>
                        {isTaken ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-textMuted block">
                          Dose Time: {dose.time}
                        </span>
                        <h5 className="font-bold text-xs text-brand-textDark mt-0.5">
                          {dose.medicineName}
                        </h5>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-brand-textMuted flex justify-between items-center bg-white/70 px-2.5 py-1.5 rounded-lg border border-black/5">
                    <span>Dosage: <strong>{dose.dosage}</strong></span>
                    {isTaken ? (
                      <span className="text-emerald-700 font-bold font-mono text-[10px]">
                        Taken at {dose.takenAt || dose.time} ✅
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold font-mono text-[10px]">
                        Pending Verification ⏳
                      </span>
                    )}
                  </div>

                  {/* Approve / Verify Button */}
                  <div>
                    {isTaken ? (
                      <div className="w-full py-2 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified On Time</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApproveDose(dose.id)}
                        className="w-full py-2 bg-brand-accent hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Take Dose</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================
            4. DAY-BY-DAY INTERACTIVE GRAPHICAL BAR CHART
            ========================================================= */}
        <div className="bg-white border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-brand-border pb-4">
            <div>
              <h4 className="font-bold text-sm text-brand-textDark flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-accent" />
                <span>7-Day Clinical Graphical Progression</span>
              </h4>
              <p className="text-xs text-brand-textMuted mt-0.5">
                Day-by-day comparison curves across tracked clinical indicators
              </p>
            </div>

            {/* Metric Mode Switcher */}
            <div className="flex bg-brand-sand p-1 rounded-xl border border-brand-border text-xs flex-wrap gap-1">
              <button
                onClick={() => setChartMode('sugar')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  chartMode === 'sugar' ? 'bg-white text-brand-accent shadow-sm' : 'text-brand-textMuted hover:text-brand-textDark'
                }`}
              >
                Sugar (mg/dL)
              </button>
              <button
                onClick={() => setChartMode('hb')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  chartMode === 'hb' ? 'bg-white text-brand-accent shadow-sm' : 'text-brand-textMuted hover:text-brand-textDark'
                }`}
              >
                Haemoglobin (g/dL)
              </button>
              <button
                onClick={() => setChartMode('rbc')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  chartMode === 'rbc' ? 'bg-white text-brand-accent shadow-sm' : 'text-brand-textMuted hover:text-brand-textDark'
                }`}
              >
                RBC (M/µL)
              </button>
              <button
                onClick={() => setChartMode('adherence')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  chartMode === 'adherence' ? 'bg-white text-brand-accent shadow-sm' : 'text-brand-textMuted hover:text-brand-textDark'
                }`}
              >
                Adherence (%)
              </button>
              <button
                onClick={() => setChartMode('score')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  chartMode === 'score' ? 'bg-white text-brand-accent shadow-sm' : 'text-brand-textMuted hover:text-brand-textDark'
                }`}
              >
                Health Score
              </button>
            </div>
          </div>

          {/* Visual SVG / HTML Bar Graph */}
          <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-brand-sand/20 rounded-2xl border border-brand-border/60">
            {daysList.map((day) => {
              const isSelected = day.dateKey === selectedDateKey;
              let val = 0;
              let maxVal = 100;
              let unit = '';
              let barColor = 'bg-teal-500';

              if (chartMode === 'sugar') {
                val = day.sugarLevel || 98;
                maxVal = 140;
                unit = ' mg/dL';
                barColor = val <= 100 ? 'bg-emerald-500' : (val <= 125 ? 'bg-amber-500' : 'bg-rose-500');
              } else if (chartMode === 'hb') {
                val = day.haemoglobin || 13.8;
                maxVal = 18.0;
                unit = ' g/dL';
                barColor = 'bg-red-500';
              } else if (chartMode === 'rbc') {
                val = day.rbcLevel || 4.85;
                maxVal = 6.0;
                unit = ' M/µL';
                barColor = 'bg-rose-500';
              } else if (chartMode === 'adherence') {
                const t = day.doses?.length || 1;
                const tk = day.doses?.filter(x => x.status === 'taken').length || 0;
                val = Math.round((tk / t) * 100);
                maxVal = 100;
                unit = '%';
                barColor = val === 100 ? 'bg-emerald-500' : (val >= 60 ? 'bg-teal-500' : 'bg-rose-500');
              } else {
                val = day.healthScore || 90;
                maxVal = 100;
                unit = '/100';
                barColor = val >= 85 ? 'bg-teal-600' : (val >= 70 ? 'bg-emerald-500' : 'bg-amber-500');
              }

              const heightPct = Math.max(15, Math.min(100, (val / maxVal) * 100));

              return (
                <div 
                  key={day.dateKey}
                  onClick={() => setSelectedDateKey(day.dateKey)}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                >
                  {/* Tooltip / value badge */}
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${
                    isSelected ? 'bg-brand-textDark text-white' : 'text-brand-textMuted group-hover:text-brand-textDark'
                  }`}>
                    {val}{unit}
                  </span>

                  {/* Vertical bar */}
                  <div className="w-full max-w-[38px] bg-slate-100 rounded-t-xl overflow-hidden h-36 flex items-end p-0.5">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-500 ${barColor} ${
                        isSelected ? 'ring-2 ring-brand-textDark shadow-md' : 'opacity-85 group-hover:opacity-100'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>

                  {/* Day label */}
                  <span className={`text-[11px] font-mono font-bold ${
                    isSelected ? 'text-brand-accent' : 'text-brand-textMuted'
                  }`}>
                    {day.dayShort}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-between items-center text-xs text-brand-textMuted px-2 gap-2">
            <span>7-Day Mean Fasting Sugar: <strong className="text-brand-textDark font-mono">{avgSugar} mg/dL</strong></span>
            <span>7-Day Mean Haemoglobin: <strong className="text-brand-textDark font-mono">{avgHb} g/dL</strong></span>
            <span>7-Day Prescription Adherence: <strong className="text-brand-textDark font-mono">{avgAdherence}%</strong></span>
          </div>
        </div>
      </div>

      {/* =========================================================
          LOG / UPDATE MEDICAL VITALS MODAL
          ========================================================= */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white border border-brand-border rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-brand-accent" />
                <h4 className="font-bold text-sm text-brand-textDark">Log / Update Clinical Vitals</h4>
              </div>
              <button 
                onClick={() => setShowLogModal(false)}
                className="text-brand-textMuted hover:text-brand-textDark font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-brand-textMuted">
              Record verified diagnostic readings for <strong>{activeDay.dayFull}, {activeDay.dateNumber} {activeDay.monthShort}</strong>.
            </p>

            <form onSubmit={handleSaveVitals} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-textDark block mb-1">Sugar Level (mg/dL)</label>
                  <input 
                    type="number" 
                    value={formSugar}
                    onChange={e => setFormSugar(e.target.value)}
                    className="w-full border border-brand-border rounded-xl px-3 py-2 outline-none focus:border-brand-accent bg-white"
                    placeholder="e.g. 98"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-brand-textDark block mb-1">RBC Level (M/µL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formRbc}
                    onChange={e => setFormRbc(e.target.value)}
                    className="w-full border border-brand-border rounded-xl px-3 py-2 outline-none focus:border-brand-accent bg-white"
                    placeholder="e.g. 4.85"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-brand-textDark block mb-1">Haemoglobin (g/dL)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={formHb}
                    onChange={e => setFormHb(e.target.value)}
                    className="w-full border border-brand-border rounded-xl px-3 py-2 outline-none focus:border-brand-accent bg-white"
                    placeholder="e.g. 13.8"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-brand-textDark block mb-1">Blood Pressure</label>
                  <input 
                    type="text" 
                    value={formBp}
                    onChange={e => setFormBp(e.target.value)}
                    className="w-full border border-brand-border rounded-xl px-3 py-2 outline-none focus:border-brand-accent bg-white"
                    placeholder="e.g. 120/80"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-brand-textDark block mb-1">Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={formWeight}
                    onChange={e => setFormWeight(e.target.value)}
                    className="w-full border border-brand-border rounded-xl px-3 py-2 outline-none focus:border-brand-accent bg-white"
                    placeholder="e.g. 64.5"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-2 pt-2 border-t border-brand-border">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-accent hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-sm"
                >
                  Save Vitals to Daily Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2.5 bg-brand-sand text-brand-textDark font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
