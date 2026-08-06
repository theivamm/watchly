import { useState } from "react";
import { Globe, Lock, X } from "lucide-react";

interface Props {
  title: string;
  submitLabel: string;
  initialName?: string;
  initialDescription?: string;
  initialIsPublic?: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, isPublic: boolean) => Promise<void> | void;
}

export default function ListFormModal({
  title,
  submitLabel,
  initialName = "",
  initialDescription = "",
  initialIsPublic = false,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(name.trim(), description.trim(), isPublic);
    } catch (err) {
      console.error("Failed to save list:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl border p-6 md:p-8 space-y-4 animate-slide-up"
        style={{
          backgroundColor: "var(--surface-1)",
          borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-white/5"
            style={{ color: "var(--text-secondary)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Nombre
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mi lista de terror..."
            required
            className="w-full !rounded-xl !text-sm !px-4 !py-3"
            style={{
              backgroundColor: "var(--surface-2)",
              border: "1.5px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Descripción (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Las mejores películas del género..."
            rows={3}
            className="w-full !rounded-xl !text-sm !p-3 resize-none"
            style={{
              backgroundColor: "var(--surface-2)",
              border: "1.5px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsPublic((v) => !v)}
          className="w-full px-5 py-3 rounded-full text-xs font-bold transition-all"
          style={{
            backgroundColor: isPublic ? "var(--accent-soft)" : "var(--surface-2)",
            color: isPublic ? "var(--accent-light)" : "var(--text-secondary)",
            border: `1.5px solid ${isPublic ? "var(--accent)" : "var(--border)"}`,
          }}
        >
          {isPublic ? (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Pública (cualquiera puede verla)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Privada (solo vos)
            </span>
          )}
        </button>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex-1 px-7 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{
              background: "var(--gradient-accent)",
              color: "#fff",
              boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)",
            }}
          >
            {saving ? "Guardando..." : submitLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-full text-sm font-bold transition-all"
            style={{
              backgroundColor: "var(--surface-2)",
              color: "var(--text-primary)",
              border: "1.5px solid var(--border)",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
