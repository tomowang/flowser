# Tab Group Query

Query browser tab groups.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Matching tab group objects

When no groups match, this node returns no items and following nodes do not run by default. Enable **Always Output Data** in the node's properties to emit an empty item instead. A following **If** node can check whether `id` is empty and create a group when needed.

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Title Pattern | title | string | | Match group titles against a pattern |
