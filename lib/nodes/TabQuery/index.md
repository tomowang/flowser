# Tab Query

Query browser tabs matching specific criteria.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Matching tab objects

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Title Pattern | title | string | | Match page titles against a pattern (e.g. `*Google*`) |
| URL Pattern | url | string | | Match tabs against a URL pattern (e.g. `*google.com*`) |
| Active | active | options | any | Filter by active state: `Any`, `Yes`, `No` |
| Status | tabStatus | options | any | Filter by loading status: `Any`, `Unloaded`, `Loading`, `Complete` |
