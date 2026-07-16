import { describe, it, expect, vi } from "vitest";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";
import { Registry } from "@/lib/nodes/registry";
import { getAllCredentialTypes } from "@/lib/credentials";
import type { INodeProperties, INodeType, ICredentialType } from "@/lib/types";

// lib/db.ts opens an IndexedDB connection as a module-level side effect, which
// isn't available in this test environment. Registering all built-in nodes
// (via lib/nodes/register) transitively imports it through the DataTable
// node, so stub it out — this test only inspects node/credential shape.
vi.mock("idb", () => ({ openDB: () => Promise.resolve({}) }));

await import("@/lib/nodes/register");

type LocaleEntry = {
  properties?: Record<string, { options?: Record<string, string> }>;
};

// Flattens fixedCollection sub-properties (option.values) alongside top-level
// properties, since the locale key convention addresses them flat
// (nodes.<name>.properties.<subPropName>...), not double-nested.
function flattenProperties(
  properties: INodeProperties[],
): Map<string, INodeProperties> {
  const map = new Map<string, INodeProperties>();
  for (const prop of properties) {
    map.set(prop.name, prop);
    for (const opt of prop.options || []) {
      if (opt.values) {
        for (const [name, sub] of flattenProperties(opt.values)) {
          map.set(name, sub);
        }
      }
    }
  }
  return map;
}

function validOptionKeys(prop: INodeProperties): Set<string> {
  const keys = new Set<string>();
  for (const opt of prop.options || []) {
    keys.add(opt.value ?? opt.name);
    for (const child of opt.children || []) {
      keys.add(child.value);
    }
  }
  return keys;
}

describe("locale consistency", () => {
  it("does not re-introduce duplicate English node/credential strings in en.json", () => {
    // Node/credential definitions in lib/nodes/** and lib/credentials/** are
    // the English source of truth; en.json must not mirror them (that's what
    // caused the If node's description to drift from its code definition).
    expect((en as Record<string, unknown>).nodes).toBeUndefined();
    expect((en as Record<string, unknown>).credentialTypes).toBeUndefined();
  });

  it("every zh-CN.json node translation points at a real property/option", () => {
    const nodesByName = new Map<string, INodeType>();
    for (const node of Registry.getAll()) {
      nodesByName.set(node.description.name, node);
    }

    const zhNodes = (zhCN as { nodes: Record<string, LocaleEntry> }).nodes;
    for (const [nodeName, entry] of Object.entries(zhNodes)) {
      const node = nodesByName.get(nodeName);
      expect(
        node,
        `zh-CN.json has translations for unknown node "${nodeName}"`,
      ).toBeDefined();
      if (!node) continue;

      const propsByName = flattenProperties(node.description.properties);
      for (const [propName, propEntry] of Object.entries(
        entry.properties || {},
      )) {
        const prop = propsByName.get(propName);
        expect(
          prop,
          `zh-CN.json nodes.${nodeName}.properties.${propName} has no matching property`,
        ).toBeDefined();
        if (!prop) continue;

        if (propEntry.options) {
          const validKeys = validOptionKeys(prop);
          for (const key of Object.keys(propEntry.options)) {
            expect(
              validKeys.has(key),
              `zh-CN.json nodes.${nodeName}.properties.${propName}.options.${key} has no matching option`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("every zh-CN.json credential translation points at a real property", () => {
    const credsByName = new Map<string, ICredentialType>();
    for (const cred of getAllCredentialTypes()) {
      credsByName.set(cred.name, cred);
    }

    const zhCreds = (zhCN as { credentialTypes: Record<string, LocaleEntry> })
      .credentialTypes;
    for (const [credName, entry] of Object.entries(zhCreds)) {
      const cred = credsByName.get(credName);
      expect(
        cred,
        `zh-CN.json has translations for unknown credential "${credName}"`,
      ).toBeDefined();
      if (!cred) continue;

      const propNames = new Set(cred.properties.map((p) => p.name));
      for (const propName of Object.keys(entry.properties || {})) {
        expect(
          propNames.has(propName),
          `zh-CN.json credentialTypes.${credName}.properties.${propName} has no matching property`,
        ).toBe(true);
      }
    }
  });
});
