import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  MonitorPlay,
  Plus,
  Search,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Trash2,
  Pencil,
  CheckCheck,
  X,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/app/auth-context";
import {
  createRoom,
  getMyRooms,
  joinRoom,
  renameRoom,
  deleteRoom,
  roomInviteLink,
  type RoomTokenResponse,
} from "@/services/rooms";
import type { Room } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function RoomsPage() {
  usePageTitle("Salas | Watchly");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [creatingError, setCreatingError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const reload = useCallback(async () => {
    if (!user) {
      setMyRooms([]);
      setLoadingRooms(false);
      return;
    }
    setLoadingRooms(true);
    try {
      const rooms = await getMyRooms(user.id);
      setMyRooms(rooms);
    } catch (e) {
      console.error(e);
      setMyRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCreate = async () => {
    setCreatingError("");
    if (!user) {
      navigate("/login?goto=/salas");
      return;
    }
    setCreating(true);
    try {
      const { room } = await createRoom(user.id, name);
      setMyRooms((prev) => [room, ...prev]);
      navigate(`/salas/${room.id}`);
    } catch (e) {
      console.error(e);
      setCreatingError(String((e as Error)?.message ?? e) || "No se pudo crear la sala. Intentá de nuevo.");
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (roomId: string) => {
    setSavingName(true);
    try {
      await renameRoom(roomId, draftName);
      setEditingId(null);
      await reload();
    } catch (e) {
      console.error(e);
      alert("No se pudo renombrar: " + String((e as Error)?.message ?? e));
    } finally {
      setSavingName(false);
    }
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`¿Eliminar "${room.name}"? Se borrará para siempre y expulsará a todos los que estén adentro.`)) return;
    setDeletingId(room.id);
    try {
      await deleteRoom(room.id);
      setMyRooms((prev) => prev.filter((r) => r.id !== room.id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar: " + String((e as Error)?.message ?? e));
    } finally {
      setDeletingId(null);
    }
  };

  const copyLink = async (room: Room) => {
    await navigator.clipboard.writeText(roomInviteLink(room));
    setCopiedId(room.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleJoin = async () => {
    setJoinError("");
    if (!user) {
      navigate("/login?goto=/salas");
      return;
    }
    const code = joinCode.trim();
    if (!code) {
      setJoinError("Ingresá un código o enlace de invitación.");
      return;
    }
    setJoining(true);
    try {
      const payload: { room_id?: string; invite_code?: string } = {};
      try {
        const u = new URL(code);
        const parts = u.pathname.split("/").filter(Boolean);
        const salasIdx = parts.indexOf("salas");
        if (salasIdx >= 0 && parts[salasIdx + 1]) {
          payload.room_id = parts[salasIdx + 1];
        } else {
          throw new Error("no route");
        }
      } catch {
        payload.invite_code = code;
      }
      const tokenResp: RoomTokenResponse = await joinRoom(user.id, payload);
      navigate(`/salas/${tokenResp.room.id}`);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("invitación inválido") || msg.includes("Sala no encontrada")) {
        setJoinError("Código de invitación inválido.");
      } else if (msg.includes("finalizó")) {
        setJoinError("Esta sala finalizó.");
      } else if (msg.includes("llena")) {
        setJoinError("La sala está llena.");
      } else if (msg.includes("autorizado") || msg.includes("No autorizado") || msg.includes("401")) {
        navigate("/login?goto=/salas");
        return;
      } else if (msg.includes("expulsar") || msg.includes("No podés")) {
        setJoinError("No podés unirte a esta sala.");
      } else {
        setJoinError(msg || "No se pudo unir a la sala.");
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 45%, transparent)" }}
          >
            <MonitorPlay className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              Salas
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Salas permanentes para ver y compartir con quien quieras.
            </p>
          </div>
        </div>

        {!user && (
          <div className="rounded-3xl border p-6 mb-6" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <Link to="/login?goto=/salas" className="font-bold underline" style={{ color: "var(--accent-light)" }}>
                Iniciá sesión
              </Link>{" "}
              para crear tus salas o unirte a una.
            </p>
          </div>
        )}

        {/* === Mis salas === */}
        <div className="rounded-3xl border p-5 md:p-6 space-y-4 mb-6"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>Mis salas</h2>
            {loadingRooms && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-secondary)" }} />}
          </div>

          {myRooms.length === 0 && !loadingRooms && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Todavía no tenés salas. Creá una y compartí su enlace: queda abierta siempre.
            </p>
          )}

          <div className="space-y-3">
            {myRooms.map((room) => {
              const isEditing = editingId === room.id;
              return (
                <div
                  key={room.id}
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderColor: `color-mix(in srgb, ${room.color} 45%, transparent)`,
                    boxShadow: `0 0 0 1px color-mix(in srgb, ${room.color} 12%, transparent)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `color-mix(in srgb, ${room.color} 22%, transparent)` }}
                      >
                        <MonitorPlay className="w-4.5 h-4.5" style={{ color: room.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              value={draftName}
                              onChange={(e) => setDraftName(e.target.value.slice(0, 60))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void handleRename(room.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              className="flex-1 !rounded-lg !text-sm !px-2.5 !py-1.5"
                              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
                            />
                            <button
                              onClick={() => void handleRename(room.id)}
                              disabled={savingName}
                              className="p-1.5 rounded-lg hover:bg-white/5"
                              style={{ color: "var(--accent-light)" }}
                              title="Guardar nombre"
                            >
                              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "var(--text-secondary)" }} title="Cancelar">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-extrabold truncate" style={{ color: "var(--text-primary)" }}>
                              {room.name}
                            </span>
                            <button
                              onClick={() => { setEditingId(room.id); setDraftName(room.name); }}
                              className="p-1 rounded hover:bg-white/5 shrink-0"
                              style={{ color: "var(--text-secondary)" }}
                              title="Renombrar sala"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          Código: <span className="font-bold tracking-wide" style={{ color: room.color }}>{room.invite_code}</span> · Abierta para siempre
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/salas/${room.id}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                      style={{ background: `color-mix(in srgb, ${room.color} 22%, transparent)`, color: room.color, border: `1px solid color-mix(in srgb, ${room.color} 45%, transparent)` }}
                    >
                      Entrar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => void copyLink(room)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}
                    >
                      {copiedId === room.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === room.id ? "Enlace copiado" : "Copiar enlace"}
                    </button>
                    <button
                      onClick={() => void handleDelete(room)}
                      disabled={deletingId === room.id}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
                      style={{ backgroundColor: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.35)" }}
                    >
                      {deletingId === room.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* === Crear sala === */}
        <div className="rounded-3xl border p-5 md:p-6 space-y-4 mb-6"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>Crear una sala</h2>
            <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>Máximo 8 participantes</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
              placeholder="Nombre de la sala (ej: Cine nocturno)…"
              disabled={creating || !user}
              className="flex-1 !rounded-xl !text-sm !px-3.5 !py-2.5"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
            />
            <button
              onClick={() => void handleCreate()}
              disabled={creating || !user}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{
                background: "var(--gradient-accent)",
                color: "#fff",
                boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 35%, transparent)",
              }}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? "Creando…" : "Crear sala"}
            </button>
          </div>

          {creatingError && (
            <div className="flex items-start gap-2 text-xs" style={{ color: "#f87171" }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{creatingError}</span>
            </div>
          )}

          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Tu sala queda abierta siempre con el mismo enlace. Solo desaparece si la eliminás.
          </p>
        </div>

        {/* === Unirse a una sala === */}
        <div className="rounded-3xl border p-5 md:p-6 space-y-4"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>Unirse a una sala</h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Pegá el código o el enlace que te compartieron.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.slice(0, 128))}
              onKeyDown={(e) => { if (e.key === "Enter") void handleJoin(); }}
              placeholder="Código o enlace de invitación…"
              className="flex-1 !rounded-xl !text-sm !px-3.5 !py-2.5"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
            />
            <button
              onClick={() => void handleJoin()}
              disabled={joining || !joinCode.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ backgroundColor: "var(--surface-2)", color: "var(--accent-light)", border: "1.5px solid var(--border)" }}
            >
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Unirme
            </button>
          </div>

          {joinError && (
            <div className="flex items-start gap-2 text-xs" style={{ color: "#f87171" }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{joinError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
