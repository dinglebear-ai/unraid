<!-- Native <select>, restyled to match Input/Button rather than the browser default —
     keeps native keyboard/accessibility/mobile behavior, just repaints the chrome. -->
<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import { cn } from "../../lib/utils";

const props = defineProps<{
  modelValue?: string;
  class?: string;
  id?: string;
  disabled?: boolean;
}>();

const emits = defineEmits<{ (e: "update:modelValue", payload: string): void }>();

const modelValue = useVModel(props, "modelValue", emits, { passive: true });
</script>

<template>
  <div :class="cn('relative inline-block', props.class)">
    <select
      :id="id"
      v-model="modelValue"
      :disabled="disabled"
      class="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full cursor-pointer appearance-none rounded-md border py-2 pr-8 pl-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
    >
      <slot />
    </select>
    <svg
      class="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2"
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
    >
      <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </div>
</template>
