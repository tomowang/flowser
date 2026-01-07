import {
  newQuickJSWASMModule,
  QuickJSSyncVariant,
  QuickJSWASMModule,
} from "quickjs-emscripten";
import ReleaseSync from "@jitl/quickjs-wasmfile-release-sync";
import wasmUrl from "@jitl/quickjs-wasmfile-release-sync/wasm?url";

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
          "default" in moduleLoader ? moduleLoader.default : moduleLoader;
        return async (options: any = {}) => {
          const wasmBinary = await fetch(wasmUrl).then((r) => r.arrayBuffer());
          return (defaultFactory as any)({
            ...options,
            wasmBinary,
          });
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
