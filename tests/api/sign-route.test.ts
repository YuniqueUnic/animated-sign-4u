import { beforeAll, describe, expect, it, vi } from "vitest";

// Simple fake font implementation reused across tests
const fakeFont = {
    unitsPerEm: 1000,
    stringToGlyphs(text: string) {
        return Array.from(text).map((_, index) => ({
            advanceWidth: 500,
            getPath(x: number, y: number, fontSize: number) {
                const left = x;
                const right = x + fontSize / 2;
                const top = y - fontSize / 2;
                const bottom = y + fontSize / 2;
                return {
                    toPathData: () =>
                        `M${left} ${top}L${right} ${top}L${right} ${bottom}L${left} ${bottom}Z`,
                    getBoundingBox: () => ({
                        x1: left,
                        y1: top,
                        x2: right,
                        y2: bottom,
                    }),
                };
            },
        }));
    },
};

beforeAll(() => {
    // Mock global fetch used in loadFont
    vi.stubGlobal("fetch", async () =>
        ({
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(8),
        }) as any);

    // Mock opentype.js default export
    vi.mock("opentype.js", () => ({
        default: {
            parse: () => fakeFont,
        },
    }));
});

describe("GET /api/sign", () => {
    it("returns SVG by default", async () => {
        const { GET } = await import("@/app/api/sign/route");

        const req = new Request(
            "http://localhost/api/sign?text=Test&font=great-vibes",
        );
        const res = await GET(req as any);
        const body = await res.text();

        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toContain("image/svg+xml");
        expect(body).toContain("<svg");
    });

    it("returns JSON when format=json", async () => {
        const { GET } = await import("@/app/api/sign/route");

        const req = new Request(
            "http://localhost/api/sign?text=JsonTest&theme=laser&format=json",
        );
        const res = await GET(req as any);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toContain("application/json");
        expect(Array.isArray(json.paths)).toBe(true);
        expect(json.viewBox).toBeDefined();
        expect(json.viewBox.w).toBeGreaterThan(0);
        expect(json.viewBox.h).toBeGreaterThan(0);
    });

    it("returns 501 for PNG format stub", async () => {
        const { GET } = await import("@/app/api/sign/route");

        const req = new Request(
            "http://localhost/api/sign?text=PngTest&format=png",
        );
        const res = await GET(req as any);
        const text = await res.text();

        expect(res.status).toBe(501);
        expect(text).toContain("PNG format is not implemented yet");
    });
});
