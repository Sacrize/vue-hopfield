<template>
    <div class="mesh">
        <div :key="row" class="row" v-for="row in inRow">
            <div :key="col" class="col" v-for="col in inRow">
                <Node @change="v => onChange(row, col, v)" :reset="flush" :ref="'node_' + calcIndex(row, col)" :readonly="readonly"></Node>
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
        },
        readonly: {
            type: Boolean,
        }
    },
    data() {
        return {
            flush: false,
        }
    },
    watch: {
      value(v) {
          if (!v.length) {
              this.reset();
          } else {
              for (let i = 0; i < v.length; i++) {
                  let comp = this.$refs['node_' + i];
                  comp[0].setValue(v[i] === 1);
              }
          }
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
        },
        calcIndex(row, col) {
            return ((row - 1) * this.inRow) + (col - 1);
        }
    },
    beforeMount() {
        if (!this.value.length) {
            this.reset();
        }
    },
    mounted() {
        if (this.value.length) {
            for (let i = 0; i < this.value.length; i++) {
                let comp = this.$refs['node_' + i];
                comp[0].setValue(this.value[i] === 1);
            }
        }
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
