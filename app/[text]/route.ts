import { NextRequest, NextResponse } from "next/server";

/**
 * Root-level dynamic route handler for /{text}
 *
 * Behavior:
 * - Treats short URLs like `/Signature` or `/Signature?font=...` as
 *   **share links** for the builder UI.
 * - Redirects them to the main builder page `/` with a canonical
 *   query string where the path segment becomes `text` and any
 *   existing query parameters are preserved.
 *
 * This keeps `/api/sign` as the primary HTTP API endpoint while
 * letting human-friendly paths act as shareable links for the UI.
 */
export async function GET(
  req: NextRequest,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const search = new URLSearchParams(url.search);

    // Derive the path segment directly from the request URL so we do not
    // rely on Next.js dynamic params being synchronous.
    const pathname = url.pathname || "/";
    const raw = pathname.startsWith("/") ? pathname.slice(1) : pathname;

    // Support a common copy/paste case where users may accidentally use the
    // full-width question mark `？` inside the path, e.g.
    //   /你好世界？font=ma-shan-zheng
    // In this case, treat the part before `？` as the text and the part
    // after `？` as an inline query string that should be merged into the
    // final search params.
    const fullWidthQIndex = raw.indexOf("？");
    const inlineQuery = fullWidthQIndex !== -1
      ? raw.slice(fullWidthQIndex + 1)
      : "";
    const rawTextSegment = fullWidthQIndex !== -1
      ? raw.slice(0, fullWidthQIndex)
      : raw;

    let decodedText = rawTextSegment;
    try {
      decodedText = decodeURIComponent(rawTextSegment);
    } catch {
      // fall back to raw text if decoding fails
    }

    if (decodedText) {
      // Path text always wins over any existing `text` query param
      search.set("text", decodedText);
    }

    // If the text value itself still contains a full-width question mark,
    // split it into real text and an inline query string.
    const currentText = search.get("text");
    if (currentText && currentText.includes("？")) {
      const splitIndex = currentText.indexOf("？");
      const textPart = currentText.slice(0, splitIndex);
      const inlineFromText = currentText.slice(splitIndex + 1);

      search.set("text", textPart);

      if (inlineFromText) {
        const textInlineParams = new URLSearchParams(inlineFromText);
        textInlineParams.forEach((value, key) => {
          if (!search.has(key)) {
            search.set(key, value);
          }
        });
      }
    }

    // Merge inline query parameters (after a full-width `？`) into the
    // effective search params, without clobbering any explicitly provided
    // query parameters in the original URL.
    if (inlineQuery) {
      const inlineParams = new URLSearchParams(inlineQuery);
      inlineParams.forEach((value, key) => {
        if (!search.has(key)) {
          search.set(key, value);
        }
      });
    }

    const nextUrl = new URL(url.origin);
    const ui = search.get("ui") ?? search.get("u");
    nextUrl.pathname = ui === "editor" ? "/editor" : "/";
    nextUrl.search = search.toString();

    return NextResponse.redirect(nextUrl.toString(), 308);
  } catch (error) {
    console.error("Error in /[text] redirect route", error);
    return new Response("Failed to process short URL", { status: 500 });
  }
}
