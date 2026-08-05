import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Lock, Trash2, List } from "lucide-react";
import { getList, removeItemFromList, deleteList } from "@/services/lists";
import { getPosterUrl } from "@/services/tmdb";
import type { ListWithItems } from "@/types";

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<ListWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getList(id)
      .then(setList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleRemoveItem = async (itemId: string) => {
    setRemoving(itemId);
    try {
      await removeItemFromList(itemId);
      setList((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) }
          : prev
      );
    } catch (err) {
      console.error("Failed to remove item:", err);
    } finally {
      setRemoving(null);
    }
  };

  const handleDeleteList = async () => {
    if (!id || !confirm("¿Eliminar esta lista?")) return;
    setDeleting(true);
    try {
      await deleteList(id);
      navigate("/listas");
    } catch (err) {
      console.error("Failed to delete list:", err);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-5 md:px-8 py-8 md:py-12 flex justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--accent)",
          }}
        />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="w-full px-5 md:px-8 py-8 md:py-12">
        <p style={{ color: "var(--text-secondary)" }}>Lista no encontrada</p>
      </div>
    );
  }

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12">
      <button
        onClick={() => navigate("/listas")}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] mb-6"
        style={{
          backgroundColor: "var(--surface-2)",
          color: "var(--text-primary)",
          border: "1.5px solid var(--border)",
        }}
      >
        <ArrowLeft className="w-4 h-4" /> Volver a listas
      </button>

      <div className="flex items-start justify-between mb-8">
        <div className="flex-1 min-w-0 mr-4">
          <h1
            className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {list.name}
          </h1>
          {list.description && (
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              {list.description}
            </p>
          )}
          <div className="flex items-center gap-2">
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
            <span
              className="text-xs font-bold"
              style={{ color: "var(--text-secondary)" }}
            >
              {list.items.length} {list.items.length === 1 ? "ítulo" : "ítulos"}
            </span>
          </div>
        </div>
        <button
          onClick={handleDeleteList}
          disabled={deleting}
          className="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{
            backgroundColor: "var(--surface-2)",
            color: "#f87171",
            border: "1.5px solid var(--border)",
          }}
        >
          Eliminar lista
        </button>
      </div>

      {list.items.length === 0 ? (
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
            Lista vacía
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Agregá títulos desde la búsqueda o el detalle de una película
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {list.items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: "var(--surface-1)",
                borderColor: "rgba(139,92,246,0.2)",
              }}
            >
              <div
                className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-[70px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                style={{ background: "var(--gradient-accent)" }}
              />
              <img
                src={getPosterUrl(item.poster_path, "w342")}
                alt={item.title}
                className="w-full object-cover"
                style={{ aspectRatio: "2/3" }}
              />
              <button
                onClick={() => handleRemoveItem(item.id)}
                disabled={removing === item.id}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                style={{
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "#f87171",
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="p-3">
                <p
                  className="text-xs font-bold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.title}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.media_type === "movie" ? "Película" : "Serie"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
