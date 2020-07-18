<template>
  <v-dialog v-model="dialog" transition="dialog-bottom-transition">
    <v-card>
      <v-sheet class="pa-4">
        <div class="d-flex">
          <v-text-field
            v-model="tracklistSearchInput"
            label="Search track"
            clear-icon="mdi-close-circle-outline"
            flat hide-details clearable
          ></v-text-field>
          <v-btn dark @click="dialog = false" class="ml-4">
            <v-icon left>mdi-close</v-icon>
            Close
          </v-btn>
        </div>
      </v-sheet>
      <v-data-table
        v-if="tracklistInDialog"
        :headers="headers"
        :items="tracklistInDialog.tracks"
        :items-per-page="10"
        :key="componentKey"
        :search="tracklistSearchInput"
        :page.sync="page"
      >
        <template v-slot:item.artists="{ item }">
          {{ item.artists.join(', ')}}
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn small @click="openMuzonlyTab(item)" class="mr-2">
            <v-icon small left>mdi-open-in-new</v-icon>
            MuzOnly
          </v-btn>
          <v-btn
            small
            :loading="item.loadingAddingToDownloadPlaylist"
            @click="addToDownloadSpotifyPlaylist(item)"
            :color="item.hasBeenAddedToDownloadPlaylist ? 'green' : ''"
            class="mr-2"
          >
            <v-icon small left>fab fa-spotify</v-icon>
            to download
          </v-btn>
          <v-btn
            small
            :loading="item.loadingAddingToBuyPlaylist"
            @click="addToBuySpotifyPlaylist(item)"
            :color="item.hasBeenAddedToBuyPlaylist ? 'green' : ''"
          >
            <v-icon small left>fab fa-spotify</v-icon>
            to buy
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState } from 'vuex'

import SpotifyService from '@/services/SpotifyService'

export default {
  data: () => {
    return {
      dialog: false,
      tracklistSearchInput: null,
      headers: [
        { text: 'Track name', value: 'name' },
        { text: 'Track artists', value: 'artists' },
        { text: '', value: 'actions', sortable: false }
      ],
      componentKey: 0,
      page: 0
    }
  },
  computed: {
    ...mapState([
      'tracklistInDialog',
      'showDialog',
      'spotifyPlaylistWithTracksToDownload',
      'spotifyPlaylistIdWithTracksToBuy'
    ])
  },
  watch: {
    showDialog: function (newValue) {
      this.dialog = newValue
    },
    dialog: function (newValue, oldValue) {
      if (!newValue) {
        this.$store.dispatch('toggleDialog')
      }
    }
  },
  methods: {
    openMuzonlyTab (track) {
      const url = `https://srv.muzonly2.com/#/search?text=${track.name} ${track.artists.join(' ')}`
      var win = window.open(encodeURI(url), '_blank')
      win.focus()
    },
    addToDownloadSpotifyPlaylist (track) {
      track.loadingAddingToDownloadPlaylist = true
      SpotifyService.addTracksToPlaylist(this.spotifyPlaylistWithTracksToDownload, [track.uri]).then(response => {
        if (response.status === 201 && response.data.snapshot_id) {
          track.hasBeenAddedToDownloadPlaylist = true
          track.loadingAddingToDownloadPlaylist = false
          this.componentKey += 1
        }
      })
    },
    addToBuySpotifyPlaylist (track) {
      track.loadingAddingToBuyPlaylist = true
      SpotifyService.addTracksToPlaylist(this.spotifyPlaylistIdWithTracksToBuy, [track.uri]).then(response => {
        if (response.status === 201 && response.data.snapshot_id) {
          track.hasBeenAddedToBuyPlaylist = true
          track.loadingAddingToBuyPlaylist = false
          this.componentKey += 1
        }
      })
    }
  }
}
</script>

<style lang="scss">
.v-data-table tbody {
  text-transform: capitalize;
}
</style>
