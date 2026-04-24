# Schedule Trigger

Triggers the workflow automatically on a recurring schedule using a Cron expression.

## Inputs
- None

## Outputs
- **Main**: Initial trigger item

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Cron Expression | cron | cron | `0 * * * *` | Cron expression (e.g., `*/15 * * * *` for every 15 minutes) |
