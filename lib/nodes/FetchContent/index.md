# Fetch Content

Fetch text or HTML content from a web page using selectors.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Fetched content items

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Tab ID | tabId | number | | The ID of the tab to fetch content from |
| Selector Type | selectorType | options | css | `CSS Selector` or `XPath` |
| Selector | selector | string | | The selector of the element to fetch |
| Content Type | contentType | options | text | `Text` or `HTML` |
| Multiple | multiple | boolean | true | Fetch all matched elements |
