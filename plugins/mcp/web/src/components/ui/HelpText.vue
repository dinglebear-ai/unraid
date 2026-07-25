<script setup lang="ts">
// Unraid's native inline-help convention: <blockquote class="inline_help"> is display:none
// by default (webGui/styles/default-base.css) and the toolbar's "?" Help button toggles
// every element with this class site-wide (plugins/dynamix/HelpButton.page — plain
// `$('.inline_help').show('slow')`/`.hide('slow')`, a live jQuery selector re-run on every
// click, not a one-time page-load scan — so it picks up this component's content
// regardless of when Vue mounts it). No custom styling needed: the site's own blockquote
// CSS (light-blue banded panel, theme-aware colors) applies for free since this renders
// into light DOM, not a shadow root.
</script>

<template>
  <blockquote class="inline_help">
    <slot />
  </blockquote>
</template>
