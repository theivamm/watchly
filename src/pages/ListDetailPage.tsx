import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, List, Pencil, Trash2 } from "lucide-react";
import { getList, deleteList, updateList, removeItemFromList } from "@/services/lists";
import MediaCard from "@/components/media/MediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import ListFormModal from "@/components/lists/ListFormModal";
import PageHeader from "@/components/ui/PageHeader";
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
  const [removingId, setRemovingId] = useState<string | null>(null);
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

  const handleRemoveItem = async (itemId: string) => {
    if (!list || !confirm("¿Sacar este título de la lista?")) return;
    setRemovingId(itemId);
    try {
      await removeItemFromList(itemId);
      setList((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev));
    } catch (err) {
      console.error("Failed to remove item:", err);
    } finally {
      setRemovingId(null);
    }
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
      <div className="w-full px-4 md:px-6 pt-20 pb-12 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="w-full px-4 md:px-6 pt-20 pb-12 text-white">
        <p className="text-white/70">Lista no encontrada</p>
      </div>
    );
  }

  const posters = list.items.filter((i) => i.poster_path).slice(0, 14).map((i) => i.poster_path as string);
  const count = list.items.length;

  return (
    <div className="w-full px-4 md:px-6 pt-20 pb-12 text-white">
      <PageHeader
        title={list.name}
        eyebrow={list.is_public ? "Lista pública" : "Lista privada"}
        subtitle={list.description || undefined}
        posters={posters}
        stats={[
          { v: count, l: count === 1 ? "título" : "títulos" },
          { v: list.items.filter((i) => i.media_type === "movie").length, l: "películas" },
          { v: list.items.filter((i) => i.media_type === "tv").length, l: "series" },
        ]}
        actions={
          <>
            <button onClick={() => navigate("/listas")} className="liquid-glass-sm inline-flex items-center gap-2 h-12 px-6 rounded-full text-sm font-bold text-white transition-transform hover:scale-[1.03]"><ArrowLeft className="w-4 h-4" /> Listas</button>
            <button onClick={() => setEditing(true)} className="liquid-glass-sm inline-flex items-center gap-2 h-12 px-6 rounded-full text-sm font-bold text-white transition-transform hover:scale-[1.03]"><Pencil className="w-4 h-4" /> Editar</button>
            <button onClick={handleDeleteList} disabled={deleting} className="liquid-glass-sm inline-flex items-center gap-2 h-12 px-6 rounded-full text-sm font-bold transition-transform hover:scale-[1.03] disabled:opacity-50" style={{ color: "#fca5a5" }}><Trash2 className="w-4 h-4" /> Eliminar</button>
          </>
        }
      />

      {list.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border-t border-white/20 text-center">
          <List className="w-10 h-10 mb-5 text-white/60" />
          <p className="font-cinema text-5xl mb-2">Lista vacía</p>
          <p className="text-sm text-white/70">Agregá títulos desde la búsqueda o el detalle de una película</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
          {list.items.map((item) => (
            <div key={item.id} className="relative group">
              <MediaCard
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
              <button
                onClick={() => handleRemoveItem(item.id)}
                disabled={removingId === item.id}
                title="Sacar de la lista"
                className="liquid-glass-sm absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 disabled:opacity-40"
                style={{ color: "#fca5a5" }}
              >
                {removingId === item.id ? (
                  <div className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <MediaDetailModal
          result={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            if (id) getList(id).then(setList).catch(console.error);
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
