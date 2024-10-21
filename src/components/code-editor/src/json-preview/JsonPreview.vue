<template>
  <vue-json-pretty :path="'res'" :deep="3" :showLength="true" :data="data" />
</template>

<script setup>
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";

defineProps({
  data: Object,
});
</script>
