# Tab Query

Query browser tabs matching specific criteria.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Matching tab objects

When no tabs match, this node returns no items and following nodes do not run by default. Enable **Always Output Data** in the node's properties to emit one empty item instead. A following **If** node can check whether `id` is empty before using a tab ID.

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Title Pattern | title | string | | Match page titles against a pattern (e.g. `*Google*`) |
| URL Pattern | url | string | | Match tabs against a URL pattern (e.g. `*google.com*`) |
| Active | active | options | any | Filter by active state: `Any`, `Yes`, `No` |
| Status | tabStatus | options | any | Filter by loading status: `Any`, `Unloaded`, `Loading`, `Complete` |
