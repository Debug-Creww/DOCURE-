const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const TAVILY_KEY = import.meta.env.VITE_TAVILY_API_KEY || '';
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// Free OpenStreetMap Geocoding API (Nominatim)
export async function geocodeCity(city) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (error) {
    console.error("Geocoding failed for city:", city, error);
  }
  return null;
}

// 1. Triage analysis using Groq (Llama-3) or Gemini fallback
export async function getTriageAnalysis(symptoms, onset, severity, context, age, gender) {
  const prompt = `You are a clinical AI triage assistant called DOCURE.
Analyze the following patient profile and symptoms:
- Age: ${age}
- Gender: ${gender}
- Symptoms: ${symptoms}
- Onset: ${onset}
- Severity: ${severity}/10
- Pre-existing conditions / medications / other context: ${context}

Provide a structured clinical triage report in MARKDOWN format. It must contain the following sections:
1. ### AI Triaging Analysis Summary
Provide a list of 2-3 potential conditions based on the symptoms and profile. For each condition, give a brief explanation of why it might apply.
2. ### Safe Home Care Practices
Provide 3-4 actionable, safe steps the patient can take at home to manage symptoms.
3. A clear warning: "Urgent Warning: If you experience any breathing issues, chest pain, fainting, or sudden severe symptoms, request SOS immediately."

Be professional, direct, and supportive. Always include the disclaimer that you are an AI, not a doctor.`;

  // Try Groq first
  if (GROQ_KEY) {
    try {
      const response = await fetch('https://api.api-us.groq.com/openai/v1/chat/completions' || 'https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.warn("Groq triage call failed, falling back to Gemini:", error);
    }
  }

  // Fallback to Gemini
  if (GEMINI_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      console.error("Gemini fallback triage call failed:", error);
    }
  }

  return null; // indicates to use mock fallback
}

// 2. Tavily Search for doctors and labs
export async function searchTavily(query) {
  if (!TAVILY_KEY) return null;
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query,
        search_depth: "basic",
        max_results: 5
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Tavily search failed:", error);
    return null;
  }
}

// 3. Structure search results using Gemini
export async function extractSpecialistsAndLabs(searchResultText, city, symptoms) {
  const prompt = `You are a clinical database parser. We searched the web for specialists, doctors, and diagnostic labs in "${city}" for symptoms like "${symptoms}".
Here are the raw search results:
${searchResultText}

Extract and structure this information into a valid JSON object matching this exact typescript interface structure (no markdown wrapper, just raw JSON, do not include any backticks or markdown markers):
{
  "conditions": [
    { "name": "Condition Name", "reason": "Reason for condition matching" }
  ],
  "prevention": [
    "prevention step 1",
    "prevention step 2"
  ],
  "doctors": [
    { "name": "Dr. Name", "specialty": "Specialty", "phone": "Phone Number", "address": "Full Clinic Address" }
  ],
  "labs": [
    { "name": "Lab/Clinic Name", "phone": "Phone Number", "address": "Full Address" }
  ]
}

Important Instructions:
1. Ensure the JSON is completely valid and parseable. Do not wrap the JSON in \`\`\`json \`\`\` code blocks. Just output raw text JSON.
2. Return up to 3 doctors and up to 2 labs.
3. If phone numbers or specific specialties are missing, make a best-guess approximation or use a placeholder like "+91 99999-00000" or similar local format.
4. Keep the conditions and prevention empty or populate them with basic summaries.
`;

  if (GEMINI_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        const jsonText = data.candidates[0].content.parts[0].text;
        return JSON.parse(jsonText);
      }
    } catch (error) {
      console.error("Gemini failed to extract structures:", error);
    }
  }
  return null;
}

// 4. Analyze uploaded report with Gemini
export async function analyzeReport(base64Data, mimeType, fileName) {
  const prompt = `You are a clinical AI diagnostic assistant. Analyze the uploaded blood test report/document named "${fileName}".
Extract key metabolic biomarkers, identifying any that are elevated, low, or out of range.
Provide a clear summary in markdown with:
- Key biomarkers and their levels.
- Highlight abnormal levels (e.g., high cholesterol, elevated glucose) with warning symbols like ⚠️.
- A section: **Clinical AI Diagnostic Analysis** explaining what these levels might suggest.
- A section: **Ecosystem Updates** which lists recommended actions (e.g. updating profile card, scheduling checks).

Also, you must return a final line in this exact format:
||METRIC_UPDATE: {"chronic": "Name of Chronic Condition detected (e.g., Pre-Diabetes or High Cholesterol)", "glucose": 120, "cholesterol": 210, "risk": "Elevated" (or "Normal" or "SOS")}||

Make sure to output the metric update line at the very end of your response so we can programmatically parse it.`;

  if (!GEMINI_KEY) return null;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }]
      })
    });
    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    }
  } catch (error) {
    console.error("Gemini report analysis failed:", error);
  }
  return null;
}
