<!-- Vendored from @unraid/ui (upstream/unraid-api/unraid-ui/src/components/common/badge/Badge.vue). -->
<script setup lang="ts">
import { computed } from "vue";
import { badgeVariants, type BadgeVariants } from "./badge.variants";

export interface BadgeProps {
  variant?: BadgeVariants["variant"];
  size?: BadgeVariants["size"];
  class?: string;
}

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: "gray",
  size: "sm",
  class: "",
});

const badgeClass = computed(() => badgeVariants({ variant: props.variant, size: props.size }));
</script>

<template>
  <span :class="[badgeClass, props.class]"><slot /></span>
</template>
