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
                            label="Próby skojarzenia"
                    ></v-text-field>

                    <v-text-field
                            type="number"
                            v-model="noicePercent"
                            max="100"
                            label="Szum [%]"
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
                            <div class="mb-2">
                                <v-btn @click="learn">Naucz się</v-btn>
                                <v-btn @click="remind">Sprawdź</v-btn>
                                <v-btn @click="reset">Reset</v-btn>
                            </div>
                            <div class="mb-4">
                                <v-btn small @click="generate">Generuj wzór</v-btn>
                                <v-btn small @click="addphoto">Dodaj zdjęcie</v-btn>
                                <span v-if="shouldShowNoiceButton">
                                    <v-btn small @click="noice">Szum</v-btn>
                                </span>
                                <image-uploader
                                        :debug="1"
                                        :maxWidth="inRow"
                                        :maxHeight="inRow"
                                        :autoRotate=true
                                        outputFormat="verbose"
                                        :preview=false
                                        capture="environment"
                                        accept="image/jpg,image/jpeg"
                                        doNotResize="['gif', 'svg']"
                                        @input="setImage"
                                        v-if="shouldShowPhotoUpload"
                                        className="mt-3 ml-2"
                                ></image-uploader>
                            </div>
                            <Mesh :nodes="nodes" v-model="state"></Mesh>
                            <hr class="my-4"/>
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
                tolerance: 1000,
                learning: 'Hebbian',
                energy: 0.0,
                noiceOf: [],
                noicePerc: 10,
                shouldShowPhotoUpload: false,
                remindCounter: 0,
            }
        },
        computed: {
            inRow() {
                return Math.round(Math.sqrt(this.neurons));
            },
            noicePercent: {
                get() {
                    return this.noicePerc;
                },
                set() {
                }
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
            },
            shouldShowNoiceButton() {
                let active = this.state.reduce((p, c) => p + Number(c === 1), 0);
                return active > 2;
            }
        },
        watch: {
            nodes() {
                this.reset();
            }
        },
        methods: {
            addphoto() {
                this.shouldShowPhotoUpload = !this.shouldShowPhotoUpload;
            },
            setImage(img) {

                console.log(img)

                var image = new Image();
                image.onload = () => {
                    var canvas = document.createElement('canvas');
                    canvas.width = image.width;
                    canvas.height = image.height;

                    var context = canvas.getContext('2d');
                    context.drawImage(image, 0, 0);

                    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                    // Now you can access pixel data from imageData.data.
                    // It's a one-dimensional array of RGBA values.
                    // Here's an example of how to get a pixel's color at (x,y)
                    let tmp = Array(this.neurons);
                    for (let x = 0; x < this.inRow; x++) {
                        for (let y = 0; y < this.inRow; y++) {
                            let index = (y * imageData.width + x) * 4;
                            let red = imageData.data[index] || 255;
                            let green = imageData.data[index + 1] || 255;
                            let blue = imageData.data[index + 2] || 255;

                            let avg = math.mean([red, green, blue]);
                            tmp[(x * this.inRow) + y] = avg > 200 ? -1 : 1;
                        }
                    }
                    this.state = [...tmp];
                    this.noiceOf = [];
                };

                this.resetOrientation(img.dataUrl, 5, (base64) => {
                    image.src = base64;
                });
            },
            resetOrientation(srcBase64, srcOrientation, callback) {
                var img = new Image();

                img.onload = function () {
                    var width = img.width,
                        height = img.height,
                        canvas = document.createElement('canvas'),
                        ctx = canvas.getContext("2d");

                    // set proper canvas dimensions before transform & export
                    if (4 < srcOrientation && srcOrientation < 9) {
                        canvas.width = height;
                        canvas.height = width;
                    } else {
                        canvas.width = width;
                        canvas.height = height;
                    }

                    // transform context before drawing image
                    switch (srcOrientation) {
                        case 2:
                            ctx.transform(-1, 0, 0, 1, width, 0);
                            break;
                        case 3:
                            ctx.transform(-1, 0, 0, -1, width, height);
                            break;
                        case 4:
                            ctx.transform(1, 0, 0, -1, 0, height);
                            break;
                        case 5:
                            ctx.transform(0, 1, 1, 0, 0, 0);
                            break;
                        case 6:
                            ctx.transform(0, 1, -1, 0, height, 0);
                            break;
                        case 7:
                            ctx.transform(0, -1, -1, 0, height, width);
                            break;
                        case 8:
                            ctx.transform(0, -1, 1, 0, 0, width);
                            break;
                        default:
                            break;
                    }

                    // draw image
                    ctx.drawImage(img, 0, 0);

                    // export base64
                    callback(canvas.toDataURL());
                };

                img.src = srcBase64;
            },
            generate() {
                let letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
                let r = Math.round((Math.random() * 100)) % 26;

                this.toDataURL(require(`./assets/letters/${letters[r]}.jpg`), (base64) => {

                    let maxWidth = this.inRow;
                    let maxHeight = this.inRow;

                    // Max size for thumbnail
                    if (typeof (maxWidth) === 'undefined') maxWidth = 500;
                    if (typeof (maxHeight) === 'undefined') maxHeight = 500;

                    // Create and initialize two canvas
                    var canvas = document.createElement("canvas");
                    var ctx = canvas.getContext("2d");
                    var canvasCopy = document.createElement("canvas");
                    var copyContext = canvasCopy.getContext("2d");

                    // Create original image
                    var img = new Image();

                    img.onload = () => {

                        // Determine new ratio based on max size
                        var ratio = 1;
                        ratio = maxWidth / img.width;

                        // Draw original image in second canvas
                        canvasCopy.width = img.width;
                        canvasCopy.height = img.height;
                        copyContext.drawImage(img, 0, 0);

                        // Copy and resize second canvas to first canvas
                        canvas.width = img.width * ratio;
                        canvas.height = img.height * ratio;
                        ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);

                        this.setImage({dataUrl: canvas.toDataURL()});
                    };

                    img.src = base64;
                });
            },
            toDataURL(url, callback) {
                let xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    let reader = new FileReader();
                    reader.onloadend = function () {
                        callback(reader.result);
                    }
                    reader.readAsDataURL(xhr.response);
                };
                xhr.open('GET', url);
                xhr.responseType = 'blob';
                xhr.send();
            },
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

                let active = this.state.reduce((p, c) => p + Number(c === 1), 0);
                if (active === 0) return;

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
                } else if (this.learning === 'Storkey') {

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

                this.remindCounter = 0;
                for (let iteration = 0; iteration < this.tolerance; iteration++) {
                    const index = math.randomInt(0, this.W.length);

                    vector[index] = math.dot([...this.W[index]], vector) > 0 ? 1 : -1;

                    for (let vector2 of this.train) {
                        if (this.isEqual(vector, vector2)) {
                            wasFound = vector2;
                        }
                    }

                    this.remindCounter++;
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
                alert(`Pamiętam! (${this.remindCounter} prób)`);
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
