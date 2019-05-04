<template>
    <div class="mesh">
        <div :key="row" class="row" v-for="row in inRow">
            <div :key="col" class="col" v-for="col in inRow">
                <Node @change="v => onChange(row, col, v)" :reset="flush"></Node>
            </div>
        </div>
    </div>
</template>

<script>
import Node from './Node';
export default {
    name: "Mesh",
    props: {
        nodes: {
            type: Number,
        },
        value: {
            type: Array,
        }
    },
    data() {
        return {
            flush: false,
        }
    },
    watch: {
      value() {
          this.reset();
      }
    },
    components: {
        Node,
    },
    computed: {
        inRow() {
            return Math.round(Math.sqrt(this.nodes));
        }
    },
    methods: {
        onChange(row, col, v) {
            this.value[((row - 1) * this.inRow) + (col - 1)] = v ? 1 : -1;
            this.$emit('input', this.value);
        },
        reset() {
            this.value.length = this.nodes;
            this.value.fill(-1);
            this.flush = !this.flush;
        }
    },
    beforeMount() {
        this.reset();
    }
}
</script>

<style scoped>
    .col {
        display: inline-flex;
    }
    .row {
        white-space: nowrap;
    }
    .mesh {
        overflow-x: auto;
        overflow-y: visible;
    }
</style>
