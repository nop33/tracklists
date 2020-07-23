<template>
  <div class="home">
    <v-container fluid>
      <v-row>
        <v-col class="d-flex align-center flex-column">
          <h2 class="text-h4 mb-5">Import playlist from</h2>
          <v-btn-toggle v-model="importMethodSelected">
            <ImportPlaylistButton text="Spotify" icon="fab fa-spotify" color="green" />
            <ImportPlaylistButton text="iTunes" icon="fab fa-itunes" color="blue" />
            <ImportPlaylistButton text="Rekordbox" icon="fas fa-headphones" color="black" />
          </v-btn-toggle>
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
      <v-dialog v-model="importerDialog" transition="dialog-bottom-transition" class="mx-auto" max-width="50vw">
        <SpotifyPlaylistListCard
          :playlistImportCallback="importSpotifyPlaylist"
          :playlistSelectedCallback="resetSelectedImportMethod"
          :apiErrorCallback="handleAPIError"
          v-if="canAccessSpotifyAPI"
          v-show="importMethodSelected == 0"
        />
        <v-btn v-if="importMethodSelected == 0 && !canAccessSpotifyAPI" @click="loginToSpotify" dark color="green">
          Login to Spotify
        </v-btn>
        <v-card v-if="importMethodSelected == 1 || importMethodSelected == 2">
          <v-card-title></v-card-title>
          <v-card-text>
            <v-file-input
              v-show="importMethodSelected == 1"
              label="Upload iTunes playlist file"
              @change="readITunesFile"
              prepend-icon="fas fa-file-alt"
            >
            </v-file-input>
            <v-file-input
              v-show="importMethodSelected == 2"
              label="Upload rekordbox playlist file"
              @change="readRekordboxFile"
              prepend-icon="fas fa-file-alt"
            >
            </v-file-input>
          </v-card-text>
        </v-card>
      </v-dialog>
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

import SpotifyService from '@/services/SpotifyService'
import ImportPlaylistButton from '@/components/ImportPlaylistButton.vue'
import SpotifyPlaylistListCard from '@/components/SpotifyPlaylistListCard.vue'
import VSnackbars from 'v-snackbars'
import ComparisonRow from '@/components/ComparisonRow.vue'
import TracklistsCard from '@/components/TracklistsCard.vue'
import Dialog from '@/components/Dialog.vue'

import { generateRandomString, cleanTrackName, removeFeaturedArtistFromName } from '@/utils/utils'
import { ImportedTracklist, GeneratedTracklist } from '@/utils/tracklist'
import { contentTypes } from '@/utils/constants'

export default {
  components: {
    ImportPlaylistButton,
    SpotifyPlaylistListCard,
    VSnackbars,
    ComparisonRow,
    TracklistsCard,
    Dialog
  },
  data: () => ({
    clientId: 'e5d07ddf1fe64a6cbcd2d14ac0aac87b',
    scope: 'playlist-read-private playlist-modify-private user-library-read user-library-modify',
    redirectUri: 'http://localhost:8080/spotify-auth-callback',
    state: generateRandomString(16),
    iTunesFileReader: new FileReader(),
    rekordboxFileReader: new FileReader(),
    importedTracklists: [],
    generatedTracklists: [],
    currentlyProcessingTextFileName: '',
    canAccessSpotifyAPI: false,
    snackbar: false,
    snackBarText: '',
    spotifyPlaylistSearch: null,
    importerDialog: false
  }),
  watch: {
    selectedImportMethod (newValue) {
      if (newValue === null && this.importerDialog) {
        this.importerDialog = false
      }
    },
    importerDialog (newValue) {
      if (!newValue && this.selectedImportMethod !== null) {
        this.resetSelectedImportMethod() // TODO: Need to delay this until dialog transition has finished
      }
    },
    importedTracklists () {
      if (this.importedTracklists.length <= 2) {
        this.$store.dispatch('setTracklistToCompare', this.importedTracklists[this.importedTracklists.length - 1])
      }
    },
    progressValue (newValue) {
      if (newValue === 100) {
        setTimeout(() => {
          this.isOverlayOpen = false
        }, 1000)
      }
    }
  },
  computed: {
    ...mapState(
      [
        'selectedTracklistToCompareLeft',
        'selectedTracklistToCompareRight',
        'selectedImportMethod',
        'spotifyPlaylistWithTracksToDownload',
        'spotifyPlaylistWithTracksToBuy',
        'notifications',
        'progressCurrent',
        'progressTotal'
      ]
    ),
    ...mapGetters(
      [
        'isOverlayOpen',
        'overlayTotalProgress',
        'overlayCurrentProgress'
      ]
    ),
    spotifyAuthUrl () {
      const baseUrl = 'https://accounts.spotify.com/authorize'
      const responseType = 'token'
      const clientId = encodeURIComponent(this.clientId)
      const scope = encodeURIComponent(this.scope)
      const redirectUri = encodeURIComponent(this.redirectUri)
      const state = encodeURIComponent(this.state)
      return `${baseUrl}?response_type=${responseType}&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`
    },
    importMethodSelected: {
      get () {
        return this.selectedImportMethod
      },
      set (value) {
        this.importerDialog = value >= 0
        this.$store.dispatch('setSelectedImportMethod', value)
      }
    },
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
      return this.overlayTotalProgress ? Math.floor((this.overlayCurrentProgress / this.overlayTotalProgress) * 100) : 0
    }
  },
  created () {
    this.iTunesFileReader.addEventListener('load', (event) => {
      const file = event.target.result
      this.processITunesPlaylistFile(file)
    })
    this.rekordboxFileReader.addEventListener('load', (event) => {
      const file = event.target.result
      this.processRekordboxPlaylistFile(file)
    })
    this.canAccessSpotifyAPI = !!localStorage.getItem('spotifyAccessToken')
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

      this.generatedTracklists.push(
        new GeneratedTracklist(
          `Both in "${this.selectedTracklistToCompareLeft.name}" and "${this.selectedTracklistToCompareRight.name}"`,
          `Both in "${this.selectedTracklistToCompareLeft.name}" and "${this.selectedTracklistToCompareRight.name}"`,
          'mixed',
          sameTracks
        )
      )
      this.generatedTracklists.push(
        new GeneratedTracklist(
          `Only in "${this.selectedTracklistToCompareLeft.name}" and not in "${this.selectedTracklistToCompareRight.name}"`,
          `Only in "${this.selectedTracklistToCompareLeft.name}" and not in "${this.selectedTracklistToCompareRight.name}"`,
          this.selectedTracklistToCompareLeft.contentType,
          onlyLeftSideTracks
        )
      )
      this.generatedTracklists.push(
        new GeneratedTracklist(
          `Only in "${this.selectedTracklistToCompareRight.name}" and not in "${this.selectedTracklistToCompareLeft.name}"`,
          `Only in "${this.selectedTracklistToCompareRight.name}" and not in "${this.selectedTracklistToCompareLeft.name}"`,
          this.selectedTracklistToCompareRight.contentType,
          onlyRightSideTracks
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
        if (leftSideTrack.id === rightSideTrack.id || (leftSideTrack.name === rightSideTrack.name &&
            atLeastOneSpotifyArtistIsIncludedInITunesArtistString(leftSideTrack, rightSideTrack))) {
          // count duplicate track in right side if rightSideTrack.match is not undefined
          leftSideTrack.match = rightSideTrack.id
          rightSideTrack.match = leftSideTrack.id
        }
        i++
      }

      function atLeastOneSpotifyArtistIsIncludedInITunesArtistString (leftSideTrack, rightSideTrack) {
        return leftSideTrack.artists.some(leftSideTrackArtist => rightSideTrack.artists.includes(leftSideTrackArtist))
      }
    },
    loginToSpotify () {
      window.open(this.spotifyAuthUrl, '_blank', 'height=570,width=520')
      const checkForspotifyAccessToken = setInterval(() => {
        if (localStorage.getItem('spotifyAccessToken')) {
          clearInterval(checkForspotifyAccessToken)
          const receivedState = localStorage.getItem('spotifyReceivedState')
          if (receivedState === null || receivedState !== this.state) {
            this.$store.dispatch('pushNotification', 'Spotify says no. Refresh the page and try to login again =)')
          } else {
            this.canAccessSpotifyAPI = true
          }
        }
      }, 2000)
    },
    readITunesFile (file) {
      this.resetSelectedImportMethod()
      this.currentlyProcessingTextFileName = file.name.split('.')[0]
      this.iTunesFileReader.readAsText(file)
    },
    readRekordboxFile (file) {
      this.resetSelectedImportMethod()
      this.currentlyProcessingTextFileName = file.name.split('.')[0]
      this.rekordboxFileReader.readAsText(file)
    },
    processITunesPlaylistFile (file) {
      const playlistName = `${this.currentlyProcessingTextFileName} (iTunes)`
      const tracks = []
      const lines = file.split(/[\r\n]+/)
      lines.shift() // remove first line with headers
      lines.pop() // remove empty last line

      lines.forEach(line => {
        const trackData = line.split('\t')
        const track = {
          name: cleanTrackName(trackData[0]),
          artists: trackData[1].split(', ').map(artist => artist.trim().toLowerCase())
        }
        track.name = removeFeaturedArtistFromName(track)
        tracks.push({
          id: `${track.name} - ${track.artists}`,
          name: track.name,
          artists: track.artists
        })
      })

      this.importedTracklists.push(
        new ImportedTracklist(
          playlistName,
          playlistName,
          contentTypes.ITUNES,
          tracks
        )
      )
      this.currentlyProcessingTextFileName = ''
    },
    processRekordboxPlaylistFile (file) {
      const playlistName = `${this.currentlyProcessingTextFileName} (Rekordbox)`
      const tracks = []
      const lines = file.split(/[\r\n]+/)
      lines.shift() // remove first line with headers
      lines.pop() // remove empty last line

      lines.forEach(line => {
        const trackData = line.split('\t')
        const track = {
          name: cleanTrackName(trackData[1]),
          artists: trackData[2].split(', ').map(artist => artist.trim().toLowerCase())
        }
        track.name = removeFeaturedArtistFromName(track)
        tracks.push({
          id: `${track.name} - ${track.artists}`,
          name: track.name,
          artists: track.artists
        })
      })
      this.importedTracklists.push(
        new ImportedTracklist(
          playlistName,
          playlistName,
          contentTypes.REKORDBOX,
          tracks
        )
      )
      this.currentlyProcessingTextFileName = ''
    },
    async importSpotifyPlaylist (playlistName, playlistId, totalTracks) {
      const tracks = await this.getSpotifyPlaylistTracks(playlistId, totalTracks)
      const tracklist = new ImportedTracklist(playlistId, playlistName, contentTypes.SPOTIFY, tracks)
      this.importedTracklists.push(tracklist)
    },
    async reloadPlaylistTracksFromApi (playlist) {
      try {
        const result = await SpotifyService.getPlaylist(playlist.id)
        const totalTracks = result.data.tracks.total
        playlist.tracks = await this.getSpotifyPlaylistTracks(playlist.id, totalTracks)
      } catch (err) {
        this.handleAPIError(err)
      }
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
    deleteTracklist (tracklist) {
      this.generatedTracklists.splice(this.generatedTracklists.indexOf(tracklist), 1)
    },
    handleAPIError (err) {
      console.log(err)
      if (err.response && err.response.status === 401) {
        this.$store.dispatch('pushNotification', 'Please login on Spotify again, sorry!')
        localStorage.removeItem('spotifyAccessToken')
        this.canAccessSpotifyAPI = false
      } else {
        this.$store.dispatch('pushNotification', err.response.data.error.message)
      }
    },
    resetSelectedImportMethod () {
      this.$store.dispatch('setSelectedImportMethod', null)
    }
  }
}
</script>
