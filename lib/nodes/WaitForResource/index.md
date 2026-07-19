# Wait For Resource

Waits for an element to appear, an HTTP request to complete, or an element to become visible in the viewport before continuing the workflow. Throws an error if the wait times out.

## Inputs

- **Main**: Input items

## Outputs

- **Main**: Same input items, once the wait condition is met

## Parameters

| Display Name      | Name           | Type    | Default | Description                                                              |
| ----------------- | -------------- | ------- | ------- | ------------------------------------------------------------------------ |
| Wait For          | waitFor        | options | element | `Element`, `HTTP Request`, or `Viewport`                                 |
| Tab ID            | tabId          | number  |         | The ID of the tab to wait on                                             |
| Selector Type     | selectorType   | options | css     | `CSS Selector` or `XPath` (Element/Viewport modes)                       |
| Selector          | selector       | string  |         | The selector of the element to wait for (Element/Viewport modes)         |
| URL Contains      | urlContains    | string  |         | Wait for a request whose URL contains this substring (HTTP Request mode) |
| Method            | method         | options | any     | Only match requests using this HTTP method (HTTP Request mode)           |
| Timeout (Seconds) | timeoutSeconds | number  | 30      | How long to wait before failing the node                                 |
