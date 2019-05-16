<template>
    <div class="node" @click="onClick" :class="{active}" :reset="reset"></div>
</template>

<script>
    export default {
        name: "Node",
        props: {
          reset: Boolean,
        },
        data() {
          return {
              active: false,
          }
        },
        watch: {
            reset() {
                this.active = false;
            }
        },
        methods: {
            onClick() {
                this.setValue(!this.active)
            },
            setValue(state) {
                this.active = state;
                this.$emit('change', this.active);
            }
        }
    }
</script>

<style scoped>
    .node {
        width: 20px;
        height: 20px;
        border: 1px solid red;
        margin-left: 4px;
    }
    .node.active {
        background: red;
    }
</style>
