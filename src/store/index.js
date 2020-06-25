import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    iTunesTracks: []
  },
  mutations: {
    INITIALIZE_ITUNES_TRACKS (state, tracks) {
      state.iTunesTracks = tracks
    }
  },
  actions: {
    initializeITunesTracks ({ commit }, tracks) {
      commit('INITIALIZE_ITUNES_TRACKS', tracks)
    }
  },
  modules: {
  }
})
