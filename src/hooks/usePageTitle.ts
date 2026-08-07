import { useEffect } from "react";

const ATTENTION_MESSAGE = "¡Volvé a Watchly!";
const RETURN_MESSAGE = "¡Volviste!";

let currentTitle = "Watchly — Tu biblioteca de películas y series";
let returnTimer: number | undefined;

function setMeta(name: string, property: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${property}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(property, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function applyMeta(title: string, description?: string) {
  currentTitle = title;
  if (!document.hidden) document.title = title;

  if (description) {
    setMeta("description", "name", description);
    setMeta("og:description", "property", description);
  }
}

function handleVisibility() {
  if (document.hidden) {
    if (returnTimer !== undefined) {
      clearTimeout(returnTimer);
      returnTimer = undefined;
    }
    document.title = ATTENTION_MESSAGE;
  } else {
    document.title = RETURN_MESSAGE;
    returnTimer = window.setTimeout(() => {
      if (!document.hidden) document.title = currentTitle;
      returnTimer = undefined;
    }, 1500);
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", handleVisibility);
}

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    applyMeta(title, description);
  }, [title, description]);
}
