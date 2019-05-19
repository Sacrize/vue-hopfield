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
          <v-select
            :items="['Hebbian', 'Storkey']"
            v-model="learning"
            label="Metoda nauki"
          ></v-select>
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
            v-model="tolerance"
            min="0"
            max="100"
            label="Tolerancja"
          ></v-text-field>

          <v-text-field
            type="number"
            v-model="noicePercent"
            max="100"
            label="Maks. szumu [%]"
            @change="onChangeNoicePercent"
          ></v-text-field>

          <h2 class="mb-4">Statystyki</h2>

          <v-text-field
            type="text"
            :value="train.length + ' /' + capacity"
            label="Wzory"
            readonly
          ></v-text-field>

          <v-text-field
            type="number"
            v-model="memory"
            step="0.01"
            label="Zajętość [%]"
            readonly
          ></v-text-field>

          <v-text-field
            type="number"
            v-model="energy"
            step="0.01"
            label="Energia"
            readonly
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
                <v-btn @click="reset">Reset</v-btn>
              </div>
              <Mesh :nodes="nodes" v-model="state"></Mesh>
              <div v-if="history.length" class="mt-2">
                <v-btn small @click="noice">Szum</v-btn>
              </div>
              <hr class="my-4" />
              <v-flex v-if="history.length">
                <h2>Historia</h2>
                <div class="mesh-container">
                  <div v-for="(s, i) in history" :key="i">
                    <v-btn small @click="copyMe(i)">Skopiuj</v-btn>
                    <Mesh :nodes="nodes" :value="s" :readonly="true"></Mesh>
                  </div>
                </div>
              </v-flex>
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
      history: [],
      W: [],
      tolerance: 100,
      learning: 'Hebbian',
      energy: 0.0,
      noiceOf: [],
      noicePerc: 10.00,
    }
  },
  computed: {
    noicePercent: {
      get() {
        return this.noicePerc.toFixed(2);
      },
      set() { }
    },
    memory() {
      return ((this.train.length / this.capacity) * 100).toFixed(2);
    },
    nodes: {
      get() {
        return this.neurons;
      },
      set(v) {
        this.neurons = Number(v);
      }
    },
    capacity() {
      if (this.learning === 'Hebbian') {
        return this.hebbianCapacity();
      } else {
        return this.storkeyCapacity();
      }
    }
  },
  watch: {
    nodes() {
      this.reset();
    }
  },
  methods:  {
    onChangeNoicePercent(v) {
      this.noicePerc = Number(v);
    },
    noice() {
      if (!this.noiceOf.length) {
        this.noiceOf = [...this.state];
      }
      let tmp = [...this.noiceOf];

      let active = tmp.reduce((p, c) => p + Number(c === 1), 0);

      let chenged = 0;
      let del = 0;
      for (let i = 0; i < this.state.length; i++) {
        let r = Math.random() * 100 < 20;
        let node = this.noiceOf[i];
        if (node === 1) {
          if (r) {
            del++;
            tmp[i] = -1;
            chenged++;
          }
        }
        console.log((chenged / active * 100).toFixed(2), this.noicePercent)
        if ((chenged / active * 100).toFixed(2) >= this.noicePercent) {
          del--;
          break;
        }
      }

      for (let i = 0; i < this.state.length; i++) {
        let r = Math.random() * 100 < 20;
        let node = this.noiceOf[i];
        if (node === -1) {
          if (r && del > 0) {
            tmp[i] = 1;
            del--;
          }
        }
      }

      this.state = tmp;
    },
    onChangeNeurons() {
      this.reset();
      this.neurons = Math.pow(Math.round(Math.sqrt(this.neurons)), 2);
    },
    hebbianCapacity() {
      return Math.round(this.neurons / (2 * math.log(this.neurons)));
    },
    storkeyCapacity() {
      return Math.round(this.neurons / (2 * math.sqrt(math.log(this.neurons))));
    },
    copyMe(i) {
      this.state = [...this.history[i]];
    },
    calcEnergy(vector) {
      let energy = 0.0;

      for (let i = 0; i < vector.length; i++) {
        for (let j = 0; j < vector.length; j++) {
          energy += vector[i] * vector[j] * this.W[i][j];
        }
      }
      energy *= -0.5;

      return energy;
    },
    learn() {
      this.history.push(this.state);
      this.train.push([...this.state]);
      let tmp = [...this.state];
      this.state = [];

      for (let n = 0; n < this.W.length; n++) {
        this.W[n] = Array(this.nodes).fill(0);
      }

      if (this.learning === 'Hebbian') {

        for (let vector of this.train) {
          for (let i = 0; i < this.nodes; i++) {
            for (let j = i + 1; j < this.nodes; j++) {
              this.W[i][j] += vector[i] * vector[j];
              this.W[j][i] = this.W[i][j];
            }
          }
        }
      } else if(this.learning === 'Storkey') {

        for (let vector of this.train) {
          let hebbian_term = this.vOuter(vector, vector) - math.identity(vector.length);
          let net_inputs = math.multiply(this.W, vector);
          let pre_synaptic = this.vOuter(vector, net_inputs);
          let post_synaptic = this.vOuter(net_inputs, vector);
          this.W = math.add(this.W, math.multiply((1.00 / vector.length), (hebbian_term - pre_synaptic - post_synaptic)));
        }
      }

      this.energy = this.calcEnergy(tmp);

    },
    vOuter(a, b) {
      let ret = [];
      for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
          ret[i] = ret[i] ? ret[i] : [];
          ret[i][j] = i * j;
        }
      }
      return ret;
    },
    remind() {
      let vector = [...this.state];

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
        this.state = [];
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
      this.history = [];
      this.energy = 0;
      this.noiceOf = [];
    },
    rebuild(vector) {
      alert('Pamiętam!');
      this.state = [...vector];
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
  .mesh-container {
    display: flex;
    flex-wrap: wrap;
  }
  .mesh-container .mesh {
    margin-right: 10px;
    margin-top: 10px;
  }
</style>
