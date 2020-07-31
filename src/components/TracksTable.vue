<template>
  <v-dialog v-model="dialog" transition="dialog-bottom-transition" content-class="my-dialog">
    <v-card>
      <v-toolbar v-if="dialogTitle" color="grey lighten-4" flat>
        <v-toolbar-title class="d-flex align-center">
          <v-icon left v-text="tracklistIcon" :color="iconColor"></v-icon>
          {{ dialogTitle }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-sheet class="pa-4">
        <div class="d-flex align-center">
          <v-menu rounded="b-xl" offset-y v-if="isSpotifyTracklist">
            <template v-slot:activator="{ on: menu, attrs }">
              <v-tooltip right>
                <template v-slot:activator="{ on: tooltip }">
                  <v-btn
                    class="mr-2"
                    fab
                    outlined
                    small
                    color="primary"
                    v-bind="attrs"
                    v-on="{ ...tooltip, ...menu }"
                    :disabled="isAddSelectedTracksToPlaylistMenuDisabled"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </template>
                <span>Add {{ selectedTracks.length }} tracks to playlist</span>
              </v-tooltip>
            </template>
            <v-list>
              <v-list-item
                link
                v-for="spotifyPlaylist in spotifyPlaylistsToAddListOfTracks"
                :key="spotifyPlaylist.id"
                @click="addSelectedTracksToSpotifyPlaylist(spotifyPlaylist)"
                :disabled="selectedTracksToAddToPlaylist(spotifyPlaylist).length === 0"
              >
                <v-list-item-title>
                  <v-icon left :color="spotifyIconColor">{{ spotifyIcon }}</v-icon>
                  {{ spotifyPlaylist.name }} (+{{ selectedTracksToAddToPlaylist(spotifyPlaylist).length }})
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <v-btn
                fab
                outlined
                small
                v-on="on"
                @click="toggleExpansion"
              >
                <v-icon>mdi-unfold-more-horizontal</v-icon>
              </v-btn>
            </template>
            <span>{{ expansionTooltipContent }}</span>
          </v-tooltip>

          <v-spacer/>

          <v-text-field
            v-model="tracklistSearchInput"
            dense
            label="Search"
            clear-icon="mdi-close"
            clearable
            append-icon="mdi-magnify"
            class="flex-grow-0"
          ></v-text-field>
        </div>
      </v-sheet>
      <v-sheet class="px-4 pb-4 text-caption">
        Displaying {{ itemsPerPage }} out of {{ totalNumberOfTracks }} tracks
      </v-sheet>
      <v-data-table
        fixed-header
        height="60vh"
        v-if="tracklistInDialog"
        :headers="headers"
        :items="tracklistInDialog.tracks"
        :items-per-page="itemsPerPage"
        :key="componentKey"
        :search="tracklistSearchInput"
        :page.sync="page"
        v-model="selectedTracks"
        show-select
      >
        <template v-slot:item.artists="{ item }">
          {{ item.artists.join(', ')}}
        </template>
        <template v-slot:item.actions="{ item }">
          <TracksTableRowActions :track="item"/>
        </template>
      </v-data-table>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import { contentTypes, icons, iconColors } from '@/utils/constants'
import { areTracksTheSame } from '@/utils/utils'

import SpotifyService from '@/services/SpotifyService'

import TracksTableRowActions from '@/components/TracksTableRowActions.vue'

export default {
  components: {
    TracksTableRowActions
  },
  props: [
    'apiErrorCallback',
    'reloadPlaylistTracksFromApi'
  ],
  data: () => {
    return {
      dialog: false,
      tracklistSearchInput: null,
      headers: [
        { text: 'Track name', value: 'name', width: '33%' },
        { text: 'Track artists', value: 'artists', width: '33%' },
        { text: '', value: 'actions', sortable: false, width: '33%' }
      ],
      selectedTracks: [],
      componentKey: 0,
      page: 0,
      addedTracksToPlaylistResult: 0,
      itemsPerPage: 10,
      defaultItemsPerPage: 10,
      showScrollToTop: false
    }
  },
  computed: {
    ...mapState([
      'tracklistInDialog',
      'showDialog'
    ]),
    ...mapGetters([
      'importedTracklists'
    ]),
    spotifyImportedPlaylists () {
      return this.importedTracklists.filter(tracklist => tracklist.contentType === contentTypes.SPOTIFY)
    },
    dialogTitle () {
      return this.tracklistInDialog ? this.tracklistInDialog.name : ''
    },
    isSpotifyTracklist () {
      return this.tracklistInDialog && this.tracklistInDialog.contentType === contentTypes.SPOTIFY
    },
    spotifyPlaylistsToAddListOfTracks () {
      return this.tracklistInDialog
        ? this.spotifyImportedPlaylists.filter(playlist => playlist.id !== this.tracklistInDialog.id)
        : []
    },
    spotifyIcon () {
      return icons.SPOTIFY
    },
    spotifyIconColor () {
      return iconColors[contentTypes.SPOTIFY]
    },
    isAddSelectedTracksToPlaylistMenuDisabled () {
      return !this.tracklistInDialog || !this.isSpotifyTracklist || this.spotifyPlaylistsToAddListOfTracks.length === 0 || this.selectedTracks.length === 0
    },
    expansionTooltipContent () {
      if (this.tracklistInDialog) {
        return this.itemsPerPage > this.defaultItemsPerPage ? 'Switch to pagination' : `See all ${this.totalNumberOfTracks} tracks`
      }
      return ''
    },
    totalNumberOfTracks () {
      return this.tracklistInDialog ? this.tracklistInDialog.tracks.length : 0
    },
    iconColor () {
      return this.tracklistInDialog ? iconColors[this.tracklistInDialog.contentType] : ''
    },
    tracklistIcon () {
      return this.tracklistInDialog ? icons[this.tracklistInDialog.contentType] : ''
    }
  },
  watch: {
    showDialog: function (newValue) {
      this.dialog = newValue
    },
    dialog: function (newValue, oldValue) {
      if (!newValue) {
        this.$store.dispatch('toggleDialog')
        this.selectedTracks = []
      }
    }
  },
  methods: {
    toggleExpansion () {
      this.itemsPerPage = this.itemsPerPage > this.defaultItemsPerPage ? this.defaultItemsPerPage : this.tracklistInDialog.tracks.length
    },
    selectedTracksToAddToPlaylist (playlist) {
      return this.selectedTracks.filter(track => !playlist.tracks.some(tr => areTracksTheSame(tr, track)))
    },
    async addSelectedTracksToSpotifyPlaylist (playlist) {
      const tracks = this.selectedTracksToAddToPlaylist(playlist)
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
      this.dialog = false
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
    }
  }
}
</script>

<style lang="scss">
.my-dialog {
  height: 90%;
  position: relative;

  .v-card {
    height: 100%;
  }

  .v-data-table tbody {
    text-transform: capitalize;
  }
}
</style>
