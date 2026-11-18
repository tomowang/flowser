# Placeholder

Passes input data through to the output unchanged. Useful as a stand-in for a step you haven't built yet, or as a junction point in a workflow graph.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Same input items, unmodified

With **Always Output Data** off (the default), an empty input produces no output items. When the node executes with this setting enabled and has no input items, it emits one empty item (`{ json: {} }`). In a full run, enable the setting on the upstream node producing no items if you need this Placeholder to run at all.

## Parameters

None.
