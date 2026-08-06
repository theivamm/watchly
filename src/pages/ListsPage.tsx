import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { List, Plus, Globe, Lock, Trash2, Pencil, Clapperboard, Tv } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getUserLists, createList, deleteList, updateList, getList } from "@/services/lists";
import { getPosterUrl } from "@/services/tmdb";
import ListFormModal from "@/components/lists/ListFormModal";
import type { List as ListType } from "@/types";

interface ListPreview {
  posters: string[];
  movies: number;
  series: number;
}

export default function ListsPage() {
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
    <div className="w-full px-5 md:px-8 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-2xl md:text-3xl font-extrabold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Listas
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{
            background: "var(--gradient-accent)",
            color: "#fff",
            boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)",
          }}
        >
          <Plus className="w-4 h-4" /> Nueva lista
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-3xl border p-6 md:p-8 space-y-4"
          style={{
            backgroundColor: "var(--surface-1)",
            borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
          }}
        >
          <div>
            <label
              className="block text-xs font-bold mb-2 uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
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
            <label
              className="block text-xs font-bold mb-2 uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Las mejores películas del género..."
              rows={2}
              className="w-full !rounded-xl !text-sm !p-3 resize-none"
              style={{
                backgroundColor: "var(--surface-2)",
                border: "1.5px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublic((v) => !v)}
              className="px-5 py-2.5 rounded-full text-xs font-bold transition-all"
              style={{
                backgroundColor: isPublic ? "var(--accent-soft)" : "var(--surface-2)",
                color: isPublic ? "var(--accent-light)" : "var(--text-secondary)",
                border: `1.5px solid ${isPublic ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {isPublic ? (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Pública
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Privada
                </span>
              )}
            </button>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="px-7 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{
                background: "var(--gradient-accent)",
                color: "#fff",
                boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)",
              }}
            >
              {creating ? "Creando..." : "Crear lista"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
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
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--accent)",
            }}
          />
        </div>
      ) : lists.length === 0 && !showForm ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-3xl border"
          style={{
            backgroundColor: "var(--surface-1)",
            borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: "var(--gradient-accent)",
              boxShadow: "0 0 30px color-mix(in srgb, var(--accent) 35%, transparent)",
            }}
          >
            <List className="w-7 h-7 text-white" />
          </div>
          <p
            className="text-base font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Sin listas
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Creá listas para organizar tus títulos
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
            style={{
              background: "var(--gradient-accent)",
              color: "#fff",
              boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)",
            }}
          >
            <Plus className="w-4 h-4" /> Crear primera lista
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => {
            const preview = previews[list.id];
            const posters = preview?.posters ?? [];
            const total = (preview?.movies ?? 0) + (preview?.series ?? 0);
            return (
              <Link
                key={list.id}
                to={`/listas/${list.id}`}
                className="group relative overflow-hidden rounded-[2rem] border h-56 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: "var(--surface-1)",
                  borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
                  boxShadow: "0 20px 50px -20px rgba(0,0,0,0.6)",
                }}
              >
                {posters.length > 0 ? (
                  <>
                    <div className="absolute inset-0 overflow-hidden">
                      {posters.length === 1 ? (
                        <img
                          src={getPosterUrl(posters[0], "w500")}
                          alt=""
                          aria-hidden="true"
                          className="w-full h-full object-cover blur-sm scale-110 transition-transform duration-700 group-hover:scale-125"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full w-full">
                          {posters.slice(0, 4).map((p, i) => (
                            <img
                              key={i}
                              src={getPosterUrl(p, "w300")}
                              alt=""
                              aria-hidden="true"
                              className="w-full h-full object-cover blur-[3px] scale-110 transition-transform duration-700 group-hover:scale-125"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}
                      <div
                        className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-70"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(11,11,20,0.7) 0%, rgba(11,11,20,0.3) 45%, rgba(11,11,20,0.95) 100%)",
                        }}
                      />
                      <div
                        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px] animate-glow pointer-events-none"
                        style={{ background: "color-mix(in srgb, var(--accent) 30%, transparent)" }}
                      />
                    </div>
                  </>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: "var(--gradient-accent-soft)" }}
                  />
                )}

                <div className="relative z-10 h-full p-5 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md"
                        style={{
                          backgroundColor: "rgba(11,11,20,0.55)",
                          color: list.is_public ? "#4ade80" : "var(--text-secondary)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {list.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {list.is_public ? "Pública" : "Privada"}
                      </span>
                      {total > 0 && (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md"
                          style={{
                            backgroundColor: "rgba(11,11,20,0.55)",
                            color: "var(--accent-light)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {total} {total === 1 ? "título" : "títulos"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEdit(e, list)}
                        title="Editar lista"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10"
                        style={{ color: "var(--accent-light)" }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, list.id)}
                        disabled={deleting === list.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10"
                        style={{ color: "#f87171" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3
                      className="text-lg font-extrabold tracking-tight mb-1 drop-shadow-md"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {list.name}
                    </h3>
                    {list.description && (
                      <p
                        className="text-xs mb-2 line-clamp-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {list.description}
                      </p>
                    )}
                    {(preview?.movies ?? 0) > 0 && (preview?.series ?? 0) > 0 && (
                      <div className="flex items-center gap-3 text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                          <Clapperboard className="w-3 h-3" /> {preview?.movies ?? 0} pelis
                        </span>
                        <span className="inline-flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                          <Tv className="w-3 h-3" /> {preview?.series ?? 0} series
                        </span>
                      </div>
                    )}
                  </div>
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
