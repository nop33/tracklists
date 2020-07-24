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
            prepend-icon="mdi-magnify"
          ></v-text-field>
          <v-menu rounded="b-xl" offset-y>
            <template v-slot:activator="{ attrs, on }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                text
                class="grey--text"
                outlined
                :disabled="!tracklistInDialog || !isSpotifyTracklist || spotifyPlaylistsToAddListOfTracks.length === 0"
              >
                <v-icon left>mdi-plus</v-icon>
                to playlist
                <v-icon right>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                link
                v-for="spotifyPlaylist in spotifyPlaylistsToAddListOfTracks"
                :key="spotifyPlaylist.id"
                @click="addToSpotifyPlaylist(tracksToAddToPlaylist(spotifyPlaylist), spotifyPlaylist)"
                :disabled="tracksToAddToPlaylist(spotifyPlaylist).length === 0"
              >
                <v-list-item-title>
                  <v-icon left>fab fa-spotify</v-icon>
                  {{ spotifyPlaylist.name }} (+{{ tracksToAddToPlaylist(spotifyPlaylist).length }})
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
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

          <v-menu rounded="b-xl" offset-y v-if="isSpotifyTracklist && spotifyPlaylistsToAddTrack([item]).length > 0">
            <template v-slot:activator="{ attrs, on }">
              <v-btn v-bind="attrs" v-on="on" text class="grey--text">
                Add to playlist
                <v-icon right>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                link
                v-for="spotifyPlaylist in spotifyPlaylistsToAddTrack([item])"
                :key="spotifyPlaylist.id"
                @click="addToSpotifyPlaylist([item], spotifyPlaylist)"
              >
                <v-list-item-title>
                  <v-icon left>fab fa-spotify</v-icon>
                  {{ spotifyPlaylist.name }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState } from 'vuex'

import SpotifyService from '@/services/SpotifyService'
import { contentTypes } from '@/utils/constants'

export default {
  props: [
    'spotifyImportedPlaylists',
    'apiErrorCallback',
    'reloadPlaylistTracksFromApi'
  ],
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
      addedTracksToPlaylistResult: 0
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
    isSpotifyTracklist () {
      return this.tracklistInDialog.contentType === contentTypes.SPOTIFY
    },
    spotifyPlaylistsToAddListOfTracks () {
      return this.tracklistInDialog
        ? this.spotifyImportedPlaylists.filter(playlist => playlist.id !== this.tracklistInDialog.id)
        : []
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
    tracksToAddToPlaylist (playlist) {
      return this.tracklistInDialog.tracks.filter(track => !playlist.tracks.some(tr => tr.id === track.id))
    },
    openMuzonlyTab (track) {
      const url = `https://srv.muzonly2.com/#/search?text=${track.name} ${track.artists.join(' ')}`
      var win = window.open(encodeURI(url), '_blank')
      win.focus()
    },
    async addToSpotifyPlaylist (tracks, playlist) {
      const cleanedFromLocalTracks = tracks.filter(track => !track.uri.startsWith('spotify:local'))
      if (cleanedFromLocalTracks.length === 0) {
        this.$store.dispatch('pushNotification', 'There are no valid tracks to add...')
        return
      }
      this.$store.dispatch('setOverlay', true)
      const limit = playlist.id === 'liked' ? 50 : 100
      const offset = 0
      this.$store.dispatch('setOverlayTotalProgress', cleanedFromLocalTracks.length)
      const numberOfTracksAdded = await this.addTracksChunkToSpotifyPlaylist(playlist, cleanedFromLocalTracks, offset, limit)
      if (numberOfTracksAdded > 0) {
        this.reloadPlaylistTracksFromApi(playlist)
        this.$store.dispatch('pushNotification', `${numberOfTracksAdded} tracks added!`)
      } else {
        this.$store.dispatch('pushNotification', 'No tracks were added...')
      }
    },
    async addTracksChunkToSpotifyPlaylist (playlist, allTracks, offset, limit) {
      const tracksChunk = allTracks.slice(offset, offset + limit)
      let response = null
      let result = 0
      try {
        response = playlist.id === 'liked'
          ? await SpotifyService.addTracksToLiked(tracksChunk.map(track => track.id))
          : await SpotifyService.addTracksToPlaylist(playlist, tracksChunk.map(track => track.uri))
        if (response.status === 200 || (response.status === 201 && response.data.snapshot_id)) {
          this.$store.dispatch('increaseOverlayCurrentProgress', tracksChunk.length)
        }

        offset += limit
        if (offset < allTracks.length) {
          result = await this.addTracksChunkToSpotifyPlaylist(playlist, allTracks, offset, limit)
        }

        return result + tracksChunk.length
      } catch (err) {
        this.apiErrorCallback(err)
      }
    },
    spotifyPlaylistsToAddTrack (track) {
      return this.spotifyImportedPlaylists.filter(playlist => {
        return playlist !== this.tracklistInDialog && !playlist.tracks.some(tr => tr.id === track.id)
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
