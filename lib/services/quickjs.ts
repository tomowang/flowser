import {
  newQuickJSWASMModule,
  QuickJSSyncVariant,
  QuickJSWASMModule,
} from "quickjs-emscripten";
import ReleaseSync from "@jitl/quickjs-wasmfile-release-sync";
import wasmUrl from "@jitl/quickjs-wasmfile-release-sync/wasm?url";
import { browser } from "wxt/browser";

let quickJS: QuickJSWASMModule | undefined;

export async function getQuickJS(): Promise<QuickJSWASMModule> {
  if (quickJS) {
    return quickJS;
  }

  try {
    // Create a custom variant that handles WASM loading for Vite
    const CustomVariant: QuickJSSyncVariant = {
      ...ReleaseSync,
      importModuleLoader: async () => {
        const moduleLoader = await ReleaseSync.importModuleLoader();
        const defaultFactory =
          "default" in moduleLoader
            ? (moduleLoader.default as (options?: unknown) => Promise<unknown>)
            : (moduleLoader as (options?: unknown) => Promise<unknown>);

        return async (options: Record<string, unknown> = {}) => {
          // Robust URL resolution for both dev and production
          let url = wasmUrl;
          if (
            !url.startsWith("http") &&
            !url.startsWith("chrome-extension") &&
            !url.startsWith("moz-extension") &&
            !url.startsWith("data:")
          ) {
            // Ensure path starts with / for getURL
            const path = url.startsWith("/") ? url : `/${url}`;
            url = browser.runtime.getURL(path);
          }

          try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const wasmBinary = await response.arrayBuffer();
            return defaultFactory({
              ...options,
              wasmBinary,
            });
          } catch (fetchError) {
            console.error(`Failed to fetch WASM from ${url}:`, fetchError);
            throw new Error(
              `Failed to fetch QuickJS WASM from ${url}. Ensure the file exists and is accessible.`
            );
          }
        };
      },
    };

    quickJS = await newQuickJSWASMModule(CustomVariant);
    return quickJS;
  } catch (e) {
    console.error("Failed to load QuickJS", e);
    throw new Error("Failed to initialize javascript sandbox environment");
  }
}
