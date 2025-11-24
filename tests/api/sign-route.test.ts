import { beforeAll, describe, expect, it, vi } from "vitest";
import { buildStateFromQuery } from "@/lib/state-from-query";

// Mock Hanzi data utilities so /api/sign can be tested without network.
vi.mock("@/lib/hanzi-data", () => {
    return {
        fetchHanziData: vi.fn(async () => ({
            // Minimal stroke list; actual geometry is not important here.
            strokes: ["M0 0 L10 0", "M0 0 L0 10"],
        })),
        isChinese: (ch: string) => /[\u4e00-\u9fff]/u.test(ch),
        mergeHanziStrokes: (strokes: string[]) => strokes.join(" "),
    };
});

// Simple fake font implementation reused across tests
const fakeFont = {
    unitsPerEm: 1000,
    stringToGlyphs(text: string) {
        return Array.from(text).map(() => ({
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

    it(
        "returns GIF when format=gif",
        async () => {
            const { GET } = await import("@/app/api/sign/route");

            const req = new Request(
                "http://localhost/api/sign?text=GifTest&format=gif",
            );
            const res = await GET(req as any);
            const buffer = await res.arrayBuffer();

            expect(res.status).toBe(200);
            expect(res.headers.get("Content-Type")).toContain("image/gif");
            expect(buffer.byteLength).toBeGreaterThan(0);
        },
        10000,
    ); // 10-second timeout

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

    it("uses Hanzi stroke data when useHanziData=1 and text is Chinese", async () => {
        const { GET } = await import("@/app/api/sign/route");

        const req = new Request(
            "http://localhost/api/sign?text=汉&useHanziData=1&format=json",
        );
        const res = await GET(req as any);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(Array.isArray(json.paths)).toBe(true);
        // Each Hanzi stroke becomes its own path with isHanzi flag
        expect(json.paths.length).toBeGreaterThan(1);
        expect(json.paths.every((p: any) => p.isHanzi === true)).toBe(true);
        expect(json.viewBox).toBeDefined();
    });

    it("respects bg=transparent and omits background rect in SVG", async () => {
        const { GET } = await import("@/app/api/sign/route");

        const req = new Request(
            "http://localhost/api/sign?text=NoBg&bg=transparent",
        );
        const res = await GET(req as any);
        const body = await res.text();

        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toContain("image/svg+xml");
        expect(body).toContain("<svg");
        // No background <rect> is rendered when bgTransparent is true
        expect(body).not.toContain("<rect");
    });

    it("supports short keys fmt=svg and st=1 for static SVG", async () => {
        const { GET } = await import("@/app/api/sign/route");

        const req = new Request(
            "http://localhost/api/sign?text=StaticShort&fmt=svg&st=1",
        );
        const res = await GET(req as any);
        const body = await res.text();

        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toContain("image/svg+xml");
        expect(body).toContain("<svg");
        // Static SVG should not contain SMIL <animate> tags
        expect(body).not.toContain("<animate");
    });

    it("initializes pepsi theme as multi fill and stroke with black/white pattern", async () => {
        const params = new URLSearchParams("text=Signature&theme=pepsi");
        const state = buildStateFromQuery(params);

        expect(state.fillMode).toBe("multi");
        expect(state.strokeMode).toBe("multi");

        expect(state.charColors.length).toBe(state.text.length);
        expect(state.strokeCharColors.length).toBe(state.text.length);

        const first4 = state.text.length >= 4 ? 4 : state.text.length;

        expect(state.charColors.slice(0, first4).every((c) => c === "#000000"))
            .toBe(true);
        expect(
            state.strokeCharColors.slice(0, first4).every((c) =>
                c === "#000000"
            ),
        )
            .toBe(true);

        expect(state.charColors.slice(first4).every((c) => c === "#ffffff"))
            .toBe(
                true,
            );
        expect(
            state.strokeCharColors.slice(first4).every((c) => c === "#ffffff"),
        ).toBe(true);
    });
});
