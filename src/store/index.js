import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    spotifyPlaylistIdWithTracksToDownload: null,
    spotifyPlaylistIdWithTracksToBuy: null,
    selectedTracklistToCompareLeft: null,
    selectedTracklistToCompareRight: null,
    selectedImportMethod: null,
    showDialog: false,
    tracklistToShowTracks: null
  },
  mutations: {
    SET_SPOTIFY_TO_DOWNLOAD_PLAYLIST_ID (state, spotifyPlaylistId) {
      state.spotifyPlaylistIdWithTracksToDownload = spotifyPlaylistId
    },
    SET_SPOTIFY_TO_BUY_PLAYLIST_ID (state, spotifyPlaylistId) {
      state.spotifyPlaylistIdWithTracksToBuy = spotifyPlaylistId
    },
    SET_TRACKLIST_TO_COMPARE (state, tracklist) {
      if (!state.selectedTracklistToCompareLeft) {
        state.selectedTracklistToCompareLeft = tracklist
      } else {
        state.selectedTracklistToCompareRight = tracklist
      }
    },
    UNSET_TRACKLIST_TO_COMPARE (state, tracklist) {
      if (state.selectedTracklistToCompareLeft.id === tracklist.id) {
        state.selectedTracklistToCompareLeft = null
      } else if (state.selectedTracklistToCompareRight.id === tracklist.id) {
        state.selectedTracklistToCompareRight = null
      }
    },
    TOGGLE_DIALOG (state) {
      state.showDialog = !state.showDialog
    },
    SET_TRACKLIST_TO_SHOW_TRACKS (state, tracklist) {
      state.tracklistToShowTracks = tracklist
    },
    SET_SELECTED_IMPORT_METHOD (state, value) {
      state.selectedImportMethod = value
    }
  },
  actions: {
    setSpotifyToDownloadPlaylistId ({ commit }, spotifyPlaylistId) {
      commit('SET_SPOTIFY_TO_DOWNLOAD_PLAYLIST_ID', spotifyPlaylistId)
    },
    setSpotifyToBuyPlaylistId ({ commit }, spotifyPlaylistId) {
      commit('SET_SPOTIFY_TO_BUY_PLAYLIST_ID', spotifyPlaylistId)
    },
    setTracklistToCompare ({ commit }, tracklist) {
      commit('SET_TRACKLIST_TO_COMPARE', tracklist)
    },
    unsetTracklistToCompare ({ commit }, tracklist) {
      commit('UNSET_TRACKLIST_TO_COMPARE', tracklist)
    },
    toggleDialog ({ commit }) {
      commit('TOGGLE_DIALOG')
    },
    setTracklistToShowTracks ({ commit }, tracklist) {
      commit('SET_TRACKLIST_TO_SHOW_TRACKS', tracklist)
    },
    setSelectedImportMethod ({ commit }, value) {
      commit('SET_SELECTED_IMPORT_METHOD', value)
    },
    hideImporter ({ commit }) {
      commit('SET_SELECTED_IMPORT_METHOD', null)
    }
  },
  modules: {
  }
})
