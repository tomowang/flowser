# Click Element

Simulates a click on an element on a web page.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Input items for valid Tab IDs, passed through unchanged

If every input item has a missing or invalid Tab ID, this node returns no items and following nodes do not run by default. **Always Output Data** can emit one empty item so the branch continues, but it does not click anything or restore the input fields. If a valid tab has no matching elements, the input item is still passed through.

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Tab ID | tabId | number | | The ID of the tab containing the element |
| Selector Type | selectorType | options | css | `CSS Selector` or `XPath` |
| Selector | selector | string | | The selector of the element to click |
| Multiple | multiple | boolean | false | Click all matched elements |
