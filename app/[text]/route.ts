import { NextRequest } from "next/server";
import { buildStateFromQuery, buildPaths, loadFont } from "../api/sign/route";
import { generateSVG } from "@/lib/svg-generator";
import sharp from "sharp";

/**
 * Root-level dynamic route handler for /{text}
 * Allows text to be passed as a URL path parameter at the root level.
 * 
 * Example:
 *   http://domain.com/Signature?font=great-vibes&fontSize=120
 * is equivalent to:
 *   http://domain.com/api/sign?text=Signature&font=great-vibes&fontSize=120
 * 
 * This provides a cleaner, shorter URL format for signature generation.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { text: string } },
): Promise<Response> {
    try {
        const url = new URL(req.url);
        const searchParams = url.searchParams;

        // Decode the text from the path parameter
        const textFromPath = decodeURIComponent(params.text);

        // Merge path parameter with query parameters
        // Path parameter takes precedence over query parameter if both exist
        const mergedParams = new URLSearchParams(searchParams);
        mergedParams.set("text", textFromPath);

        const state = buildStateFromQuery(mergedParams);
        const font = await loadFont(state.font);
        const { paths, viewBox } = await buildPaths(font, state);

        if (paths.length === 0) {
            return new Response("No paths generated", { status: 400 });
        }

        const format = searchParams.get("format") || "svg";

        if (format === "json") {
            const body = JSON.stringify({ paths, viewBox });
            return new Response(body, {
                status: 200,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Cache-Control": "s-maxage=86400, immutable",
                },
            });
        }

        if (format === "gif") {
            const staticSvg = generateSVG(state, paths, viewBox, {
                staticRender: true,
            });
            const gifBuffer = await sharp(Buffer.from(staticSvg)).gif()
                .toBuffer();
            const gifArray = new Uint8Array(gifBuffer);

            return new Response(gifArray, {
                status: 200,
                headers: {
                    "Content-Type": "image/gif",
                    "Cache-Control": "s-maxage=86400, immutable",
                },
            });
        }

        if (format === "png") {
            const staticSvg = generateSVG(state, paths, viewBox, {
                staticRender: true,
            });
            const pngBuffer = await sharp(Buffer.from(staticSvg)).png()
                .toBuffer();
            const pngArray = new Uint8Array(pngBuffer);

            return new Response(pngArray, {
                status: 200,
                headers: {
                    "Content-Type": "image/png",
                    "Cache-Control": "s-maxage=86400, immutable",
                },
            });
        }

        const svg = generateSVG(state, paths, viewBox);

        return new Response(svg, {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml; charset=utf-8",
                "Cache-Control": "s-maxage=86400, immutable",
            },
        });
    } catch (error) {
        console.error("Error in /[text] route", error);
        return new Response("Failed to generate signature", { status: 500 });
    }
}
