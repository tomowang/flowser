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

## Empty output

Returning `[]`, for example after filtering out every input item, stops this branch by default. Enable **Always Output Data** in the node's properties to emit one item (`{ json: {} }`) instead when the returned array is empty. Leave it off when an empty array is intended to stop the branch. Existing output items are unchanged, and thrown errors still stop execution.
