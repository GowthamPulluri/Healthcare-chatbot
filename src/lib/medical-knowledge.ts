import { SupportedLanguage } from './translation';

export interface MedicalCondition {
  name: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  precautions: string[];
  emergency: boolean;
}

export interface MedicalResponse {
  response: string;
  suggestions: string[];
  emergency: boolean;
  followUp?: string;
}

// Medical knowledge base
const MEDICAL_KNOWLEDGE: Record<string, MedicalCondition> = {
  fever: {
    name: 'Fever',
    symptoms: ['elevated body temperature', 'chills', 'sweating', 'headache', 'muscle aches'],
    causes: ['viral infection', 'bacterial infection', 'inflammatory conditions'],
    treatments: ['rest', 'hydration', 'fever reducers', 'cool compresses'],
    precautions: ['monitor temperature', 'stay hydrated', 'seek medical attention if temperature exceeds 103°F'],
    emergency: false
  },
  headache: {
    name: 'Headache',
    symptoms: ['head pain', 'pressure in head', 'throbbing sensation', 'sensitivity to light'],
    causes: ['stress', 'dehydration', 'lack of sleep', 'eye strain', 'sinus issues'],
    treatments: ['rest in dark room', 'hydration', 'pain relievers', 'cold compress'],
    precautions: ['avoid triggers', 'maintain regular sleep', 'stay hydrated'],
    emergency: false
  },
  cough: {
    name: 'Cough',
    symptoms: ['throat irritation', 'chest congestion', 'sore throat', 'difficulty breathing'],
    causes: ['viral infection', 'diseases', 'irritants', 'asthma'],
    treatments: ['cough suppressants', 'hydration', 'steam inhalation', 'honey'],
    precautions: ['avoid irritants', 'stay hydrated', 'rest voice'],
    emergency: false
  },
  chest_pain: {
    name: 'Chest Pain',
    symptoms: ['chest discomfort', 'pressure', 'burning sensation', 'shortness of breath'],
    causes: ['heart conditions', 'muscle strain', 'acid reflux', 'anxiety'],
    treatments: ['immediate medical evaluation', 'rest', 'avoid exertion'],
    precautions: ['seek immediate medical attention', 'avoid self-diagnosis'],
    emergency: true
  },
  diabetes: {
    name: 'Diabetes',
    symptoms: ['frequent urination', 'excessive thirst', 'fatigue', 'blurred vision', 'slow healing'],
    causes: ['insulin resistance', 'pancreatic dysfunction', 'genetic factors'],
    treatments: ['blood sugar monitoring', 'medication', 'diet control', 'exercise'],
    precautions: ['regular monitoring', 'healthy diet', 'regular exercise', 'foot care'],
    emergency: false
  },
  hypertension: {
    name: 'High Blood Pressure',
    symptoms: ['often asymptomatic', 'headaches', 'shortness of breath', 'nosebleeds'],
    causes: ['genetic factors', 'poor diet', 'lack of exercise', 'stress'],
    treatments: ['medication', 'diet modification', 'exercise', 'stress management'],
    precautions: ['regular monitoring', 'low sodium diet', 'regular exercise', 'limit alcohol'],
    emergency: false
  }
};

export function getMedicalResponse(
  intent: string,
  entities: string[],
  userDiseases: string[] = [],
  language: SupportedLanguage = 'en'
): MedicalResponse {
  let response = '';
  let suggestions: string[] = [];
  let emergency = false;
  let followUp = '';

  // Check for emergency conditions
  if (intent === 'emergency' || entities.some(e => ['chest pain', 'heart attack', 'stroke'].includes(e))) {
    return {
      response: language === 'en' 
        ? 'This sounds like a medical emergency. Please call emergency services immediately or go to the nearest hospital.'
        : 'यह एक चिकित्सा आपातकाल की तरह लगता है। कृपया तुरंत आपातकालीन सेवाओं को कॉल करें या निकटतम अस्पताल जाएं।',
      suggestions: ['Call emergency services', 'Go to nearest hospital', 'Stay calm'],
      emergency: true
    };
  }

  // Handle specific medical conditions
  const matchedCondition = entities.find(entity => MEDICAL_KNOWLEDGE[entity]);
  if (matchedCondition) {
    const condition = MEDICAL_KNOWLEDGE[matchedCondition];
    emergency = condition.emergency;
    
    response = generateConditionResponse(condition, language);
    suggestions = condition.treatments;
    
    // Add disease-specific precautions
    if (userDiseases.length > 0) {
      suggestions.push(`Note: You have diseases to: ${userDiseases.join(', ')}. Please inform your healthcare provider.`);
    }
    
    followUp = `Would you like more information about ${condition.name} or its treatment options?`;
  } else {
    // General health advice
    response = generateGeneralResponse(intent, entities, language);
    suggestions = getGeneralSuggestions(intent);
  }

  return {
    response,
    suggestions,
    emergency,
    followUp
  };
}

function generateConditionResponse(condition: MedicalCondition, language: SupportedLanguage): string {
  if (language === 'en') {
    return `${condition.name} is a medical condition that can cause ${condition.symptoms.join(', ')}. ` +
           `Common causes include ${condition.causes.join(', ')}. ` +
           `Treatment options include ${condition.treatments.join(', ')}. ` +
           `Important precautions: ${condition.precautions.join(', ')}. ` +
           `Please consult with a healthcare professional for proper diagnosis and treatment.`;
  } else if (language === 'hi') {
    return `${condition.name} एक चिकित्सा स्थिति है जो ${condition.symptoms.join(', ')} का कारण बन सकती है। ` +
           `सामान्य कारणों में ${condition.causes.join(', ')} शामिल हैं। ` +
           `उपचार के विकल्पों में ${condition.treatments.join(', ')} शामिल हैं। ` +
           `महत्वपूर्ण सावधानियां: ${condition.precautions.join(', ')}। ` +
           `उचित निदान और उपचार के लिए कृपया एक स्वास्थ्य देखभाल पेशेवर से परामर्श करें।`;
  } else {
    return `${condition.name} అనేది ${condition.symptoms.join(', ')} కలిగించే వైద్య పరిస్థితి. ` +
           `సాధారణ కారణాలలో ${condition.causes.join(', ')} ఉన్నాయి. ` +
           `చికిత్సా ఎంపికలలో ${condition.treatments.join(', ')} ఉన్నాయి. ` +
           `ముఖ్యమైన జాగ్రత్తలు: ${condition.precautions.join(', ')}. ` +
           `సరైన నిర్ధారణ మరియు చికిత్స కోసం దయచేసి ఆరోగ్య సంరక్షణ నిపుణుడిని సంప్రదించండి.`;
  }
}

function generateGeneralResponse(intent: string, entities: string[], language: SupportedLanguage): string {
  if (language === 'en') {
    switch (intent) {
      case 'symptom_inquiry':
        return 'I understand you\'re experiencing some symptoms. Could you please describe them in more detail? This will help me provide better guidance.';
      case 'disease_info':
        return 'I\'d be happy to provide information about health conditions. What specific condition would you like to know about?';
      case 'medication_query':
        return 'For medication advice, I recommend consulting with a healthcare professional or pharmacist. They can provide personalized recommendations based on your specific needs.';
      case 'general_health':
        return 'I\'m here to help with general health information. What would you like to know about maintaining good health?';
      default:
        return 'I\'m here to help with your health questions. Could you please provide more details about what you\'re experiencing?';
    }
  } else if (language === 'hi') {
    switch (intent) {
      case 'symptom_inquiry':
        return 'मैं समझता हूं कि आप कुछ लक्षणों का अनुभव कर रहे हैं। क्या आप कृपया उन्हें अधिक विस्तार से वर्णन कर सकते हैं?';
      case 'disease_info':
        return 'मैं स्वास्थ्य स्थितियों के बारे में जानकारी प्रदान करने में खुश हूं। आप किस विशिष्ट स्थिति के बारे में जानना चाहते हैं?';
      case 'medication_query':
        return 'दवा सलाह के लिए, मैं एक स्वास्थ्य देखभाल पेशेवर या फार्मासिस्ट से परामर्श करने की सलाह देता हूं।';
      case 'general_health':
        return 'मैं सामान्य स्वास्थ्य जानकारी में मदद के लिए यहां हूं। अच्छे स्वास्थ्य को बनाए रखने के बारे में आप क्या जानना चाहते हैं?';
      default:
        return 'मैं आपके स्वास्थ्य प्रश्नों में मदद के लिए यहां हूं। क्या आप कृपया अपने अनुभव के बारे में अधिक विवरण प्रदान कर सकते हैं?';
    }
  } else {
    switch (intent) {
      case 'symptom_inquiry':
        return 'మీరు కొన్ని లక్షణాలను అనుభవిస్తున్నట్లు నేను అర్థం చేసుకున్నాను. దయచేసి వాటిని మరింత వివరంగా వివరించగలరా?';
      case 'disease_info':
        return 'ఆరోగ్య పరిస్థితుల గురించి సమాచారం అందించడంలో నేను సంతోషిస్తున్నాను. మీరు ఏ నిర్దిష్ట పరిస్థితి గురించి తెలుసుకోవాలనుకుంటున్నారు?';
      case 'medication_query':
        return 'మందుల సలహా కోసం, ఆరోగ్య సంరక్షణ నిపుణుడు లేదా ఫార్మసిస్ట్‌ను సంప్రదించమని నేను సిఫార్సు చేస్తున్నాను.';
      case 'general_health':
        return 'సాధారణ ఆరోగ్య సమాచారంతో సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను. మంచి ఆరోగ్యాన్ని నిర్వహించడం గురించి మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?';
      default:
        return 'మీ ఆరోగ్య ప్రశ్నలతో సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను. మీరు అనుభవిస్తున్న దాని గురించి మరింత వివరాలను అందించగలరా?';
    }
  }
}

function getGeneralSuggestions(intent: string): string[] {
  switch (intent) {
    case 'symptom_inquiry':
      return ['Describe symptoms in detail', 'Note when symptoms started', 'Track symptom severity', 'Consult a healthcare provider'];
    case 'disease_info':
      return ['Research reliable medical sources', 'Consult healthcare professionals', 'Ask specific questions', 'Understand treatment options'];
    case 'medication_query':
      return ['Consult pharmacist', 'Check drug interactions', 'Follow dosage instructions', 'Monitor for side effects'];
    case 'general_health':
      return ['Maintain balanced diet', 'Exercise regularly', 'Get adequate sleep', 'Manage stress', 'Regular health checkups'];
    default:
      return ['Provide more details', 'Consult healthcare professional', 'Keep health records', 'Follow medical advice'];
  }
}
