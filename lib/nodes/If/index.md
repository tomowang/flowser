# If

Splits a flow into two branches based on conditional logic.

## Inputs
- **Main**: Items to evaluate

## Outputs
- **True**: Items that meet the conditions
- **False**: Items that do not meet the conditions

Only outputs containing items run their connected nodes. An unused branch stays empty even when **Always Output Data** is enabled, as long as the other branch contains items. If both outputs are empty and the setting is enabled, one empty item is emitted on the first (**True**) output; it is not evaluated against the conditions.

To handle a query that finds nothing, enable **Always Output Data** on the query node, then check for a missing result field here (for example, whether `id` is empty after Tab Query). Enabling the setting only on this If node cannot make it run when the preceding query emits no items.

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Combinator | combinator | options | all | `All (AND)` or `Any (OR)` |
| Conditions | conditions | fixedCollection | | List of conditions (String, Number, Date, Boolean, etc.) |
