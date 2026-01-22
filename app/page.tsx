"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppTopBar } from "@/components/app-top-bar";
import { ThemesSection } from "@/components/signature-builder/sidebar-themes-section";
import { EmbedRows } from "@/components/landing/embed-rows";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_STATE } from "@/lib/constants";
import { buildSignApiUrl } from "@/lib/api-url";
import { buildBuilderSearchParams } from "@/lib/builder-query";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-state";
import { buildStateFromQuery } from "@/lib/state-from-query";
import { SignatureState } from "@/lib/types";

const CHINESE_FONT = "ma-shan-zheng";

export default function LandingPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<SignatureState>(() => ({
    ...INITIAL_STATE,
    bgTransparent: false,
  }));
  const [previewState, setPreviewState] = useState<SignatureState>(state);
  const [origin, setOrigin] = useState("");

  const lastNonChineseFontRef = useRef<string>(INITIAL_STATE.font);

  const updateState = (updates: Partial<SignatureState>) => {
    setState((prev) => ({
      ...prev,
      ...updates,
      // Landing: keep a non-transparent background to reduce user confusion.
      bgTransparent: false,
    }));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);

    const search = window.location.search;
    const rawSearch = search.startsWith("?") ? search.slice(1) : search;
    if (!rawSearch) return;

    const params = new URLSearchParams(rawSearch);
    if ([...params.keys()].length === 0) return;

    const next = buildStateFromQuery(params);
    next.bgTransparent = false;
    updateState(next);
  }, []);

  // Track the last non-Chinese font so "中文" can toggle back to it.
  useEffect(() => {
    if (state.font && state.font !== CHINESE_FONT) {
      lastNonChineseFontRef.current = state.font;
    }
  }, [state.font]);

  const debouncedUpdatePreview = useDebouncedCallback(
    (next: SignatureState) => setPreviewState(next),
    200,
  );
  useEffect(() => {
    debouncedUpdatePreview(state);
  }, [state, debouncedUpdatePreview]);

  const debouncedSyncUrl = useDebouncedCallback(
    (next: SignatureState) => {
      const params = buildBuilderSearchParams(next, { shortKeys: true });
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      router.replace(url, { scroll: false });
    },
    250,
  );
  useEffect(() => {
    debouncedSyncUrl(state);
  }, [state, debouncedSyncUrl]);

  const isChineseEnabled = state.font === CHINESE_FONT;

  const editorHref = useMemo(() => {
    const params = buildBuilderSearchParams(state, { shortKeys: true });
    const query = params.toString();
    return query ? `/editor?${query}` : "/editor";
  }, [state]);

  const previewUrl = useMemo(() => {
    const stableState: SignatureState = { ...previewState, bgTransparent: false };
    return buildSignApiUrl(stableState, {
      format: "svg",
      origin: "",
      shortKeys: true,
    });
  }, [previewState]);

  const imageUrlForEmbed = useMemo(() => {
    const stableState: SignatureState = { ...state, bgTransparent: false };
    return buildSignApiUrl(stableState, {
      format: "svg",
      origin: origin || "",
      shortKeys: true,
    });
  }, [state, origin]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppTopBar />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <section className="flex flex-col items-center gap-5">
            <Link href={editorHref}>
              <Button
                type="button"
                variant="outline"
                className="h-10 px-6 rounded-full"
              >
                进入高级编辑页面
              </Button>
            </Link>

            <div className="w-full rounded-2xl border bg-card p-8 flex items-center justify-center overflow-hidden">
              <img
                src={previewUrl}
                alt="Signature preview"
                className="max-w-full h-auto"
              />
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 md:grid-cols-[420px_1fr] gap-6">
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between gap-6 pb-3 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">中文</span>
                  <Switch
                    checked={isChineseEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateState({ font: CHINESE_FONT });
                      } else {
                        updateState({
                          font: lastNonChineseFontRef.current || INITIAL_STATE.font,
                          useHanziData: false,
                        });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">中文笔画</span>
                  <Switch
                    checked={state.useHanziData ?? false}
                    disabled={!isChineseEnabled}
                    onCheckedChange={(checked) => updateState({ useHanziData: checked })}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Textarea
                  value={state.text}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\r?\n/g, " ");
                    const next = raw.trim() ? raw : INITIAL_STATE.text;
                    updateState({ text: next });
                  }}
                  className="min-h-44 text-2xl font-medium tracking-tight"
                  placeholder="signature"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  输入文字后会实时生成可嵌入的图片 URL；支持复制 Markdown / HTML / 直链。
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <ThemesSection state={state} updateState={updateState} />
            </div>
          </section>

          <section className="mt-8">
            <EmbedRows imageUrl={imageUrlForEmbed} />
          </section>
        </div>
      </main>
    </div>
  );
}

