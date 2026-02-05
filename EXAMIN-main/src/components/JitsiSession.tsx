import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PhoneOff } from 'lucide-react';
import { JITSI_DOMAIN } from '../config/video';
import ChatPanel from './ChatPanel';

interface JitsiSessionProps {
  roomUrl: string; // e.g., https://meet.jit.si/roomName
  onLeave: () => void;
  guideName?: string;
  userName?: string;
}

// Load Jitsi external_api.js dynamically
function loadJitsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).JitsiMeetExternalAPI) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Jitsi API'));
    document.head.appendChild(script);
  });
}

interface JitsiWithChatProps extends JitsiSessionProps {
  sessionId: string;
  chatMode?: 'one-way' | 'two-way';
  isGuide: boolean;
}

const JitsiSession: React.FC<JitsiWithChatProps> = ({ roomUrl, onLeave, guideName, userName, sessionId, chatMode, isGuide }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  // Ref callback that triggers initialization as soon as container is available
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    console.log('Container ref callback fired, node:', node ? 'available' : 'null');
    containerRef.current = node;
    
    if (!node) return;
    
    // Prevent double initialization (React StrictMode causes double renders in dev)
    if (apiRef.current || isInitializingRef.current) {
      console.log('Already initialized or initializing, skipping...');
      return;
    }

    isInitializingRef.current = true;

    // Clear any pending timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }

    // Initialize immediately when container is set
    const init = async () => {
      try {
        console.log('Loading Jitsi script...');
        await loadJitsiScript();
        const ExternalAPI = (window as any).JitsiMeetExternalAPI;
        if (!ExternalAPI) throw new Error('Jitsi API not available');

        const url = new URL(roomUrl);
        const roomName = url.pathname.replace(/^\//, '');
        const domain = url.hostname || JITSI_DOMAIN;

        console.log('Container ready, initializing Jitsi...', { domain, roomName, isGuide });
        apiRef.current = new ExternalAPI(domain, {
          roomName,
          parentNode: node,
          userInfo: { 
            displayName: isGuide ? (guideName || 'Guide') : (userName || 'Student')
          },
          configOverwrite: {
            // Disable prejoin for smoother experience
            prejoinConfig: { enabled: false },
            // Start with audio/video on
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            // Enable features
            enableWelcomePage: false,
            enableClosePage: false,
            // Allow anyone to start the conference (no moderator lock)
            disableModeratorIndicator: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_REMOTE_DISPLAY_NAME: isGuide ? 'Student' : 'Guide',
          },
        });

        apiRef.current.on('readyToClose', () => {
          console.log('Jitsi readyToClose event');
          onLeave();
        });

        console.log('Jitsi initialized successfully');
        setLoading(false);
      } catch (e: any) {
        console.error('Failed to start Jitsi session:', e);
        setError(e?.message || 'Failed to start video session');
        setLoading(false);
      } finally {
        isInitializingRef.current = false;
      }
    };

    init();
  }, [roomUrl, onLeave, guideName, userName]);

  useEffect(() => {
    return () => {
      try {
        console.log('Disposing Jitsi API');
        apiRef.current?.dispose?.();
      } finally {
        apiRef.current = null;
        isInitializingRef.current = false;
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }
      }
    };
  }, [retryToken]);

  {loading && (
  <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center">
    <p className="text-white">Joining video session...</p>
  </div>
)}
  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); setRetryToken(t => t + 1); }}
            className="bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-600 mr-2"
          >
            Retry
          </button>
          <button
            onClick={onLeave}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
        <h2 className="text-white font-semibold">Video Session</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowChat(s => !s)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
          <button
            onClick={onLeave}
            className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition"
            title="Leave session"
          >
            <PhoneOff className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
      <div ref={setContainerRef} className="flex-1" />

      {showChat && (
        <ChatPanel sessionId={sessionId} chatMode={chatMode || 'two-way'} isGuide={isGuide} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};

export default JitsiSession;
