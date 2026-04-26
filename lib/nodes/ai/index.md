# AI Models

These nodes provide Large Language Model (LLM) configurations used by other nodes, such as the [AI Agent](./agent). They handle authentication and model selection for various AI providers.

## Available Models

### OpenAI Chat Model
OpenAI's Large Language Models (LLM), including the GPT-4 and GPT-3.5 families.

**Credentials**: OpenAI API

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Model Name | modelName | options | `gpt-4o` | The specific OpenAI model to use. The list is dynamically fetched from the API based on your credentials. |

### Claude Chat Model
Anthropic's Claude family of Large Language Models (LLM).

**Credentials**: Anthropic API

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Model Name | modelName | options | `claude-3-5-sonnet-20240620` | The specific Claude model to use. The list is dynamically fetched from the API based on your credentials. |

### DeepSeek Chat Model
DeepSeek's family of Large Language Models (LLM).

**Credentials**: DeepSeek API

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Model Name | modelName | options | `deepseek-chat` | The specific DeepSeek model to use. The list is dynamically fetched from the API based on your credentials. |

### Gemini Chat Model
Google's Gemini family of Large Language Models (LLM).

**Credentials**: Gemini API

| Display Name | Name | Type | Default | Description |
| --- | --- | --- | --- | --- |
| Model Name | modelName | options | `gemini-2.5-flash-lite` | The specific Gemini model to use. The list is dynamically fetched from the API based on your credentials. |
