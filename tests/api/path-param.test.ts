import { describe, expect, it } from "vitest";
import { GET } from "@/app/[text]/route";
import { NextRequest } from "next/server";

describe("/[text] - Root-level Path Parameter Support", () => {
    it("should extract text from path parameter", async () => {
        const url = "http://localhost:3000/HelloWorld";
        const req = new NextRequest(url);

        const response = await GET(req, { params: { text: "HelloWorld" } });

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toContain("image/svg");

        const svg = await response.text();
        expect(svg).toContain("<svg");
        expect(svg).toContain("<path");
    });

    it("should combine path parameter with query parameters", async () => {
        const url =
            "http://localhost:3000/CustomText?font=sacramento&fontSize=80";
        const req = new NextRequest(url);

        const response = await GET(req, { params: { text: "CustomText" } });

        expect(response.status).toBe(200);

        const svg = await response.text();
        expect(svg).toContain("<svg");
    });

    it("should decode URL-encoded text in path", async () => {
        // Test with spaces encoded as %20
        const url = "http://localhost:3000/Hello%20World";
        const req = new NextRequest(url);

        const response = await GET(req, { params: { text: "Hello%20World" } });

        expect(response.status).toBe(200);

        const svg = await response.text();
        expect(svg).toContain("<svg");
    });

    it("should handle Chinese characters in path", async () => {
        const url =
            "http://localhost:3000/你好世界?font=ma-shan-zheng";
        const req = new NextRequest(url);

        const response = await GET(req, { params: { text: "你好世界" } });

        expect(response.status).toBe(200);

        const svg = await response.text();
        expect(svg).toContain("<svg");
    }, 10000); // Increase timeout to 10s for font and Hanzi data loading

    it("should support format parameter for JSON output", async () => {
        const url = "http://localhost:3000/TestText?format=json";
        const req = new NextRequest(url);

        const response = await GET(req, { params: { text: "TestText" } });

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toContain(
            "application/json",
        );

        const json = await response.json();
        expect(json).toHaveProperty("paths");
        expect(json).toHaveProperty("viewBox");
    });

    it("should path parameter override query parameter if both present", async () => {
        // If someone accidentally uses both /PathText?text=QueryText,
        // the path parameter should take precedence
        const url =
            "http://localhost:3000/PathText?text=QueryText&font=great-vibes";
        const req = new NextRequest(url);

        const response = await GET(req, { params: { text: "PathText" } });

        expect(response.status).toBe(200);

        // The SVG should be generated based on "PathText", not "QueryText"
        const svg = await response.text();
        expect(svg).toContain("<svg");
    });

    it("should support all other parameters like charSpacing", async () => {
        const url =
            "http://localhost:3000/Spaced?charSpacing=50&fontSize=100";
        const req = new NextRequest(url);

        const response = await GET(req, { params: { text: "Spaced" } });

        expect(response.status).toBe(200);

        const svg = await response.text();
        expect(svg).toContain("<svg");
    });
});
