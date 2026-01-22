"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppTopBar } from "@/components/app-top-bar";
import { ThemesSection } from "@/components/signature-builder/sidebar-themes-section";
import { EmbedRows } from "@/components/landing/embed-rows";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

import {
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  FileCode2,
  FileImage,
  Film,
  Image,
  Loader2,
  Play,
  Share2,
  Triangle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INITIAL_STATE } from "@/lib/constants";
import { buildSignApiUrl, buildShareUrl } from "@/lib/api-url";
import { buildBuilderSearchParams } from "@/lib/builder-query";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-state";
import { buildStateFromQuery } from "@/lib/state-from-query";
import { SignatureState } from "@/lib/types";
import { useI18n } from "@/components/i18n-provider";
import { generateJSComponent, generateReactComponent, generateVueComponent } from "@/lib/code-generators";

const CHINESE_FONT = "ma-shan-zheng";

export default function LandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();

  const [state, setState] = useState<SignatureState>(() => ({
    ...INITIAL_STATE,
    bgTransparent: true, // Start transparent for the magazine "floating" look
  }));
  const [previewState, setPreviewState] = useState<SignatureState>(state);
  const [origin, setOrigin] = useState("");
  const [svgCode, setSvgCode] = useState(""); // For component generation
  
  // Share/Download State
  const [shareCopyStatus, setShareCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const [isGifDialogOpen, setIsGifDialogOpen] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);

  const lastNonChineseFontRef = useRef<string>(INITIAL_STATE.font);

  const updateState = (updates: Partial<SignatureState>) => {
    setState((prev) => ({
      ...prev,
      ...updates,
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
    // If the query doesn't specify bg, default to transparent for landing
    if (!params.has("bg") && !params.has("theme")) {
      next.bgTransparent = true;
    }
    updateState(next);
  }, []);

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

  // Fetch SVG code for component generation when previewState changes
  useEffect(() => {
    const url = buildSignApiUrl(previewState, { format: "svg", static: false });
    fetch(url).then(res => res.text()).then(setSvgCode).catch(() => { /* ignore */ });
  }, [previewState]);

  const debouncedSyncUrl = useDebouncedCallback(
    (next: SignatureState) => {
      const params = buildBuilderSearchParams(next, { shortKeys: true });
      const query = params.toString();
      const currentSearch = window.location.search;
      const currentQuery = currentSearch.startsWith("?")
        ? currentSearch.slice(1)
        : currentSearch;

      if (query !== currentQuery) {
        const url = query ? `${pathname}?${query}` : pathname;
        router.replace(url, { scroll: false });
      }
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
    return buildSignApiUrl(previewState, {
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

  // --- Download & Share Logic (Duplicated from Editor for parity) ---

  const renderDownloadIcon = (key: string) => {
    switch (key) {
      case "react": return <Code2 className="w-3.5 h-3.5" />;
      case "vue": return <Triangle className="w-3.5 h-3.5 rotate-180" />;
      case "js": return <FileCode2 className="w-3.5 h-3.5" />;
      case "svg-animated": return <Play className="w-3.5 h-3.5" />;
      case "svg-static": return <Image className="w-3.5 h-3.5" />;
      case "svg": return <FileCode2 className="w-3.5 h-3.5" />;
      case "png": return <FileImage className="w-3.5 h-3.5" />;
      case "gif": return <Film className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const downloadSVG = (animated: boolean = true) => {
    const url = buildSignApiUrl(state, { format: "svg", static: !animated });
    fetch(url)
      .then((res) => res.text())
      .then((svg) => {
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `signature_${state.text}_${animated ? "animated" : "static"}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => console.error("Failed to download SVG:", err));
  };

  const downloadRaster = (format: "png" | "gif") => {
    const url = buildSignApiUrl(state, { format });
    const a = document.createElement("a");
    a.href = url;
    a.download = `signature_${state.text || "sign"}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleGenerateGif = async () => {
    try {
      setGifError(null);
      setIsGeneratingGif(true);
      const url = buildSignApiUrl(state, { format: "gif" });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to generate GIF");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `signature_${state.text || "sign"}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setIsGeneratingGif(false);
      setIsGifDialogOpen(false);
    } catch (error) {
      console.error("Failed to generate GIF:", error);
      setGifError(t("gifGenerateErrorLabel"));
      setIsGeneratingGif(false);
    }
  };

  const downloadComponent = (type: "react" | "vue" | "js") => {
    if (!svgCode) return;
    let code = "";
    let filename = "";
    let mimeType = "";
    if (type === "react") {
      code = generateReactComponent(svgCode, state);
      filename = `Signature.tsx`;
      mimeType = "text/typescript";
    } else if (type === "vue") {
      code = generateVueComponent(svgCode, state);
      filename = `Signature.vue`;
      mimeType = "text/plain";
    } else if (type === "js") {
      code = generateJSComponent(svgCode, state);
      filename = `signature.js`;
      mimeType = "text/javascript";
    }
    const blob = new Blob([code], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadOptions = [
    { key: "react", label: t("reactComponent"), action: () => downloadComponent("react") },
    { key: "vue", label: t("vueComponent"), action: () => downloadComponent("vue") },
    { key: "js", label: t("jsComponent"), action: () => downloadComponent("js") },
    { key: "svg-animated", label: t("downloadSvgAnimatedLabel"), action: () => downloadSVG(true) },
    { key: "svg-static", label: t("downloadSvgStaticLabel"), action: () => downloadSVG(false) },
    { key: "png", label: t("downloadPngLabel"), action: () => downloadRaster("png") },
    { key: "gif", label: t("downloadGifLabel"), action: () => setIsGifDialogOpen(true) },
  ];

  const copyShareUrl = async (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopyStatus("success");
        setTimeout(() => setShareCopyStatus("idle"), 2000);
        return;
      } catch {
        // ignore
      }
    }
    if (typeof window !== "undefined") {
      setShareCopyStatus("error");
      setTimeout(() => setShareCopyStatus("idle"), 2000);
      window.prompt(t("sharePromptLabel"), url);
    }
  };

  const handleShare = async () => {
    try {
      const url = buildShareUrl(state, { ui: "editor" });
      if (typeof navigator !== "undefined" && navigator.share) {
                try {
                  await navigator.share({ title: t("appTitle"), url });
                  return;
                } catch {
                  // ignore
                }
              }
              await copyShareUrl(url);
            } catch {
              // ignore
            }
          };

  const handleCopyShareUrl = async () => {
    try {
      const url = buildShareUrl(state, { ui: "editor" });
      await copyShareUrl(url);
    } catch {
      setShareCopyStatus("error");
      setTimeout(() => setShareCopyStatus("idle"), 2000);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#fdfdfb] dark:bg-[#121212] text-[#1a1a1a] dark:text-gray-100 transition-colors duration-300 font-sans overflow-hidden relative">
      {/* Parallax Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[300px] bg-red-400/20 blur-[80px] -rotate-15 animate-pulse" />
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[600px] bg-blue-400/20 blur-[100px] rotate-10 animate-pulse delay-700" />
        <div className="absolute top-[-5%] right-[20%] w-[600px] h-[400px] bg-yellow-400/20 blur-[90px] -rotate-6 animate-pulse delay-500" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[500px] bg-green-400/20 blur-[70px] rotate-20" />
        <div className="absolute bottom-[20%] left-[30%] w-[400px] h-[300px] bg-purple-400/20 blur-[80px] -rotate-12" />
      </div>

      <AppTopBar 
        extraActions={
          <>
             {/* Desktop Download - hover dropdown with all formats */}
             <div className="relative group hidden md:block">
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs gap-2 bg-[#1a1a1a] hover:bg-black text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black pr-8"
              >
                <Download className="w-3.5 h-3.5" />
                {t("mobileDownloadLabel")}
                <ChevronDown className="w-3 h-3 ml-auto absolute right-2 opacity-50" />
              </Button>
              <div className="absolute right-0 mt-2 w-52 bg-popover rounded-xl shadow-2xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="p-1">
                  {downloadOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={opt.action}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition text-left"
                    >
                      {renderDownloadIcon(opt.key)}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Share current configuration - desktop: hover to reveal menu */}
            <div className="relative group hidden md:block">
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-xs inline-flex"
                aria-label={t("shareButtonLabel")}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <div className="absolute right-0 mt-2 w-40 bg-popover rounded-xl shadow-2xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="p-1">
                  <button
                    type="button"
                    onClick={handleCopyShareUrl}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition text-left"
                  >
                    {shareCopyStatus === "success" && (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">{t("shareCopySuccessLabel")}</span>
                      </>
                    )}
                    {shareCopyStatus === "error" && (
                      <>
                        <X className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-red-600">{t("shareCopyErrorLabel")}</span>
                      </>
                    )}
                    {shareCopyStatus === "idle" && (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t("shareCopyLabel")}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition text-left"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t("shareNativeLabel")}</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        }
      />

      <main className="flex-1 flex flex-col md:flex-row min-h-0 xl:max-w-[75%] mx-auto overflow-hidden w-full">
        {/* Main Workspace */}
        <div className="flex-1 flex flex-col gap-4 p-4 md:p-8 min-w-0 overflow-y-auto custom-scrollbar">
          
          {/* Section 1: Preview & Issue Header */}
          <section className="flex flex-col gap-2 shrink-0 min-h-0 flex-1 justify-center">
            <div className="flex items-baseline justify-between border-b border-gray-200 dark:border-gray-800 pb-2 mb-2 shrink-0">
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">{t("landingIssueLabel")}</h2>
              <span className="font-serif italic text-sm text-muted-foreground hidden sm:inline">{t("landingArtQuoteLabel")}</span>
            </div>
            
            <div className="w-full flex-1 min-h-0 flex items-center justify-center border border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-black/20 backdrop-blur-sm relative group overflow-hidden rounded-sm p-4">
              <img
                src={previewUrl}
                alt="Signature Preview"
                className="max-w-full max-h-full object-contain drop-shadow-xl transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-2 right-3 text-[9px] uppercase tracking-widest opacity-40">
                {t("landingPreviewRenderingLabel")}
              </div>
            </div>
          </section>

          {/* Section 2: Editor Input */}
          <section className="flex flex-col gap-2 shrink-0">
             <div className="flex items-baseline justify-between border-b border-gray-200 dark:border-gray-800 pb-2 mb-2">
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">{t("landingDigitalSignatureLabel")}</h2>
            </div>
            <input
              className="w-full bg-transparent border-b-2 border-[#1a1a1a] dark:border-white py-2 text-4xl md:text-5xl font-serif placeholder:text-gray-300 dark:placeholder:text-gray-700 focus:outline-none focus:border-opacity-50 transition-all text-center md:text-left"
              placeholder={t("landingInputPlaceholder")}
              type="text"
              value={state.text}
              onChange={(e) => {
                const raw = e.target.value;
                const next = raw ? raw : INITIAL_STATE.text;
                updateState({ text: next });
              }}
            />
          </section>

          {/* Section 3: Controls & Config */}
          <section className="flex flex-col gap-4 mt-2 shrink-0">
            
            {/* Controls */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between border-b border-gray-200 dark:border-gray-800 pb-1">
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">{t("landingCuratedControlLabel")}</h2>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground hidden sm:inline">{t("landingTailoredLabel")}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 py-1">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] uppercase tracking-widest font-bold">
                    {t("landingChineseLabel")}
                  </label>
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
                  <label className="text-[10px] uppercase tracking-widest font-bold">
                    {t("landingHanziStrokeLabel")}
                  </label>
                  <Switch
                    checked={state.useHanziData ?? false}
                    disabled={!isChineseEnabled}
                    onCheckedChange={(checked) =>
                      updateState({ useHanziData: checked })
                    }
                  />
                </div>
                <div className="flex items-center gap-3 flex-1 min-w-[140px]">
                  <label className="text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">
                    {t("speedLabel") || "Speed"}
                  </label>
                  <Slider
                    value={[state.speed ?? 1]}
                    min={0.1}
                    max={5}
                    step={0.1}
                    onValueChange={([val]) => updateState({ speed: val })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Themes */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between border-b border-gray-200 dark:border-gray-800 pb-1">
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">{t("quickThemesSectionTitle")}</h2>
              </div>
              <div className="themes-grid-wrapper overflow-x-auto pb-2 scrollbar-hide">
                <ThemesSection state={state} updateState={updateState} variant="compact" />
              </div>
            </div>

            {/* Exports */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between border-b border-gray-200 dark:border-gray-800 pb-1">
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">{t("landingAssetCollectionLabel")}</h2>
              </div>
              <EmbedRows imageUrl={imageUrlForEmbed} variant="editorial" />
              
              <div className="mt-4 flex justify-end">
                 <Link href={editorHref}>
                  <Button variant="outline" className="rounded-none border-[#1a1a1a] dark:border-white uppercase tracking-widest text-xs h-10 px-8 hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                    {t("landingEnterEditorLabel")} &rarr;
                  </Button>
                </Link>
              </div>
            </div>

          </section>
        </div>
      </main>

      {/* GIF Export Dialog Reuse */}
      <Dialog
        open={isGifDialogOpen}
        onOpenChange={(open) => {
          if (isGeneratingGif && !open) return;
          setIsGifDialogOpen(open);
          if (!open) {
            setGifError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("gifDialogTitle")}</DialogTitle>
            <DialogDescription>{t("gifDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">{t("gifFpsLabel")}</span>
                <span className="text-indigo-600 font-mono">{state.gifFps ?? 30} fps</span>
              </div>
              <Slider
                min={10}
                max={60}
                step={5}
                value={[state.gifFps ?? 30]}
                onValueChange={([v]) => updateState({ gifFps: v })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">{t("gifQualityLabel")}</span>
                <span className="text-indigo-600 font-mono">{state.gifQuality ?? 5}</span>
              </div>
              <Slider
                min={1}
                max={20}
                step={1}
                value={[state.gifQuality ?? 5]}
                onValueChange={([v]) => updateState({ gifQuality: v })}
              />
            </div>
            {isGeneratingGif && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("gifGeneratingLabel")}</span>
              </div>
            )}
            {gifError && <p className="text-xs text-red-600">{gifError}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (isGeneratingGif) return;
                setIsGifDialogOpen(false);
                setGifError(null);
              }}
            >
              {t("gifCancelButtonLabel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerateGif}
              disabled={isGeneratingGif}
            >
              {isGeneratingGif ? t("gifGeneratingLabel") : t("gifStartButtonLabel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}