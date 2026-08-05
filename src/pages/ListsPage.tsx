import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { List, Plus, Globe, Lock, Trash2 } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getUserLists, createList, deleteList } from "@/services/lists";
import type { List as ListType } from "@/types";

export default function ListsPage() {
  const { user } = useAuth();
  const [lists, setLists] = useState<ListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserLists(user.id)
      .then(setLists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

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
            boxShadow: "0 4px 18px rgba(139,92,246,0.45)",
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
            borderColor: "rgba(139,92,246,0.2)",
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
                color: isPublic ? "#c4b5fd" : "var(--text-secondary)",
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
                boxShadow: "0 4px 18px rgba(139,92,246,0.45)",
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
            borderColor: "rgba(139,92,246,0.2)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: "var(--gradient-accent)",
              boxShadow: "0 0 30px rgba(139,92,246,0.35)",
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
              boxShadow: "0 4px 18px rgba(139,92,246,0.45)",
            }}
          >
            <Plus className="w-4 h-4" /> Crear primera lista
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Link
              key={list.id}
              to={`/listas/${list.id}`}
              className="group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: "var(--surface-1)",
                borderColor: "rgba(139,92,246,0.2)",
              }}
            >
              <div
                className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-[70px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                style={{ background: "var(--gradient-accent)" }}
              />
              <div className="relative flex items-start justify-between mb-3">
                <h3
                  className="text-base font-extrabold truncate flex-1 mr-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  {list.name}
                </h3>
                <button
                  onClick={(e) => handleDelete(e, list.id)}
                  disabled={deleting === list.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10"
                  style={{ color: "#f87171" }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {list.description && (
                <p
                  className="relative text-xs mb-3 line-clamp-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {list.description}
                </p>
              )}
              <div className="relative flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  style={{
                    backgroundColor: list.is_public
                      ? "rgba(74,222,128,0.1)"
                      : "var(--surface-2)",
                    color: list.is_public ? "#4ade80" : "var(--text-secondary)",
                  }}
                >
                  {list.is_public ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  {list.is_public ? "Pública" : "Privada"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
