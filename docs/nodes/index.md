<script setup lang="ts">
import { data } from './index.data';
</script>

# Nodes

## Empty outputs

In a full workflow run, an output with no items does not run its connected nodes. To continue after a query finds no matches or a Code node returns an empty array, enable **Always Output Data** in that node's properties. This setting is off by default. When all outputs are empty, it emits one item (`{ json: {} }`) on the first output; existing items and other outputs are unchanged. The empty item contains no fields from the input or query result.

Enable the setting on the node producing the empty output. Enabling it only on a downstream node cannot make that node run. For nodes that process each input item, such as browser actions and HTTP Request, an empty input means there are no items to process; emitting an empty output item does not perform those actions.

An empty output is different from an item containing `null`, an empty array, or an error field: those items already allow connected nodes to run. Always Output Data does not suppress thrown errors. AI model connections supply models rather than workflow items, so the setting does not apply to them.

See [Data Flow](../execution-engine#data-flow) for execution details.

## Available nodes

<ul class="node-list">
  <li v-for="n in data" :key="n.slug" class="node-list-item">
    <a :href="n.slug" class="node-list-link">{{ n.title }}</a>
  </li>
</ul>
