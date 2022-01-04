import Vue from 'vue';
import Vuex from 'vuex';

import auth from './stores/auth';
import auditorAuth from './stores/auditorAuth';
import stream from './stores/stream';
import attestation from './stores/attestation';
import auditorStreams from './stores/auditorStreams';


Vue.use(Vuex);

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    auth, auditorAuth,
    stream,
    attestation,
    auditorStreams
  },
});
