# Window Query

Query browser windows matching specific criteria.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Matching window objects

When no windows match, this node returns no items and following nodes do not run by default. Enable **Always Output Data** in the node's properties to emit one empty item instead. A following **If** node can check whether `id` is empty before using a window ID.

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Populate Tabs | populate | boolean | false | Include tab objects in the result |
| Window Types | windowTypes | options | any | `Any`, `Normal`, `Popup`, `Panel`, `App`, `DevTools` |
