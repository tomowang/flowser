---
trigger: always_on
---

# Localization (l10n) Standards

All user-facing strings in Flowser must be localized using `vue-i18n`. This ensures the application remains accessible to a global audience.

## Core Principles
1. **Never hardcode strings:** Avoid using literal strings in Vue templates or TypeScript files for UI elements.
2. **Hierarchical structure:** Use a structured key system in locale files to keep translations organized.
3. **Graceful degradation:** Always provide a fallback (usually English) in the code for cases where a translation key might be missing.

## Locale Files
Locales are stored in `lib/i18n/locales/` as JSON files:
- `en.json` (English - Source of Truth)
- `zh-CN.json` (Simplified Chinese)

## Key Conventions

### UI Components
Use descriptive top-level keys for general UI areas:
- `common`: Reusable strings (Save, Cancel, Delete, etc.)
- `sidebar`: Sidebar navigation items.
- `workflows`: Workflow list and management.
- `workflowEditor`: Tools and UI in the editor.
- `credentials`: Credential management.
- `executions`: Execution logs and details.
- `settings`: Application settings.

### Node Localization
Nodes require a specific hierarchical path for their metadata:
- `nodes.<nodeName>.displayName`: The name of the node shown in the editor.
- `nodes.<nodeName>.description`: A brief explanation of the node's function.
- `nodes.<nodeName>.properties.<propName>.displayName`: Label for a node property.
- `nodes.<nodeName>.properties.<propName>.description`: Help text for a node property.
- `nodes.<nodeName>.properties.<propName>.options.<optionValue>`: Labels for select/option values.

### Credential Localization
- `credentialTypes.<credentialName>.displayName`: The display name for a type of credential.

## Implementation Examples

### In Vue Templates
```vue
<template>
  <button>{{ t('common.save') }}</button>
  <p>{{ t('workflows.nodes', { count: nodeCount }) }}</p>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>
```

### Dynamic Node Metadata (TypeScript/Vue)
When rendering node metadata, check for the existence of a translation key using `te()`:
```typescript
const label = te(`nodes.${nodeType}.properties.${propName}.displayName`)
  ? t(`nodes.${nodeType}.properties.${propName}.displayName`)
  : property.displayName; // Fallback to hardcoded value
```

## Maintenance
When adding new features or nodes:
1. Add the necessary keys to `lib/i18n/locales/en.json` first.
2. Provide a corresponding translation in `lib/i18n/locales/zh-CN.json`.
3. If a translation is missing in a specific language, the system will automatically fall back to `en`.
