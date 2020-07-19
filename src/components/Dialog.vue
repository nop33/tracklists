<template>
  <v-dialog v-model="dialog" transition="dialog-bottom-transition">
    <v-card>
      <v-toolbar v-if="dialogTitle" color="grey lighten-4" flat>
        <v-toolbar-title>{{ dialogTitle }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-sheet class="pa-4">
        <div class="d-flex">
          <v-text-field
            v-model="tracklistSearchInput"
            label="Search track"
            clear-icon="mdi-close-circle-outline"
            flat hide-details clearable
          ></v-text-field>
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

          <v-menu rounded="b-xl" offset-y v-if="isSpotifyTrack && spotifyPlaylistsToAddTrack.length > 0">
            <template v-slot:activator="{ attrs, on }">
              <v-btn v-bind="attrs" v-on="on" text class="grey--text">
                Add to playlist
                <v-icon right>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                link
                v-for="spotifyPlaylist in spotifyPlaylistsToAddTrack"
                :key="spotifyPlaylist.id"
                @click="addToSpotifyPlaylist(item, spotifyPlaylist)"
              >
                <v-list-item-title>
                  <v-icon left>fab fa-spotify</v-icon>
                  {{ spotifyPlaylist.name }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <!-- <v-btn
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
          </v-btn> -->
        </template>
      </v-data-table>
    </v-card>
    <v-snackbars :messages.sync="messages" color="green" bottom></v-snackbars>
  </v-dialog>
</template>

<script>
import { mapState } from 'vuex'

import SpotifyService from '@/services/SpotifyService'
import { contentTypes } from '@/utils/constants'

import VSnackbars from 'v-snackbars'

export default {
  props: ['spotifyImportedPlaylists'],
  components: {
    VSnackbars
  },
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
      page: 0,
      messages: []
    }
  },
  computed: {
    ...mapState([
      'tracklistInDialog',
      'showDialog',
      'spotifyPlaylistWithTracksToDownload',
      'spotifyPlaylistIdWithTracksToBuy'
    ]),
    dialogTitle () {
      return this.tracklistInDialog ? this.tracklistInDialog.name : ''
    },
    isSpotifyTrack () {
      return this.tracklistInDialog.contentType === contentTypes.SPOTIFY
    },
    spotifyPlaylistsToAddTrack () {
      return this.spotifyImportedPlaylists.filter(playlist => playlist !== this.tracklistInDialog)
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
    addToSpotifyPlaylist (track, playlist) {
      if (playlist.id === 'liked') {
        SpotifyService.addTracksToLiked([track.id]).then(response => {
          this.messages.push(`"${track.name}" added in Liked!`)
        })
      } else {
        SpotifyService.addTracksToPlaylist(playlist, [track.uri]).then(response => {
          if (response.status === 201 && response.data.snapshot_id) {
            // this.componentKey += 1
            this.messages.push(`"${track.name}" added in "${playlist.name}"!`)
          } else {
            // Add error logging
          }
        })
      }
    }
    // addToDownloadSpotifyPlaylist (track) {
    //   track.loadingAddingToDownloadPlaylist = true
    //   SpotifyService.addTracksToPlaylist(this.spotifyPlaylistWithTracksToDownload, [track.uri]).then(response => {
    //     if (response.status === 201 && response.data.snapshot_id) {
    //       track.hasBeenAddedToDownloadPlaylist = true
    //       track.loadingAddingToDownloadPlaylist = false
    //       this.componentKey += 1
    //     }
    //   })
    // },
    // addToBuySpotifyPlaylist (track) {
    //   track.loadingAddingToBuyPlaylist = true
    //   SpotifyService.addTracksToPlaylist(this.spotifyPlaylistIdWithTracksToBuy, [track.uri]).then(response => {
    //     if (response.status === 201 && response.data.snapshot_id) {
    //       track.hasBeenAddedToBuyPlaylist = true
    //       track.loadingAddingToBuyPlaylist = false
    //       this.componentKey += 1
    //     }
    //   })
    // }
  }
}
</script>

<style lang="scss">
.v-data-table tbody {
  text-transform: capitalize;
}
</style>
