import Vue from 'vue';
import Vuetify from 'vuetify';
import ImageUploader from 'vue-image-upload-resize'
import 'vuetify/dist/vuetify.min.css';
import App from './App.vue';

Vue.config.productionTip = false;

Vue.use(Vuetify);
Vue.use(ImageUploader);

new Vue({
  render: h => h(App),
}).$mount('#app');
