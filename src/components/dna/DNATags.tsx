import { Tags } from "lucide-react";

export default function DNATags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="rounded-3xl border p-6 md:p-8"
      style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <Tags className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Etiquetas de tu biblioteca
        </h2>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {tags.map((tag) => (
          <span key={tag}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
            style={{
              backgroundColor: "var(--accent-soft)",
              color: "var(--accent-light)",
              border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
            }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
