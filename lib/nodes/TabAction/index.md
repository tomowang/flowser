# Tab Action

Perform actions on browser tabs like Create, Close, or Group.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Result of the action

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Action | action | options | create | `Create`, `Close`, or `Group` |
| URL | url | string | | (Create) The URL to navigate to |
| Active | active | boolean | true | (Create) Focus the new tab |
| Pinned | pinned | boolean | false | (Create) Pin the new tab |
| Tab ID | tabId | number | | (Close) ID of the tab to close |
| Tab IDs | tabIds | string | | (Group) Comma-separated list of IDs to group |
