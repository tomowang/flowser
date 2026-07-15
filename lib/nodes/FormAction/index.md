# Fill Form

Fills in form fields on a web page — text inputs, textareas, password fields, `<select>` (single or multi), checkboxes, and radio buttons.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Result information, including per-field success/error status

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Tab ID | tabId | number | | The ID of the tab containing the form |
| Fields | fields | fixedCollection | | The list of form fields to fill |

### Field row parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Selector Type | selectorType | options | css | `CSS Selector` or `XPath` |
| Selector | selector | string | | The selector of the form element to fill |
| Field Type | fieldType | options | text | `Text / Textarea / Password`, `Select`, `Checkbox`, or `Radio` |
| Value | value | string | | For text fields, the value to type. For select, the option value to choose (comma-separated for multi-select). For radio, the `value` attribute of the option to check. Hidden for checkbox fields. |
| Checked | checked | boolean | true | Whether the checkbox should be checked. Only shown for checkbox fields. |
