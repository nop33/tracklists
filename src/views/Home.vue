<template>
  <div class="home">
    <v-container fluid>
      <v-row>
        <v-col>
          <Importer
            :getSpotifyPlaylistTracks="getSpotifyPlaylistTracks"
            :handleAPIError="handleAPIError"
          />
        </v-col>
        <v-slide-x-reverse-transition>
          <v-col v-if="atLeastTwoPlaylistsWereImported">
            <ComparisonRow
              :leftTracklist="selectedTracklistToCompareLeft"
              :rightTracklist="selectedTracklistToCompareRight"
              :compareCallback="compare"
            />
          </v-col>
        </v-slide-x-reverse-transition>
      </v-row>
      <v-row>
        <v-col>
          <v-slide-x-transition>
            <TracklistsCard
              v-if="atLeastOnePlaylistWasImported"
              :tracklists="importedTracklists"
              cardTitle="Imported playlists"
              placeholderText="Your imported playlists will appear here"
            />
          </v-slide-x-transition>
        </v-col>
        <v-col>
          <v-slide-x-reverse-transition>
            <TracklistsCard
              v-if="atLeastTwoPlaylistsWereImported"
              :tracklists="generatedTracklists"
              cardTitle="Generated tracklists"
              placeholderText="Your generated tracklists will appear here"
              :deleteTracklistCallback="deleteTracklist"
            />
          </v-slide-x-reverse-transition>
        </v-col>
      </v-row>
      <v-row>
        <v-col sm="6">
          <Dialog
            :spotifyImportedPlaylists="spotifyImportedPlaylists"
            :apiErrorCallback="handleAPIError"
            :reloadPlaylistTracksFromApi="reloadPlaylistTracksFromApi"
          />
        </v-col>
      </v-row>
    </v-container>
    <v-snackbars :messages.sync="notifications"></v-snackbars>
    <v-overlay :value="isOverlayOpen" color="white" z-index="300">
      <v-progress-circular
        v-show="overlayProgressIsIndeterminate"
        :size="100"
        :width="15"
        indeterminate
        color="primary"
      />
      <v-progress-circular
        v-show="!overlayProgressIsIndeterminate"
        :rotate="-90"
        :size="100"
        :width="15"
        :value="progressValue"
        color="green"
      >
        {{ progressValue }}
      </v-progress-circular>
    </v-overlay>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import { cleanTrackName, removeFeaturedArtistFromName, areTracksTheSame } from '@/utils/utils'
import { GeneratedTracklist } from '@/utils/tracklist'
import { contentTypes } from '@/utils/constants'

import SpotifyService from '@/services/SpotifyService'
import VSnackbars from 'v-snackbars'
import ComparisonRow from '@/components/ComparisonRow.vue'
import TracklistsCard from '@/components/TracklistsCard.vue'
import Dialog from '@/components/Dialog.vue'
import Importer from '@/components/Importer.vue'

export default {
  components: {
    VSnackbars,
    ComparisonRow,
    TracklistsCard,
    Dialog,
    Importer
  },
  data: () => ({
    generatedTracklists: [],
    snackbar: false,
    snackBarText: '',
    spotifyPlaylistSearch: null
  }),
  computed: {
    ...mapState(
      [
        'selectedTracklistToCompareLeft',
        'selectedTracklistToCompareRight',
        'selectedImportMethod',
        'notifications',
        'progressCurrent',
        'progressTotal'
      ]
    ),
    ...mapGetters(
      [
        'isOverlayOpen',
        'overlayProgressTotal',
        'overlayProgressCurrent',
        'importedTracklists',
        'overlayProgressIsIndeterminate'
      ]
    ),
    notifications: {
      get () {
        return this.$store.state.notifications
      },
      set (value) {
        this.$store.dispatch('setNotifications', value)
      }
    },
    isOverlayOpen: {
      get () {
        return this.$store.state.overlay.isOpen
      },
      set (value) {
        if (!value) {
          this.$store.dispatch('resetOverlayProgress')
        }
        this.$store.dispatch('setOverlay', value)
      }
    },
    atLeastOneSpotifyPlaylistWasImported () {
      return this.importedTracklists.some(tracklist => tracklist.contentType === contentTypes.SPOTIFY)
    },
    atLeastOnePlaylistWasImported () {
      return this.importedTracklists.length > 0
    },
    atLeastTwoPlaylistsWereImported () {
      return this.importedTracklists.length > 1
    },
    spotifyImportedPlaylists () {
      return this.importedTracklists.filter(tracklist => tracklist.contentType === contentTypes.SPOTIFY)
    },
    progressValue () {
      return this.overlayProgressTotal ? Math.floor((this.overlayProgressCurrent / this.overlayProgressTotal) * 100) : 0
    }
  },
  watch: {
    progressValue (newValue) {
      if (newValue === 100) {
        setTimeout(() => {
          this.isOverlayOpen = false
        }, 1000)
      }
    }
  },
  created () {
    this.$store.dispatch('toggleSpotifyAccessTokenFlag', !!localStorage.getItem('spotifyAccessToken'))
  },
  methods: {
    compare () {
      const sameTracks = []
      const onlyLeftSideTracks = []
      const onlyRightSideTracks = []

      this.selectedTracklistToCompareLeft.tracks.forEach(leftSideTrack => {
        this.findMatchingRightSideTrack(leftSideTrack)
        if (leftSideTrack.match) {
          sameTracks.push(leftSideTrack)
        } else {
          onlyLeftSideTracks.push(leftSideTrack)
        }
      })

      this.selectedTracklistToCompareRight.tracks.forEach(rightSideTrack => {
        if (!rightSideTrack.match) {
          onlyRightSideTracks.push(rightSideTrack)
        }
      })
      const isSpotify = this.selectedTracklistToCompareLeft.contentType === contentTypes.SPOTIFY ||
                        this.selectedTracklistToCompareRight.contentType === contentTypes.SPOTIFY
      const matchesTracklistContentType = isSpotify ? contentTypes.SPOTIFY : 'mixed'

      this.generatedTracklists.push(
        new GeneratedTracklist(
          `Both in "${this.selectedTracklistToCompareLeft.name}" and "${this.selectedTracklistToCompareRight.name}"`,
          `Both in "${this.selectedTracklistToCompareLeft.name}" and "${this.selectedTracklistToCompareRight.name}"`,
          matchesTracklistContentType,
          sameTracks,
          this.selectedTracklistToCompareLeft,
          this.selectedTracklistToCompareRight
        )
      )
      this.generatedTracklists.push(
        new GeneratedTracklist(
          `Only in "${this.selectedTracklistToCompareLeft.name}" and not in "${this.selectedTracklistToCompareRight.name}"`,
          `Only in "${this.selectedTracklistToCompareLeft.name}" and not in "${this.selectedTracklistToCompareRight.name}"`,
          this.selectedTracklistToCompareLeft.contentType,
          onlyLeftSideTracks,
          this.selectedTracklistToCompareLeft,
          this.selectedTracklistToCompareRight
        )
      )
      this.generatedTracklists.push(
        new GeneratedTracklist(
          `Only in "${this.selectedTracklistToCompareRight.name}" and not in "${this.selectedTracklistToCompareLeft.name}"`,
          `Only in "${this.selectedTracklistToCompareRight.name}" and not in "${this.selectedTracklistToCompareLeft.name}"`,
          this.selectedTracklistToCompareRight.contentType,
          onlyRightSideTracks,
          this.selectedTracklistToCompareLeft,
          this.selectedTracklistToCompareRight
        )
      )

      this.selectedTracklistToCompareLeft.tracks.forEach(track => {
        track.match = undefined
      })
      this.selectedTracklistToCompareRight.tracks.forEach(track => {
        track.match = undefined
      })
    },
    findMatchingRightSideTrack (leftSideTrack) {
      let i = 0
      while (i < this.selectedTracklistToCompareRight.tracks.length) {
        const rightSideTrack = this.selectedTracklistToCompareRight.tracks[i]
        if (areTracksTheSame(leftSideTrack, rightSideTrack)) {
          // count duplicate track in right side if rightSideTrack.match is not undefined
          leftSideTrack.match = rightSideTrack.id
          rightSideTrack.match = leftSideTrack.id
        }
        i++
      }
    },
    async reloadPlaylistTracksFromApi (playlist) {
      try {
        const result = playlist.id === 'liked'
          ? await SpotifyService.getPlaylistTracks('liked', { limit: 1, offset: 0 })
          : await SpotifyService.getPlaylist(playlist.id)
        const totalTracks = result.data.total || result.data.tracks.total

        playlist.tracks = await this.getSpotifyPlaylistTracks(playlist.id, totalTracks)
      } catch (err) {
        this.handleAPIError(err)
      }

      this.recalculateGeneratedPlaylists(playlist)
    },
    async getSpotifyPlaylistTracks (playlistId, totalTracks) {
      const tracks = []
      const promisesArray = []
      const limit = playlistId === 'liked' ? 50 : 100
      let offset = 0

      while (offset < totalTracks) {
        promisesArray.push(SpotifyService.getPlaylistTracks(playlistId, { limit, offset }))
        offset += limit
      }

      await Promise.all(promisesArray).then(responses => {
        responses.forEach(response => {
          tracks.push(
            ...response.data.items.map(item => {
              const track = {
                name: cleanTrackName(item.track.name),
                artists: item.track.artists.map(artist => artist.name.trim().toLowerCase())
              }
              track.name = removeFeaturedArtistFromName(track)
              return {
                id: item.track.id,
                name: track.name,
                artists: track.artists,
                uri: item.track.uri
              }
            })
          )
        })
      }).catch(err => {
        this.handleAPIError(err)
      })

      return tracks
    },
    recalculateGeneratedPlaylists (playlistThatWasModified) {
      const updatedGeneratedTracklists = []
      const playlistIdPairsToRecompute = []

      this.generatedTracklists.forEach(generatedTracklist => {
        if (generatedTracklist.parentLeft.id === playlistThatWasModified.id ||
            generatedTracklist.parentRight.id === playlistThatWasModified.id) {
          updatedGeneratedTracklists.push(generatedTracklist)
          if (!playlistIdPairsToRecompute.some(pair => {
            return pair.every(id => id === generatedTracklist.parentLeft.id || id === generatedTracklist.parentRight.id)
          })) {
            playlistIdPairsToRecompute.push([generatedTracklist.parentLeft.id, generatedTracklist.parentRight.id])
          }
        }
      })

      // Remove from generated
      updatedGeneratedTracklists.forEach(tracklist => {
        this.generatedTracklists.splice(this.generatedTracklists.indexOf(tracklist), 1)
      })

      // Make new comparison
      playlistIdPairsToRecompute.forEach(pair => {
        if (this.selectedTracklistToCompareLeft) {
          this.$store.dispatch('unsetTracklistToCompare', this.selectedTracklistToCompareLeft)
        }
        if (this.selectedTracklistToCompareRight) {
          this.$store.dispatch('unsetTracklistToCompare', this.selectedTracklistToCompareRight)
        }

        const leftPlaylist = this.importedTracklists.find(tracklist => tracklist.id === pair[0]) ||
                             this.generatedTracklists.find(tracklist => tracklist.id === pair[0])

        const rightPlaylist = this.importedTracklists.find(tracklist => tracklist.id === pair[1]) ||
                             this.generatedTracklists.find(tracklist => tracklist.id === pair[1])

        this.$store.dispatch('setTracklistToCompare', leftPlaylist)
        this.$store.dispatch('setTracklistToCompare', rightPlaylist)
        this.compare()
      })

      // Repeat process for deeper levels
      updatedGeneratedTracklists.forEach(tracklist => {
        this.recalculateGeneratedPlaylists(tracklist)
      })
    },
    deleteTracklist (tracklist) {
      this.generatedTracklists.splice(this.generatedTracklists.indexOf(tracklist), 1)
    },
    handleAPIError (err) {
      console.log(err)
      this.$store.dispatch('setOverlay', false)
      if (err.response && err.response.status === 401) {
        // to improve
        if (!this.$store.state.notifications.includes('Please login on Spotify again, sorry!')) {
          this.$store.dispatch('pushNotification', 'Please login on Spotify again, sorry!')
        }
        localStorage.removeItem('spotifyAccessToken')
        this.$store.dispatch('toggleSpotifyAccessTokenFlag', false)
      } else {
        this.$store.dispatch('pushNotification', err.response.data.error.message)
      }
    }
  }
}
</script>
