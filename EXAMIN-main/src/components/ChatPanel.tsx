import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../../api.js';

interface ChatPanelProps {
  sessionId: string;
  chatMode: 'one-way' | 'two-way';
  isGuide: boolean;
  onClose?: () => void;
}

interface ChatMessage {
  _id: string;
  senderRole: 'guide' | 'user';
  text: string;
  createdAt: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, chatMode, isGuide, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = isGuide || chatMode === 'two-way';

  async function loadMessages() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const data = await api.get(`/sessions/${sessionId}/messages`, { auth: token });
      setMessages(data.messages || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!user || !input.trim()) return;
    setSending(true);
    try {
      const token = await user.getIdToken();
      const data = await api.post(`/sessions/${sessionId}/messages`, { text: input.trim() }, { auth: token });
      setMessages(prev => [...prev, data.message]);
      setInput('');
    } catch (e: any) {
      setError(e?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadMessages();
    const id = setInterval(loadMessages, 4000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="absolute top-16 right-0 w-full md:w-96 h-[calc(100%-4rem)] bg-slate-800 border-l border-slate-700 flex flex-col z-50">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Session Chat ({chatMode === 'one-way' ? 'Guide → Student' : 'Two-way'})</h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-300 hover:text-white text-sm">Close</button>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-2">
        {loading && <p className="text-slate-400 text-sm">Loading messages…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {!loading && messages.length === 0 && (
          <p className="text-slate-400 text-sm">No messages yet.</p>
        )}
        {messages.map(m => (
          <div key={m._id} className={`max-w-[85%] ${m.senderRole === 'guide' ? 'ml-auto text-right' : ''}`}>
            <div className={`${m.senderRole === 'guide' ? 'bg-emerald-600' : 'bg-slate-700'} inline-block px-3 py-2 rounded-lg text-white text-sm`}>{m.text}</div>
            <div className="text-[10px] text-slate-400 mt-1">
              {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); canSend && !sending && send(); } }}
            className="flex-1 px-3 py-2 rounded bg-slate-700 text-white outline-none placeholder:text-slate-400 disabled:opacity-50"
            placeholder={canSend ? 'Type a message…' : 'Chat is one-way (guide only)'}
            disabled={!canSend || sending}
          />
          <button
            onClick={send}
            disabled={!canSend || sending || !input.trim()}
            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
