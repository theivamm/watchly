import "@/styles/cinema.css";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-white">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <form onSubmit={handleSubmit} className="liquid-glass relative w-full max-w-md rounded-[2.5rem] p-7 md:p-9 space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="font-cinema text-4xl leading-none">{title}</h2>
          <button type="button" onClick={onClose} className="liquid-glass-sm w-10 h-10 rounded-full flex items-center justify-center" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block">
          <span className="block text-xs font-extrabold mb-2 uppercase tracking-widest text-white/70">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi lista de terror..." required className="glass-input" />
        </label>

        <label className="block">
          <span className="block text-xs font-extrabold mb-2 uppercase tracking-widest text-white/70">Descripción (opcional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Las mejores películas del género..." rows={3} className="glass-input" />
        </label>

        <button type="button" onClick={() => setIsPublic((v) => !v)} data-active={isPublic} className="frost-tab w-full justify-center !h-12">
          {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {isPublic ? "Pública (cualquiera puede verla)" : "Privada (solo vos)"}
        </button>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving || !name.trim()}
            className="flex-1 h-12 rounded-full bg-white text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.02] disabled:opacity-50">
            {saving ? "Guardando..." : submitLabel}
          </button>
          <button type="button" onClick={onClose} className="frost-tab !h-12 !px-6">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
