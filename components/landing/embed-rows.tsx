"use client";

import React, { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface EmbedRowsProps {
  imageUrl: string;
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

export function EmbedRows({ imageUrl }: EmbedRowsProps) {
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
                    已复制
                  </>
                )
                : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    复制
                  </>
                )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

