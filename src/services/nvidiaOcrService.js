/**
 * NVIDIA NIM AI Medical Lab Report Analyzer Service
 * Strategy:
 * - PDF: Extract full text via PDF.js → send to Llama 3.1 70B text model for analysis
 * - Image: Send to Llama 3.2 90B Vision model for OCR + analysis
 */

const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY || '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';

const NVIDIA_TEXT_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? '/api/nvidia/v1/chat/completions'
  : 'https://integrate.api.nvidia.com/v1/chat/completions';

const TEXT_MODEL  = 'meta/llama-3.1-70b-instruct';
const VISION_MODEL = 'meta/llama-3.2-90b-vision-instruct';

/** ---------------------------------------------------------------
 *  SAMPLE REPORTS (for preview only)
 *  --------------------------------------------------------------- */
export const SAMPLE_LAB_REPORTS = [
  {
    id: 'sample_cbc',
    title: 'Complete Blood Count (CBC) Panel',
    labName: 'Dr Lal PathLabs NABL Accredited Central Laboratory',
    patientName: 'Sample Patient (32 Yrs / Male)',
    healthScore: 74,
    summary: 'Mild microcytic anemia indicated by low Hemoglobin and MCV. Elevated TLC suggests mild inflammation.',
    specialistToConsult: 'General Physician / Hematologist',
    allParameters: [
      { serialNo:1, name:'Hemoglobin (Hb)',           value:'11.2', unit:'g/dL',      referenceRange:'13.0 - 17.0', status:'LOW',    interpretation:'Mild anemia reducing oxygen-carrying capacity.' },
      { serialNo:2, name:'Total Leukocyte Count (WBC)',value:'11800',unit:'/cumm',     referenceRange:'4000 - 11000',status:'HIGH',   interpretation:'Elevated WBC indicates active immune response.' },
      { serialNo:3, name:'Neutrophils',                value:'64',   unit:'%',         referenceRange:'40 - 70',     status:'NORMAL', interpretation:'Normal primary defense against bacteria.' },
      { serialNo:4, name:'Lymphocytes',                value:'28',   unit:'%',         referenceRange:'20 - 40',     status:'NORMAL', interpretation:'Healthy adaptive immune proportion.' },
      { serialNo:5, name:'Monocytes',                  value:'5.0',  unit:'%',         referenceRange:'2 - 10',      status:'NORMAL', interpretation:'Normal phagocytic levels.' },
      { serialNo:6, name:'Eosinophils',                value:'3.0',  unit:'%',         referenceRange:'1 - 6',       status:'NORMAL', interpretation:'No active allergic burden.' },
      { serialNo:7, name:'PCV / Hematocrit',           value:'34.8', unit:'%',         referenceRange:'40 - 50',     status:'LOW',    interpretation:'Reduced red blood cell volume in blood.' },
      { serialNo:8, name:'MCV',                        value:'76.2', unit:'fL',        referenceRange:'80 - 100',    status:'LOW',    interpretation:'Microcytic cells, iron deficiency marker.' },
      { serialNo:9, name:'MCH',                        value:'26.1', unit:'pg',        referenceRange:'27 - 32',     status:'LOW',    interpretation:'Hypochromic cells with lower hemoglobin content.' },
      { serialNo:10,name:'Platelet Count',              value:'2.40', unit:'Lakhs/cumm',referenceRange:'1.5 - 4.5',  status:'NORMAL', interpretation:'Healthy bone marrow clotting generation.' },
      { serialNo:11,name:'PDW',                        value:'18.4', unit:'%',         referenceRange:'9 - 17',      status:'HIGH',   interpretation:'Variation in platelet sizes during active generation.' },
    ],
    positiveInsights: ['Platelet count is robust (2.40 Lakhs/cumm).', 'Differential WBC count is well-balanced.'],
    negativeInsights: ['Mild Iron Deficiency Anemia (Hb 11.2 g/dL, MCV 76.2 fL).', 'Mild Leukocytosis (WBC 11,800/cumm).'],
    recommendedActions: ['Iron Profile testing (Serum Ferritin, TIBC).', 'Iron-rich diet: spinach, beetroot, pomegranate.', 'Repeat CBC after 4 weeks.']
  }
];

/** ---------------------------------------------------------------
 *  PDF TEXT EXTRACTION via PDF.js
 *  --------------------------------------------------------------- */
export async function extractTextFromPdf(pdfFile) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  
  // Try PDF.js first
  try {
    const pdfjs = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
    if (pdfjs) {
      const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      const maxPages = Math.min(pdfDoc.numPages, 5);
      for (let p = 1; p <= maxPages; p++) {
        const page = await pdfDoc.getPage(p);
        const content = await page.getTextContent();
        // Preserve row structure using Y-position grouping
        const items = content.items.sort((a, b) => {
          const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]);
          if (Math.abs(yDiff) > 3) return yDiff;
          return a.transform[4] - b.transform[4];
        });
        let lastY = null;
        let line = '';
        for (const item of items) {
          const y = Math.round(item.transform[5]);
          if (lastY !== null && Math.abs(y - lastY) > 3) {
            fullText += line.trim() + '\n';
            line = '';
          }
          line += item.str + ' ';
          lastY = y;
        }
        if (line.trim()) fullText += line.trim() + '\n';
        fullText += '\n';
      }
      if (fullText.trim().length > 50) return fullText.trim();
    }
  } catch(e) {
    console.warn('PDF.js text extraction error:', e);
  }

  // Fallback: raw binary string extraction
  try {
    const uint8 = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(uint8);
    const matches = raw.match(/\(([^()]{2,200})\)/g) || [];
    return matches.map(m => m.slice(1,-1)).filter(s => /[a-zA-Z0-9]/.test(s)).join(' ');
  } catch(e) {
    return '';
  }
}

/** ---------------------------------------------------------------
 *  IMAGE OPTIMIZER (resize to max 1280px, JPEG 85%)
 *  --------------------------------------------------------------- */
export async function optimizeImageForAi(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) { resolve(dataUrl); return; }
    const img = new Image();
    img.onload = () => {
      const maxDim = 1280;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else        { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** ---------------------------------------------------------------
 *  JSON EXTRACTOR (handles ```json blocks + raw JSON)
 *  --------------------------------------------------------------- */
function extractJson(text) {
  if (!text) return null;

  // Try each ```json ... ``` block, pick the one with allParameters
  const blocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const b of blocks) {
    try {
      const p = JSON.parse(b[1].trim());
      if (p?.allParameters?.length) return p;
    } catch(e) {}
  }

  // Try first balanced JSON object
  let depth = 0, start = text.indexOf('{');
  if (start !== -1) {
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') { depth--; if (depth === 0) {
        try {
          const p = JSON.parse(text.slice(start, i+1));
          if (p?.allParameters?.length) return p;
        } catch(e) {}
        break;
      }}
    }
  }

  // Last resort
  try { return JSON.parse(text.replace(/```(?:json)?/gi,'').replace(/```/g,'').trim()); }
  catch(e) { return null; }
}

/** ---------------------------------------------------------------
 *  BUILD PROMPT
 *  --------------------------------------------------------------- */
function buildPrompt(extractedText = '') {
  return `You are a medical laboratory report OCR and clinical analysis AI.
${extractedText ? `The following is the FULL TEXT extracted from a lab report PDF:\n\n${extractedText}\n\n` : ''}
Extract every diagnostic test parameter from this lab report in sequential order (as printed top to bottom).

For each parameter provide:
- serialNo (integer starting at 1)
- name (exact test name as printed)
- value (exact numeric result)
- unit (exact unit: g/dL, mg/dL, %, /cumm, U/L, etc.)
- referenceRange (exact normal range as printed)
- status: "HIGH" if value exceeds upper limit, "LOW" if below lower limit, "NORMAL" if within range
- interpretation (one sentence about what this result means clinically)

Also provide:
- reportName: test panel name (e.g. "Complete Blood Count", "Lipid Profile", etc.)
- labName: laboratory or hospital name from letterhead
- testDate: date of test or "Recent"
- patientName: patient name or "Patient"
- healthScore: 0-100 (100=all normal, deduct points per abnormal parameter)
- summary: 2-3 sentence clinical overview
- specialistToConsult: appropriate specialist (e.g. "Hematologist", "Cardiologist")
- positiveInsights: array of 2-4 positive findings (normal parameters)
- negativeInsights: array of 2-4 risk findings (abnormal parameters)
- recommendedActions: array of 3-4 actionable recommendations

Respond with ONLY valid JSON, no markdown fences, no commentary:
{"reportName":"...","labName":"...","testDate":"...","patientName":"...","healthScore":85,"summary":"...","specialistToConsult":"...","allParameters":[{"serialNo":1,"name":"...","value":"...","unit":"...","referenceRange":"...","status":"NORMAL","interpretation":"..."}],"positiveInsights":["..."],"negativeInsights":["..."],"recommendedActions":["..."]}`;
}

/** ---------------------------------------------------------------
 *  CALL NVIDIA API
 *  --------------------------------------------------------------- */
async function callNvidiaApi(model, messages) {
  const response = await fetch(NVIDIA_TEXT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`
    },
    body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 4096 })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NVIDIA API ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/** ---------------------------------------------------------------
 *  MAIN EXPORT: ANALYZE PDF (text-based, most reliable)
 *  --------------------------------------------------------------- */
export async function analyzePdfReport(pdfFile) {
  const extractedText = await extractTextFromPdf(pdfFile);

  if (!extractedText || extractedText.trim().length < 30) {
    return { error: true, message: 'Could not read text from the PDF. Try uploading a higher-quality or digital (non-scanned) PDF.' };
  }

  const prompt = buildPrompt(extractedText);
  const rawText = await callNvidiaApi(TEXT_MODEL, [{ role: 'user', content: prompt }]);
  const parsed = extractJson(rawText);

  if (parsed?.allParameters?.length) {
    return enrichResult(parsed);
  }

  return { error: true, message: 'AI could not parse lab parameters from this PDF. Ensure it contains a blood test or pathology report.' };
}

/** ---------------------------------------------------------------
 *  MAIN EXPORT: ANALYZE IMAGE (vision-based)
 *  --------------------------------------------------------------- */
export async function analyzeImageReport(dataUrl) {
  const optimized = await optimizeImageForAi(dataUrl);
  const prompt = buildPrompt();

  const rawText = await callNvidiaApi(VISION_MODEL, [{
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: optimized } }
    ]
  }]);

  const parsed = extractJson(rawText);
  if (parsed?.allParameters?.length) {
    return enrichResult(parsed);
  }

  return { error: true, message: 'Could not extract lab parameters from this image. Please upload a clear, well-lit photo of a lab report.' };
}

/** ---------------------------------------------------------------
 *  LEGACY COMPAT: UNIFIED ENTRY POINT (called from component)
 *  --------------------------------------------------------------- */
export async function analyzeLabReportWithNvidia(base64DataUrl, reportText = '') {
  // If reportText is meaningful PDF text, use text model
  if (reportText && reportText.trim().length > 100) {
    const prompt = buildPrompt(reportText);
    try {
      const rawText = await callNvidiaApi(TEXT_MODEL, [{ role: 'user', content: prompt }]);
      const parsed = extractJson(rawText);
      if (parsed?.allParameters?.length) return enrichResult(parsed);
    } catch(e) {
      console.error('Text model error:', e);
    }
  }

  // Otherwise use vision model on the image
  if (base64DataUrl && base64DataUrl.startsWith('data:image')) {
    try {
      return await analyzeImageReport(base64DataUrl);
    } catch(e) {
      console.error('Vision model error:', e);
    }
  }

  return { error: true, message: 'Unable to extract data. Please upload a clear PDF or image of your lab report.' };
}

/** ---------------------------------------------------------------
 *  ENRICH parsed result with derived fields
 *  --------------------------------------------------------------- */
function enrichResult(parsed) {
  const all = parsed.allParameters || [];
  return {
    ...parsed,
    allParameters: all.map((p, i) => ({ ...p, serialNo: p.serialNo || i+1 })),
    excessParams: all.filter(p => p.status === 'HIGH' || p.status === 'EXCESS'),
    normalParams: all.filter(p => p.status === 'NORMAL'),
    lowParams:    all.filter(p => p.status === 'LOW' || p.status === 'DEFICIENT'),
  };
}
