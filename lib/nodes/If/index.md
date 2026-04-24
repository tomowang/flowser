# If

Splits a flow into two branches based on conditional logic.

## Inputs
- **Main**: Items to evaluate

## Outputs
- **True**: Items that meet the conditions
- **False**: Items that do not meet the conditions

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Combinator | combinator | options | all | `All (AND)` or `Any (OR)` |
| Conditions | conditions | fixedCollection | | List of conditions (String, Number, Date, Boolean, etc.) |
