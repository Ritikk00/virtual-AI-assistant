import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const getSystemPrompt = () => {
  const now = new Date().toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata' });
  return `Follow these strict operational rules:
1. WAKE WORD FILTERING:
   - Only respond when the user addresses the assistant by the configured assistant name.
2. DUAL-LANGUAGE OUTPUT PROTOCOL:
   - If the user speaks in Hindi, the response field must use pure Devanagari Hindi script.
   - If the user speaks in English, reply in clear, natural, voice-friendly English.
3. STRUCTURED JSON RESPONSE SCHEME:
   - Always return a raw JSON object with this exact structure:
     {
       "type": "GENERAL" | "OPEN_URL" | "YOUTUBE_PLAY" | "GOOGLE_SEARCH" | "GET_TIME" | "GET_DATE",
       "userQuery": "<sanitized user input without wake word>",
       "targetUrl": "<exact actionable URL if the action requires one>",
       "response": "<1-2 concise voice-friendly sentences>"
     }
4. AUTOMATION ACTIONS:
   - For YouTube song or play requests, set type to "YOUTUBE_PLAY" and targetUrl to "https://www.youtube.com/results?search_query=..."
   - For Google search commands, set type to "GOOGLE_SEARCH" with a search query URL.
   - For direct website requests such as GitHub, Instagram, Gmail, Netflix, Spotify, and similar sites, set type to "OPEN_URL" and provide the exact targetUrl.
   - For general conversational replies, use type "GENERAL" and leave targetUrl empty.
5. CURRENT CONTEXT:
   - Today's exact date and time in India is: ${now}. Use this for date/time questions.
6. RESPONSE STYLE:
   - Keep responses extremely concise, voice-friendly, natural, and action-oriented.`;
};

const URL_ACTIONS = [
  { keyword: 'youtube', type: 'OPEN_URL', url: 'https://www.youtube.com' },
  { keyword: 'google', type: 'OPEN_URL', url: 'https://www.google.com' },
  { keyword: 'github', type: 'OPEN_URL', url: 'https://github.com' },
  { keyword: 'linkedin', type: 'OPEN_URL', url: 'https://www.linkedin.com' },
  { keyword: 'instagram', type: 'OPEN_URL', url: 'https://www.instagram.com' },
  { keyword: 'facebook', type: 'OPEN_URL', url: 'https://www.facebook.com' },
  { keyword: 'twitter', type: 'OPEN_URL', url: 'https://x.com' },
  { keyword: 'x.com', type: 'OPEN_URL', url: 'https://x.com' },
  { keyword: 'gmail', type: 'OPEN_URL', url: 'https://mail.google.com' },
  { keyword: 'netflix', type: 'OPEN_URL', url: 'https://www.netflix.com' },
  { keyword: 'spotify', type: 'OPEN_URL', url: 'https://open.spotify.com' },
  { keyword: 'amazon', type: 'OPEN_URL', url: 'https://www.amazon.com' },
  { keyword: 'drive', type: 'OPEN_URL', url: 'https://drive.google.com' },
  { keyword: 'docs', type: 'OPEN_URL', url: 'https://docs.google.com' },
];

const sanitizeUserQuery = (prompt) => {
  return String(prompt || '')
    .replace(/\b(?:hey|hello|hi)\b/gi, '')
    .replace(/\b(?:jarvis|nova|assistant)\b/gi, '')
    .replace(/^(?:please|can you|could you|open|launch|go to|visit|show me|take me to|search for|search|find|look up|seek|play|play me|for me)\s+/gi, '')
    .replace(/\b(?:on|for|me|please|can|could|the|a|an)\b/gi, '')
    .replace(/\b(?:youtube|google|github|gmail|instagram|linkedin|facebook|twitter|netflix|spotify|amazon|drive|docs)\b/gi, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const extractJsonObject = (text) => {
  if (!text) return null;

  const trimmed = String(text).replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const buildSearchUrl = (type, query) => {
  const encoded = encodeURIComponent(query.trim());
  if (type === 'YOUTUBE_PLAY') return `https://www.youtube.com/results?search_query=${encoded}`;
  if (type === 'GOOGLE_SEARCH') return `https://www.google.com/search?q=${encoded}`;
  return null;
};

export const extractAssistantPayload = (prompt, modelReply = '') => {
  const combinedText = [prompt, modelReply].filter(Boolean).join(' ').trim();
  if (!combinedText) return null;

  const parsed = extractJsonObject(modelReply || combinedText);
  if (parsed?.type && parsed?.response) {
    return {
      type: parsed.type,
      userQuery: parsed.userQuery || sanitizeUserQuery(prompt),
      targetUrl: parsed.targetUrl || '',
      response: parsed.response,
    };
  }

  const lowerText = combinedText.toLowerCase();
  const hasYoutubePlayIntent = /\b(?:youtube|you tube)\b/i.test(lowerText) && /\b(?:play|song|gaana|bajao|music|video)\b/i.test(lowerText);
  if (hasYoutubePlayIntent) {
    const userQuery = sanitizeUserQuery(prompt);
    const query = userQuery || 'your requested song';
    return {
      type: 'YOUTUBE_PLAY',
      userQuery: query,
      targetUrl: buildSearchUrl('YOUTUBE_PLAY', query),
      response: `YouTube पर ${query} प्ले कर रहा हूँ।`,
    };
  }

  const hasGoogleSearchIntent = /\bgoogle\b/i.test(lowerText) && /\b(?:search|find|look up|seek|dhoondo|dhundo)\b/i.test(lowerText);
  if (hasGoogleSearchIntent) {
    const userQuery = sanitizeUserQuery(prompt);
    const query = userQuery || 'your search';
    return {
      type: 'GOOGLE_SEARCH',
      userQuery: query,
      targetUrl: buildSearchUrl('GOOGLE_SEARCH', query),
      response: `Google पर ${query} ढूँढ रहा हूँ।`,
    };
  }

  const matchedAction = URL_ACTIONS.find(({ keyword }) => lowerText.includes(keyword));
  if (!matchedAction) return null;

  const userQuery = sanitizeUserQuery(prompt);
  return {
    type: matchedAction.type,
    userQuery,
    targetUrl: matchedAction.url,
    response: 'Opening the requested site.',
  };
};

const buildActionReply = (payload) => {
  if (!payload) return null;
  return JSON.stringify(payload);
};

const normalizeModelReply = (prompt, modelReply) => {
  const userQuery = sanitizeUserQuery(prompt);
  const lowerPrompt = String(prompt || '').toLowerCase();

  try {
    const parsed = JSON.parse(String(modelReply || '').replace(/```json|```/g, '').trim());
    if (parsed?.type && parsed?.response) {
      return {
        type: parsed.type,
        userQuery: parsed.userQuery || userQuery,
        targetUrl: parsed.targetUrl || '',
        response: parsed.response,
      };
    }
  } catch {
    // Ignore and fall back to a voice-friendly response.
  }

  if (/\b(time|samay|ghanta|clock|kya samay|abhi ka samay)\b/i.test(lowerPrompt)) {
    return { type: 'GET_TIME', userQuery, targetUrl: '', response: String(modelReply || '').trim() || 'मैं अभी समय देख रहा हूँ।' };
  }

  if (/\b(date|taareekh|tarikh|calendar|din|aaj ka din)\b/i.test(lowerPrompt)) {
    return { type: 'GET_DATE', userQuery, targetUrl: '', response: String(modelReply || '').trim() || 'मैं आज की तारीख देख रहा हूँ।' };
  }

  return { type: 'GENERAL', userQuery, targetUrl: '', response: String(modelReply || '').trim() || 'मैं आपकी मदद के लिए तैयार हूँ।' };
};

// Real-Time Internet Search Functionality using Tavily API
const fetchLiveWebData = async (query) => {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) return '';

  try {
    const res = await axios.post('https://api.tavily.com/search', {
      api_key: tavilyKey,
      query: query,
      search_depth: 'basic',
      max_results: 3
    });

    return res.data?.results?.map(r => r.content).join('\n') || '';
  } catch (err) {
    console.error('⚠️ Tavily Web Search Error:', err?.message || err);
    return '';
  }
};

const needsWebSearch = (text) => {
  const searchKeywords = /\b(today|aaj|news|weather|mausam|score|date|tarikh|current|price|who is|latest)\b/i;
  return searchKeywords.test(text);
};

const geminiresponse = async (prompt) => {
  try {
    const directAction = extractAssistantPayload(prompt);
    if (directAction) {
      return buildActionReply(directAction);
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;

    if (!apiKey) {
      console.error('❌ API KEY missing in .env file');
      return buildActionReply({
        type: 'GENERAL',
        userQuery: sanitizeUserQuery(prompt),
        targetUrl: '',
        response: 'मैं आपकी मदद के लिए तैयार हूँ।',
      });
    }

    let liveSearchContext = '';
    if (needsWebSearch(prompt)) {
      liveSearchContext = await fetchLiveWebData(prompt);
    }

    const messages = [
      { role: 'system', content: getSystemPrompt() }
    ];

    if (liveSearchContext) {
      messages.push({
        role: 'system',
        content: `Live Web Search Context for user query:\n${liveSearchContext}`
      });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.3,
        max_tokens: 150,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const modelReply = response?.data?.choices?.[0]?.message?.content?.trim() || 'I heard you, but I could not generate a response right now.';
    const parsedAction = extractAssistantPayload(prompt, modelReply);

    if (parsedAction) {
      return buildActionReply(parsedAction);
    }

    return buildActionReply(normalizeModelReply(prompt, modelReply));
  } catch (error) {
    console.error('API Error ❌:', error?.response?.data || error?.message || error);
    return buildActionReply({
      type: 'GENERAL',
      userQuery: sanitizeUserQuery(prompt),
      targetUrl: '',
      response: 'I am having trouble responding right now. Please try again in a moment.',
    });
  }
};

export default geminiresponse;