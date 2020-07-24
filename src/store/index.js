import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    tracklists: {
      imported: []
    },
    api: {
      hasSpotifyAccessToken: false
    },
    selectedTracklistToCompareLeft: null,
    selectedTracklistToCompareRight: null,
    selectedImportMethod: null,
    showDialog: false,
    tracklistInDialog: null,
    isSnackBarVisible: false,
    notifications: [],
    overlay: {
      isOpen: false,
      progress: {
        current: 0,
        total: 0
      }
    }
  },
  getters: {
    isOverlayOpen: state => state.overlay.isOpen,
    overlayTotalProgress: state => state.overlay.progress.total,
    overlayCurrentProgress: state => state.overlay.progress.current,
    hasSpotifyAccessToken: state => state.api.hasSpotifyAccessToken,
    importedTracklists: state => state.tracklists.imported
  },
  mutations: {
    ADD_IMPORTED_TRACKLIST (state, tracklist) {
      this.state.tracklists.imported.push(tracklist)
    },
    SET_TRACKLIST_TO_COMPARE (state, tracklist) {
      if (!state.selectedTracklistToCompareLeft) {
        state.selectedTracklistToCompareLeft = tracklist
      } else {
        state.selectedTracklistToCompareRight = tracklist
      }
    },
    UNSET_TRACKLIST_TO_COMPARE (state, tracklist) {
      if (state.selectedTracklistToCompareLeft && state.selectedTracklistToCompareLeft.id === tracklist.id) {
        state.selectedTracklistToCompareLeft = null
      } else if (state.selectedTracklistToCompareRight && state.selectedTracklistToCompareRight.id === tracklist.id) {
        state.selectedTracklistToCompareRight = null
      }
    },
    TOGGLE_DIALOG (state) {
      state.showDialog = !state.showDialog
    },
    SET_TRACKLIST_TO_SHOW_TRACKS (state, tracklist) {
      state.tracklistInDialog = tracklist
    },
    SET_SELECTED_IMPORT_METHOD (state, value) {
      state.selectedImportMethod = value
    },
    TOGGLE_SNACKBAR (state, value) {
      state.isSnackBarVisible = value
    },
    PUSH_NOTIFICATION (state, text) {
      state.notifications.push(text)
    },
    SET_NOTIFICATIONS (state, messages) {
      state.notifications = messages
    },
    SET_OVERLAY (state, value) {
      state.overlay.isOpen = value
    },
    SET_OVERLAY_TOTAL_PROGRESS (state, value) {
      state.overlay.progress.total = value
    },
    INCREASE_OVERLAY_CURRENT_PROGRESS (state, value) {
      state.overlay.progress.current += value
    },
    RESET_OVERLAY_PROGRESS (state) {
      state.overlay.progress.total = 0
      state.overlay.progress.current = 0
    },
    // api
    TOGGLE_SPOTIFY_ACCESS_TOKEN_FLAG (state, toggle) {
      state.api.hasSpotifyAccessToken = toggle
    }
  },
  actions: {
    addImportedTracklist ({ state, commit }, tracklist) {
      commit('ADD_IMPORTED_TRACKLIST', tracklist)
      if (state.tracklists.imported.length <= 2) {
        commit('SET_TRACKLIST_TO_COMPARE', tracklist)
      }
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
    resetSelectedImportMethod ({ commit }) {
      commit('SET_SELECTED_IMPORT_METHOD', null)
    },
    toggleSnackBar ({ commit }, value) {
      commit('TOGGLE_SNACKBAR', value)
    },
    pushNotification ({ commit }, text) {
      commit('PUSH_NOTIFICATION', text)
    },
    setNotifications ({ commit }, messages) {
      commit('SET_NOTIFICATIONS', messages)
    },
    setOverlay ({ commit }, value) {
      commit('SET_OVERLAY', value)
    },
    setOverlayTotalProgress ({ commit }, value) {
      commit('SET_OVERLAY_TOTAL_PROGRESS', value)
    },
    increaseOverlayCurrentProgress ({ commit }, value) {
      commit('INCREASE_OVERLAY_CURRENT_PROGRESS', value)
    },
    resetOverlayProgress ({ commit }) {
      commit('RESET_OVERLAY_PROGRESS')
    },
    // api
    toggleSpotifyAccessTokenFlag ({ commit }, toggle) {
      commit('TOGGLE_SPOTIFY_ACCESS_TOKEN_FLAG', toggle)
    }
  },
  modules: {
  }
})
