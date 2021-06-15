<template>
  <div>{{ title }}</div>
</template>

<script>
import { reactive } from "vue";
export default {
  setup() {
    const state = reactive({
        title: "hello, simple vite!",
    });
    return {
        ...toRefs(state)
    };
  },
};
</script>