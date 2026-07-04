import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage } from '../types';
import { geminiService } from '../services/geminiService';
import { Send, Volume2, Loader2, User, RefreshCw, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  profile: UserProfile;
}

const AICoach: React.FC<Props> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: `## READY TO DOMINATE? 
I am **Leo**. Your elite strength and conditioning commander. 

**My Directive:**
1.  Analyze your biometrics.
2.  Optimization of nutrition.
3.  Push you beyond failure.

*Ask me anything.*`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedText, isStreaming]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const simulateStream = async (text: string) => {
    setIsStreaming(true);
    setStreamedText('');

    const words = text.split(' ');
    let currentText = '';

    // Animate word by word for "streaming" effect
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      setStreamedText(currentText);
      // Random delay for realism
      await new Promise(r => setTimeout(r, Math.random() * 30 + 10));
    }

    setIsStreaming(false);
    return currentText;
  };

  const handleSend = async () => {
    if (!input.trim() || loading || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Gather context
      const notepad = localStorage.getItem('iron_ai_notepad') || '';
      const logs = localStorage.getItem('iron_ai_logs') || '[]';
      const nutrition = localStorage.getItem('iron_ai_nutrition') || '[]';

      const context = `
Notepad Entries: ${notepad.substring(0, 500)}...
Recent Workout Logs: ${logs.substring(0, 500)}...
Recent Nutrition: ${nutrition.substring(0, 500)}...
      `;

      // Get full response
      const responseText = await geminiService.chatWithCoach(messages, userMsg.text, profile, context);
      setLoading(false); // Stop loading indicator, start streaming

      // Simulate streaming
      await simulateStream(responseText);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
      setStreamedText(''); // Clear stream buffer

    } catch (error) {
      console.error("Chat error", error);
      setLoading(false);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'model',
        text: '⚠️ **SYSTEM ERROR** \n\nConnection disrupted. Verify API keys and retry protocol.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const playTTS = async (text: string, id: string) => {
    if (speakingId === id) return;
    setSpeakingId(id);

    try {
      const audioBuffer = await geminiService.generateSpeech(text);
      if (audioBuffer) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
        source.onended = () => setSpeakingId(null);
      } else {
        setSpeakingId(null);
      }
    } catch (e) {
      console.error(e);
      setSpeakingId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden relative mx-4 lg:mx-10 mb-10 shadow-2xl">
      {/* Premium Header */}
      <div className="p-4 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary relative shadow-[0_0_15px_rgba(255,94,0,0.4)]">
            <img
              src="https://i.pinimg.com/originals/2d/9c/55/2d9c551a2a058d0c478250351a15b7cd.jpg?nii=t"
              className="w-full h-full object-cover"
              alt="Leo Coach"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Leo+Coach&background=ff5e00&color=fff';
              }}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/20 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-lg tracking-wide flex items-center gap-2">
              COACH LEO <span className="text-[10px] bg-primary text-black px-1.5 py-0.5 rounded font-bold">PRO</span>
            </h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${loading || isStreaming ? 'bg-green-400 animate-pulse' : 'bg-green-500'}`}></span>
              <span className="text-xs text-gray-400 font-mono">{loading ? 'ANALYZING...' : 'ONLINE // READY'}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors" title="Clear Chat" onClick={() => setMessages([messages[0]])}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scroll-smooth">

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-black mr-3 flex-shrink-0 flex items-center justify-center border border-white/10 shadow-lg mt-1">
                <div className="font-display font-bold text-primary text-sm">L</div>
              </div>
            )}

            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 relative group shadow-sm ${msg.role === 'user'
              ? 'bg-gradient-to-br from-primary to-orange-600 text-black font-medium selection:bg-black selection:text-white rounded-tr-sm'
              : 'bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
              }`}>

              {/* Markdown Content */}
              <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-p:text-black prose-strong:text-black' : 'prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-primary'} leading-relaxed`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>
              </div>

              {/* TTS Button */}
              {msg.role === 'model' && (
                <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={() => playTTS(msg.text, msg.id)}
                    className={`p-1.5 rounded-full bg-black/50 border border-white/10 text-gray-400 hover:text-primary transition-colors ${speakingId === msg.id ? 'text-primary animate-pulse border-primary/50' : ''}`}
                    title="Read Aloud"
                  >
                    <Volume2 size={12} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Streaming Message (The "Ghost" Message) */}
        {isStreaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-black mr-3 flex-shrink-0 flex items-center justify-center border border-white/10 shadow-lg mt-1">
              <div className="font-display font-bold text-primary text-sm">L</div>
            </div>
            <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <div className="prose prose-sm prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-strong:text-primary leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamedText + ' ▍'}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}

        {loading && !isStreaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start ml-11">
            <div className="bg-[#1a1a1a] rounded-full px-4 py-2 border border-white/10 flex items-center gap-2 shadow-lg">
              <Loader2 className="animate-spin text-primary" size={14} />
              <span className="text-xs text-gray-500 font-mono tracking-wider">COMPUTING RESPONSE...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-5 bg-black border-t border-white/10">
        <div className="relative flex gap-2 max-w-4xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Leo about your protocol..."
            disabled={loading || isStreaming}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-primary/50 focus:bg-white/10 focus:ring-1 focus:ring-primary/50 outline-none text-white placeholder-gray-500 font-sans text-base transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || isStreaming}
            className="bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-black w-14 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-orange-500/20"
          >
            {loading || isStreaming ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[10px] text-gray-600 font-mono uppercase">AI-Generated Content • Verify Important Health Advice</span>
        </div>
      </div>
    </div>
  );
};

export default AICoach;