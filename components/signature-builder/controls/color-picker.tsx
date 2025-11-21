import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-state";

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Debounce delay in ms (default: 100). Set to 0 to disable debouncing */
  debounceMs?: number;
}

export function ColorPicker({
  label,
  value,
  onChange,
  className,
  debounceMs = 100,
}: ColorPickerProps) {
  // Local state for instant visual feedback
  const [localColor, setLocalColor] = useState(value);

  // Debounced callback for actual state update
  const debouncedOnChange = useDebouncedCallback(onChange, debounceMs);

  // Update local state when prop value changes externally
  React.useEffect(() => {
    setLocalColor(value);
  }, [value]);

  const handleColorChange = (newColor: string) => {
    // Update local state immediately for instant visual feedback
    setLocalColor(newColor);
    // Trigger debounced state update
    debouncedOnChange(newColor);
  };

  return (
    <div className={className}>
      {label && (
        <Label className="text-xs text-muted-foreground mb-1.5 block">
          {label}
        </Label>
      )}
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-border shadow-sm hover:scale-105 transition-transform">
          <input
            type="color"
            value={localColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded select-all">
          {localColor}
        </span>
      </div>
    </div>
  );
}
