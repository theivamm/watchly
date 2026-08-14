import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MonitorPlay,
  PauseCircle,
  PlayCircle,
  LogOut,
  Users,
  Copy,
  AlertCircle,
  Loader2,
  Trash2,
  Send,
  Video,
  Laugh,
  MousePointerClick,
  MessageCircle,
  Minimize2,
  ChevronDown,
  Maximize,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "@/app/auth-context";
import type { Room, RoomMember, RoomRole, Profile } from "@/types";
import {
  getRoomById,
  getRoomMembers,
  joinRoom,
  controlRoom,
  setMemberLeft,
  roomInviteLink,
  type RoomTokenResponse,
} from "@/services/rooms";
import { supabase } from "@/lib/supabase";
import type { LocalTrack, RemoteVideoTrack, RemoteAudioTrack } from "livekit-client";
import {
  useLiveKitRoom,
  REACTION_EMOJIS,
  type ReactionType,
  type ChatMessage,
} from "@/lib/livekit";
import Avatar from "@/components/ui/Avatar";
import { usePageTitle } from "@/hooks/usePageTitle";

const WAITING_MESSAGES = [
  "Preparando las palomitas virtuales… 🍿",
  "El host está decidiendo qué compartir… o no 🤔",
  "Afila los ojos: la pantalla llega en breve 👀",
  "Aquí estaremos, comiendo pipoca hasta que arranque.",
  "Avisale al host que la paciencia es oro… 🏅",
  "El silencio es incómodo. ¡Compartí algo, host! 🙏",
  "Tranqui, esto no es un video de 10 horas… todavía.",
  "El host está calentando motores… o simplemente laburando.",
  "Mientras tanto, te recomendamos leer la sinopsis. De nuevo.",
  "Este espacio se renta por hora. Bueno, no. Pero casi.",
];

const FAKE_PROFILE_BASE = {
  id: "",
  username: "",
  display_name: "",
  bio: null,
  avatar_path: null,
  location: null,
  website_url: null,
  instagram_url: null,
  avatar_id: null,
  created_at: "",
  updated_at: "",
  show_dna_publicly: false,
  dna_dirty: false,
  onboarding_completed: false,
};

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [tokenResp, setTokenResp] = useState<RoomTokenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kicking, setKicking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState<"participants" | "chat">("participants");

  const [immersive, setImmersive] = useState(false);
  const [volume, setVolume] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const me = useMemo(() => {
    if (!user) return null;
    return {
      user_id: user.id,
      name: profile?.display_name || profile?.username || user.email?.split("@")[0] || "Usuario",
      avatar_id: profile?.avatar_id ?? null,
    };
  }, [user, profile]);

  const role: RoomRole = useMemo(() => {
    if (!room || !user) return "guest";
    return room.host_user_id === user.id ? "host" : "guest";
  }, [room, user]);

  const livekit = useLiveKitRoom(tokenResp, me);
  const isHost = role === "host";

  const meRef = useRef(me);
  meRef.current = me;
  const disconnectRef = useRef(livekit.disconnect);
  disconnectRef.current = livekit.disconnect;

  // Contador de mensajes no leídos mientras el chat está oculto.
  const msgLenRef = useRef(0);
  useEffect(() => {
    const len = livekit.messages.length;
    if (!immersive) {
      msgLenRef.current = len;
      setUnread(0);
      return;
    }
    if (chatOpen) {
      msgLenRef.current = len;
      setUnread(0);
      return;
    }
    if (len > msgLenRef.current) setUnread((u) => u + (len - msgLenRef.current));
    msgLenRef.current = len;
  }, [livekit.messages.length, immersive, chatOpen]);

  // Auto-ocultar el chat flotante tras unos segundos.
  useEffect(() => {
    if (!immersive || !chatOpen) return;
    const t = setTimeout(() => setChatOpen(false), 8000);
    return () => clearTimeout(t);
  }, [chatOpen, immersive, livekit.messages.length]);

  const mainRef = useRef<HTMLDivElement | null>(null);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await mainRef.current?.requestFullscreen?.();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!id) return;
    if (!user) {
      navigate(`/login?goto=/salas/${id}`);
      return;
    }
    setLoading(true);
    Promise.all([getRoomById(id), getRoomMembers(id)])
      .then(([r, m]) => {
        setRoom(r);
        setMembers(m.filter((x) => !x.removed_at));
      })
      .catch((e) => {
        console.error(e);
        setError("No se pudo cargar la sala.");
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`realtime:public:watch_room_members:room_id=eq.${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "watch_room_members",
          filter: `room_id=eq.${id}`,
        },
        () => {
          getRoomMembers(id)
            .then((m) => {
              const filtered = m.filter((x) => !x.removed_at);
              setMembers(filtered);
              const myId = meRef.current?.user_id;
              if (myId && !filtered.some((x) => x.user_id === myId)) {
                disconnectRef.current();
                navigate("/salas");
              }
            })
            .catch(console.error);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "watch_rooms", filter: `id=eq.${id}` },
        (payload) => {
          setRoom((prev) => (prev ? { ...prev, ...(payload.new as Partial<Room>) } : prev));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "watch_rooms", filter: `id=eq.${id}` },
        () => {
          disconnectRef.current();
          navigate("/salas");
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    joinRoom(user.id, { room_id: id })
      .then((resp) => {
        if (!cancelled) setTokenResp(resp);
      })
      .catch((e) => {
        const msg = String(e?.message ?? e);
        if (!cancelled) {
          if (msg.includes("invitación inválido") || msg.includes("no encontrada"))
            setError("Código de invitación inválido o sala no encontrada.");
          else if (msg.includes("finalizó")) setError("Esta sala finalizó.");
          else if (msg.includes("llena")) setError("La sala está llena.");
          else if (msg.includes("expulsar") || msg.includes("No podés") || msg.includes("No autorizado") || msg.includes("401"))
            setError("No tenés permiso para entrar a esta sala.");
          else setError(msg || "No se pudo conectar.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const handleStart = async () => {
    try {
      await livekit.startScreenShare();
    } catch (e) {
      console.error(e);
      setError("No se pudo iniciar la transmisión.");
    }
  };

  const handleStopScreen = async () => {
    try {
      await livekit.stopScreenShare();
    } catch (e) {
      console.error(e);
    }
  };

  const handleKick = async (memberUserId: string) => {
    if (!room || !confirm("¿Expulsar a este participante?")) return;
    setKicking(memberUserId);
    try {
      await controlRoom(room.id, "kick", { user_id: memberUserId });
    } catch (e) {
      console.error(e);
      setError("No se pudo expulsar al participante.");
    } finally {
      setKicking(null);
    }
  };

  const handleLeave = async () => {
    if (room && user) {
      setMemberLeft(room.id, user.id).catch(console.error);
    }
    livekit.disconnect();
    navigate("/salas");
  };

  const copyInvitation = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(roomInviteLink(room));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const pokeHost = () => {
    livekit.sendReaction("👋");
  };

  usePageTitle(room ? `${room.name} | Salas | Watchly` : "Sala | Watchly");

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] px-5 md:px-8 py-8 md:py-12">
        <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Conectando a la sala…</span>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="w-full h-[calc(100vh-64px)] px-5 md:px-8 py-8 md:py-12">
        <div className="flex items-start gap-2.5 text-sm" style={{ color: "#f87171" }}>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error || "Sala no encontrada"}</span>
        </div>
        <button
          onClick={() => navigate("/salas")}
          className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}
        >
          Volver a salas
        </button>
      </div>
    );
  }

  const connectedMembers = members.filter((m) => !m.left_at && !m.removed_at);

  const participantInfos = [
    {
      user_id: room.host_user_id,
      name: profile?.display_name || profile?.username || "Host",
      avatar_id: profile?.avatar_id ?? null,
      role: "host" as RoomRole,
      isHost: true,
    },
    ...connectedMembers
      .filter((m) => m.user_id !== room.host_user_id)
      .map((m) => ({
        user_id: m.user_id,
        name: m.user_id.slice(0, 8),
        avatar_id: null as number | null,
        role: m.role as RoomRole,
        isHost: false,
      })),
  ];

  const roomColor = room.color || "#8b5cf6";

  return (
    <div className="fixed inset-0 md:left-[84px] z-40 flex flex-col" style={{ background: "var(--gradient-accent)" }}>
      {!immersive && (
        <header className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ backgroundColor: "rgba(11,11,20,0.7)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${roomColor} 22%, transparent)` }}
            >
              <MonitorPlay className="w-4 h-4" style={{ color: roomColor }} />
            </div>
            <h1 className="text-base font-bold truncate" style={{ color: "var(--text-primary)" }}>{room.name}</h1>
            {isHost && livekit.isPublishingScreen ? (
              <button
                onClick={() => void handleStopScreen()}
                title="Detener transmisión"
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 cursor-pointer transition-all hover:scale-[1.05]"
                style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.5)" }}
              >
                ● Transmitiendo — detener
              </button>
            ) : (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${roomColor} 18%, transparent)`, color: roomColor }}>
                Abierta
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
            <Users className="w-3.5 h-3.5" />
            <span>{connectedMembers.length}/{room.max_participants}</span>
            <button onClick={copyInvitation} title="Copiar enlace de invitación" className="ml-2 p-1 rounded hover:bg-white/5"
              style={{ color: "var(--text-primary)" }}>
              {copied ? <Copy className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setImmersive(true)}
              title="Ocultar interfaz y ver solo la pantalla"
              className="p-1 rounded hover:bg-white/5"
              style={{ color: "var(--text-primary)" }}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <main
          ref={mainRef}
          className="relative flex-1 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          {livekit.status === "connecting" || livekit.status === "reconnecting" ? (
            <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Conectando…</span>
            </div>
          ) : livekit.status === "error" ? (
            <div className="flex items-start gap-2.5 text-center px-6" style={{ color: "#f87171" }}>
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>No se pudo conectar a LiveKit. Verificá la configuración.</span>
            </div>
          ) : (
            <LiveView
              room={livekit.room}
              isHost={isHost}
              onStart={handleStart}
              onStop={handleStopScreen}
              isPublishingScreen={livekit.isPublishingScreen}
              localScreenTrack={livekit.screenShareTrack}
              remoteScreenTrack={livekit.remoteScreenTrack}
              remoteScreenAudio={livekit.remoteScreenAudio}
              screenMuted={livekit.screenMuted}
              volume={volume}
              onVolumeChange={setVolume}
              onToggleFullscreen={toggleFullscreen}
              onPoke={pokeHost}
            />
          )}

          {immersive && (
            <button
              onClick={() => setImmersive(false)}
              className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-[1.03]"
              style={{ backgroundColor: "rgba(0,0,0,0.65)", color: "var(--text-secondary)", backdropFilter: "blur(8px)" }}
            >
              <ChevronDown className="w-3.5 h-3.5" /> Ver interfaz
            </button>
          )}
        </main>

        {!immersive && (
          <aside
            className="flex flex-col md:w-72 md:border-l border-t md:border-t-0 h-[40vh] md:h-auto shrink-0"
            style={{ backgroundColor: "rgba(11,11,20,0.8)", borderColor: "var(--border)" }}
          >
            <nav className="flex border-b shrink-0" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setPanel("participants")}
                className="flex-1 py-3 text-xs font-bold transition-colors"
                style={{ color: panel === "participants" ? "var(--accent-light)" : "var(--text-secondary)" }}
              >
                Participantes
              </button>
              <button
                onClick={() => setPanel("chat")}
                className="flex-1 py-3 text-xs font-bold transition-colors"
                style={{ color: panel === "chat" ? "var(--accent-light)" : "var(--text-secondary)" }}
              >
                Chat
              </button>
            </nav>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {panel === "participants" && (
                <ParticipantsList
                  participants={participantInfos}
                  isHost={isHost}
                  kicking={kicking}
                  onKick={handleKick}
                  localUserId={me?.user_id}
                />
              )}
              {panel === "chat" && (
                <ChatPanel
                  messages={livekit.messages}
                  onSend={livekit.sendMessage}
                  reactions={livekit.reactions}
                  onReact={livekit.sendReaction}
                />
              )}
            </div>

            <div className="p-3 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => void handleLeave()}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                style={{ backgroundColor: "var(--surface-2)", color: "#f87171", border: "1.5px solid var(--border)" }}
              >
                <LogOut className="w-4 h-4" />
                Salir de la sala
              </button>
              <p className="mt-2 text-center text-[11px]" style={{ color: "var(--text-secondary)" }}>
                La sala queda abierta. Volvé cuando quieras con el mismo enlace.
              </p>
            </div>
          </aside>
        )}
      </div>

      {immersive && (
        <FloatingChat
          open={chatOpen}
          unread={unread}
          onToggle={() => setChatOpen((o) => !o)}
          messages={livekit.messages}
          onSend={livekit.sendMessage}
          reactions={livekit.reactions}
          onReact={livekit.sendReaction}
        />
      )}
    </div>
  );
}

function LiveView({
  room,
  isHost,
  onStart,
  onStop,
  isPublishingScreen,
  localScreenTrack,
  remoteScreenTrack,
  remoteScreenAudio,
  screenMuted,
  volume,
  onVolumeChange,
  onToggleFullscreen,
  onPoke,
}: {
  room: import("livekit-client").Room | null;
  isHost: boolean;
  onStart: () => void;
  onStop: () => void;
  isPublishingScreen: boolean;
  localScreenTrack: LocalTrack | null;
  remoteScreenTrack: RemoteVideoTrack | null;
  remoteScreenAudio: RemoteAudioTrack | null;
  screenMuted: boolean;
  volume: number;
  onVolumeChange: (v: number) => void;
  onToggleFullscreen: () => void;
  onPoke: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!remoteScreenTrack || !el) return;
    remoteScreenTrack.attach(el);
    el.autoplay = true;
    el.playsInline = true;
    el.muted = true;
    return () => {
      remoteScreenTrack.detach(el);
    };
  }, [remoteScreenTrack, room]);

  useEffect(() => {
    const el = audioRef.current;
    if (!remoteScreenAudio || !el) return;
    remoteScreenAudio.attach(el);
    el.autoplay = true;
    el.muted = false;
    el.volume = volume;
    el.play?.().catch(() => {});
    return () => {
      remoteScreenAudio.detach(el);
    };
  }, [remoteScreenAudio, volume, room]);

  useEffect(() => {
    const el = localVideoRef.current;
    if (!localScreenTrack || !el) return;
    localScreenTrack.attach(el);
    el.autoplay = true;
    el.playsInline = true;
    return () => {
      localScreenTrack.detach(el);
    };
  }, [localScreenTrack]);

  const controls = (
    <div
      className="absolute bottom-3 right-3 z-10 flex items-center gap-2 px-3 py-2 rounded-full"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
    >
      <button onClick={onToggleFullscreen} title="Pantalla completa" className="text-white/90 hover:text-white">
        <Maximize className="w-4 h-4" />
      </button>
      {!isHost && (
        <>
          <button
            onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
            title={volume > 0 ? "Silenciar" : "Activar sonido"}
            className="text-white/90 hover:text-white"
          >
            {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-20 accent-white"
            aria-label="Volumen"
          />
        </>
      )}
    </div>
  );

  const waitingStage = (
    <WaitingStage
      isHost={isHost}
      onStart={onStart}
      onStop={onStop}
      isPublishingScreen={isPublishingScreen}
      onPoke={onPoke}
    />
  );

  let content;
  if (!room || room.state !== "connected") {
    content = waitingStage;
  } else if (isHost && localScreenTrack) {
    content = (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <video ref={localVideoRef} className="max-w-full max-h-full" muted playsInline />
        <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "var(--text-secondary)" }}>
          Vista previa: tu pantalla
        </span>
        <button
          onClick={onStop}
          className="absolute bottom-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.03]"
          style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#f87171", border: "1.5px solid rgba(248,113,113,0.5)", backdropFilter: "blur(6px)" }}
        >
          <PauseCircle className="w-4 h-4" />
          Detener transmisión
        </button>
      </div>
    );
  } else if (remoteScreenTrack) {
    content = (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <video
          key={remoteScreenTrack.sid ?? "screen"}
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          muted
          playsInline
        />
        {screenMuted && (
          <div
            className="absolute inset-x-0 top-0 z-10 px-4 py-3 text-center text-xs font-bold"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "var(--text-secondary)", backdropFilter: "blur(8px)" }}
          >
            El host está en otra pestaña. La transmisión se pausó y se reanuda sola cuando vuelva.
          </div>
        )}
        {controls}
      </div>
    );
  } else {
    content = waitingStage;
  }

  return (
    <div className="relative w-full h-full">
      <audio ref={audioRef} />
      {content}
    </div>
  );
}

function WaitingStage({
  isHost,
  onStart,
  onStop,
  isPublishingScreen,
  onPoke,
}: {
  isHost: boolean;
  onStart: () => void;
  onStop: () => void;
  isPublishingScreen: boolean;
  onPoke: () => void;
}) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [poked, setPoked] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setMsgIdx((i) => (i + 1) % WAITING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const message = WAITING_MESSAGES[msgIdx];

  return (
    <div className="text-center px-6 max-w-md" style={{ color: "var(--text-secondary)" }}>
      <div className="relative w-fit mx-auto mb-4">
        <Video className="w-14 h-14 mx-auto" style={{ color: "var(--accent)" }} />
        <span className="absolute -top-1 -right-2 animate-bounce">🍿</span>
      </div>
      <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        {isHost ? "Tu sala está abierta" : "Esperando que el host comparta…"}
      </p>
      <p key={message} className="text-sm mb-2 transition-opacity duration-300" style={{ color: "var(--text-secondary)" }}>
        {message}
      </p>

      {isHost ? (
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
          {isPublishingScreen ? (
            <button
              onClick={onStop}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}
            >
              <PauseCircle className="w-4 h-4" />
              Detener transmisión
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={isPublishingScreen}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "var(--gradient-accent)", color: "#fff" }}
            >
              {isPublishingScreen ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {isPublishingScreen ? "Compartiendo…" : "Compartir pestaña"}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={() => {
              onPoke();
              setPoked(true);
              setTimeout(() => setPoked(false), 1500);
            }}
            disabled={poked}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
            style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}
          >
            {poked ? <Laugh className="w-4 h-4" /> : <MousePointerClick className="w-4 h-4" />}
            {poked ? "¡Poke enviado! 👀" : "Hacerle ruido al host"}
          </button>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Tu reacción aparecerá en el chat.
          </span>
        </div>
      )}

      <p className="mt-4 text-xs" style={{ color: "var(--text-secondary)" }}>
        Algunos sitios y contenidos protegidos pueden impedir la transmisión de imagen o sonido.
      </p>
    </div>
  );
}

function FloatingChat({
  open,
  unread,
  onToggle,
  messages,
  onSend,
  reactions,
  onReact,
}: {
  open: boolean;
  unread: number;
  onToggle: () => void;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  reactions: { emoji: ReactionType; ts: number; from: string }[];
  onReact: (emoji: ReactionType) => void;
}) {
  return (
    <div className="absolute bottom-4 left-0 right-0 z-20 flex flex-col items-center px-4 pointer-events-none">
      {open && (
        <div
          className="w-full max-w-md h-72 rounded-3xl border p-3 mb-2 pointer-events-auto"
          style={{
            backgroundColor: "rgba(15,15,28,0.72)",
            borderColor: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          }}
        >
          <ChatPanel messages={messages} onSend={onSend} reactions={reactions} onReact={onReact} />
        </div>
      )}
      <button
        onClick={onToggle}
        className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition-all hover:scale-[1.03]"
        style={{
          backgroundColor: "rgba(15,15,28,0.72)",
          borderColor: "rgba(255,255,255,0.2)",
          color: "var(--text-primary)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <MessageCircle className="w-4 h-4" style={{ color: "var(--accent-light)" }} />
        {open ? "Cerrar chat" : "Chat"}
        {!open && unread > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center"
            style={{ backgroundColor: "#ef4444", color: "#fff" }}
          >
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}

interface ParticipantInfo {
  user_id: string;
  name: string;
  avatar_id: number | null;
  role: RoomRole;
  isHost: boolean;
}

function ParticipantsList({
  participants,
  isHost,
  kicking,
  onKick,
  localUserId,
}: {
  participants: ParticipantInfo[];
  isHost: boolean;
  kicking: string | null;
  onKick: (uid: string) => void;
  localUserId?: string;
}) {
  const profileFor = (p: ParticipantInfo): Profile => ({ ...FAKE_PROFILE_BASE, id: p.user_id, username: p.name, display_name: p.name, avatar_id: p.avatar_id } as Profile);

  return (
    <>
      {participants.map((p) => (
        <div key={p.user_id} className="flex items-center gap-3">
          <Avatar profile={profileFor(p)} size={32} />
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{p.name}</span>
          {p.isHost && <span className="text-[10px] font-bold" style={{ color: "var(--accent-light)" }}>HOST</span>}
          {!p.isHost && isHost && p.user_id !== localUserId && (
            <button
              onClick={() => onKick(p.user_id)}
              disabled={kicking === p.user_id}
              title="Expulsar"
              className="ml-auto p-1 rounded hover:bg-white/5 disabled:opacity-60"
              style={{ color: "#f87171" }}
            >
              {kicking === p.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      ))}
    </>
  );
}

function ChatPanel({
  messages,
  onSend,
  reactions,
  onReact,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  reactions: { emoji: ReactionType; ts: number; from: string }[];
  onReact: (emoji: ReactionType) => void;
}) {
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollTo({ top: messagesEndRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, reactions]);

  return (
    <div className="flex flex-col h-full gap-2">
      <div ref={messagesEndRef} className="flex-1 overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-bold" style={{ color: "var(--accent-light)" }}>{m.name}:</span>{" "}
            <span style={{ color: "var(--text-primary)" }}>{m.text}</span>
            <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}> · {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        ))}
        {messages.length === 0 && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Aún no hay mensajes.</p>}
        {reactions.map((r, i) => (
          <div key={`${r.from}-${r.ts}-${i}`} className="text-xl" style={{ color: "var(--accent-light)" }}>
            {r.emoji} <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{r.from}</span>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft.trim();
          if (!t) return;
          onSend(t);
          setDraft("");
        }}
        className="flex gap-1"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 500))}
          placeholder="Mensaje (Enter para enviar)…"
          className="flex-1 !rounded-xl !text-xs !px-2.5 !py-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
        />
        <button type="submit" className="px-2 rounded-lg" style={{ color: "var(--accent-light)" }}>
          <Send className="w-4 h-4" />
        </button>
      </form>
      <div className="flex gap-1 justify-center">
        {REACTION_EMOJIS.map((e) => (
          <button key={e} onClick={() => onReact(e)} className="text-lg" aria-label={`Reacción ${e}`}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
