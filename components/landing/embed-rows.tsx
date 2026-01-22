"use client";

import React, { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export interface EmbedRowsProps {
  imageUrl: string;
  variant?: "default" | "editorial";
}

type RowKey = "markdown" | "html" | "url";

function buildRowValue(key: RowKey, imageUrl: string): string {
  switch (key) {
    case "markdown":
      return `![signature](${imageUrl})`;
    case "html":
      return `<img src="${imageUrl}" alt="signature" />`;
    case "url":
      return imageUrl;
  }
}

export function EmbedRows({ imageUrl, variant = "default" }: EmbedRowsProps) {
  const { t } = useI18n();
  const rows = useMemo(
    () =>
      ([
        { key: "markdown", label: "Markdown" },
        { key: "html", label: "HTML" },
        { key: "url", label: "URL" },
      ] as const),
    [],
  );

  const [copiedKey, setCopiedKey] = useState<RowKey | null>(null);

  const handleCopy = async (key: RowKey) => {
    const value = buildRowValue(key, imageUrl);
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      // fall back: do nothing (clipboard may be blocked)
    }
  };

  if (variant === "editorial") {
    return (
      <div className="space-y-4">
        {rows.map((row) => {
          const value = buildRowValue(row.key, imageUrl);
          const copied = copiedKey === row.key;
          return (
            <div
              key={row.key}
              className="group border border-gray-200 dark:border-gray-800 flex items-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <div className="w-24 px-4 py-3 text-[10px] uppercase font-bold border-r border-gray-200 dark:border-gray-800 text-[#1a1a1a] dark:text-white">
                {row.label}
              </div>
              <div className="flex-1 px-4 py-3 font-mono text-xs text-gray-500 truncate italic">
                {value}
              </div>
              <button
                type="button"
                onClick={() => handleCopy(row.key)}
                className={cn(
                  "px-4 py-3 border-l border-gray-200 dark:border-gray-800 hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center justify-center",
                  copied && "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                )}
              >
                {copied ? (
                  <Check className="w-[18px] h-[18px]" />
                ) : (
                  <Copy className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const value = buildRowValue(row.key, imageUrl);
        const copied = copiedKey === row.key;
        return (
          <div
            key={row.key}
            className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2"
          >
            <div className="w-24 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {row.label}
            </div>
            <div className="flex-1 min-w-0">
              <Input
                readOnly
                value={value}
                onFocus={(e) => e.currentTarget.select()}
                className="h-9 font-mono text-xs"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(row.key)}
              className={cn(
                "h-9 px-3 text-xs",
                copied && "border-emerald-500 text-emerald-600",
              )}
            >
              {copied
                ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    {t("landingCopiedLabel")}
                  </>
                )
                : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    {t("landingCopyLabel")}
                  </>
                )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
