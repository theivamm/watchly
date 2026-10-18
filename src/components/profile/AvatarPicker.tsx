
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { UserAvatar } from "@/types";
import { listAvatars } from "@/lib/avatar-registry";
import { updateProfile } from "@/services/profile";

export interface AvatarPickerProps {
  userId: string;
  currentId: number | null | undefined;
  onChange: (id: number | null) => void;
  size?: number;
}

export default function AvatarPicker({ userId, currentId, onChange, size = 84 }: AvatarPickerProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Los avatares vienen del bundle de Vite (imágenes estáticas en src/assets/avatar/).
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
    <div className="space-y-5">
      <p className="text-sm font-bold text-white/70">Pronto vamos a ir sumando más avatares.</p>
      <div className="grid gap-4 md:gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${size + 12}px, 1fr))` }}>
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
              className="group relative mx-auto rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b14] transition-transform duration-300 hover:scale-110 disabled:opacity-60"
              style={{ width: size, height: size, opacity: selected ? 1 : 0.88 }}
            >
              <img
                src={a.image_url as string}
                alt={a.name}
                loading="lazy"
                className="w-full h-full rounded-full object-cover transition-all duration-300"
                style={{
                  border: selected ? "3px solid #fff" : "2px solid rgba(255,255,255,.18)",
                  boxShadow: selected
                    ? "-4px 0 0 rgba(255,80,140,.8), 4px 0 0 rgba(70,170,255,.8), 0 14px 30px -8px rgba(0,0,0,.7)"
                    : "0 10px 22px -10px rgba(0,0,0,.7)",
                }}
              />
              {selected && (
                <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center bg-white text-[#111] shadow-[0_6px_14px_rgba(0,0,0,.5)]">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm font-bold text-red-300">{error}</p>}
    </div>
  );
}
