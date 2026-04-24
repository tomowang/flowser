# Code

Executes custom JavaScript code in a secure sandbox.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Items returned by the code

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Code | code | code | | JavaScript to execute. Use the `items` variable to access input data. |

## Usage
The code is executed using QuickJS. You have access to the `items` array which contains the input data. Your code should return an array of objects to be passed to the next node.
