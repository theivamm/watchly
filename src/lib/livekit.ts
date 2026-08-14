import {
  Room,
  RoomEvent,
  ConnectionState,
  TrackEvent,
  type RemoteParticipant,
  type RemoteTrackPublication,
  type RemoteTrack,
  type RemoteVideoTrack,
  type RemoteAudioTrack,
  type LocalTrack,
  type LocalTrackPublication,
  type TrackPublication,
  createLocalScreenTracks,
  type TrackPublishOptions,
  DataPacket_Kind,
} from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomRole } from "@/types";
import type { RoomTokenResponse } from "@/services/rooms";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export interface ChatMessage {
  id: string;
  user_id: string;
  name: string;
  avatar_id: number | null;
  text: string;
  ts: number;
}

export interface ParticipantInfo {
  user_id: string;
  name: string;
  avatar_id: number | null;
  role: RoomRole;
  isSpeaking: boolean;
  isHost: boolean;
}

export const REACTION_EMOJIS = ["👋", "👏", "❤️", "😮", "🎉"] as const;
export type ReactionType = (typeof REACTION_EMOJIS)[number];

const DATA_TOPIC_CHAT = "chat";
const DATA_TOPIC_REACTION = "reaction";

export interface LiveKitRoomState {
  room: Room | null;
  status: ConnectionStatus;
  role: "host" | "guest";
  localParticipant: { user_id: string; name: string; avatar_id: number | null } | null;
  participants: ParticipantInfo[];
  screenTrack: LocalTrackPublication | null;
  isPublishingScreen: boolean;
  isScreenAvailable: boolean;
  screenShareTrack: LocalTrack | null;
  remoteScreenTrack: RemoteVideoTrack | null;
  remoteScreenAudio: RemoteAudioTrack | null;
  screenMuted: boolean;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  reactions: { emoji: ReactionType; ts: number; from: string }[];
  sendReaction: (emoji: ReactionType) => void;
  startScreenShare: () => Promise<boolean>;
  stopScreenShare: () => Promise<void>;
  disconnect: () => void;
}

export function useLiveKitRoom(
  tokenResponse: RoomTokenResponse | null,
  me: { user_id: string; name: string; avatar_id: number | null } | null
): LiveKitRoomState {
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [screenTrack, setScreenTrack] = useState<LocalTrackPublication | null>(null);
  const [screenTracks, setScreenTracks] = useState<LocalTrack[]>([]);
  const [remoteScreenTrack, setRemoteScreenTrack] = useState<RemoteVideoTrack | null>(null);
  const [remoteScreenAudio, setRemoteScreenAudio] = useState<RemoteAudioTrack | null>(null);
  const [screenMuted, setScreenMuted] = useState(false);
  const [isPublishingScreen, setIsPublishingScreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<
    { emoji: ReactionType; ts: number; from: string }[]
  >([]);

  const localInfoRef = useRef(me);
  localInfoRef.current = me;

  const buildParticipantList = useCallback(
    (r: Room): ParticipantInfo[] => {
      const list: ParticipantInfo[] = [];
      if (me && r.localParticipant) {
        list.push({
          user_id: me.user_id,
          name: me.name,
          avatar_id: me.avatar_id,
          role: tokenResponse?.role === "host" ? "host" : "guest",
          isSpeaking: r.localParticipant.isSpeaking,
          isHost: tokenResponse?.role === "host",
        });
      }
      r.remoteParticipants.forEach((p: RemoteParticipant) => {
        const id = p.identity.split(":").pop() ?? p.sid;
        list.push({
          user_id: id,
          name: p.name || id,
          avatar_id: null,
          role: "guest",
          isSpeaking: p.isSpeaking,
          isHost: false,
        });
      });
      return list;
    },
    [tokenResponse?.role, me]
  );

  const startScreenShare = useCallback(async () => {
    if (!room || tokenResponse?.role !== "host" || isPublishingScreen) return false;
    setIsPublishingScreen(true);
    try {
      let tracks: LocalTrack[];
      try {
        tracks = await createLocalScreenTracks({
          audio: true,
          video: { frameRate: 15, width: { ideal: 1280 } } as any,
          // Habilita el botón "Compartir esta pestaña en su lugar" de Chrome
          // para cambiar de pestaña compartida sin cortar la transmisión.
          surfaceSwitching: "include",
          selfBrowserSurface: "exclude",
        } as any);
      } catch {
        tracks = await createLocalScreenTracks({
          audio: false,
          video: { frameRate: 15, width: { ideal: 1280 } } as any,
          surfaceSwitching: "include",
          selfBrowserSurface: "exclude",
        } as any);
      }
      const publishOpts: TrackPublishOptions = {
        source: "screen_share",
        video: { maxWidth: 1280, maxFramerate: 15, maxBitrate: 1_500_000 },
        audio: true,
      } as TrackPublishOptions;
      const pubs: LocalTrackPublication[] = [];
      for (const t of tracks) {
        const pub = await room.localParticipant.publishTrack(t, publishOpts);
        pubs.push(pub);
      }
      // Solo el fin del video significa que la captura terminó de verdad
      // (Chrome la cortó: "dejar de compartir", cerrar/navegar la pestaña).
      // Limpiamos todo para que el invitado vuelva a la espera y la UI del
      // host se resetee.
      const videoTrack = tracks[0];
      const audioTracks = tracks.slice(1);
      const onScreenEnded = async () => {
        if (!room) return;
        for (const t of tracks) {
          try {
            await room.localParticipant.unpublishTrack(t, true);
          } catch (e) {
            console.error(e);
          }
        }
        setScreenTracks([]);
        setScreenTrack(null);
      };
      videoTrack.on(TrackEvent.Ended, onScreenEnded);
      // El audio de la pestaña se cae solo al cambiar de pestaña (bug de
      // Chrome: issues.chromium.org/344876285). No matamos la transmisión por
      // eso: despublicamos únicamente el audio y el video sigue.
      for (const at of audioTracks) {
        at.on(TrackEvent.Ended, async () => {
          if (!room) return;
          try {
            await room.localParticipant.unpublishTrack(at, true);
          } catch (e) {
            console.error(e);
          }
        });
      }
      setScreenTrack(pubs[0]);
      setScreenTracks(tracks);
      return true;
    } catch (err) {
      console.error("screen share error", err);
      return false;
    } finally {
      setIsPublishingScreen(false);
    }
  }, [room, isPublishingScreen, tokenResponse?.role]);

  const stopScreenShare = useCallback(async () => {
    if (!room) return;
    for (const t of screenTracks) {
      try {
        await room.localParticipant.unpublishTrack(t, true);
        t.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setScreenTracks([]);
    setScreenTrack(null);
  }, [room, screenTracks]);

  const disconnect = useCallback(() => {
    if (room) room.disconnect();
  }, [room]);

  useEffect(() => {
    if (!tokenResponse) return;

    const r = new Room();
    setRoom(r);
    setStatus("connecting");

    r.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      setStatus(
        state === "connected"
          ? "connected"
          : state === "connecting" || state === "reconnecting"
            ? "reconnecting"
            : "disconnected"
      );
      if (state === "connected") setParticipants(buildParticipantList(r));
    });

    r.on(RoomEvent.ParticipantDisconnected, () => {
      setParticipants((_ps) => buildParticipantList(r));
    });
    r.on(RoomEvent.TrackPublished, () => {
      setParticipants((_ps) => buildParticipantList(r));
    });
    r.on(RoomEvent.TrackUnpublished, () => {
      setParticipants((_ps) => buildParticipantList(r));
    });

    r.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, pub: RemoteTrackPublication) => {
        if (pub.source !== "screen_share") return;
        if (track.kind === "video") setRemoteScreenTrack(track as RemoteVideoTrack);
        else if (track.kind === "audio") setRemoteScreenAudio(track as RemoteAudioTrack);
      }
    );
    r.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, pub: RemoteTrackPublication) => {
      if (pub.source !== "screen_share") return;
      if (track.kind === "video") {
        setRemoteScreenTrack(null);
        setScreenMuted(false);
      } else if (track.kind === "audio") {
        setRemoteScreenAudio(null);
      }
    });

    // Chrome marca la pista capturada como muted cuando la pestaña
    // compartida pasa a segundo plano. Lo propagamos al UI para avisar
    // al invitado en vez de mostrar una pantalla negra.
    r.on(RoomEvent.TrackMuted, (pub: TrackPublication) => {
      if (pub.source === "screen_share") setScreenMuted(true);
    });
    r.on(RoomEvent.TrackUnmuted, (pub: TrackPublication) => {
      if (pub.source === "screen_share") setScreenMuted(false);
    });

    r.on(
      RoomEvent.DataReceived,
      (
        payload: Uint8Array,
        _sender: RemoteParticipant | undefined,
        _kind?: DataPacket_Kind,
        topic?: string
      ) => {
        let parsed: Record<string, unknown> | null = null;
        try {
          parsed = JSON.parse(new TextDecoder().decode(payload));
        } catch {
          return;
        }
        if (topic === DATA_TOPIC_CHAT) {
          setMessages((prev) =>
            [
              ...prev,
              {
                id: crypto.randomUUID(),
                user_id: (parsed?.user_id as string) ?? "unknown",
                name: (parsed?.name as string) ?? "Anon",
                avatar_id: (parsed?.avatar_id as number | null) ?? null,
                text: (parsed?.text as string) ?? "",
                ts: (parsed?.ts as number) ?? Date.now(),
              },
            ].slice(-200)
          );
        } else if (topic === DATA_TOPIC_REACTION) {
          setReactions((prev) =>
            [
              ...prev,
              {
                emoji: (parsed?.emoji as ReactionType) ?? "👋",
                ts: Date.now(),
                from: (parsed?.from as string) ?? "?",
              },
            ]
              .filter((rx) => Date.now() - rx.ts < 4000)
              .slice(-40)
          );
        }
      }
    );

    (async () => {
      try {
        await r.connect(tokenResponse.url, tokenResponse.token, {
          autoSubscribe: true,
        });
        setParticipants(buildParticipantList(r));
      } catch (e) {
        console.error("livekit connect error", e);
        setStatus("error");
      }
    })();

    return () => {
      r.disconnect();
    };
  }, [tokenResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuando la pestaña compartida pasa a segundo plano, Chrome emite "muted"
  // en la pista y livekit-client respondería pausando el envío upstream a los
  // 5s (debouncedTrackMuteHandler -> pauseUpstream -> sender.replaceTrack(null)),
  // cortando la transmisión para el invitado. Neutralizamos pauseUpstream para
  // que la pista siga enviando frames aunque la pestaña quede en background.
  useEffect(() => {
    if (screenTracks.length === 0) return;
    for (const t of screenTracks) {
      (t as unknown as { pauseUpstream: () => Promise<void> }).pauseUpstream = () =>
        Promise.resolve();
    }
  }, [screenTracks]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!room || text.length === 0 || text.length > 500) return;
      const data = new TextEncoder().encode(
        JSON.stringify({
          user_id: me?.user_id,
          name: me?.name,
          avatar_id: me?.avatar_id,
          text,
          ts: Date.now(),
        })
      );
      room.localParticipant.publishData(data, { topic: DATA_TOPIC_CHAT, reliable: true });
      setMessages((prev) =>
        [
          ...prev,
          {
            id: crypto.randomUUID(),
            user_id: me?.user_id ?? "me",
            name: me?.name ?? "Yo",
            avatar_id: me?.avatar_id ?? null,
            text,
            ts: Date.now(),
          },
        ].slice(-200)
      );
    },
    [room, me]
  );

  const sendReaction = useCallback(
    (emoji: ReactionType) => {
      if (!room) return;
      const data = new TextEncoder().encode(
        JSON.stringify({ emoji, from: me?.name ?? "Yo" })
      );
      room.localParticipant.publishData(data, { topic: DATA_TOPIC_REACTION, reliable: true });
      setReactions((prev) =>
        [
          ...prev,
          { emoji, ts: Date.now(), from: me?.name ?? "Yo" },
        ]
          .filter((rx) => Date.now() - rx.ts < 4000)
          .slice(-40)
      );
    },
    [room, me]
  );

  return {
    room,
    status,
    role: tokenResponse?.role ?? "guest",
    localParticipant: me,
    participants,
    screenTrack,
    isPublishingScreen,
    isScreenAvailable: !!room,
    screenShareTrack: screenTracks[0] ?? null,
    remoteScreenTrack,
    remoteScreenAudio,
    screenMuted,
    messages,
    sendMessage,
    reactions,
    sendReaction,
    startScreenShare,
    stopScreenShare,
    disconnect,
  };
}
