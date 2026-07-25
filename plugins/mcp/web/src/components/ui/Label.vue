<!-- Vendored from @unraid/ui (upstream/unraid-api/unraid-ui/src/components/form/label/Label.vue),
     simplified to a plain <label> (dropping the reka-ui Label wrapper — not needed here). -->
<script setup lang="ts">
defineProps<{ for?: string; class?: string }>();
</script>

<template>
  <label
    :for="$props.for"
    :class="['text-sm leading-none font-medium', $props.class]"
  ><slot /></label>
</template>
