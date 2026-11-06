// Turns Elementor/WooCommerce description HTML into small, safe, semantic HTML.
import sanitizeHtml from "sanitize-html";

const DROP_SECTION =
  /care instruction|our commitment|baxım|qulluq|öhdəlik|уход|обязательств|наша миссия/i;

export function cleanDescription(html: string): string {
  const withoutMedia = (html || "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    .replace(/<img[^>]*>/gi, "");
  // Split into sections at each heading, drop boilerplate sections, merge duplicate headings.
  const parts = withoutMedia.split(/(?=<h[1-6][^>]*>)/i);
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const part of parts) {
    const m = part.match(/^<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const heading = m
      ? sanitizeHtml(m[1], { allowedTags: [] }).replace(/\s+/g, " ").trim()
      : "";
    if (heading && DROP_SECTION.test(heading)) continue;
    if (heading && seen.has(heading.toLowerCase())) {
      kept.push(part.slice(m![0].length));
      continue;
    }
    if (heading) seen.add(heading.toLowerCase());
    kept.push(m ? `<h3>${heading}</h3>` + part.slice(m[0].length) : part);
  }
  const clean = sanitizeHtml(kept.join(""), {
    allowedTags: ["p", "ul", "ol", "li", "strong", "em", "h3", "br"],
    allowedAttributes: {},
    exclusiveFilter: (frame) =>
      ["p", "li", "h3"].includes(frame.tag) && !frame.text.trim(),
  });
  return clean
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .replace(/(<br \/>)+<\/p>/g, "</p>")
    .trim();
}

export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [] }).replace(/\s+/g, " ").trim();
}

/** First n sentences of a text (used for summaries and meta descriptions). */
export function firstSentences(text: string, n = 2, max = 300): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  let out = sentences.slice(0, n).map((x) => x.trim()).join(" ");
  if (out.length > max)
    out = out.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
  return out;
}
