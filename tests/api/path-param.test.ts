import { describe, expect, it } from "vitest";
import { GET } from "@/app/[text]/route";
import { NextRequest } from "next/server";

describe("/[text] - Root-level share URL redirect", () => {
  it("should redirect simple text path to builder with text param", async () => {
    const url = "http://localhost:3000/HelloWorld";
    const req = new NextRequest(url);

    const response = await GET(req);

    expect(response.status).toBe(308);
    const location = response.headers.get("Location");
    expect(location).toBe("http://localhost:3000/?text=HelloWorld");
  });

  it("should merge path text with existing query parameters", async () => {
    const url = "http://localhost:3000/CustomText?font=sacramento&fontSize=80";
    const req = new NextRequest(url);

    const response = await GET(req);

    expect(response.status).toBe(308);
    const location = response.headers.get("Location");
    expect(location).toBeTruthy();

    const redirected = new URL(location!);
    const params = redirected.searchParams;
    expect(params.get("text")).toBe("CustomText");
    expect(params.get("font")).toBe("sacramento");
    expect(params.get("fontSize")).toBe("80");
  });

  it("should redirect to /editor when ui=editor is present", async () => {
    const url = "http://localhost:3000/HelloWorld?ui=editor&font=sacramento";
    const req = new NextRequest(url);

    const response = await GET(req);

    expect(response.status).toBe(308);
    const location = response.headers.get("Location");
    expect(location).toBeTruthy();

    const redirected = new URL(location!);
    expect(redirected.pathname).toBe("/editor");
    expect(redirected.searchParams.get("text")).toBe("HelloWorld");
    expect(redirected.searchParams.get("ui")).toBe("editor");
    expect(redirected.searchParams.get("font")).toBe("sacramento");
  });

  it("should decode URL-encoded text in path", async () => {
    const url = "http://localhost:3000/Hello%20World";
    const req = new NextRequest(url);

    const response = await GET(req);

    expect(response.status).toBe(308);
    const location = response.headers.get("Location");
    expect(location).toBeTruthy();

    const redirected = new URL(location!);
    const params = redirected.searchParams;
    expect(params.get("text")).toBe("Hello World");
  });

  it("should handle Chinese characters in path", async () => {
    const url = "http://localhost:3000/你好世界？font=ma-shan-zheng";
    const req = new NextRequest(url);

    const response = await GET(req);

    expect(response.status).toBe(308);
    const location = response.headers.get("Location");
    expect(location).toBeTruthy();

    const redirected = new URL(location!);
    const params = redirected.searchParams;
    expect(params.get("text")).toBe("你好世界");
    expect(params.get("font")).toBe("ma-shan-zheng");
  }, 10000);

  it("should preserve existing query string when both path text and text query are present", async () => {
    const url =
      "http://localhost:3000/PathText?text=QueryText&font=great-vibes";
    const req = new NextRequest(url);

    const response = await GET(req);

    expect(response.status).toBe(308);
    const location = response.headers.get("Location");
    expect(location).toBeTruthy();

    const redirected = new URL(location!);
    const params = redirected.searchParams;
    // Path text should win over query `text`
    expect(params.get("text")).toBe("PathText");
    expect(params.get("font")).toBe("great-vibes");
  });
});
