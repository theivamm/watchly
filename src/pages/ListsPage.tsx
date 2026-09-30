import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { List, Plus, Globe, Lock, Trash2, Pencil, Clapperboard, Tv } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getUserLists, createList, deleteList, updateList, getList } from "@/services/lists";
import { getPosterUrl } from "@/services/tmdb";
import ListFormModal from "@/components/lists/ListFormModal";
import PageHeader from "@/components/ui/PageHeader";
import type { List as ListType } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

interface ListPreview {
  posters: string[];
  movies: number;
  series: number;
}

const whiteBtn =
  "inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-[#111] hover:text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03] disabled:opacity-50";

export default function ListsPage() {
  usePageTitle("Mis listas | Watchly");
  const { user } = useAuth();
  const [lists, setLists] = useState<ListType[]>([]);
  const [previews, setPreviews] = useState<Record<string, ListPreview>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<ListType | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserLists(user.id)
      .then(setLists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (lists.length === 0) {
      setPreviews({});
      return;
    }
    let cancelled = false;
    const fetchPreviews = async () => {
      const data: Record<string, ListPreview> = {};
      await Promise.all(
        lists.map(async (list) => {
          try {
            const { items } = await getList(list.id);
            const withPoster = items.filter((i) => i.poster_path);
            data[list.id] = {
              posters: withPoster.slice(0, 4).map((i) => i.poster_path as string),
              movies: items.filter((i) => i.media_type === "movie").length,
              series: items.filter((i) => i.media_type === "tv").length,
            };
          } catch {
            data[list.id] = { posters: [], movies: 0, series: 0 };
          }
        })
      );
      if (!cancelled) setPreviews(data);
    };
    fetchPreviews();
    return () => {
      cancelled = true;
    };
  }, [lists]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setCreating(true);
    try {
      const list = await createList(user.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      setLists((prev) => [list, ...prev]);
      setName("");
      setDescription("");
      setIsPublic(false);
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create list:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, listId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Eliminar esta lista?")) return;
    setDeleting(listId);
    try {
      await deleteList(listId);
      setLists((prev) => prev.filter((l) => l.id !== listId));
    } catch (err) {
      console.error("Failed to delete list:", err);
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (e: React.MouseEvent, list: ListType) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing(list);
  };

  const handleUpdate = async (name: string, description: string, isPublic: boolean) => {
    if (!editing) return;
    const updated = await updateList(editing.id, { name, description, is_public: isPublic });
    setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setEditing(null);
  };

  return (
    <div className="w-full px-5 md:px-10 py-8 md:py-12 text-white">
      <PageHeader
        title="Listas"
        eyebrow="Tus colecciones"
        subtitle={!loading ? `${lists.length} ${lists.length === 1 ? "lista" : "listas"}` : undefined}
        actions={
          <button onClick={() => setShowForm((v) => !v)} className={whiteBtn}>
            <Plus className="w-4 h-4" /> Nueva lista
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleCreate} className="liquid-glass mb-10 rounded-[2.5rem] p-7 md:p-9 space-y-5 max-w-3xl">
          <label className="block">
            <span className="block text-xs font-extrabold mb-2 uppercase tracking-widest text-white/70">Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi lista de terror..." required className="glass-input" />
          </label>
          <label className="block">
            <span className="block text-xs font-extrabold mb-2 uppercase tracking-widest text-white/70">Descripción (opcional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Las mejores películas del género..." rows={2} className="glass-input" />
          </label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsPublic((v) => !v)} data-active={isPublic} className="frost-tab">
              {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isPublic ? "Pública" : "Privada"}
            </button>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={creating || !name.trim()} className={whiteBtn}>
              {creating ? "Creando..." : "Crear lista"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="frost-tab !h-12 !px-6">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      ) : lists.length === 0 && !showForm ? (
        <div className="frost-card flex flex-col items-center justify-center py-24 rounded-[2.5rem]">
          <div className="liquid-glass-sm w-16 h-16 rounded-full flex items-center justify-center mb-5">
            <List className="w-7 h-7" />
          </div>
          <p className="font-cinema text-3xl mb-1">Sin listas</p>
          <p className="text-sm mb-6 text-white/70">Creá listas para organizar tus títulos</p>
          <button onClick={() => setShowForm(true)} className={whiteBtn}>
            <Plus className="w-4 h-4" /> Crear primera lista
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {lists.map((list) => {
            const preview = previews[list.id];
            const posters = preview?.posters ?? [];
            const total = (preview?.movies ?? 0) + (preview?.series ?? 0);
            return (
              <Link
                key={list.id}
                to={`/listas/${list.id}`}
                className="group relative overflow-hidden rounded-[2.25rem] h-80 border border-white/18 shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)] transition-transform duration-500 hover:-translate-y-2 text-white hover:text-white"
                style={{ background: "linear-gradient(160deg, rgba(139,92,246,.35), rgba(20,20,32,.9))" }}
              >
                {posters.length > 0 && (
                  <div className="absolute inset-0 grid h-full w-full" style={{ gridTemplateColumns: `repeat(${posters.length}, 1fr)` }}>
                    {posters.map((p, i) => (
                      <img key={i} src={getPosterUrl(p, "w342")} alt="" aria-hidden="true" loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ))}
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,7,13,.35) 0%, transparent 35%, rgba(7,7,13,.55) 100%)" }} />

                <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="liquid-glass-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold">
                      {list.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {list.is_public ? "Pública" : "Privada"}
                    </span>
                    {total > 0 && (
                      <span className="liquid-glass-sm px-3 py-1.5 rounded-full text-[11px] font-extrabold">
                        {total} {total === 1 ? "título" : "títulos"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEdit(e, list)} title="Editar lista"
                      className="liquid-glass-sm w-9 h-9 rounded-full flex items-center justify-center">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDelete(e, list.id)} disabled={deleting === list.id} title="Eliminar lista"
                      className="liquid-glass-sm w-9 h-9 rounded-full flex items-center justify-center" style={{ color: "#fca5a5" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="liquid-glass absolute left-3.5 right-3.5 bottom-3.5 rounded-[1.75rem] px-5 py-4">
                  <h3 className="font-cinema text-3xl leading-none truncate">{list.name}</h3>
                  {list.description && <p className="text-xs mt-2 line-clamp-1 text-white/75">{list.description}</p>}
                  {(preview?.movies ?? 0) > 0 && (preview?.series ?? 0) > 0 && (
                    <div className="flex items-center gap-4 text-[11px] font-bold mt-2 text-white/70">
                      <span className="inline-flex items-center gap-1"><Clapperboard className="w-3 h-3" /> {preview?.movies} pelis</span>
                      <span className="inline-flex items-center gap-1"><Tv className="w-3 h-3" /> {preview?.series} series</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {editing && (
        <ListFormModal
          title="Editar lista"
          submitLabel="Guardar cambios"
          initialName={editing.name}
          initialDescription={editing.description ?? ""}
          initialIsPublic={editing.is_public}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}
