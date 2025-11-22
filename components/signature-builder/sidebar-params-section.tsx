import React from "react";
import { SignatureState } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Settings2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

interface ParamsSectionProps {
    state: SignatureState;
    updateState: (updates: Partial<SignatureState>) => void;
}

export function ParamsSection({ state, updateState }: ParamsSectionProps) {
    const { t } = useI18n();
    return (
        <section className="space-y-4">
            <details open className="group">
                <summary className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 cursor-pointer">
                    <span className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Settings2 className="w-3 h-3" />
                    </span>
                    <span>{t("paramsSectionTitle")}</span>
                    <ChevronDown className="ml-auto w-3 h-3 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="mt-3 space-y-5">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">
                                {t("fontSizeLabel")}
                            </span>
                            <span className="text-indigo-600 font-mono">
                                {state.fontSize}px
                            </span>
                        </div>
                        <Slider
                            min={8}
                            max={400}
                            value={[state.fontSize]}
                            onValueChange={([v]) =>
                                updateState({ fontSize: v })}
                            className="**:data-[slot=slider-track]:bg-slate-200 **:data-[slot=slider-track]:h-2 **:data-[slot=slider-range]:bg-indigo-500 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-indigo-500 **:data-[slot=slider-thumb]:shadow-lg **:data-[slot=slider-thumb]:w-5 **:data-[slot=slider-thumb]:h-5"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">
                                {t("charSpacingLabel")}
                            </span>
                            <span className="text-indigo-600 font-mono">
                                {state.charSpacing}px
                            </span>
                        </div>
                        <Slider
                            min={-100}
                            max={100}
                            value={[state.charSpacing || 0]}
                            onValueChange={([v]) =>
                                updateState({ charSpacing: v })}
                            className="**:data-[slot=slider-track]:bg-slate-200 **:data-[slot=slider-track]:h-2 **:data-[slot=slider-range]:bg-indigo-500 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-indigo-500 **:data-[slot=slider-thumb]:shadow-lg **:data-[slot=slider-thumb]:w-5 **:data-[slot=slider-thumb]:h-5"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">
                                {t("animationSpeedLabel")}
                            </span>
                            <span className="text-indigo-600 font-mono">
                                {state.speed.toFixed(2)}x
                            </span>
                        </div>
                        <Slider
                            min={0.1}
                            max={24}
                            step={0.1}
                            value={[state.speed]}
                            onValueChange={([v]) => updateState({ speed: v })}
                            className="**:data-[slot=slider-track]:bg-slate-200 **:data-[slot=slider-track]:h-2 **:data-[slot=slider-range]:bg-indigo-500 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-indigo-500 **:data-[slot=slider-thumb]:shadow-lg **:data-[slot=slider-thumb]:w-5 **:data-[slot=slider-thumb]:h-5"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-xs text-muted-foreground">
                                {t("hanziStrokeModeLabel")}
                            </Label>
                            <p className="text-[10px] text-muted-foreground/70">
                                {t("hanziStrokeModeDescription")}
                            </p>
                        </div>
                        <Switch
                            checked={state.useHanziData ?? false}
                            onCheckedChange={(checked) =>
                                updateState({ useHanziData: checked })}
                        />
                    </div>

                    {/* GIF Export Settings */}
                    <div className="pt-3 border-t border-slate-200/60">
                        <div className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                            {t("gifExportSettings")}
                        </div>
                        <div className="space-y-4">
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
                                    onValueChange={([v]) =>
                                        updateState({ gifFps: v })}
                                    className="**:data-[slot=slider-track]:bg-slate-200 **:data-[slot=slider-track]:h-2 **:data-[slot=slider-range]:bg-indigo-500 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-indigo-500 **:data-[slot=slider-thumb]:shadow-lg **:data-[slot=slider-thumb]:w-5 **:data-[slot=slider-thumb]:h-5"
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
                                    onValueChange={([v]) =>
                                        updateState({ gifQuality: v })}
                                    className="**:data-[slot=slider-track]:bg-slate-200 **:data-[slot=slider-track]:h-2 **:data-[slot=slider-range]:bg-indigo-500 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-indigo-500 **:data-[slot=slider-thumb]:shadow-lg **:data-[slot=slider-thumb]:w-5 **:data-[slot=slider-thumb]:h-5"
                                />
                                <p className="text-[10px] text-muted-foreground/70">
                                    {t("gifQualityDescription")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </details>
        </section>
    );
}
