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
- `en.json` (English - Source of Truth for most namespaces — see the `nodes`/`credentialTypes` exception below)
- `zh-CN.json` (Simplified Chinese)

**Exception for `nodes.*` / `credentialTypes.*`:** for these two namespaces, the hardcoded English strings already in the node/credential definition (`lib/nodes/**`, `lib/credentials/**`) are the source of truth, not `en.json`. `en.json` must **not** contain `nodes` or `credentialTypes` keys — duplicating the English string there serves no purpose and has already caused real drift (a node's code and its `en.json` entry silently diverging). `zh-CN.json` (and any future locale) holds only the non-English translations for these two namespaces.

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

This path stays **flat** even for a property nested inside a `fixedCollection`. For example, `If`'s `conditions` property has a nested `operator` sub-property — its keys are `nodes.if.properties.operator.displayName` and `nodes.if.properties.operator.options.<value>`, not double-nested under `conditions.operator`. Likewise, a `fixedCollection`'s option group itself (e.g. `If`'s `items`, `FormAction`'s/`EditFields`'s `values`) is addressed as an *option* of its parent property: `nodes.<nodeName>.properties.<parentPropName>.options.<groupName>`, never as a sibling top-level property — that flattening mistake previously created dead, unreachable translations.

### Credential Localization
- `credentialTypes.<credentialName>.displayName`: The display name for a type of credential.
- `credentialTypes.<credentialName>.properties.<propName>.displayName` / `.description`: same convention as node properties.

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

### Dynamic Node/Credential Metadata (TypeScript/Vue)
Do not inline the `te()`/`t()` ternary at call sites — use the shared `useEntityI18n` composable (`lib/composables/useEntityI18n.ts`), which encapsulates the fallback logic and the `nodes.*`/`credentialTypes.*` key construction:
```typescript
import { useEntityI18n } from "@/lib/composables/useEntityI18n";

const nodeI18n = useEntityI18n("nodes"); // or useEntityI18n("credentialTypes")

nodeI18n.label(nodeType.description.name, nodeType.description.displayName);
nodeI18n.description(nodeType.description.name, nodeType.description.description);
nodeI18n.propertyLabel(nodeType.description.name, prop.name, prop.displayName);
nodeI18n.propertyDescription(nodeType.description.name, prop.name, prop.description);
nodeI18n.optionLabel(nodeType.description.name, prop.name, option.value ?? option.name, option.name);
```
Each function falls back to the second-to-last argument (the hardcoded value from the node/credential definition) when no translation key exists — this is the graceful degradation described above, implemented once instead of duplicated per call site.

## Maintenance
When adding new features or nodes:
1. For general UI namespaces (`common`, `sidebar`, `workflows`, `workflowEditor`, `credentials`, `executions`, `settings`, etc.), add the necessary keys to `lib/i18n/locales/en.json` first, since it's the source of truth there.
2. For `nodes.*` / `credentialTypes.*`, there is nothing to add to `en.json` — the English string already lives in the node/credential definition. Only add an entry to `lib/i18n/locales/zh-CN.json` (or another non-English locale) when you have an actual translation to provide.
3. If a translation is missing in a specific language, the system falls back to the hardcoded value in code (for `nodes`/`credentialTypes`) or to `en` (for every other namespace).
