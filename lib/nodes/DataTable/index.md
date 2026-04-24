# Data Table

Retrieve rows from an internal Flowser Data Table.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Table rows

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Table Name or ID | table | string | | Name or UUID of the table |
| Filter | filter | json | `{}` | Filter object (e.g., `{ "category": "news" }`) |
| Limit | limit | number | 0 | Max number of rows (0 for no limit) |
