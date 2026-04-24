# HTTP Request

Makes an HTTP request (GET, POST, PUT, DELETE, etc.) from the background process.

## Inputs
- **Main**: Input items

## Outputs
- **Main**: Response data

## Parameters

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| URL | url | string | | The URL to make the request to |
| Method | method | options | GET | HTTP method |
| Query Parameters | parameters | json | `{}` | Query parameters |
| Headers | headers | json | `{}` | Request headers |
| Body Type | specifyBody | options | none | `None`, `JSON`, or `Form-Urlencoded` |
