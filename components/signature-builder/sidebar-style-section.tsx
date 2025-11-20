import React from "react";
import { SignatureState, TextureType } from "@/lib/types";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "./controls/color-picker";
import { ChevronDown, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

interface StyleColorSectionProps {
    state: SignatureState;
    updateState: (updates: Partial<SignatureState>) => void;
}

export function StyleColorSection(
    { state, updateState }: StyleColorSectionProps,
) {
    const { t } = useI18n();
    const updateCharColor = (index: number, color: string) => {
        const newColors = [...state.charColors];
        newColors[index] = color;
        updateState({ charColors: newColors });
    };

    const updateStrokeCharColor = (index: number, color: string) => {
        const newColors = [...state.strokeCharColors];
        newColors[index] = color;
        updateState({ strokeCharColors: newColors });
    };

    const bgModeLabels: Record<string, string> = {
        solid: t("bgModeSolidLabel"),
        gradient: t("bgModeGradientLabel"),
    };

    const bgSizeModeLabels: Record<string, string> = {
        auto: t("bgSizeAutoLabel"),
        custom: t("bgSizeCustomLabel"),
    };

    const strokeModeLabels: Record<string, string> = {
        single: t("strokeModeSingleLabel"),
        gradient: t("strokeModeGradientLabel"),
        multi: t("strokeModeMultiLabel"),
    };

    const fillModeLabels: Record<string, string> = {
        single: t("fillModeSingleLabel"),
        gradient: t("fillModeGradientLabel"),
        multi: t("fillModeMultiLabel"),
    };

    return (
        <section className="space-y-4">
            <details open className="group">
                <summary className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 cursor-pointer">
                    <span className="w-6 h-6 rounded bg-pink-100 text-pink-600 flex items-center justify-center">
                        <Palette className="w-3 h-3" />
                    </span>
                    <span>{t("styleColorSectionTitle")}</span>
                    <ChevronDown className="ml-auto w-3 h-3 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>

                {/* Background Card */}
                <div className="mt-2 p-3 bg-card border rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold">
                            {t("cardBackgroundLabel")}
                        </Label>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={state.bgTransparent}
                                onCheckedChange={(c) =>
                                    updateState({ bgTransparent: c })}
                                id="bg-transparent"
                            />
                            <Label
                                htmlFor="bg-transparent"
                                className="text-xs text-muted-foreground"
                            >
                                {t("transparentLabel")}
                            </Label>
                        </div>
                    </div>

                    <div
                        className={cn(
                            "space-y-2 transition-opacity duration-200",
                            state.bgTransparent &&
                                "opacity-50 pointer-events-none",
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">
                                {t("backgroundModeLabel")}
                            </Label>
                            <div className="flex bg-muted p-0.5 rounded-lg text-[11px]">
                                {(["solid", "gradient"] as const).map((
                                    mode,
                                ) => (
                                    <button
                                        key={mode}
                                        onClick={() =>
                                            updateState({ bgMode: mode })}
                                        className={cn(
                                            "px-2 py-0.5 rounded-md capitalize",
                                            state.bgMode === mode
                                                ? "bg-background shadow-sm text-foreground"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        {bgModeLabels[mode]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {state.bgMode === "solid" && (
                            <ColorPicker
                                value={state.bg}
                                onChange={(c) => updateState({ bg: c })}
                            />
                        )}

                        {state.bgMode === "gradient" && (
                            <div className="flex gap-2 items-center">
                                <div className="flex-1">
                                    <ColorPicker
                                        value={state.bg}
                                        onChange={(c) => updateState({ bg: c })}
                                    />
                                </div>
                                <span className="text-muted-foreground">→</span>
                                <div className="flex-1">
                                    <ColorPicker
                                        value={state.bg2}
                                        onChange={(c) =>
                                            updateState({ bg2: c })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-3 border-t">
                        <Label className="text-xs text-muted-foreground mb-2 block">
                            {t("textureLabel")}
                        </Label>
                        <Select
                            value={state.texture}
                            onValueChange={(v) =>
                                updateState({ texture: v as TextureType })}
                        >
                            <SelectTrigger className="h-8 text-xs bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-2 border-border shadow-xl">
                                <SelectItem
                                    value="none"
                                    className="bg-popover hover:bg-accent"
                                >
                                    {t("textureNoneLabel")}
                                </SelectItem>
                                <SelectItem
                                    value="grid"
                                    className="bg-popover hover:bg-accent"
                                >
                                    {t("textureGridLabel")}
                                </SelectItem>
                                <SelectItem
                                    value="dots"
                                    className="bg-popover hover:bg-accent"
                                >
                                    {t("textureDotsLabel")}
                                </SelectItem>
                                <SelectItem
                                    value="lines"
                                    className="bg-popover hover:bg-accent"
                                >
                                    {t("textureLinesLabel")}
                                </SelectItem>
                                <SelectItem
                                    value="cross"
                                    className="bg-popover hover:bg-accent"
                                >
                                    {t("textureCrossLabel")}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {state.texture !== "none" && (
                            <div className="mt-3 space-y-3 pl-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground">
                                        {t("textureColorLabel")}
                                    </span>
                                    <input
                                        type="color"
                                        value={state.texColor}
                                        onChange={(e) =>
                                            updateState({
                                                texColor: e.target.value,
                                            })}
                                        className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>{t("textureSizeLabel")}</span>
                                        <span>{state.texSize}</span>
                                    </div>
                                    <Slider
                                        min={10}
                                        max={100}
                                        value={[state.texSize]}
                                        onValueChange={([v]) =>
                                            updateState({ texSize: v })}
                                        className="**:data-[slot=slider-track]:bg-slate-200 **:data-[slot=slider-track]:h-2 **:data-[slot=slider-range]:bg-indigo-500 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-indigo-500 **:data-[slot=slider-thumb]:shadow-lg **:data-[slot=slider-thumb]:w-5 **:data-[slot=slider-thumb]:h-5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>
                                            {t("textureThicknessLabel")}
                                        </span>
                                        <span>{state.texThickness}</span>
                                    </div>
                                    <Slider
                                        min={0.5}
                                        max={5}
                                        step={0.5}
                                        value={[state.texThickness]}
                                        onValueChange={([v]) =>
                                            updateState({ texThickness: v })}
                                        className="**:data-[slot=slider-track]:bg-slate-200 **:data-[slot=slider-track]:h-2 **:data-[slot=slider-range]:bg-indigo-500 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-indigo-500 **:data-[slot=slider-thumb]:shadow-lg **:data-[slot=slider-thumb]:w-5 **:data-[slot=slider-thumb]:h-5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>{t("textureOpacityLabel")}</span>
                                        <span>{state.texOpacity}</span>
                                    </div>
                                    <Slider
                                        min={0.1}
                                        max={1}
                                        step={0.1}
                                        value={[state.texOpacity]}
                                        onValueChange={([v]) =>
                                            updateState({ texOpacity: v })}
                                        className="**:data-[slot=slider-track]:bg-slate-200 **:data-[slot=slider-track]:h-2 **:data-[slot=slider-range]:bg-indigo-500 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-indigo-500 **:data-[slot=slider-thumb]:shadow-lg **:data-[slot=slider-thumb]:w-5 **:data-[slot=slider-thumb]:h-5"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-3 border-t space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                                {t("cornerRadiusLabel")}
                            </span>
                            <span className="font-mono text-indigo-600">
                                {state.borderRadius}px
                            </span>
                        </div>
                        <Slider
                            min={0}
                            max={40}
                            value={[state.borderRadius]}
                            onValueChange={([v]) =>
                                updateState({ borderRadius: v })}
                            className="**:data-[slot=slider-track]:bg-slate-200 **:data-[slot=slider-track]:h-2 **:data-[slot=slider-range]:bg-indigo-500 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-indigo-500 **:data-[slot=slider-thumb]:shadow-lg **:data-[slot=slider-thumb]:w-5 **:data-[slot=slider-thumb]:h-5"
                        />
                    </div>

                    {/* Background Size */}
                    <div className="pt-3 border-t mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">
                                {t("backgroundSizeLabel")}
                            </Label>
                            <div className="flex bg-muted p-0.5 rounded-lg text-[11px]">
                                {(["auto", "custom"] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() =>
                                            updateState({ bgSizeMode: mode })}
                                        className={cn(
                                            "px-2 py-0.5 rounded-md capitalize",
                                            state.bgSizeMode === mode
                                                ? "bg-background shadow-sm text-foreground"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {state.bgSizeMode === "custom" && (
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                                <div className="flex flex-col gap-1">
                                    <span>{t("bgWidthLabel")}</span>
                                    <input
                                        type="number"
                                        min={100}
                                        max={2000}
                                        value={state.bgWidth ?? ""}
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            updateState({
                                                bgWidth: Number.isFinite(v)
                                                    ? v
                                                    : null,
                                                bgSizeMode: "custom",
                                            });
                                        }}
                                        className="h-7 px-2 rounded border border-border bg-background text-xs"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span>{t("bgHeightLabel")}</span>
                                    <input
                                        type="number"
                                        min={100}
                                        max={2000}
                                        value={state.bgHeight ?? ""}
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            updateState({
                                                bgHeight: Number.isFinite(v)
                                                    ? v
                                                    : null,
                                                bgSizeMode: "custom",
                                            });
                                        }}
                                        className="h-7 px-2 rounded border border-border bg-background text-xs"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stroke & Fill */}
                <div className="mt-3 p-3 bg-card border rounded-xl shadow-sm space-y-3">
                    {/* Stroke */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs font-medium text-muted-foreground">
                                {t("strokeColorLabel")}
                            </Label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={state.strokeEnabled}
                                    onCheckedChange={(c) =>
                                        updateState({ strokeEnabled: c })}
                                    id="stroke-enable"
                                />
                                <Label
                                    htmlFor="stroke-enable"
                                    className="text-[10px] text-muted-foreground"
                                >
                                    {t("enableLabel")}
                                </Label>
                            </div>
                        </div>
                        <div
                            className={cn(
                                "space-y-2 transition-opacity",
                                !state.strokeEnabled && "opacity-50",
                            )}
                        >
                            <div className="flex bg-muted p-1 rounded-lg text-[11px]">
                                {(["single", "gradient", "multi"] as const).map(
                                    (mode) => (
                                        <button
                                            key={mode}
                                            onClick={() =>
                                                updateState({
                                                    strokeMode: mode,
                                                })}
                                            className={cn(
                                                "flex-1 py-1 text-[11px] font-medium rounded-md transition-all capitalize",
                                                state.strokeMode === mode
                                                    ? "bg-background shadow-sm text-foreground"
                                                    : "text-muted-foreground hover:text-foreground",
                                            )}
                                        >
                                            {strokeModeLabels[mode]}
                                        </button>
                                    ),
                                )}
                            </div>

                            {state.strokeMode === "single" && (
                                <ColorPicker
                                    value={state.stroke}
                                    onChange={(c) => updateState({ stroke: c })}
                                />
                            )}

                            {state.strokeMode === "gradient" && (
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <ColorPicker
                                            value={state.stroke}
                                            onChange={(c) =>
                                                updateState({ stroke: c })}
                                        />
                                    </div>
                                    <span className="text-muted-foreground">
                                        →
                                    </span>
                                    <div className="flex-1">
                                        <ColorPicker
                                            value={state.stroke2}
                                            onChange={(c) =>
                                                updateState({ stroke2: c })}
                                        />
                                    </div>
                                </div>
                            )}

                            {state.strokeMode === "multi" && (
                                <div className="space-y-1">
                                    <div className="bg-muted/30 border rounded-lg p-2 overflow-x-auto">
                                        <div className="flex gap-2 min-w-max pb-1">
                                            {state.text.split("").map((
                                                char,
                                                idx,
                                            ) => (
                                                <div
                                                    key={idx}
                                                    className="flex flex-col items-center min-w-6 gap-1"
                                                >
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                        {char}
                                                    </span>
                                                    <input
                                                        type="color"
                                                        value={state
                                                            .strokeCharColors[
                                                                idx
                                                            ] ||
                                                            state.stroke}
                                                        onChange={(e) =>
                                                            updateStrokeCharColor(
                                                                idx,
                                                                e.target.value,
                                                            )}
                                                        className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fill */}
                    <div className="pt-3 border-t space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground">
                            {t("fillModeLabel")}
                        </Label>
                        <div className="flex bg-muted p-1 rounded-lg">
                            {(["single", "gradient", "multi"] as const).map(
                                (mode) => (
                                    <button
                                        key={mode}
                                        onClick={() =>
                                            updateState({ fillMode: mode })}
                                        className={cn(
                                            "flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                                            state.fillMode === mode
                                                ? "bg-background shadow-sm text-foreground"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        {fillModeLabels[mode]}
                                    </button>
                                ),
                            )}
                        </div>

                        {state.fillMode === "single" && (
                            <ColorPicker
                                value={state.fill1}
                                onChange={(c) => updateState({ fill1: c })}
                            />
                        )}

                        {state.fillMode === "gradient" && (
                            <div className="flex gap-2 items-center">
                                <div className="flex-1">
                                    <ColorPicker
                                        value={state.fill1}
                                        onChange={(c) =>
                                            updateState({ fill1: c })}
                                    />
                                </div>
                                <span className="text-muted-foreground">→</span>
                                <div className="flex-1">
                                    <ColorPicker
                                        value={state.fill2}
                                        onChange={(c) =>
                                            updateState({ fill2: c })}
                                    />
                                </div>
                            </div>
                        )}

                        {state.fillMode === "multi" && (
                            <div className="space-y-1">
                                <div className="bg-muted/30 border rounded-lg p-2 overflow-x-auto">
                                    <div className="flex gap-2 min-w-max pb-1">
                                        {state.text.split("").map((
                                            char,
                                            idx,
                                        ) => (
                                            <div
                                                key={idx}
                                                className="flex flex-col items-center min-w-6 gap-1"
                                            >
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {char}
                                                </span>
                                                <input
                                                    type="color"
                                                    value={state
                                                        .charColors[idx] ||
                                                        state.fill1}
                                                    onChange={(e) =>
                                                        updateCharColor(
                                                            idx,
                                                            e.target.value,
                                                        )}
                                                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-right">
                                    {t("multiScrollHint")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Effects */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                    <div
                        className={cn(
                            "cursor-pointer border p-3 rounded-xl transition hover:border-indigo-300 hover:shadow-sm",
                            state.useGlow &&
                                "border-indigo-500 bg-indigo-50/50",
                        )}
                        onClick={() => updateState({ useGlow: !state.useGlow })}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">
                                {t("glowTitle")}
                            </span>
                            <Switch
                                checked={state.useGlow}
                                onCheckedChange={(c) =>
                                    updateState({ useGlow: c })}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            {t("glowDescription")}
                        </p>
                    </div>

                    <div
                        className={cn(
                            "cursor-pointer border p-3 rounded-xl transition hover:border-indigo-300 hover:shadow-sm",
                            state.useShadow &&
                                "border-indigo-500 bg-indigo-50/50",
                        )}
                        onClick={() =>
                            updateState({ useShadow: !state.useShadow })}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">
                                {t("shadowTitle")}
                            </span>
                            <Switch
                                checked={state.useShadow}
                                onCheckedChange={(c) =>
                                    updateState({ useShadow: c })}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            {t("shadowDescription")}
                        </p>
                    </div>
                </div>
            </details>
        </section>
    );
}
