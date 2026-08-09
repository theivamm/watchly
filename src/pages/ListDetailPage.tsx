import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Lock, List, Pencil } from "lucide-react";
import { getList, deleteList, updateList } from "@/services/lists";
import MediaCard from "@/components/media/MediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import ListFormModal from "@/components/lists/ListFormModal";
import type { ListWithItems, TMDBSearchResult, MediaType } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<ListWithItems | null>(null);
  usePageTitle(list ? `${list.name} | Watchly` : "Lista | Watchly");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<TMDBSearchResult | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getList(id)
      .then(setList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleUpdate = async (name: string, description: string, isPublic: boolean) => {
    if (!list) return;
    const updated = await updateList(list.id, { name, description, is_public: isPublic });
    setList((prev) => (prev ? { ...prev, ...updated } : prev));
    setEditing(false);
  };

  const toSearchResult = (item: ListWithItems["items"][0]): TMDBSearchResult => ({
    tmdbId: item.tmdb_id,
    mediaType: item.media_type as MediaType,
    title: item.title,
    originalTitle: item.title,
    overview: "",
    year: null,
    releaseDate: null,
    posterPath: item.poster_path,
    backdropPath: null,
    genreIds: [],
    tmdbRating: null,
  });

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
              {list.items.length} {list.items.length === 1 ? "título" : "títulos"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: "var(--surface-2)",
              color: "var(--accent-light)",
              border: "1.5px solid var(--border)",
            }}
          >
            <Pencil className="w-3.5 h-3.5" /> Editar lista
          </button>
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
      </div>

      {list.items.length === 0 ? (
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
            Lista vacía
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Agregá títulos desde la búsqueda o el detalle de una película
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {list.items.map((item) => (
            <MediaCard
              key={item.id}
              tmdbId={item.tmdb_id}
              title={item.title}
              posterPath={item.poster_path}
              year={null}
              mediaType={item.media_type as MediaType}
              rating={null}
              tmdbRating={null}
              status={undefined}
              onClick={() => setSelected(toSearchResult(item))}
            />
          ))}
        </div>
      )}

      {selected && (
        <MediaDetailModal
          result={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            if (id) {
              getList(id).then(setList).catch(console.error);
            }
          }}
        />
      )}

      {editing && list && (
        <ListFormModal
          title="Editar lista"
          submitLabel="Guardar cambios"
          initialName={list.name}
          initialDescription={list.description ?? ""}
          initialIsPublic={list.is_public}
          onClose={() => setEditing(false)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}