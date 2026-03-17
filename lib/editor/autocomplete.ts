import { CompletionContext, Completion } from "@codemirror/autocomplete";
import { javascriptLanguage } from "@codemirror/lang-javascript";

export function getCodeCompletions(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const options: Completion[] = [
    { label: "items", type: "variable", info: "The input data from the previous node." },
    { label: "console", type: "object", info: "The console object for logging." },
    { label: "console.log", type: "function", info: "Outputs a message to the console." },
    { label: "JSON", type: "object", info: "The global JSON object." },
    { label: "JSON.stringify", type: "function", info: "Converts a JavaScript value to a JSON string." },
    { label: "JSON.parse", type: "function", info: "Parses a JSON string, constructing the JS value." },
  ];

  return {
    from: word.from,
    options: options.filter(o => o.label.startsWith(word!.text)),
  };
}

export function getExpressionCompletions(context: CompletionContext) {
  // Expressions usually start with $ or have $ words
  const word = context.matchBefore(/\$?\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const options: Completion[] = [
    { label: "$", type: "function", info: "Access other nodes' data: $(\"Node Name\").item.json" },
    { label: "$json", type: "variable", info: "The JSON data of the current item." },
    { label: "$input", type: "variable", info: "Input data helpers. e.g. $input.item, $input.all()" },
    { label: "$itemIndex", type: "variable", info: "The index of the current item being processed." },
  ];

  return {
    from: word.from,
    options: options.filter(o => o.label.startsWith(word!.text)),
  };
}

export const codeAutocompleteExtension = javascriptLanguage.data.of({ autocomplete: getCodeCompletions });
export const expressionAutocompleteExtension = javascriptLanguage.data.of({ autocomplete: getExpressionCompletions });
