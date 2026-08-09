import { useEffect, useMemo, useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import type { UserAvatar } from "@/types";
import { avatarDataUri } from "@/lib/avatars";
import { getAvatars } from "@/services/avatar";
import { updateProfile } from "@/services/profile";

export interface AvatarPickerProps {
  userId: string;
  currentId: number | null | undefined;
  onChange: (id: number | null) => void;
}

export default function AvatarPicker({ userId, currentId, onChange }: AvatarPickerProps) {
  const [avatars, setAvatars] = useState<UserAvatar[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAvatars()
      .then((list) => {
        if (!cancelled) setAvatars(list);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar los avatares.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const previews = useMemo(
    () =>
      (avatars ?? []).map((a) => ({
        ...a,
        src: a.image_url || avatarDataUri(a.seed),
      })),
    [avatars]
  );

  const handleSelect = async (id: number) => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await updateProfile(userId, { avatar_id: id });
      onChange(id);
    } catch {
      setError("No se pudo guardar el avatar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Cargando avatares…</p>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-11 h-11 rounded-full animate-pulse" style={{ backgroundColor: "var(--surface-2)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#f87171" }} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
        24 avatares para elegir. No podés subir imágenes ni ingresar URLs.
      </p>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))" }}
      >
        {previews.map((a) => {
          const selected = a.id === currentId;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => handleSelect(a.id)}
              disabled={saving}
              aria-label={`Usar avatar ${a.name}`}
              aria-pressed={selected}
              className="group relative rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)] focus:ring-offset-2 focus:ring-offset-[#0b0b14]"
              style={{ width: 48, height: 48 }}
            >
              <img
                src={a.src}
                alt={a.name}
                className="rounded-full object-cover"
                style={{
                  width: 44,
                  height: 44,
                  border: selected ? "2px solid var(--accent)" : "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
                  boxShadow: selected ? "0 0 12px color-mix(in srgb, var(--accent) 50%, transparent)" : undefined,
                }}
              />
              {selected && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "var(--gradient-accent)" }}>
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}
