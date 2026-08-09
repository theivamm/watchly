import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { UserAvatar } from "@/types";
import { listAvatars } from "@/lib/avatar-registry";
import { updateProfile } from "@/services/profile";

export interface AvatarPickerProps {
  userId: string;
  currentId: number | null | undefined;
  onChange: (id: number | null) => void;
}

export default function AvatarPicker({ userId, currentId, onChange }: AvatarPickerProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Los 40 avatares vienen del bundle de Vite (imágenes estáticas en
  // src/assets/avatar/). No se hace fetch a la base ni generación on-the-fly.
  const previews = useMemo(() => listAvatars(), []);

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

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
        {previews.length} avatares para elegir. No podés subir imágenes ni ingresar URLs.
      </p>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))" }}
      >
        {previews.map((a: UserAvatar) => {
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
                src={a.image_url as string}
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
