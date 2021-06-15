<template>
<section>
    <div>{{ state.count }}</div>
    <button @click="handleUp">+</button>
    <button @click="handleDown">-</button>
</section>
</template>

<script>
import {
    reactive,
    toRefs,
} from "vue";
// import { reactive } from "../../packages/reactive.js";

export default {
    setup() {
        const state = reactive({
            count: 0,
        });
        return {
            // ...toRefs(state),
            state,
        };
    },
    methods: {
        handleUp() {
            this.state.count++;
            console.log('state.count ++ :>> ', this.state.count);
        },
        handleDown() {
            this.state.count--;
            console.log('state.count -- :>> ', this.state.count);
        },
    }
};
</script>
