import React, { useEffect, useState, useCallback, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';
import type { DailyCall } from '@daily-co/daily-js';
import { useDaily, DailyProvider, DailyVideo } from '@daily-co/daily-react';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Users, Settings } from 'lucide-react';
import { toast } from 'react-toastify';

interface VideoSessionProps {
  roomUrl: string;
  isGuide: boolean;
  onLeave: () => void;
  sessionId: string;
  guideName?: string;
  userName?: string;
  chatMode?: 'one-way' | 'two-way';
}

// Module-scoped singleton and creation guard to avoid duplicate DailyIframe instances
let __singletonCallObject: DailyCall | null = null;
let __creatingCallObject: Promise<DailyCall> | null = null;

async function getOrCreateCallObject(options?: { audioSource?: any; videoSource?: any }): Promise<DailyCall> {
  if (__singletonCallObject) return __singletonCallObject;
  if (__creatingCallObject) return __creatingCallObject;

  __creatingCallObject = (async () => {
    const obj = DailyIframe.createCallObject({
      audioSource: options?.audioSource ?? true,
      videoSource: options?.videoSource ?? true,
    });
    __singletonCallObject = obj;
    // also expose on window to be robust across HMR boundaries
    (window as any)['__dailyCallObject'] = obj;
    return obj;
  })();

  try {
    return await __creatingCallObject;
  } finally {
    __creatingCallObject = null;
  }
}

// Note: we intentionally do not destroy the singleton on unmount to avoid
// "use after destroy" races in StrictMode/HMR. The call object can be reused
// across mounts and joins; we leave the meeting on unmount instead.

import ChatPanel from './ChatPanel';

const VideoCall: React.FC<VideoSessionProps> = ({ roomUrl, isGuide, onLeave, guideName, userName, sessionId, chatMode }) => {
  const daily = useDaily();
  const [participants, setParticipants] = useState<any[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!daily) return;

    const updateParticipants = () => {
      const parts = daily.participants();
      setParticipants(Object.values(parts));
    };

    // Event listeners
    daily.on('participant-joined', updateParticipants);
    daily.on('participant-updated', updateParticipants);
    daily.on('participant-left', updateParticipants);
    
    daily.on('active-speaker-change', (evt) => {
      console.log('Active speaker:', evt);
    });

    updateParticipants();

    return () => {
      daily.off('participant-joined', updateParticipants);
      daily.off('participant-updated', updateParticipants);
      daily.off('participant-left', updateParticipants);
    };
  }, [daily]);

  const toggleMic = useCallback(() => {
    if (!daily) return;
    daily.setLocalAudio(!isMicOn);
    setIsMicOn(!isMicOn);
  }, [daily, isMicOn]);

  const toggleCamera = useCallback(() => {
    if (!daily) return;
    daily.setLocalVideo(!isCameraOn);
    setIsCameraOn(!isCameraOn);
  }, [daily, isCameraOn]);

  const toggleScreenShare = useCallback(async () => {
    if (!daily) return;
    try {
      if (isScreenSharing) {
        await daily.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await daily.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch {
      toast.error('Screen sharing failed');
    }
  }, [daily, isScreenSharing]);

  const handleLeave = useCallback(() => {
    if (!daily) {
      onLeave();
      return;
    }
    try {
      setLeaving(true);
      daily.leave();
    } finally {
      // We rely on the effect cleanup to destroy the call object on unmount,
      // avoiding any "use after destroy" while this component still renders.
      onLeave();
    }
  }, [daily, onLeave]);

  const kickParticipant = useCallback((participantId: string) => {
    if (!daily || !isGuide) return;
    daily.updateParticipant(participantId, { eject: true });
    toast.success('Participant removed');
  }, [daily, isGuide]);

  const muteParticipant = useCallback((participantId: string) => {
    if (!daily || !isGuide) return;
    daily.updateParticipant(participantId, { setAudio: false });
    toast.success('Participant muted');
  }, [daily, isGuide]);

  const localParticipant = participants.find(p => p.local);
  const remoteParticipants = participants.filter(p => !p.local);

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-emerald-400" />
          <h2 className="text-white font-semibold">
            {isGuide ? `Session with ${userName || 'Student'}` : `Session with ${guideName || 'Guide'}`}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="h-4 w-4" />
            <span className="text-sm">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={() => setShowChat(s => !s)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <Settings className="h-5 w-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className={`grid gap-4 h-full ${remoteParticipants.length === 0 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {/* Remote Participants */}
          {remoteParticipants.map(participant => (
            <div key={participant.session_id} className="relative bg-slate-800 rounded-xl overflow-hidden">
              <DailyVideo
                automirror
                sessionId={participant.session_id}
                type="video"
                className="w-full h-full object-cover"
              />
              
              {/* Participant Info */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-2 rounded-lg">
                <p className="text-white text-sm font-medium">
                  {participant.user_name || (isGuide ? 'Student' : 'Guide')}
                </p>
              </div>

              {/* Guide Controls for Remote Participant */}
              {isGuide && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => muteParticipant(participant.session_id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    title="Mute participant"
                  >
                    <MicOff className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => kickParticipant(participant.session_id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    title="Remove participant"
                  >
                    <PhoneOff className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}

              {/* Audio Indicator */}
              {participant.audio === false && (
                <div className="absolute top-4 left-4">
                  <MicOff className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
          ))}

          {/* Local Participant (Self View) */}
          {localParticipant && (
            <div className="relative bg-slate-800 rounded-xl overflow-hidden">
              <DailyVideo
                automirror
                sessionId={localParticipant.session_id}
                type="video"
                className="w-full h-full object-cover"
              />
              
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-2 rounded-lg">
                <p className="text-white text-sm font-medium">You</p>
              </div>

              {!isCameraOn && (
                <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
                  <VideoOff className="h-12 w-12 text-slate-400" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-800 px-6 py-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          disabled={leaving}
          className={`p-4 rounded-full transition ${isMicOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'}`}
          title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicOn ? <Mic className="h-6 w-6 text-white" /> : <MicOff className="h-6 w-6 text-white" />}
        </button>

        <button
          onClick={toggleCamera}
          disabled={leaving}
          className={`p-4 rounded-full transition ${isCameraOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'}`}
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? <Video className="h-6 w-6 text-white" /> : <VideoOff className="h-6 w-6 text-white" />}
        </button>

        <button
          onClick={toggleScreenShare}
          disabled={leaving}
          className={`p-4 rounded-full transition ${isScreenSharing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <Monitor className="h-6 w-6 text-white" />
        </button>

        <button
          onClick={handleLeave}
          disabled={leaving}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition"
          title="Leave session"
        >
          <PhoneOff className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 bg-slate-800 rounded-xl shadow-xl p-4 w-80">
          <h3 className="text-white font-semibold mb-3">Session Settings</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Room: {roomUrl.split('/').pop()}</p>
            <p>Role: {isGuide ? 'Guide (Host)' : 'Student'}</p>
            <p>Participants: {participants.length}</p>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <ChatPanel sessionId={sessionId} chatMode={chatMode || 'two-way'} isGuide={isGuide} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};

// Main component with Daily provider
const VideoSession: React.FC<VideoSessionProps> = (props) => {
  // Keep a singleton reference to avoid duplicate DailyIframe instances
  const callRef = useRef<DailyCall | null>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        // Always go through the guarded singleton creator
        const daily = await getOrCreateCallObject({ audioSource: true, videoSource: true });
        callRef.current = daily;

        // Join only if not already joining/joined. This avoids duplicate join attempts.
        const state = (daily as any).meetingState?.() || 'new';
        if (state !== 'joining' && state !== 'joined') {
          await daily.join({ url: props.roomUrl, userName: props.isGuide ? props.guideName : props.userName });
        }

        setCallObject(daily);
        setLoading(false);
      } catch (e: any) {
        console.error('Failed to join call:', e);
        setError(e?.message || 'Failed to join video session');
        setLoading(false);
      }
    };

    initCall();

    return () => {
      // On unmount, leave the meeting but do NOT destroy the singleton call object.
      // This avoids "use after destroy" during StrictMode/HMR remount cycles.
      try {
        const obj = callRef.current as any;
        if (obj && typeof obj.meetingState === 'function') {
          const state = obj.meetingState();
          if (state === 'joined' || state === 'joining' || state === 'loaded') {
            try { obj.leave?.(); } catch { /* noop */ }
          }
        }
      } finally {
        callRef.current = null;
      }
    };
    // Intentionally only depend on roomUrl; guide/user name changes shouldn't recreate the call
  }, 
  // We intentionally only depend on roomUrl to avoid re-creating the call
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [props.roomUrl]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-white text-lg">Joining video session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={props.onLeave}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!callObject) {
    return null;
  }

  return (
    <DailyProvider callObject={callObject}>
      <VideoCall {...props} />
    </DailyProvider>
  );
};

export default VideoSession;
