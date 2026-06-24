'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hello! I am the Celestial Oracle. Ask me any doubts about constellations, planets, the ISS, or anything in the cosmos.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');

    const updatedMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMsg },
    ];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Send conversation history to secure server-side Groq route
      const historyForAPI = updatedMessages
        .slice(1) // skip the greeting
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForAPI }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      setMessages((prev) => [
        ...prev,
        { role: 'model', content: data.reply },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: `[ERROR] ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 flex flex-col gap-4 h-[480px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm text-neutral-300 tracking-wide">CELESTIAL ORACLE</h2>
          <p className="mt-1 text-xs text-neutral-500">Ask doubts about the cosmos</p>
        </div>
      </div>
      <div className="panel-rule" />

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-neutral-700">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded p-3 text-sm ${msg.role === 'user' ? 'bg-neutral-800 text-white' : 'bg-black border border-neutral-800 text-neutral-300'}`}>
              <div className="font-display text-[10px] tracking-widest text-neutral-500 mb-1">
                {msg.role === 'user' ? 'YOU' : 'ORACLE'}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-black border border-neutral-800 text-neutral-500 text-xs font-mono p-3 rounded animate-pulse">
              Analyzing cosmic data...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2 mt-auto pt-2 border-t border-neutral-800">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about planets, ISS..."
          className="flex-1 bg-black border border-neutral-700 text-neutral-300 text-sm p-2 rounded focus:outline-none focus:border-neutral-500"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white px-4 rounded transition-colors font-display text-xs tracking-wider"
        >
          SEND
        </button>
      </div>
    </div>
  );
}
