# Data Table

Retrieve rows from an internal Flowser Data Table.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Table rows

When the table is empty or no rows match the filter, this node returns no items and following nodes do not run by default. Enable **Always Output Data** in the node's properties to emit one empty item instead. The empty item contains no table columns, so check for a required field before using row values. A missing table name still raises an error; this setting does not suppress errors.

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Table Name or ID | table | string | | Name or UUID of the table |
| Filter | filter | json | `{}` | Filter object (e.g., `{ "category": "news" }`) |
| Limit | limit | number | 0 | Max number of rows (0 for no limit) |
