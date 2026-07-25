<!-- Vendored from @unraid/ui (upstream/unraid-api/unraid-ui/src/components/common/button/Button.vue). -->
<script setup lang="ts">
import { computed } from "vue";
import { buttonVariants, type ButtonVariants } from "./button.variants";
import { cn } from "../../lib/utils";

export interface ButtonProps {
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  class?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: "primary",
  size: "md",
  disabled: false,
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const buttonClass = computed(() =>
  cn(
    buttonVariants({ variant: props.variant, size: props.size }),
    props.disabled && "pointer-events-none opacity-50",
    props.class
  )
);

function handleClick(event: MouseEvent) {
  if (!props.disabled) emit("click", event);
}
</script>

<template>
  <button type="button" :class="buttonClass" :disabled="disabled" @click="handleClick">
    <slot />
  </button>
</template>
