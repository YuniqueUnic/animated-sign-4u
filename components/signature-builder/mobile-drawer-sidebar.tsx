import React, { PointerEvent, TouchEvent, useState } from "react";
import { SignatureState } from "@/lib/types";
import { ContentFontSection } from "./sidebar-content-section";
import { ParamsSection } from "./sidebar-params-section";
import { ThemesSection } from "./sidebar-themes-section";
import { StyleColorSection } from "./sidebar-style-section";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

interface MobileDrawerSidebarProps {
    state: SignatureState;
    updateState: (updates: Partial<SignatureState>) => void;
    onFontUpload: (file: File) => void;
    onToggleOpen?: (open: boolean) => void;
}

export function MobileDrawerSidebar(
    { state, updateState, onFontUpload, onToggleOpen }:
        MobileDrawerSidebarProps,
) {
    const { t } = useI18n();
    const [open, setOpen] = useState(true);
    const [index, setIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [pointerStartX, setPointerStartX] = useState<number | null>(null);

    const sections = [
        <ContentFontSection
            key="content"
            state={state}
            updateState={updateState}
            onFontUpload={onFontUpload}
        />,
        <ParamsSection
            key="params"
            state={state}
            updateState={updateState}
        />,
        <ThemesSection
            key="themes"
            state={state}
            updateState={updateState}
        />,
        <StyleColorSection
            key="style"
            state={state}
            updateState={updateState}
        />,
    ];

    const slideCount = sections.length;

    const sectionTitleKeys: Array<
        | "contentFontSectionTitle"
        | "paramsSectionTitle"
        | "quickThemesSectionTitle"
        | "styleColorSectionTitle"
    > = [
        "contentFontSectionTitle",
        "paramsSectionTitle",
        "quickThemesSectionTitle",
        "styleColorSectionTitle",
    ];

    const next = () => setIndex((prev) => (prev + 1) % slideCount);
    const prev = () => setIndex((prev) => (prev - 1 + slideCount) % slideCount);

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement | null;
        // If the gesture starts on a slider, don't treat it as a drawer swipe.
        if (target && target.closest('[data-slot="slider"]')) {
            setTouchStartX(null);
            return;
        }
        setTouchStartX(e.touches[0]?.clientX ?? null);
    };

    const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
        if (touchStartX == null) return;
        const target = e.target as HTMLElement | null;
        if (target && target.closest('[data-slot="slider"]')) {
            setTouchStartX(null);
            return;
        }
        const endX = e.changedTouches[0]?.clientX ?? touchStartX;
        const dx = endX - touchStartX;
        const threshold = 40;
        if (dx < -threshold) next();
        if (dx > threshold) prev();
        setTouchStartX(null);
    };

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === "mouse" || e.pointerType === "pen") {
            const target = e.target as HTMLElement | null;
            // Ignore pointer gestures that originate on sliders so dragging
            // slider thumbs with a mouse/trackpad does not swipe sections.
            if (target && target.closest('[data-slot="slider"]')) {
                setPointerStartX(null);
                return;
            }
            setPointerStartX(e.clientX);
        }
    };

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        if (pointerStartX == null) return;
        const target = e.target as HTMLElement | null;
        if (target && target.closest('[data-slot="slider"]')) {
            setPointerStartX(null);
            return;
        }
        const dx = e.clientX - pointerStartX;
        const threshold = 40;
        if (dx < -threshold) next();
        if (dx > threshold) prev();
        setPointerStartX(null);
    };

    const activeTitleKey = sectionTitleKeys[index] ?? sectionTitleKeys[0];
    const activeTitle = t(activeTitleKey);

    const toggleOpen = () => {
        setOpen((prev) => {
            const next = !prev;
            onToggleOpen?.(next);
            return next;
        });
    };

    return (
        <div
            className={cn(
                "bg-card border-t shadow-lg transition-all duration-300 flex flex-col",
                "h-full",
            )}
        >
            <div className={cn(!open && "mt-auto")}>
                <button
                    type="button"
                    className="h-10 flex items-center justify-between px-4 text-xs font-medium text-muted-foreground w-full"
                    onClick={toggleOpen}
                >
                    <span className="truncate">{t(activeTitleKey)}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide">
                            {open
                                ? t("drawerCollapseLabel")
                                : t("drawerOpenLabel")}
                        </span>
                        <ChevronDown
                            className={cn(
                                "w-3 h-3 transition-transform",
                                open && "rotate-180",
                            )}
                        />
                    </div>
                </button>
            </div>

            {open && (
                <div className="flex-1 min-h-0 flex flex-col">
                    <div
                        className="flex-1 min-h-0 overflow-hidden"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        <div
                            className="flex h-full transition-transform duration-300 ease-out"
                            style={{
                                transform: `translateX(-${index * 100}%)`,
                            }}
                        >
                            {sections.map((section, i) => (
                                <div
                                    key={i}
                                    className="w-full shrink-0 h-full overflow-y-auto p-3 pb-6"
                                >
                                    {section}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-3 py-1.5 border-t bg-card text-[11px] text-muted-foreground">
                        <button
                            type="button"
                            className="p-1 rounded-full hover:bg-muted flex items-center justify-center"
                            onClick={prev}
                        >
                            <ChevronLeft className="w-3 h-3" />
                        </button>
                        <div className="flex items-center gap-1">
                            {sections.map((_, i) => (
                                <span
                                    key={i}
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        i === index
                                            ? "bg-indigo-500"
                                            : "bg-muted-foreground/30",
                                    )}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            className="p-1 rounded-full hover:bg-muted flex items-center justify-center"
                            onClick={next}
                        >
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
