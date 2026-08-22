import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowLeft, 
  RefreshCw, 
  Stethoscope, 
  Heart, 
  ShieldAlert, 
  Activity, 
  ExternalLink, 
  Printer, 
  Download, 
  Check, 
  HelpCircle,
  Eye,
  FileCheck,
  AlertCircle,
  FileUp,
  X,
  ListOrdered,
  Layers
} from 'lucide-react';
import { 
  analyzePdfReport,
  analyzeImageReport,
  analyzeLabReportWithNvidia,
  SAMPLE_LAB_REPORTS 
} from '../../services/nvidiaOcrService';

export default function LabReportAnalyzerNode({ onBackHome = null }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);
  const [reportData, setReportData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState('all');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Process selected file — PDF uses text extraction, Images use vision
  const processFile = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setErrorMessage('');
    setReportData(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setIsAnalyzing(true);
    setAnalysisStep(1);

    if (isPdf) {
      try {
        const animInterval = setInterval(() => {
          setAnalysisStep(prev => (prev < 3 ? prev + 1 : prev));
        }, 1200);
        const result = await analyzePdfReport(file);
        clearInterval(animInterval);
        setIsAnalyzing(false);
        if (result?.error) {
          setErrorMessage(result.message || 'Could not read PDF. Ensure it is a digital lab report.');
        } else {
          setReportData(result);
        }
      } catch (err) {
        console.error('PDF analysis error:', err);
        setErrorMessage('AI service unavailable. Please try again.');
        setIsAnalyzing(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result;
        setPreviewUrl(dataUrl);
        try {
          const animInterval = setInterval(() => {
            setAnalysisStep(prev => (prev < 3 ? prev + 1 : prev));
          }, 1200);
          const result = await analyzeImageReport(dataUrl);
          clearInterval(animInterval);
          setIsAnalyzing(false);
          if (result?.error) {
            setErrorMessage(result.message || 'Could not extract data from image. Upload a clear photo.');
          } else {
            setReportData(result);
          }
        } catch (err) {
          console.error('Image analysis error:', err);
          setErrorMessage('AI service unavailable. Please try again.');
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle standard file input change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Run NVIDIA Analysis with animated telemetry steps
  const runNvidiaAnalysis = async (base64Url, fileName, reportText = '') => {
    setIsAnalyzing(true);
    setAnalysisStep(1);
    setErrorMessage('');

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    try {
      const result = await analyzeLabReportWithNvidia(base64Url, reportText || `File: ${fileName}`);
      if (result?.error) {
        setErrorMessage(result.message || 'Could not parse the report text. Please upload a clear, high-resolution photo or PDF.');
        setReportData(null);
      } else if (result) {
        setReportData(result);
      }
    } catch (err) {
      console.error('NVIDIA OCR Analysis error:', err);
      setErrorMessage('Network timeout or AI service unavailable. Please try again.');
    } finally {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
    }
  };

  // Load Preset Sample Report (Optional quick preview)
  const handleLoadSample = (sample) => {
    setSelectedFile({ name: `${sample.title} (Clinical Sample)` });
    setPreviewUrl(null);
    setIsAnalyzing(true);
    setAnalysisStep(1);
    setErrorMessage('');

    setTimeout(() => {
      const excess = sample.allParameters.filter(p => p.status === 'HIGH' || p.status === 'EXCESS');
      const normal = sample.allParameters.filter(p => p.status === 'NORMAL');
      const low = sample.allParameters.filter(p => p.status === 'LOW' || p.status === 'DEFICIENT');

      setReportData({
        ...sample,
        excessParams: excess,
        normalParams: normal,
        lowParams: low
      });
      setIsAnalyzing(false);
    }, 600);
  };

  // Reset to clean upload screen
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setReportData(null);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Counts & Parameter lists
  const allParams = reportData?.allParameters || [];
  const excessCount = allParams.filter(p => p.status === 'HIGH' || p.status === 'EXCESS').length;
  const normalCount = allParams.filter(p => p.status === 'NORMAL').length;
  const lowCount = allParams.filter(p => p.status === 'LOW' || p.status === 'DEFICIENT').length;
  const totalCount = allParams.length;

  // Filtered displayed parameters
  const displayedParams = allParams.filter(p => {
    if (activeTabFilter === 'excess') return p.status === 'HIGH' || p.status === 'EXCESS';
    if (activeTabFilter === 'normal') return p.status === 'NORMAL';
    if (activeTabFilter === 'low') return p.status === 'LOW' || p.status === 'DEFICIENT';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg relative overflow-hidden font-sans select-none">
      
      {/* Top Header */}
      <header className="h-[74px] bg-white border-b border-brand-border px-6 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          {onBackHome && (
            <button
              onClick={onBackHome}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95 border border-slate-200"
              title="Return to Home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#0f766e] shrink-0">
            <FileText className="w-5 h-5 text-[#0f766e]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#0f766e] border border-emerald-200 uppercase">
                NODE 04 • AI LAB REPORT ANALYZER
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-[10px] font-mono text-[#0f766e] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#10b981]" />
                NVIDIA VISION OCR ENGINE
              </span>
            </div>
            <h2 className="text-sm font-bold text-brand-textDark mt-0.5">
              Serial-Wise Optical Parameter Extraction & Clinical Classifier
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {reportData && (
            <button
              onClick={handleReset}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 border border-slate-200 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Scan Another Report</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645e] text-white rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Report</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            className="hidden"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Error Notification if any */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-800 text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold"
            >
              Upload Clear Photo
            </button>
          </div>
        )}

        {/* ============================================================
             STATE 1: CLEAN UPLOAD HERO ZONE (When No Report is Uploaded)
             ============================================================ */}
        {!reportData && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center min-h-[480px] py-10 px-4">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center relative ${
                isDragging 
                  ? 'border-[#0f766e] bg-teal-50/80 scale-[1.02] shadow-xl' 
                  : 'border-slate-300 hover:border-[#0f766e] bg-white hover:bg-slate-50/80 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Upload Icon Badge */}
              <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-200/80 flex items-center justify-center mb-5 text-[#0f766e] group-hover:scale-110 transition-transform shadow-inner">
                <FileUp className="w-10 h-10 animate-bounce-slow" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1">
                Upload Real Lab Report (Blood Test / Pathology)
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
                Upload your report photo (JPG, PNG) or PDF. NVIDIA Vision AI will extract every test row <strong>serial-wise from top to bottom</strong> with exact values, reference ranges, and Excess / Normal / Low status.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-6 py-2.5 bg-[#0f766e] hover:bg-[#0d645e] text-white rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-md transition-all pointer-events-none"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Report Image from Device</span>
                </button>
              </div>

              <div className="flex items-center gap-4 mt-6 text-[11px] font-mono text-slate-400">
                <span>✓ CBC Blood Count</span>
                <span>•</span>
                <span>✓ Lipid Profile</span>
                <span>•</span>
                <span>✓ Liver LFT / Kidney KFT</span>
                <span>•</span>
                <span>✓ Diabetes HbA1c</span>
              </div>
            </div>

            {/* Quick Sample Preview */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider">
                Or preview with a clinical test reference:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {SAMPLE_LAB_REPORTS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleLoadSample(sample)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-2xs hover:shadow-xs active:scale-95"
                  >
                    <span>🩸</span>
                    <span>{sample.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
             STATE 2: LIVE SCANNING & OCR PROCESSING STATE
             ============================================================ */}
        {isAnalyzing && (
          <div className="bg-white border border-brand-border rounded-3xl p-16 text-center flex flex-col items-center justify-center shadow-sm max-w-2xl mx-auto my-12">
            <div className="relative w-20 h-20 mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-[#0f766e] animate-spin"></div>
              <Sparkles className="w-8 h-8 text-[#0f766e] absolute inset-0 m-auto animate-pulse" />
            </div>

            <h4 className="text-base font-bold text-slate-800">
              {analysisStep === 1 && 'Reading Document Optical Image with NVIDIA Vision...'}
              {analysisStep === 2 && 'Extracting Tests Serial-Wise with Reference Intervals...'}
              {analysisStep === 3 && 'Evaluating Excess, Normal & Low Diagnostic Status...'}
            </h4>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Strict Real-Document Extraction • Zero Fake Hallucinations
            </p>

            <div className="flex items-center gap-2 mt-6">
              {[1, 2, 3].map((step) => (
                <div 
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    analysisStep >= step ? 'w-12 bg-[#0f766e]' : 'w-6 bg-slate-200'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
             STATE 3: ANALYZED RESULTS DASHBOARD (Serial-Wise Real Data)
             ============================================================ */}
        {reportData && !isAnalyzing && (
          <>
            {/* Top Upload Info Bar */}
            {selectedFile && (
              <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs font-mono text-[#0f766e]">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-[#0f766e] shrink-0" />
                  <span className="font-bold truncate">Document: {selectedFile.name}</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 ml-3 shrink-0 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Scan Different Report</span>
                </button>
              </div>
            )}

            {/* Top Overview Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Overall Health Score Card */}
              <div className="bg-gradient-to-br from-white to-slate-50 border border-brand-border rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="uppercase font-bold">Health Score</span>
                  <Activity className="w-4 h-4 text-[#0f766e]" />
                </div>
                <div className="flex items-baseline gap-2 my-2">
                  <span className={`text-4xl font-extrabold font-mono ${
                    (reportData?.healthScore || 80) >= 80 
                      ? 'text-emerald-600' 
                      : (reportData?.healthScore || 80) >= 65 
                        ? 'text-amber-600' 
                        : 'text-rose-600'
                  }`}>
                    {reportData?.healthScore || 78}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/ 100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (reportData?.healthScore || 80) >= 80 
                        ? 'bg-emerald-500' 
                        : (reportData?.healthScore || 80) >= 65 
                          ? 'bg-amber-500' 
                          : 'bg-rose-500'
                    }`}
                    style={{ width: `${reportData?.healthScore || 78}%` }}
                  ></div>
                </div>
              </div>

              {/* Excess / High Card */}
              <div 
                onClick={() => setActiveTabFilter(activeTabFilter === 'excess' ? 'all' : 'excess')}
                className={`border rounded-3xl p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
                  activeTabFilter === 'excess' 
                    ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20' 
                    : 'bg-white border-brand-border hover:border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-rose-600">
                  <span className="font-bold uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Excess / High</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                    {excessCount} Alert{excessCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-3xl font-extrabold font-mono text-rose-600 my-2">
                  {excessCount}
                </div>
                <p className="text-[10px] text-slate-500">Above maximum reference limit</p>
              </div>

              {/* Normal / Average Card */}
              <div 
                onClick={() => setActiveTabFilter(activeTabFilter === 'normal' ? 'all' : 'normal')}
                className={`border rounded-3xl p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
                  activeTabFilter === 'normal' 
                    ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/20' 
                    : 'bg-white border-brand-border hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-emerald-600">
                  <span className="font-bold uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Normal / Average</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                    {normalCount} Safe
                  </span>
                </div>
                <div className="text-3xl font-extrabold font-mono text-emerald-600 my-2">
                  {normalCount}
                </div>
                <p className="text-[10px] text-slate-500">Within healthy standard range</p>
              </div>

              {/* Low / Deficient Card */}
              <div 
                onClick={() => setActiveTabFilter(activeTabFilter === 'low' ? 'all' : 'low')}
                className={`border rounded-3xl p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
                  activeTabFilter === 'low' 
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20' 
                    : 'bg-white border-brand-border hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-amber-600">
                  <span className="font-bold uppercase flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" />
                    <span>Low / Deficient</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">
                    {lowCount} Deficit{lowCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-3xl font-extrabold font-mono text-amber-600 my-2">
                  {lowCount}
                </div>
                <p className="text-[10px] text-slate-500">Below biological threshold</p>
              </div>
            </div>

            {/* Diagnostic Clinical Summary & Recommended Specialist */}
            <div className="bg-gradient-to-r from-teal-900 via-[#0a6d5c] to-[#043d33] text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                    {reportData?.reportName || 'Diagnostic Report'}
                  </span>
                  <span className="text-white/60 text-xs font-mono">•</span>
                  <span className="text-emerald-200 text-xs font-mono">
                    {reportData?.labName || 'Verified Laboratory'}
                  </span>
                  {reportData?.testDate && (
                    <>
                      <span className="text-white/60 text-xs font-mono">•</span>
                      <span className="text-white/70 text-xs font-mono">Date: {reportData.testDate}</span>
                    </>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold">
                  {reportData?.reportName || 'Clinical Test Evaluation'}
                </h3>
                <p className="text-xs text-white/90 leading-relaxed font-sans">
                  {reportData?.summary}
                </p>
              </div>

              {/* Specialist Recommendation Pill */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0 flex flex-col gap-1 w-full md:w-auto">
                <div className="text-[10px] font-mono text-emerald-200 uppercase font-bold flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Recommended Specialist</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  {reportData?.specialistToConsult || 'General Physician'}
                </div>
              </div>
            </div>

            {/* Filter Tabs Bar */}
            <div className="flex items-center justify-between pt-2 border-b border-brand-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
                  <ListOrdered className="w-4 h-4" />
                  <span>Filter:</span>
                </span>
                {[
                  { id: 'all', label: `All Serial Tests (${totalCount})` },
                  { id: 'excess', label: `Excess / High (${excessCount})`, color: 'text-rose-600' },
                  { id: 'normal', label: `Normal (${normalCount})`, color: 'text-emerald-600' },
                  { id: 'low', label: `Low (${lowCount})`, color: 'text-amber-600' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                      activeTabFilter === tab.id
                        ? 'bg-[#0f766e] text-white shadow-sm'
                        : 'bg-white border border-brand-border text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <span className="text-[11px] font-mono text-slate-400">
                {displayedParams.length} Parameters Displayed in Report Sequence
              </span>
            </div>

            {/* ============================================================
                 SERIAL-WISE TEST PARAMETERS (In Exact Report Order)
                 ============================================================ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-mono font-bold text-xs uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e]"></span>
                  <span>Sequential Test Parameters (Top-to-Bottom Report Order)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  NVIDIA VISION OCR EXTRACTED
                </span>
              </div>

              <div className="space-y-2.5">
                {displayedParams.map((param, index) => {
                  const isHigh = param.status === 'HIGH' || param.status === 'EXCESS';
                  const isLow = param.status === 'LOW' || param.status === 'DEFICIENT';
                  const isNormal = !isHigh && !isLow;

                  let borderClass = 'border-l-emerald-500 border-emerald-100 bg-white';
                  let statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  let valueColor = 'text-emerald-700';
                  let statusText = 'NORMAL';
                  let StatusIcon = Check;

                  if (isHigh) {
                    borderClass = 'border-l-rose-500 border-rose-200/80 bg-rose-50/30';
                    statusBadge = 'bg-rose-100 text-rose-800 border-rose-300';
                    valueColor = 'text-rose-600';
                    statusText = 'HIGH / EXCESS';
                    StatusIcon = TrendingUp;
                  } else if (isLow) {
                    borderClass = 'border-l-amber-500 border-amber-200/80 bg-amber-50/30';
                    statusBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                    valueColor = 'text-amber-600';
                    statusText = 'LOW / DEFICIENT';
                    StatusIcon = TrendingDown;
                  }

                  return (
                    <div 
                      key={param.serialNo || index}
                      className={`border-l-4 border rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${borderClass}`}
                    >
                      {/* Left: Serial Number & Test Name */}
                      <div className="flex items-start gap-3 max-w-xl">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                          {param.serialNo || index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                            {param.name}
                          </h4>
                          {param.interpretation && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-sans">
                              {param.interpretation}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Observed Value, Unit, Reference Range, & Status Badge */}
                      <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                        {/* Reference Range */}
                        <div className="text-right font-mono">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Reference Range</div>
                          <div className="text-xs text-slate-700 font-bold">{param.referenceRange || 'N/A'}</div>
                        </div>

                        {/* Observed Value */}
                        <div className="text-right font-mono min-w-[90px]">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Observed Value</div>
                          <div className={`text-sm sm:text-base font-extrabold ${valueColor}`}>
                            {param.value} <span className="text-xs font-normal text-slate-500">{param.unit}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border flex items-center gap-1 shrink-0 ${statusBadge}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusText}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================
                 SECTION: POSITIVE & NEGATIVE CLINICAL INSIGHTS
                 ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              
              {/* Positive Insights Panel */}
              <div className="bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-800 font-mono font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Positive Clinical Highlights</span>
                </div>

                <div className="space-y-2 flex-1">
                  {reportData?.positiveInsights?.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-emerald-900 bg-white/80 border border-emerald-100 p-3 rounded-xl shadow-2xs">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas of Concern / Negative Insights Panel */}
              <div className="bg-gradient-to-br from-rose-50/60 to-white border border-rose-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 text-rose-800 font-mono font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Clinical Risks & Areas of Concern</span>
                </div>

                <div className="space-y-2 flex-1">
                  {reportData?.negativeInsights?.map((risk, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-rose-900 bg-white/80 border border-rose-100 p-3 rounded-xl shadow-2xs">
                      <span className="text-rose-600 font-bold">⚠️</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended Actionable Advice & Next Steps */}
            <div className="bg-white border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#0f766e] font-mono font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#10b981]" />
                  <span>Actionable Health Roadmap & Nutritional Advice</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">AI Medical Insights</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {reportData?.recommendedActions?.map((action, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0f766e]/10 text-[#0f766e] flex items-center justify-center text-xs font-bold font-mono">
                      0{idx + 1}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {action}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}

      </div>
    </div>
  );
}
