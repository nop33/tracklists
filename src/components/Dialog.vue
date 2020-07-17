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
        :items="filteredTableContents"
        :items-per-page="10"
        :key="componentKey"
      >
        <template v-slot:item.actions="{ item }">
          <v-btn small @click="openMuzonlyTab(item)" class="mr-2">MuzOnly</v-btn>
          <v-btn
            small
            :loading="item.loadingDownload"
            @click="addToDownloadSpotifyPlaylist(item)"
            :color="item.isDownloaded ? 'green' : ''"
          >
            Add to "Download" Spotify playlist
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
      componentKey: 0
    }
  },
  computed: {
    ...mapState([
      'tracklistInDialog',
      'showDialog',
      'spotifyPlaylistIdWithTracksToDownload'
    ]),
    filteredTableContents () {
      if (this.tracklistSearchInput) {
        return this.tracklistInDialog.tracks.filter(track => {
          return (track.name.includes(this.tracklistSearchInput) ||
            track.artists.some(artist => artist.includes(this.tracklistSearchInput)))
        })
      }
      return this.tracklistInDialog.tracks
    }
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
      track.loadingDownload = true
      SpotifyService.addTracksToPlaylist(this.spotifyPlaylistIdWithTracksToDownload, [track.uri]).then(response => {
        if (response.status === 201 && response.data.snapshot_id) {
          track.isDownloaded = true
          this.componentKey += 1
          track.loadingDownload = false
        }
      })
    }
  }
}
</script>
