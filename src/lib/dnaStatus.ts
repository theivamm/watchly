import type { DNAStatus } from "@/types";

export interface DNAClassification {
  label: string;
  badgeLabel: string;
  hint: string;
}

export function classifyDna(status: DNAStatus): DNAClassification {
  switch (status) {
    case "locked":
      return { label: "Bloqueado", badgeLabel: "ADN bloqueado", hint: "Seguí agregando títulos" };
    case "early":
      return { label: "Preliminar", badgeLabel: "ADN preliminar", hint: "Resultado en construcción" };
    case "developing":
      return { label: "En desarrollo", badgeLabel: "ADN en desarrollo", hint: "Confianza media" };
    case "solid":
      return { label: "Consistente", badgeLabel: "ADN consolidado", hint: "Confianza alta" };
    case "rich":
      return { label: "Detallado", badgeLabel: "ADN detallado", hint: "Máxima variedad de insights" };
  }
}
