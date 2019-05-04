<template>
  <div id="app">
    <v-app id="form">

      <v-toolbar
        color="blue-grey"
        dark
        fixed
        app
        clipped-right
      >
        <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
        <v-toolbar-title>Toolbar</v-toolbar-title>
        <v-spacer></v-spacer>
      </v-toolbar>
      <v-navigation-drawer
        v-model="drawer"
        fixed
        app
        class="pa-4"
      >
        <h2 class="mb-4">Konfiguracja</h2>
        <v-form
          ref="form"
        >
          <v-text-field
            type="number"
            v-model="nodes"
            min="9"
            max="10000"
            label="Neurony"
            @change="onChangeNeurons"
          ></v-text-field>

          <v-text-field
            type="number"
            v-model="memoryLimit"
            min="0"
            max="100"
            step="0.01"
            label="Limit pamięci"
          ></v-text-field>

          <v-text-field
            type="number"
            v-model="tolerance"
            min="0"
            max="100"
            label="Tolerancja"
          ></v-text-field>
        </v-form>
      </v-navigation-drawer>
      <v-content>
        <v-container fluid fill-height>
          <v-layout align-start justify-start>
            <v-flex class="text-xs-left">
              <div class="mb-4">
                <v-btn @click="learn">Naucz się</v-btn>
                <v-btn @click="remind">Sprawdź</v-btn>
                <v-btn>Reset</v-btn>
              </div>
              <h4 class="mb-3">Wykorzystanie pamięci: {{ memory }}%
              </h4>
              <p v-if="train.length">Umiem już {{ train.length }} wzory!</p>
              <p v-else>Niczego jeszcze nie umiem :(</p>
              <Mesh :nodes="nodes" v-model="state"></Mesh>
            </v-flex>
          </v-layout>
        </v-container>
      </v-content>
    </v-app>
  </div>
</template>

<script>
import Mesh from './components/Mesh';
import math from 'mathjs';

export default {
  name: 'app',
  components: {
    Mesh
  },
  data() {
    return {
      drawer: null,
      neurons: 0,
      state: [],
      train: [],
      W: [],
      memoryLimit: 0.05,
      tolerance: 100,
    }
  },
  computed: {
    memory() {
      return ((this.train.length / (this.nodes * this.memoryLimit)) * 100).toFixed(2);
    },
    nodes: {
      get() {
        return this.neurons;
      },
      set(v) {
        this.neurons = Number(v);
      }
    }
  },
  watch: {
    nodes() {
      this.reset();
    }
  },
  methods:  {
    onChangeNeurons() {
      this.neurons = Math.pow(Math.round(Math.sqrt(this.neurons)), 2);
    },
    learn() {
      this.train.push([...this.state]);
      this.state = [];

      for (let n = 0; n < this.W.length; n++) {
        this.W[n] = Array(this.nodes).fill(0);
      }

      for (let vector of this.train) {
        for (let i = 0; i < this.nodes; i++) {
          for (let j = i + 1; j < this.nodes; j++) {
            this.W[i][j] += vector[i] * vector[j];
            this.W[j][i] = this.W[i][j];
          }
        }
      }
    },
    remind() {
      let vector = [...this.state];
      this.state = [];

      let wasFound = null;

      for (let iteration = 0; iteration < this.tolerance; iteration++) {
        const index = math.randomInt(0, this.W.length);

        vector[index] = math.dot([...this.W[index]], vector) > 0 ? 1 : -1;

        for (let vector2 of this.train) {
          if (this.isEqual(vector, vector2)) {
            wasFound = vector2;
          }
        }

        if (wasFound) break;
      }

      if (wasFound) {
        this.rebuild(wasFound);
      }
    },
    isEqual(arr1, arr2) {
      return (arr1.length === arr2.length) && arr1.every((el, ind) => el === arr2[ind]);
    },
    reset() {
      this.W.length = 0;
      this.W.length = this.nodes;
      this.state = [];
      this.train = [];
    },
    rebuild(vector) {

    }
  },

  mounted() {
    this.nodes = 100;
  }

}
</script>

<style>
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif; /* this was it */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
  }
</style>
