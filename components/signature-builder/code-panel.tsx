import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignatureState } from "@/lib/types";
import { codeToHtml } from "shiki";
import { buildSignApiUrl } from "@/lib/api-url";

interface CodePanelProps {
  svgCode: string;
  state: SignatureState;
}

export function CodePanel({ svgCode, state }: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("svg");
  const [highlightedCode, setHighlightedCode] = useState("");
  const [wrapCode, setWrapCode] = useState(false);

  const handleCopy = () => {
    const code = getCode(activeTab);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCode = (type: string) => {
    if (!svgCode && type !== "api") return "";

    const cleanSvg = svgCode.replace(
      /<svg([^>]*)style="[^"]*"([^>]*)>/,
      "<svg$1$2>",
    );
    const bgVal = state.bgTransparent ? "transparent" : state.bg;

    if (type === "api") {
      const animatedUrl = buildSignApiUrl(state, { format: "svg" });
      const staticUrl = buildSignApiUrl(state, { format: "svg", static: true });
      const gifUrl = buildSignApiUrl(state, { format: "gif" });

      return [
        "// Animated SVG",
        animatedUrl,
        "",
        "// Static SVG",
        staticUrl,
        "",
        "// Animated GIF",
        gifUrl,
      ].join("\n");
    } else if (type === "react") {
      const jsx = cleanSvg
        .replace(/class="/g, 'className="')
        .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        .replace(/style="([^"]*)"/g, "style={{$1}}");

      return `export default function Signature() {
  return (
    <div style={{
      display: 'inline-block',
      padding: '20px',
      backgroundColor: '${bgVal}',
      borderRadius: '${state.borderRadius}px'
    }}>
      ${jsx}
    </div>
  );
}`;
    } else if (type === "vue") {
      return `<template>
  <div class="sig-card">
    ${cleanSvg}
  </div>
</template>

<style scoped>
.sig-card {
  display: inline-block;
  padding: 20px;
  background-color: ${bgVal};
  border-radius: ${state.borderRadius}px;
}
</style>`;
    } else if (type === "js") {
      return `// Native JavaScript Implementation
const createSignature = () => {
  const container = document.getElementById('signature-container');
  if (!container) return;
  
  container.innerHTML = \`
    <div style="display:inline-block; padding:20px; background-color:${bgVal}; border-radius:${state.borderRadius}px;">
      ${cleanSvg}
    </div>
  \`;
};

// Usage: createSignature();
export { createSignature };`;
    }
    return svgCode;
  };

  useEffect(() => {
    const highlight = async () => {
      const code = getCode(activeTab);
      if (!code) {
        setHighlightedCode("");
        return;
      }

      let lang = "html";
      if (activeTab === "react" || activeTab === "js") lang = "javascript";
      if (activeTab === "vue") lang = "vue";
      if (activeTab === "api") lang = "text";

      try {
        const html = await codeToHtml(code, {
          lang,
          theme: "github-dark",
        });
        setHighlightedCode(html);
      } catch {
        setHighlightedCode(`<pre><code>${code}</code></pre>`);
      }
    };
    highlight();
  }, [svgCode, activeTab, state]);

  return (
    <div className="bg-[#0d1117] flex flex-col h-full overflow-hidden border-t border-border/50">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-8 bg-[#21262d] p-0.5 gap-0.5">
            {["svg", "react", "vue", "js", "api"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="text-xs h-full px-3 text-[#c9d1d9] data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded font-medium uppercase tracking-wide transition-all hover:text-white"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWrapCode((w) => !w)}
            className="h-7 text-xs text-[#c9d1d9] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            {wrapCode ? "No wrap" : "Wrap"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs text-[#c9d1d9] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            {copied
              ? <Check className="w-3 h-3 mr-1.5 text-green-400" />
              : <Copy className="w-3 h-3 mr-1.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-auto">
        <div
          className={"p-4 text-sm font-mono leading-relaxed " +
            (wrapCode
              ? "[&_pre]:whitespace-pre-wrap [&_code]:whitespace-pre-wrap wrap-break-word"
              : "overflow-x-auto [&_pre]:whitespace-pre [&_code]:whitespace-pre")}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>
    </div>
  );
}
