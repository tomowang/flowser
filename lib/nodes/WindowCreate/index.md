# Window Create

Create a new browser window.

## Inputs
- **Main**: Trigger items

## Outputs
- **Main**: Created window information

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| URL | url | string | | The URL to navigate the window to |
| Type | type | options | normal | Window type: `Normal`, `Popup`, or `Panel` |
| State | state | options | normal | Initial state: `Normal`, `Minimized`, `Maximized`, or `Fullscreen` |
| Focused | focused | boolean | true | Whether the window should be focused |
| Incognito | incognito | boolean | false | Whether the window should be incognito |
