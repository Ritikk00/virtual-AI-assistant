import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { userdatacontext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const navigate = useNavigate();
  const { userdata, serverurl, setuserdata } = useContext(userdatacontext);
  const assistantImage = userdata?.assistantimage || userdata?.user?.assistantimage;
  const assistantName = useMemo(() => String(userdata?.assistantname || userdata?.user?.assistantname || 'Jarvis').trim(), [userdata?.assistantname, userdata?.user?.assistantname]);
  const normalizedAssistantName = useMemo(() => assistantName.toLowerCase(), [assistantName]);
  const wakeWords = useMemo(() => Array.from(new Set([normalizedAssistantName, 'jarvis', 'nova'].filter(Boolean))), [normalizedAssistantName]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [statusText, setStatusText] = useState('Ready');
  const [isWakeActive, setIsWakeActive] = useState(false);
  const recognitionRef = useRef(null);
  const messageEndRef = useRef(null);
  const lastVoiceRef = useRef('');
  const wakeLockRef = useRef(false);
  const voiceSendTimeoutRef = useRef(null);
  const isVoiceListeningRef = useRef(false);
  const awaitingCommandRef = useRef(false);
  const speechUtteranceRef = useRef(null);
  const speechResumeTimeoutRef = useRef(null);
  const isThinkingRef = useRef(false);
  const hasGreetedRef = useRef(false);

  const userName = userdata?.name || userdata?.user?.name || 'there';
  const greetingText = `Hello ${userName}, I am ${assistantName}. How can I help you today?`;

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const normalizeWakeText = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const getLevenshteinDistance = (a, b) => {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[a.length][b.length];
  };

  const isWakeWordDetected = (transcript, assistantNameValue) => {
    const normalizedTranscript = normalizeWakeText(transcript);
    const normalizedName = normalizeWakeText(assistantNameValue);

    if (!normalizedTranscript || !normalizedName) return false;

    const directMatch = normalizedTranscript.includes(normalizedName);
    if (directMatch) return true;

    const aliases = new Set([normalizedName]);
    const baseName = normalizedName.replace(/\s+/g, '');
    if (baseName) {
      aliases.add(baseName);
    }

    if (normalizedName === 'jarvis') {
      ['jarves', 'javis', 'jarviss'].forEach((alias) => aliases.add(alias));
    } else if (normalizedName === 'shifra') {
      ['shipra', 'chifra', 'shifra'].forEach((alias) => aliases.add(alias));
    }

    if ([...aliases].some((alias) => normalizedTranscript.includes(alias))) return true;

    const words = normalizedTranscript.split(' ');
    return words.some((word) => {
      if (!word || word.length < 3) return false;
      return [...aliases].some((alias) => {
        const distance = getLevenshteinDistance(word, alias);
        return distance <= 2 || (word.length >= 4 && alias.length >= 4 && distance <= Math.max(2, Math.floor(Math.max(word.length, alias.length) * 0.25)));
      });
    });
  };

  const ensureMicAccess = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      setStatusText('Microphone permission is required');
      return false;
    }
  };

  const getSpeechRecognitionConstructor = () => {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || null;
  };

  const getSpeechVoices = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices() || [];
  };

  const getPreferredVoice = (isHindi) => {
    const voices = getSpeechVoices();
    const preferredLangs = isHindi ? ['hi-IN', 'hi'] : ['en-US', 'en-IN', 'en'];

    let voice = voices.find((voiceItem) => preferredLangs.some((lang) => voiceItem.lang === lang));
    if (!voice && isHindi) {
      voice = voices.find((voiceItem) => voiceItem.lang.startsWith('hi'));
    }
    if (!voice && !isHindi) {
      voice = voices.find((voiceItem) => voiceItem.lang.startsWith('en'));
    }

    return voice || voices[0] || null;
  };

  const getRefusalMessage = (transcript) => {
    const normalized = String(transcript || '').replace(/\s+/g, ' ').trim();
    const isHindi = /[\u0900-\u097F]/.test(normalized) || /\b(कृपया|पहले|नाम|पुकारें|तब|सकूँ|सकूं|मुझे|मेरे|आप)\b/i.test(normalized);
    return isHindi
      ? `कृपया पहले मेरा नाम ${assistantName} पुकारें, तभी मैं आपकी सहायता कर सकूँगा।`
      : `Please address me by my name ${assistantName} first so I can assist you.`;
  };

  const getVoiceCommand = (transcript) => {
    const normalized = String(transcript || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return { hasAssistantName: false, command: '' };

    const hasAssistantName = isWakeWordDetected(normalized, assistantName);

    if (!hasAssistantName) {
      return { hasAssistantName: false, command: '' };
    }

    let cleaned = normalized;
    const wordsToStrip = [assistantName, ...wakeWords].filter(Boolean);
    wordsToStrip.forEach((word) => {
      const escaped = escapeRegExp(word);
      cleaned = cleaned.replace(new RegExp(`^(?:hey|hello|hi)\\s+${escaped}\\s*`, 'i'), '');
      cleaned = cleaned.replace(new RegExp(`^${escaped}\\s*`, 'i'), '');
      cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, 'i'), '');
    });
    cleaned = cleaned.replace(/^(?:hey|hello|hi)\s+/i, '');
    cleaned = cleaned.replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '').trim();

    return { hasAssistantName: true, command: cleaned };
  };

  const handleVoiceTranscript = (transcript) => {
    if (!transcript) return;

    const normalized = transcript.replace(/\s+/g, ' ').trim();
    console.log('Transcript Heard:', normalized, '| Target Name:', assistantName);
    const { hasAssistantName, command } = getVoiceCommand(normalized);

    if (hasAssistantName) {
      if (!command) {
        awaitingCommandRef.current = true;
        setStatusText('Say your command now');
        return;
      }

      if (command === lastVoiceRef.current) return;
      lastVoiceRef.current = command;
      setInput(command);
      setStatusText('Sending command...');
      setIsWakeActive(true);
      wakeLockRef.current = true;
      awaitingCommandRef.current = false;

      if (voiceSendTimeoutRef.current) {
        window.clearTimeout(voiceSendTimeoutRef.current);
      }

      voiceSendTimeoutRef.current = window.setTimeout(() => {
        void sendMessage(command);
      }, 120);
      return;
    }

    if (awaitingCommandRef.current) {
      const commandText = normalized.replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '').trim();
      if (!commandText) return;

      if (commandText === lastVoiceRef.current) return;
      lastVoiceRef.current = commandText;
      setInput(commandText);
      setStatusText('Sending command...');
      setIsWakeActive(true);
      wakeLockRef.current = true;
      awaitingCommandRef.current = false;

      if (voiceSendTimeoutRef.current) {
        window.clearTimeout(voiceSendTimeoutRef.current);
      }

      voiceSendTimeoutRef.current = window.setTimeout(() => {
        void sendMessage(commandText);
      }, 120);
      return;
    }

    const refusalMessage = getRefusalMessage(normalized);
    setInput('');
    setStatusText('Name required');
    setIsWakeActive(false);
    wakeLockRef.current = false;
    void speak(refusalMessage);
  };

  useEffect(() => {
    if (hasGreetedRef.current || !voiceSupported) return;

    const startGreeting = () => {
      if (hasGreetedRef.current) return;
      hasGreetedRef.current = true;
      setMessages([{ role: 'assistant', text: greetingText }]);
      setStatusText('Greeting...');
      speakGreeting(greetingText);
    };

    const handleInteraction = () => {
      startGreeting();
    };

    let removeVoicesChangedListener = null;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        startGreeting();
      } else {
        const onVoicesChanged = () => {
          startGreeting();
        };
        window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
        removeVoicesChangedListener = () => {
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        };
      }
    }

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      if (removeVoicesChangedListener) {
        removeVoicesChangedListener();
      }
    };
  }, [voiceSupported, greetingText]);

  useEffect(() => {
    if (!voiceSupported || !hasGreetedRef.current) return;

    const timer = window.setTimeout(() => {
      if (!isListening && !isThinking) {
        void startListening();
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [voiceSupported, isListening, isThinking]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFirstInteraction = async () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.getVoices();
        if (typeof window.speechSynthesis.resume === 'function') {
          try {
            window.speechSynthesis.resume();
          } catch {
            // ignore resume errors
          }
        }
      }

      await ensureMicAccess();
    };

    window.addEventListener('click', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setStatusText('Voice input is not supported on this browser. Please open in Chrome on Android or Desktop.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setStatusText('Listening...');
    };

    recognition.onresult = (event) => {
      let transcript = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const current = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          transcript += current;
        }
      }

      if (!transcript.trim()) return;

      handleVoiceTranscript(transcript);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setIsListening(false);
        setStatusText('Microphone permission denied');
      } else {
        setIsListening(false);
        setStatusText('Voice unavailable');
      }
    };

    recognition.onend = () => {
      if (isVoiceListeningRef.current) {
        try {
          recognition.start();
          setIsListening(true);
          setStatusText(awaitingCommandRef.current ? 'Say your command now' : 'Listening...');
        } catch (error) {
          setIsListening(false);
          setStatusText('Voice already active');
        }
      } else {
        setIsListening(false);
        setStatusText('Ready');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isVoiceListeningRef.current = false;
      if (voiceSendTimeoutRef.current) {
        window.clearTimeout(voiceSendTimeoutRef.current);
      }
      if (speechResumeTimeoutRef.current) {
        window.clearTimeout(speechResumeTimeoutRef.current);
      }
      recognition.stop();
    };
  }, [assistantName]);

  const speak = (text) => {
    if (!('speechSynthesis' in window) || !text) return;

    const cleanText = String(text)
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^[{\[]|[}\]]$/g, '')
      .replace(/"response"\s*:\s*/g, '')
      .replace(/"/g, '')
      .trim();

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const isHindi = /[\u0900-\u097F]/.test(cleanText);
    utterance.lang = isHindi ? 'hi-IN' : 'en-US';
    utterance.rate = isHindi ? 0.92 : 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    const preferredVoice = getPreferredVoice(isHindi);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    const stopListening = () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore stop errors.
        }
      }
      isVoiceListeningRef.current = false;
    };

    utterance.onstart = () => {
      stopListening();
      speechUtteranceRef.current = utterance;
    };

    utterance.onend = () => {
      speechUtteranceRef.current = null;
      if (speechResumeTimeoutRef.current) {
        window.clearTimeout(speechResumeTimeoutRef.current);
      }
      speechResumeTimeoutRef.current = window.setTimeout(() => {
        if (!isThinkingRef.current && recognitionRef.current) {
          void startListening();
        }
      }, 700);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakGreeting = (text) => {
    if (!('speechSynthesis' in window) || !text) return;

    const cleanText = String(text)
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^[{\[]|[}\]]$/g, '')
      .replace(/"response"\s*:\s*/g, '')
      .replace(/"/g, '')
      .trim();

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const isHindi = /[\u0900-\u097F]/.test(cleanText);
    utterance.lang = isHindi ? 'hi-IN' : 'en-US';
    utterance.rate = isHindi ? 0.92 : 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    const preferredVoice = getPreferredVoice(isHindi);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    const stopRecognition = () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore stop errors.
        }
      }
      isVoiceListeningRef.current = false;
    };

    utterance.onstart = () => {
      stopRecognition();
      speechUtteranceRef.current = utterance;
    };

    utterance.onend = () => {
      speechUtteranceRef.current = null;
      if (speechResumeTimeoutRef.current) {
        window.clearTimeout(speechResumeTimeoutRef.current);
      }
      speechResumeTimeoutRef.current = window.setTimeout(() => {
        void startListening();
      }, 500);
    };

    window.speechSynthesis.speak(utterance);
  };

  const parseAssistantPayload = (reply) => {
    if (!reply) return null;

    try {
      const parsed = typeof reply === 'string' ? JSON.parse(reply) : reply;
      if (parsed?.type && parsed?.response) {
        return parsed;
      }
    } catch {
      // Ignore invalid JSON and fall back to a simple pattern match.
    }

    const text = String(reply).trim();
    const match = text.match(/\{\s*"type"\s*:\s*"([A-Z_]+)"\s*,\s*"userQuery"\s*:\s*"([^"]*)"\s*,\s*"targetUrl"\s*:\s*"([^"]*)"\s*,\s*"response"\s*:\s*"([^"]*)"/i);
    if (match?.[1]) {
      return { type: match[1], userQuery: match[2], targetUrl: match[3], response: match[4] };
    }

    return { type: 'GENERAL', userQuery: '', targetUrl: '', response: text.replace(/^```json|```$/g, '').trim() };
  };

  const startListening = async () => {
    if (isVoiceListeningRef.current || isListening) return;

    if (!recognitionRef.current) {
      setVoiceSupported(false);
      setStatusText('Voice unsupported');
      return;
    }

    const micAllowed = await ensureMicAccess();
    if (!micAllowed) return;

    try {
      recognitionRef.current.start();
      isVoiceListeningRef.current = true;
      setIsListening(true);
      setStatusText('Listening...');
      sessionStorage.setItem('voice-chat-enabled', 'true');
    } catch (error) {
      setStatusText('Voice already active');
    }
  };

  const stopListening = () => {
    isVoiceListeningRef.current = false;
    awaitingCommandRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setStatusText('Ready');
    sessionStorage.setItem('voice-chat-enabled', 'false');
  };

  const sendMessage = async (messageText) => {
    const text = messageText?.trim();
    if (!text) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    isThinkingRef.current = true;
    setIsThinking(true);
    setIsListening(false);
    setStatusText('Thinking...');
    wakeLockRef.current = false;
    awaitingCommandRef.current = false;

    try {
      const { data } = await axios.post(`${serverurl}/api/assistant/chat`, { prompt: text }, { withCredentials: true, timeout: 30000 });
      const reply = data?.reply || 'I heard you, but I could not generate a reply.';
      const payload = parseAssistantPayload(reply);

      if (payload?.type && ['OPEN_URL', 'YOUTUBE_PLAY', 'GOOGLE_SEARCH'].includes(payload.type) && payload.targetUrl) {
        window.open(payload.targetUrl, '_blank', 'noopener,noreferrer');
        const actionMessage = payload.response || 'Opening the requested site.';
        setMessages((prev) => [...prev, { role: 'assistant', text: actionMessage }]);
        speak(actionMessage);
        setStatusText('Opening link');
        setIsWakeActive(false);
        wakeLockRef.current = false;
        return;
      }

      const assistantReply = payload?.response || reply;
      setMessages((prev) => [...prev, { role: 'assistant', text: assistantReply }]);
      speak(assistantReply);
      setStatusText('Reply ready');
      setIsWakeActive(false);
      wakeLockRef.current = false;
    } catch (error) {
      const fallback = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')
        ? 'The assistant is taking too long to respond. Please try again.'
        : 'I am having trouble responding right now.';
      setMessages((prev) => [...prev, { role: 'assistant', text: fallback }]);
      speak(fallback);
      setStatusText('Reply failed');
      setIsWakeActive(false);
      wakeLockRef.current = false;
    } finally {
      isThinkingRef.current = false;
      setIsThinking(false);
    }
  };

  const handlelogout = async () => {
    try {
      await axios.post(`${serverurl}/api/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.log(error);
    } finally {
      setuserdata(null);
      navigate('/signin', { replace: true });
    }
  };

  return (
    <div className='h-dvh overflow-hidden bg-gradient-to-b from-gray-950 via-slate-900 to-black text-white'>
      <div className='mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-between px-3 py-4 sm:px-6 sm:py-6'>
        <div className='flex w-full max-w-xl items-center justify-between gap-2'>
          <div className='rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-200 sm:px-3 sm:text-xs'>
            Active Assistant: {assistantName}
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              className='rounded-full border border-cyan-400/30 bg-slate-950/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-300 transition hover:bg-cyan-500/20 sm:px-3 sm:text-xs'
              onClick={() => navigate('/customize')}
            >
              Customize
            </button>
            <button
              type='button'
              className='rounded-full border border-red-500/20 bg-slate-950/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-red-300 transition hover:bg-red-500/20 sm:px-3 sm:text-xs'
              onClick={handlelogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className='flex w-full flex-1 flex-col items-center justify-center gap-3 overflow-hidden px-1 sm:gap-4'>
          <div className={`relative flex-shrink-0 overflow-hidden rounded-full border border-cyan-400/20 bg-slate-900/70 shadow-lg shadow-cyan-500/20 ${isWakeActive ? 'ring-2 ring-cyan-400/60' : ''}`}>
            <div className={`absolute inset-0 ${isWakeActive ? 'animate-pulse bg-cyan-500/10' : ''}`} />
            <div className='h-36 w-36 overflow-hidden rounded-full sm:h-48 sm:w-48 md:h-64 md:w-64'>
              {assistantImage ? (
                <img src={assistantImage} alt='Assistant' className='h-full w-full object-cover' />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-center text-xs text-slate-400 sm:text-sm'>No assistant image yet</div>
              )}
            </div>
          </div>

          <div className='w-full max-w-md text-center'>
            <p className='text-[11px] uppercase tracking-[0.35em] text-cyan-300 sm:text-xs'>Voice Assistant</p>
            <h1 className='mt-1 text-xl font-bold tracking-wide text-white sm:text-2xl md:text-3xl'>Hello, I’m <span className='text-cyan-400'>{assistantName}</span></h1>
            <p className='mt-2 text-sm leading-6 text-slate-300 sm:text-base'>Say “Hey {assistantName}” and ask anything. I’ll answer with voice and text.</p>
          </div>

          <div className='flex w-full max-w-md flex-col items-center gap-2'>
            <div className='flex h-8 items-center justify-center sm:h-12'>
              {isListening ? (
                <div className='flex items-center gap-1'>
                  <span className='h-2 w-2 animate-pulse rounded-full bg-cyan-400' />
                  <span className='h-3 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:0.1s]' />
                  <span className='h-4 w-2 animate-pulse rounded-full bg-cyan-200 [animation-delay:0.2s]' />
                  <span className='h-3 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:0.3s]' />
                  <span className='h-2 w-2 animate-pulse rounded-full bg-cyan-400 [animation-delay:0.4s]' />
                </div>
              ) : (
                <div className='text-[11px] uppercase tracking-[0.3em] text-slate-400 sm:text-xs'>{statusText}</div>
              )}
            </div>

            <div className='max-h-[15vh] w-full max-w-md overflow-y-auto px-4 text-center text-sm font-medium text-cyan-300 sm:max-h-[20vh] sm:text-base'>
              {messages[messages.length - 1]?.text || 'Ready for your command...'}
            </div>
          </div>

          <div className='flex w-full max-w-md flex-col gap-2'>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={isListening ? stopListening : startListening}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition sm:px-5 sm:py-3 ${isListening ? 'bg-red-500 text-white' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'}`}
              >
                {isListening ? 'Stop Listening' : 'Start Voice'}
              </button>
              <button
                type='button'
                onClick={() => sendMessage(input)}
                className='rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 sm:px-5 sm:py-3'
              >
                {isThinking ? 'Thinking...' : 'Send'}
              </button>
            </div>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder={`Say “${assistantName}” and ask something...`}
              className='w-full rounded-full border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none placeholder:text-slate-500 sm:py-3'
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;