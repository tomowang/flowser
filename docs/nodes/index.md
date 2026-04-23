<script setup lang="ts">
import { data } from './index.data';
</script>

# Nodes

<ul class="node-list">
  <li v-for="n in data" :key="n.slug" class="node-list-item">
    <a :href="n.slug" class="node-list-link">{{ n.title }}</a>
  </li>
</ul>
