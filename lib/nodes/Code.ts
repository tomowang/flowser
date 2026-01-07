import { getQuickJS } from "../services/quickjs";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { Code2 } from "lucide-vue-next";

export const Code: INodeType = {
  description: {
    displayName: "Code",
    name: "code",
    icon: Code2,
    group: ["development"],
    version: 1,
    description: "Executes custom JavaScript code",
    defaults: {
      name: "Code",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Code",
        name: "code",
        type: "code", // Uses Monaco editor in UI
        default:
          "// Use 'items' to access input data\n// Return an array of objects\nreturn items;",
        description: "The JavaScript code to execute.",
        required: true,
      },
    ],
  },

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const code = this.getNodeParameter("code", "") as string;

    if (!code) {
      return [items];
    }

    let quickJS;
    try {
      quickJS = await getQuickJS();
    } catch (e) {
      console.error("Failed to load QuickJS", e);
      throw new Error("Failed to initialize javascript sandbox environment");
    }

    const runtime = quickJS.newRuntime();
    const context = runtime.newContext();

    try {
      // 1. Serialize input data to pass into VM
      const inputJson = JSON.stringify(items);

      // 2. Define a helper in VM to get the input
      // We'll wrap the user code in a function: function(items) { user_code }
      // But standard QuickJS eval is easier if we set a global variable `items`
      // OR we can pass it as an argument to a wrapped function.
      // Let's use a wrapped function approach for cleaner scope.

      // Inject console.log support (optional, but helpful)
      const logHandle = context.newFunction("log", (...args) => {
        const nativeArgs = args.map(context.dump);
        console.log("QuickJS:", ...nativeArgs);
      });
      const consoleHandle = context.newObject();
      context.setProp(consoleHandle, "log", logHandle);
      context.setProp(context.global, "console", consoleHandle);

      // Dispose handles to prevent leak
      logHandle.dispose();
      consoleHandle.dispose();

      // Prepare input 'items'
      const itemsHandle = context.newString(inputJson);
      const parseHandle = context.getProp(context.global, "JSON");
      const parseFunc = context.getProp(parseHandle, "parse");
      const itemsObjHandle = context.callFunction(
        parseFunc,
        parseHandle,
        itemsHandle,
      );

      // Cleanup intermediate handles
      itemsHandle.dispose();
      parseHandle.dispose();
      parseFunc.dispose();

      if (itemsObjHandle.error) {
        itemsObjHandle.error.dispose();
        throw new Error(
          "Internal error: could not serialize input for QuickJS",
        );
      }

      // Expose 'items' as a global variable? Or wrap?
      // "return items;" suggests function body.
      // Let's wrap: (function(items) { ... user code ... })(items)
      const wrappedCode = `(function(items) { ${code} })`;

      const resultHandle = context.evalCode(wrappedCode);
      if (resultHandle.error) {
        const error = context.dump(resultHandle.error);
        resultHandle.error.dispose();
        // Try to get stack trace if available?
        throw new Error(
          `Script execution failed: ${error.name}: ${error.message}`,
        );
      }

      // resultHandle.value is the Function object
      const funcHandle = resultHandle.value;
      const executionResultHandle = context.callFunction(
        funcHandle,
        context.undefined,
        itemsObjHandle.value,
      );

      funcHandle.dispose(); // Done with the function itself
      itemsObjHandle.value.dispose(); // Done with inputs

      if (executionResultHandle.error) {
        const error = context.dump(executionResultHandle.error);
        executionResultHandle.error.dispose();
        throw new Error(
          `Runtime error in script: ${error.name}: ${error.message}`,
        );
      }

      const outputHandle = executionResultHandle.value;
      const output = context.dump(outputHandle);
      outputHandle.dispose();

      // QuickJS dump returns primitive objects.
      // We expect INodeExecutionData[]

      if (!Array.isArray(output)) {
        throw new Error("Script must return an array of items");
      }

      return [output as INodeExecutionData[]];
    } catch (e: any) {
      throw e;
    } finally {
      context.dispose();
      runtime.dispose();
    }
  },
};
