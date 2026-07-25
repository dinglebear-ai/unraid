<script setup lang="ts">
type Tab = "builder" | "jails" | "config";
const activeTab = defineModel<Tab>({ required: true });
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "builder", label: "Builder" },
  { id: "jails", label: "Containers" },
  { id: "config", label: "Config" },
];

function handleKeydown(event: KeyboardEvent, current: Tab) {
  const index = tabs.findIndex((tab) => tab.id === current);
  let nextIndex: number | null = null;
  if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
  else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = tabs.length - 1;
  if (nextIndex === null) return;
  event.preventDefault();
  activeTab.value = tabs[nextIndex].id;
  document.getElementById(`incus-tab-${tabs[nextIndex].id}`)?.focus();
}
</script>

<template>
  <div role="tablist" aria-label="Incus settings sections" class="mb-6 flex gap-1 border-b border-border">
    <button
      v-for="tab in tabs"
      :id="`incus-tab-${tab.id}`"
      :key="tab.id"
      role="tab"
      type="button"
      :aria-selected="activeTab === tab.id"
      :aria-controls="`incus-panel-${tab.id}`"
      :tabindex="activeTab === tab.id ? 0 : -1"
      class="-mb-px cursor-pointer border-b-[3px] px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition-colors"
      :class="activeTab === tab.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
      @click="activeTab = tab.id"
      @keydown="handleKeydown($event, tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
