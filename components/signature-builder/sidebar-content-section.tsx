import React from "react";
import { SignatureState } from "@/lib/types";
import { FONTS } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, PenTool } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

interface ContentFontSectionProps {
  state: SignatureState;
  updateState: (updates: Partial<SignatureState>) => void;
  onFontUpload: (file: File) => void;
}

export function ContentFontSection({
  state,
  updateState,
  onFontUpload,
}: ContentFontSectionProps) {
  const { t } = useI18n();
  return (
    <section className="space-y-3">
      <details open className="group">
        <summary className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 cursor-pointer">
          <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <PenTool className="w-3 h-3" />
          </span>
          <span>{t("contentFontSectionTitle")}</span>
          <ChevronDown className="ml-auto w-3 h-3 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="mt-3 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {t("signatureTextLabel")}
            </Label>
            <Input
              value={state.text}
              onChange={(e) => updateState({ text: e.target.value })}
              placeholder="Enter text..."
              className="font-medium"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {t("fontFamilyLabel")}
            </Label>
            <Select
              value={state.font}
              onValueChange={(val) =>
                val === "custom"
                  ? document.getElementById("font-upload")
                    ?.click()
                  : updateState({ font: val })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-2 border-border shadow-xl max-h-[300px] overflow-y-auto">
                <SelectGroup>
                  <SelectLabel>
                    {t("fontCategoryScript")}
                  </SelectLabel>
                  {FONTS.filter((f) => f.category.includes("Script")).map(
                    (f) => (
                      <SelectItem
                        key={f.value}
                        value={f.value}
                        className="bg-popover hover:bg-accent"
                      >
                        {f.label}
                      </SelectItem>
                    ),
                  )}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>
                    {t("fontCategoryBrand")}
                  </SelectLabel>
                  {FONTS.filter((f) => f.category.includes("Brand")).map(
                    (f) => (
                      <SelectItem
                        key={f.value}
                        value={f.value}
                        className="bg-popover hover:bg-accent"
                      >
                        {f.label}
                      </SelectItem>
                    ),
                  )}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>
                    {t("fontCategoryLocal")}
                  </SelectLabel>
                  {FONTS.filter((f) => f.category.includes("Local")).map(
                    (f) => (
                      <SelectItem
                        key={f.value}
                        value={f.value}
                        className="bg-popover hover:bg-accent"
                      >
                        {f.label}
                      </SelectItem>
                    ),
                  )}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>
                    {t("fontCategoryCustom")}
                  </SelectLabel>
                  <SelectItem
                    value="custom"
                    className="bg-popover hover:bg-accent"
                  >
                    {t("uploadFontLabel")}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <input
              type="file"
              id="font-upload"
              className="hidden"
              accept=".ttf,.otf,.woff"
              onChange={(e) =>
                e.target.files?.[0] &&
                onFontUpload(e.target.files[0])}
            />
          </div>
        </div>
      </details>
    </section>
  );
}
