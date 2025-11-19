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

    it("returns PNG when format=png", async () => {
        const { GET } = await import("@/app/api/sign/route");

        const req = new Request(
            "http://localhost/api/sign?text=PngTest&format=png",
        );
        const res = await GET(req as any);
        const buffer = await res.arrayBuffer();

        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toContain("image/png");
        expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it("handles missing text with theme and format=json", async () => {
        const { GET } = await import("@/app/api/sign/route");

        const req = new Request(
            "http://localhost/api/sign?theme=pepsi&format=json",
        );
        const res = await GET(req as any);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(Array.isArray(json.paths)).toBe(true);
        expect(json.paths.length).toBeGreaterThan(0);
        expect(json.viewBox).toBeDefined();
    });

    it("handles very long text inputs", async () => {
        const { GET } = await import("@/app/api/sign/route");

        const longText = "Signature-" + "X".repeat(500);
        const req = new Request(
            `http://localhost/api/sign?text=${
                encodeURIComponent(longText)
            }&format=json`,
        );
        const res = await GET(req as any);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(Array.isArray(json.paths)).toBe(true);
        expect(json.paths.length).toBeGreaterThan(0);
        expect(json.viewBox.w).toBeGreaterThan(0);
        expect(json.viewBox.h).toBeGreaterThan(0);
    });

    it("returns JSON correctly for pepsi/ink/jade/rainbow themes", async () => {
        const { GET } = await import("@/app/api/sign/route");

        const themes = ["pepsi", "ink", "jade", "rainbow"] as const;

        for (const theme of themes) {
            const req = new Request(
                `http://localhost/api/sign?text=ThemeTest&theme=${theme}&format=json`,
            );
            const res = await GET(req as any);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(Array.isArray(json.paths)).toBe(true);
            expect(json.paths.length).toBeGreaterThan(0);
            expect(json.viewBox).toBeDefined();
        }
    });
});
