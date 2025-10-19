import natural from 'natural';

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: string[];
}

export interface EntityExtraction {
  symptoms: string[];
  diseases: string[];
  medications: string[];
  bodyParts: string[];
  entities : string[];
}

// Medical keywords for intent classification
const MEDICAL_KEYWORDS = {
  symptoms: [
    'fever', 'headache', 'cough', 'pain', 'ache', 'nausea', 'vomiting', 'diarrhea',
    'fatigue', 'weakness', 'dizziness', 'rash', 'swelling', 'bleeding', 'breathing',
    'chest pain', 'stomach pain', 'back pain', 'joint pain', 'muscle pain'
  ],
  diseases: [
    'diabetes', 'hypertension', 'cancer', 'flu', 'cold', 'pneumonia', 'asthma',
    'arthritis', 'heart disease', 'stroke', 'depression', 'anxiety', 'migraine',
    'disease', 'infection', 'inflammation'
  ],
  medications: [
    'medicine', 'drug', 'pill', 'tablet', 'capsule', 'injection', 'vaccine',
    'antibiotic', 'painkiller', 'antidepressant', 'insulin', 'blood pressure',
    'cholesterol', 'vitamin', 'supplement'
  ],
  bodyParts: [
    'head', 'chest', 'stomach', 'back', 'leg', 'arm', 'hand', 'foot', 'eye',
    'ear', 'nose', 'throat', 'heart', 'lung', 'liver', 'kidney', 'brain',
    'spine', 'joint', 'muscle', 'bone'
  ]
};

// Intent patterns
const INTENT_PATTERNS = {
  symptom_inquiry: [
    'what are the symptoms of', 'symptoms of', 'signs of', 'how to know if',
    'what does it mean when', 'is this a symptom'
  ],
  disease_info: [
    'what is', 'tell me about', 'information about', 'explain', 'define',
    'what causes', 'how to treat', 'treatment for'
  ],
  medication_query: [
    'medicine for', 'drug for', 'treatment', 'medication', 'prescription',
    'what medicine', 'which drug', 'how to treat'
  ],
  emergency: [
    'emergency', 'urgent', 'help', 'serious', 'critical', 'immediate',
    'rush', 'ambulance', 'hospital', 'doctor now'
  ],
  general_health: [
    'health advice', 'prevention', 'healthy', 'wellness', 'fitness',
    'diet', 'exercise', 'lifestyle'
  ]
};

export function detectIntent(text: string): IntentResult {
  const lowerText = text.toLowerCase();
  let bestIntent = 'general_health';
  let bestConfidence = 0.1;
  const entities: string[] = [];

  // Check for intent patterns
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        const confidence = pattern.length / text.length;
        if (confidence > bestConfidence) {
          bestIntent = intent;
          bestConfidence = confidence;
        }
      }
    }
  }

  // Extract entities
  const extractedEntities = extractEntities(text);
  entities.push(...extractedEntities.symptoms);
  entities.push(...extractedEntities.diseases);
  entities.push(...extractedEntities.medications);
  entities.push(...extractedEntities.bodyParts);

  return {
    intent: bestIntent,
    confidence: Math.min(bestConfidence + (entities.length * 0.1), 1.0),
    entities: [...new Set(entities)] // Remove duplicates
  };
}

export function extractEntities(text: string): EntityExtraction {
  const lowerText = text.toLowerCase();
  const result: EntityExtraction = {
    symptoms: [],
    diseases: [],
    medications: [],
    bodyParts: [],
    entities: []
  };

  // Extract entities from each category
  for (const [category, keywords] of Object.entries(MEDICAL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        result[category as keyof EntityExtraction].push(keyword);
      }
    }
  }

  return result;
}

export function preprocessText(text: string): string {
  // Basic text preprocessing
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
