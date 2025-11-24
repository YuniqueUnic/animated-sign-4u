import { describe, expect, it } from "vitest";

import {
  API_PARAM_BY_KEY,
  API_PARAM_BY_NAME,
  API_PARAM_DEFS,
} from "@/lib/api-params";

describe("API param mapping", () => {
  it("contains unique names and keys (no duplicates)", () => {
    const names = new Set<string>();
    const keys = new Set<string>();

    for (const def of API_PARAM_DEFS) {
      expect(def.name).toBeTruthy();
      expect(def.group).toBeTruthy();

      expect(names.has(def.name)).toBe(false);
      names.add(def.name);

      const k: string[] = [def.name];
      if (def.shortKey) k.push(def.shortKey);
      if (def.aliases) k.push(...def.aliases);

      for (const key of k) {
        expect(keys.has(key)).toBe(false);
        keys.add(key);
      }
    }
  });

  it("exposes consistent lookup indexes", () => {
    for (const def of API_PARAM_DEFS) {
      expect(API_PARAM_BY_NAME[def.name]).toBe(def);
      const allKeys: string[] = [def.name];
      if (def.shortKey) allKeys.push(def.shortKey);
      if (def.aliases) allKeys.push(...def.aliases);

      for (const key of allKeys) {
        expect(API_PARAM_BY_KEY[key]).toBe(def);
      }
    }
  });
});
