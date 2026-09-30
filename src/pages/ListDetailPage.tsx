import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Lock, List, Pencil, Trash2 } from "lucide-react";
import { getList, deleteList, updateList, removeItemFromList } from "@/services/lists";
import { getPosterUrl } from "@/services/tmdb";
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
      <div className="w-full px-5 md:px-10 py-8 md:py-12 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="w-full px-5 md:px-10 py-8 md:py-12 text-white">
        <p className="text-white/70">Lista no encontrada</p>
      </div>
    );
  }

  const posters = list.items.filter((i) => i.poster_path).slice(0, 5).map((i) => i.poster_path as string);
  const count = list.items.length;

  return (
    <div className="w-full px-5 md:px-10 py-8 md:py-12 text-white">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/18 mb-10 shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)]"
        style={{ background: "linear-gradient(160deg, rgba(139,92,246,.35), rgba(20,20,32,.9))" }}>
        {posters.length > 0 && (
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${posters.length}, 1fr)` }}>
            {posters.map((p, i) => (
              <img key={i} src={getPosterUrl(p, "w342")} alt="" aria-hidden="true" className="w-full h-full object-cover blur-md scale-110" />
            ))}
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(7,7,13,.88) 0%, rgba(7,7,13,.55) 60%, rgba(7,7,13,.75) 100%)" }} />

        <div className="relative p-7 md:p-12">
          <button onClick={() => navigate("/listas")}
            className="liquid-glass-sm inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-bold text-white mb-8 transition-transform hover:scale-[1.03]">
            <ArrowLeft className="w-4 h-4" /> Volver a listas
          </button>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0 max-w-3xl">
              <h1 className="font-cinema text-6xl md:text-8xl leading-[1.02] drop-shadow-[0_10px_50px_rgba(0,0,0,.5)]">{list.name}</h1>
              {list.description && <p className="text-base md:text-lg mt-4 text-white/80 text-pretty">{list.description}</p>}
              <div className="flex items-center gap-2.5 mt-5">
                <span className="liquid-glass-sm inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold">
                  {list.is_public ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {list.is_public ? "Pública" : "Privada"}
                </span>
                <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">
                  {count} {count === 1 ? "título" : "títulos"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={() => setEditing(true)}
                className="liquid-glass-sm inline-flex items-center gap-2 h-12 px-6 rounded-full text-sm font-bold text-white transition-transform hover:scale-[1.03]">
                <Pencil className="w-4 h-4" /> Editar lista
              </button>
              <button onClick={handleDeleteList} disabled={deleting}
                className="liquid-glass-sm h-12 px-6 rounded-full text-sm font-bold transition-transform hover:scale-[1.03] disabled:opacity-50"
                style={{ color: "#fca5a5" }}>
                Eliminar lista
              </button>
            </div>
          </div>
        </div>
      </section>

      {list.items.length === 0 ? (
        <div className="frost-card flex flex-col items-center justify-center py-24 rounded-[2.5rem]">
          <div className="liquid-glass-sm w-16 h-16 rounded-full flex items-center justify-center mb-5">
            <List className="w-7 h-7" />
          </div>
          <p className="font-cinema text-3xl mb-1">Lista vacía</p>
          <p className="text-sm text-white/70">Agregá títulos desde la búsqueda o el detalle de una película</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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
                className="liquid-glass-sm absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 disabled:opacity-40"
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
