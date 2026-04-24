# Window Close

Close a specific window.

## Inputs
- **Main**: Main input.

## Outputs
- **Main**: Main output.

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Window ID | windowId | string | | The ID of the window to close |

## Usage

When executed, this node attempts to close the window with the specified ID.

### Output JSON
If successful:
```json
{
  "closed": true,
  "windowId": 123
}
```
If the Window ID is invalid or not provided:
```json
{
  "closed": false,
  "windowIdInput": "..."
}
```
