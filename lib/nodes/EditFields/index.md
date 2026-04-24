# Edit Fields

Edit, add, or remove fields from the input items.

## Inputs
- **Main**: Input items to process

## Outputs
- **Main**: Modified items

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Mode | mode | options | mapping | `Mapping (Merge)` to merge with existing fields, or `Keep Only Set` to discard existing fields |
| Fields | fields | fixedCollection | | Define keys and values (String, Number, Boolean, JSON) to add or modify |
