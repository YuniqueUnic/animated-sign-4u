export type ApiParamGroup =
    | "core"
    | "layout"
    | "fill"
    | "stroke"
    | "background"
    | "texture"
    | "effects"
    | "hanzi"
    | "gif"
    | "meta";

export interface ApiParamDef {
    /** Canonical long key used in documentation and as the primary query key. */
    name: string;
    /** Optional short key for compact URLs. */
    shortKey?: string;
    /**
     * Additional aliases for backwards compatibility.
     * All aliases, the canonical name, and the shortKey share the same semantic meaning.
     */
    aliases?: string[];
    /** Short English description for README tables. */
    description: string;
    group: ApiParamGroup;
}

export const API_PARAM_DEFS: ApiParamDef[] = [
    // Core text/font/theme/format
    {
        name: "text",
        shortKey: "t",
        description: "Signature text",
        group: "core",
    },
    {
        name: "font",
        shortKey: "f",
        description: "Font id from FONTS",
        group: "core",
    },
    {
        name: "theme",
        description: "Optional theme key from THEMES",
        group: "core",
    },
    {
        name: "repeat",
        shortKey: "r",
        description: "Whether the animation should loop",
        group: "core",
    },
    {
        name: "eraseOnComplete",
        shortKey: "eo",
        description: "Erase the signature after drawing (carousel mode)",
        group: "core",
    },

    // Layout / geometry
    {
        name: "fontSize",
        shortKey: "fs",
        description: "Font size (px)",
        group: "layout",
    },
    {
        name: "speed",
        shortKey: "sp",
        description: "Animation speed factor (larger = faster)",
        group: "layout",
    },
    {
        name: "charSpacing",
        shortKey: "cs",
        description: "Base character spacing",
        group: "layout",
    },
    {
        name: "borderRadius",
        shortKey: "br",
        description: "Card border radius",
        group: "layout",
    },
    {
        name: "cardPadding",
        shortKey: "cp",
        description: "Inner padding used by texture overlay",
        group: "layout",
    },
    {
        name: "bgSizeMode",
        shortKey: "bgs",
        description: "Background sizing mode (auto/custom)",
        group: "layout",
    },
    {
        name: "bgWidth",
        shortKey: "bw",
        description: "Custom background/card width",
        group: "layout",
    },
    {
        name: "bgHeight",
        shortKey: "bh",
        description: "Custom background/card height",
        group: "layout",
    },

    // Background
    {
        name: "bg",
        description: "Background color or 'transparent'",
        group: "background",
    },
    {
        name: "bgMode",
        shortKey: "bm",
        description: "Background mode (solid/gradient)",
        group: "background",
    },
    {
        name: "bg2",
        description: "Secondary background color for gradients",
        group: "background",
    },

    // Fill
    {
        name: "fill",
        shortKey: "fm",
        description: "Fill mode (single/gradient/multi)",
        group: "fill",
    },
    {
        name: "fill1",
        shortKey: "f1",
        description: "Primary fill color",
        group: "fill",
    },
    {
        name: "fill2",
        shortKey: "f2",
        description: "Secondary fill color",
        group: "fill",
    },
    {
        name: "colors",
        shortKey: "cl",
        description: "Per-character fill colors (enables multi mode)",
        group: "fill",
    },

    // Stroke
    {
        name: "stroke",
        shortKey: "st",
        description: "Primary stroke color",
        group: "stroke",
    },
    {
        name: "stroke2",
        shortKey: "st2",
        description: "Secondary stroke color",
        group: "stroke",
    },
    {
        name: "strokeMode",
        shortKey: "sm",
        description: "Stroke mode (single/gradient/multi)",
        group: "stroke",
    },
    {
        name: "strokeEnabled",
        shortKey: "se",
        description: "Toggle stroke on/off",
        group: "stroke",
    },
    {
        name: "linkFillStroke",
        shortKey: "lfs",
        description: "Link stroke behavior to fill mode/colors",
        group: "stroke",
    },

    // Texture
    {
        name: "texture",
        shortKey: "tx",
        description: "Texture overlay type",
        group: "texture",
    },
    {
        name: "texColor",
        shortKey: "txc",
        description: "Texture color",
        group: "texture",
    },
    {
        name: "texSize",
        shortKey: "txs",
        description: "Texture scale",
        group: "texture",
    },
    {
        name: "texThickness",
        shortKey: "txt",
        description: "Texture line thickness",
        group: "texture",
    },
    {
        name: "texOpacity",
        shortKey: "txo",
        description: "Texture opacity (0..1)",
        group: "texture",
    },

    // Effects
    {
        name: "useGlow",
        shortKey: "gl",
        description: "Enable glow effect",
        group: "effects",
    },
    {
        name: "useShadow",
        shortKey: "sh",
        description: "Enable shadow effect",
        group: "effects",
    },

    // Hanzi / stroke data
    {
        name: "useHanziData",
        shortKey: "hz",
        description: "Use Hanzi stroke data for Chinese characters",
        group: "hanzi",
    },

    // GIF export
    {
        name: "gifFps",
        shortKey: "gf",
        description: "GIF frame rate (fps)",
        group: "gif",
    },
    {
        name: "gifQuality",
        shortKey: "gq",
        description: "GIF quality (1-20, higher is better)",
        group: "gif",
    },

    // Meta / output
    {
        name: "format",
        shortKey: "fmt",
        description: "Output format (svg/png/gif/json)",
        group: "meta",
    },
    {
        name: "static",
        shortKey: "sta",
        description: "Request a static snapshot when using SVG output",
        group: "meta",
    },
];

export const API_PARAM_BY_NAME: Record<string, ApiParamDef> = {};
export const API_PARAM_BY_KEY: Record<string, ApiParamDef> = {};

(function initMappings() {
    const nameSet = new Set<string>();
    const keySet = new Set<string>();

    for (const def of API_PARAM_DEFS) {
        if (nameSet.has(def.name)) {
            throw new Error(
                `[api-params] Duplicate param name detected: "${def.name}"`,
            );
        }
        nameSet.add(def.name);
        API_PARAM_BY_NAME[def.name] = def;

        const keys: string[] = [def.name];
        if (def.shortKey) keys.push(def.shortKey);
        if (def.aliases && def.aliases.length > 0) {
            keys.push(...def.aliases);
        }

        for (const key of keys) {
            if (keySet.has(key)) {
                throw new Error(
                    `[api-params] Duplicate param key "${key}" used by "${def.name}"`,
                );
            }
            keySet.add(key);
            API_PARAM_BY_KEY[key] = def;
        }
    }
})();

/**
 * Resolve the outgoing query key for a given canonical parameter name.
 * Falls back to the name itself when no definition is registered.
 */
export function getOutgoingKey(name: string, useShort: boolean): string {
    const def = API_PARAM_BY_NAME[name];
    if (!def) return name;
    if (useShort && def.shortKey) return def.shortKey;
    return def.name;
}

/**
 * Read a value from URLSearchParams for a given canonical parameter name.
 * It will try the canonical name, all aliases, and the short key.
 */
export function getIncomingValue(
    params: URLSearchParams,
    name: string,
): string | null {
    const def = API_PARAM_BY_NAME[name];
    if (!def) return params.get(name);

    const keys: string[] = [def.name];
    if (def.aliases && def.aliases.length > 0) {
        keys.push(...def.aliases);
    }
    if (def.shortKey) {
        keys.push(def.shortKey);
    }

    for (const key of keys) {
        const v = params.get(key);
        if (v !== null) return v;
    }

    return null;
}
