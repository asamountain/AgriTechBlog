import { useState, useEffect, useRef } from "react";

const CACHE_KEY_PREFIX = "translated_";
const MAX_CHUNK = 4500; // Google Translate free endpoint character limit per request

/**
 * Split text into chunks at paragraph boundaries, respecting the max length.
 */
function chunkText(text: string, max: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if (current.length + p.length + 2 > max && current) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(text: string, from: string, to: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translation failed");
  const data = await res.json();
  // Response format: [[["translated text", "source text", ...], ...], ...]
  return (data[0] as any[]).map((seg: any) => seg[0]).join("");
}

/**
 * Translate markdown content while preserving structure.
 * Caches results in localStorage keyed by post slug + target language.
 */
export function useTranslation(
  content: string | undefined,
  slug: string | undefined,
  targetLang: "ko" | "en"
) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const abortRef = useRef(false);

  // Posts are written in English — only translate when target is Korean
  const needsTranslation = targetLang === "ko" && !!content;

  useEffect(() => {
    if (!needsTranslation || !content || !slug) {
      setTranslated(null);
      return;
    }

    abortRef.current = false;

    // Check localStorage cache first
    const cacheKey = `${CACHE_KEY_PREFIX}${slug}_${targetLang}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { source, result } = JSON.parse(cached);
        // Validate cache: only use if source content hash matches
        if (source === content.slice(0, 200)) {
          setTranslated(result);
          return;
        }
      }
    } catch {}

    // Translate
    setIsTranslating(true);
    const chunks = chunkText(content, MAX_CHUNK);

    Promise.all(chunks.map((chunk) => translateChunk(chunk, "en", "ko")))
      .then((results) => {
        if (abortRef.current) return;
        const full = results.join("\n\n");
        setTranslated(full);
        // Cache the result
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ source: content.slice(0, 200), result: full })
          );
        } catch {}
      })
      .catch((err) => {
        console.warn("Translation failed, falling back to original:", err);
        if (!abortRef.current) setTranslated(null);
      })
      .finally(() => {
        if (!abortRef.current) setIsTranslating(false);
      });

    return () => {
      abortRef.current = true;
    };
  }, [content, slug, targetLang, needsTranslation]);

  return {
    content: needsTranslation ? (translated ?? content) : content,
    isTranslating: needsTranslation && isTranslating,
  };
}

/**
 * Translate a single short string (title, excerpt).
 * Returns original while translating.
 */
export function useTranslateText(
  text: string | undefined,
  targetLang: "ko" | "en"
) {
  const [translated, setTranslated] = useState<string | null>(null);

  useEffect(() => {
    if (targetLang !== "ko" || !text) {
      setTranslated(null);
      return;
    }

    let cancelled = false;
    translateChunk(text, "en", "ko")
      .then((result) => {
        if (!cancelled) setTranslated(result);
      })
      .catch(() => {
        if (!cancelled) setTranslated(null);
      });

    return () => { cancelled = true; };
  }, [text, targetLang]);

  return targetLang === "ko" ? (translated ?? text) : text;
}
