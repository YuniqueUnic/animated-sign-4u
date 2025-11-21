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
    { params }: { params: { text: string } },
): Promise<Response> {
    try {
        const url = new URL(req.url);
        const search = new URLSearchParams(url.search);

        const raw = params.text || "";
        let decodedText = raw;
        try {
            decodedText = decodeURIComponent(raw);
        } catch {
            // fall back to raw text if decoding fails
        }

        if (decodedText) {
            // Path text always wins over any existing `text` query param
            search.set("text", decodedText);
        }

        const nextUrl = new URL(url.origin);
        nextUrl.pathname = "/";
        nextUrl.search = search.toString();

        return NextResponse.redirect(nextUrl.toString(), 308);
    } catch (error) {
        console.error("Error in /[text] redirect route", error);
        return new Response("Failed to process short URL", { status: 500 });
    }
}
