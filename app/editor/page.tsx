"use client";

import React, { useEffect, useRef, useState } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/signature-builder/sidebar";
import { PreviewArea } from "@/components/signature-builder/preview-area";
import { CodePanel } from "@/components/signature-builder/code-panel";
import { MobileDrawerSidebar } from "@/components/signature-builder/mobile-drawer-sidebar";
import { INITIAL_STATE } from "@/lib/constants";
import { buildBuilderSearchParams } from "@/lib/builder-query";
import { SignatureState } from "@/lib/types";
import { buildStateFromQuery } from "@/lib/state-from-query";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  generateJSComponent,
  generateReactComponent,
  generateVueComponent,
} from "@/lib/code-generators";
import { useI18n } from "@/components/i18n-provider";
import { buildShareUrl, buildSignApiUrl } from "@/lib/api-url";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-state";

export default function SignatureBuilderPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<SignatureState>(INITIAL_STATE);
  const [svgCode, setSvgCode] = useState("");
  const [uploadedFont, setUploadedFont] = useState<ArrayBuffer | null>(null);
  const [isCodeOverlayOpen, setIsCodeOverlayOpen] = useState(false);
  const [shareCopyStatus, setShareCopyStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [isGifDialogOpen, setIsGifDialogOpen] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const { t } = useI18n();

  const mobileBottomPanelRef = useRef<ImperativePanelHandle | null>(null);
  const mobileBottomLastSizeRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const search = window.location.search;
    const rawSearch = search.startsWith("?") ? search.slice(1) : search;
    if (!rawSearch) return;

    const params = new URLSearchParams(rawSearch);
    if ([...params.keys()].length === 0) return;

    setState(() => buildStateFromQuery(params));
  }, []);

  const debouncedSyncUrl = useDebouncedCallback(
    (next: SignatureState) => {
      const params = buildBuilderSearchParams(next, { shortKeys: true });
      const query = params.toString();
      const currentSearch = window.location.search;
      const currentQuery = currentSearch.startsWith("?")
        ? currentSearch.slice(1)
        : currentSearch;

      // Only replace if query params have changed
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

  const updateState = (updates: Partial<SignatureState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const renderDownloadIcon = (key: string) => {
    switch (key) {
      case "react":
        return <Code2 className="w-3.5 h-3.5" />;
      case "vue":
        return <Triangle className="w-3.5 h-3.5 rotate-180" />;
      case "js":
        return <FileCode2 className="w-3.5 h-3.5" />;
      case "svg-animated":
        return <Play className="w-3.5 h-3.5" />;
      case "svg-static":
        return <Image className="w-3.5 h-3.5" />;
      case "svg":
        return <FileCode2 className="w-3.5 h-3.5" />;
      case "png":
        return <FileImage className="w-3.5 h-3.5" />;
      case "gif":
        return <Film className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const handleFontUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedFont(e.target.result as ArrayBuffer);
        updateState({ font: "custom" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadSVG = (animated: boolean = true) => {
    // Always fetch from API to get clean SVG without idPrefix
    const url = buildSignApiUrl(state, { format: "svg", static: !animated });
    fetch(url)
      .then((res) => res.text())
      .then((svg) => {
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `signature_${state.text}_${
          animated ? "animated" : "static"
        }.svg`;
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
      if (!res.ok) {
        throw new Error("Failed to generate GIF");
      }

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

  const downloadOptions = [
    {
      key: "react",
      label: t("reactComponent"),
      action: () => downloadComponent("react"),
    },
    {
      key: "vue",
      label: t("vueComponent"),
      action: () => downloadComponent("vue"),
    },
    {
      key: "js",
      label: t("jsComponent"),
      action: () => downloadComponent("js"),
    },
    {
      key: "svg-animated",
      label: t("downloadSvgAnimatedLabel"),
      action: () => downloadSVG(true),
    },
    {
      key: "svg-static",
      label: t("downloadSvgStaticLabel"),
      action: () => downloadSVG(false),
    },
    {
      key: "png",
      label: t("downloadPngLabel"),
      action: () => downloadRaster("png"),
    },
    {
      key: "gif",
      label: t("downloadGifLabel"),
      action: () => setIsGifDialogOpen(true),
    },
  ];

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

  const copyShareUrl = async (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopyStatus("success");
        setTimeout(() => setShareCopyStatus("idle"), 2000);
        return;
      } catch {
        // Fall through to prompt
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
          await navigator.share({
            title: t("appTitle"),
            url,
          });
          return;
        } catch {
          // Fall through to copy/prompt on user cancellation or error
        }
      }

      await copyShareUrl(url);
    } catch {
      // no-op – sharing should never break the main UI
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
    <div className="h-screen flex flex-col overflow-hidden bg-background font-sans">
      <AppTopBar
        extraActions={
          <>
            {/* Mobile Code & Download */}
            <div className="flex items-center gap-2 md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-3"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="ml-1 text-[11px]">
                      {t("mobileDownloadLabel")}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {downloadOptions.map((opt) => (
                    <DropdownMenuItem
                      key={opt.key}
                      onClick={opt.action}
                      className="text-xs flex items-center gap-2"
                    >
                      {renderDownloadIcon(opt.key)}
                      <span>{opt.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCodeOverlayOpen(true)}
                className="h-8 text-xs px-3"
              >
                {t("mobileCodeLabel")}
              </Button>
            </div>

            {/* Desktop Download - hover dropdown with all formats */}
            <div className="relative group hidden md:block">
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs gap-2 bg-gray-900 hover:bg-gray-800 text-white pr-8"
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

            {/* Share current configuration - mobile: click to open menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-xs inline-flex md:hidden"
                  aria-label={t("shareButtonLabel")}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 md:hidden">
                <DropdownMenuItem
                  className="text-xs flex items-center gap-2"
                  onClick={handleCopyShareUrl}
                >
                  {shareCopyStatus === "success" && (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">
                        {t("shareCopySuccessLabel")}
                      </span>
                    </>
                  )}
                  {shareCopyStatus === "error" && (
                    <>
                      <X className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-red-600">
                        {t("shareCopyErrorLabel")}
                      </span>
                    </>
                  )}
                  {shareCopyStatus === "idle" && (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t("shareCopyLabel")}</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs flex items-center gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t("shareNativeLabel")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                        <span className="text-emerald-600">
                          {t("shareCopySuccessLabel")}
                        </span>
                      </>
                    )}
                    {shareCopyStatus === "error" && (
                      <>
                        <X className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-red-600">
                          {t("shareCopyErrorLabel")}
                        </span>
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

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <Sidebar
          state={state}
          updateState={updateState}
          onFontUpload={handleFontUpload}
        />

        <main className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-background">
          <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
            <ResizablePanel defaultSize={60} minSize={30}>
              <PreviewArea
                state={state}
                onSvgGenerated={setSvgCode}
                uploadedFont={uploadedFont}
                idPrefix="desktop-"
              />
            </ResizablePanel>

            <ResizableHandle
              className="relative group cursor-row-resize bg-border hover:bg-indigo-500 active:bg-indigo-600 transition-colors duration-200"
              style={{ height: "6px", minHeight: "6px", maxHeight: "6px" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col gap-0.5">
                  <div className="w-8 h-0.5 bg-muted-foreground/30 rounded-full group-hover:bg-white group-hover:w-10 transition-all duration-200" />
                  <div className="w-8 h-0.5 bg-muted-foreground/30 rounded-full group-hover:bg-white group-hover:w-10 transition-all duration-200" />
                </div>
              </div>
            </ResizableHandle>

            <ResizablePanel defaultSize={40} minSize={20}>
              <CodePanel svgCode={svgCode} state={state} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-background">
          <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
            <ResizablePanel defaultSize={60} minSize={40}>
              <PreviewArea
                state={state}
                onSvgGenerated={setSvgCode}
                uploadedFont={uploadedFont}
                idPrefix="mobile-"
              />
            </ResizablePanel>

            <ResizableHandle
              className="relative group cursor-row-resize bg-border hover:bg-indigo-500 active:bg-indigo-600 transition-colors duration-200"
              style={{ height: "6px", minHeight: "6px", maxHeight: "6px" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col gap-0.5">
                  <div className="w-8 h-0.5 bg-muted-foreground/30 rounded-full group-hover:bg-white group-hover:w-10 transition-all duration-200" />
                  <div className="w-8 h-0.5 bg-muted-foreground/30 rounded-full group-hover:bg-white group-hover:w-10 transition-all duration-200" />
                </div>
              </div>
            </ResizableHandle>

            <ResizablePanel
              ref={mobileBottomPanelRef}
              defaultSize={40}
              minSize={5}
              className="flex flex-col min-h-0"
              onResize={(size) => {
                // Track the last "usable" size for restore; ignore tiny
                // collapsed sizes so re-open always returns to a helpful
                // height.
                if (size > 8) {
                  mobileBottomLastSizeRef.current = size;
                }
              }}
            >
              <MobileDrawerSidebar
                state={state}
                updateState={updateState}
                onFontUpload={handleFontUpload}
                onToggleOpen={(open) => {
                  const panel = mobileBottomPanelRef.current;
                  if (!panel) return;
                  try {
                    if (open) {
                      const last = mobileBottomLastSizeRef.current ?? 40;
                      panel.resize?.(last);
                    } else {
                      // Collapse down to a small strip so the preview gets
                      // most of the height while still keeping the header
                      // visible.
                      panel.resize?.(6);
                    }
                  } catch {
                    // no-op
                  }
                }}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>

      {/* GIF Export Dialog */}
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
            <DialogDescription>
              {t("gifDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">
                  {t("gifFpsLabel")}
                </span>
                <span className="text-indigo-600 font-mono">
                  {state.gifFps ?? 30} fps
                </span>
              </div>
              <Slider
                min={10}
                max={60}
                step={5}
                value={[state.gifFps ?? 30]}
                onValueChange={([v]) => updateState({ gifFps: v })}
              />
              <p className="text-[10px] text-muted-foreground/70">
                {t("gifFpsDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">
                  {t("gifQualityLabel")}
                </span>
                <span className="text-indigo-600 font-mono">
                  {state.gifQuality ?? 5}
                </span>
              </div>
              <Slider
                min={1}
                max={20}
                step={1}
                value={[state.gifQuality ?? 5]}
                onValueChange={([v]) => updateState({ gifQuality: v })}
              />
              <p className="text-[10px] text-muted-foreground/70">
                {t("gifQualityDescription")}
              </p>
            </div>

            {isGeneratingGif && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("gifGeneratingLabel")}</span>
              </div>
            )}

            {gifError && (
              <p className="text-xs text-red-600">
                {gifError}
              </p>
            )}
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
              {isGeneratingGif
                ? t("gifGeneratingLabel")
                : t("gifStartButtonLabel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isCodeOverlayOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col md:hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
            <span className="text-xs font-semibold text-[#c9d1d9]">
              {t("apiAndCode")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCodeOverlayOpen(false)}
              className="h-7 text-xs text-[#c9d1d9]"
            >
              Close
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <CodePanel svgCode={svgCode} state={state} />
          </div>
        </div>
      )}
    </div>
  );
}
