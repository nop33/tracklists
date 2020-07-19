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
      </v-row>
      <v-slide-y-transition>
        <v-row v-show="importMethodSelected == 0" justify="center">
          <v-col v-if="!canAccessSpotifyAPI" sm="auto" class="text-center">
            <v-btn @click="loginToSpotify" dark color="green">Login to Spotify</v-btn>
          </v-col>
          <v-col v-else sm="6" class="text-center">
            <SpotifyPlaylistListCard
              :playlistImportCallback="getSpotifyPlaylistTracks"
              :apiErrorCallback="handleAPIError"
            />
          </v-col>
        </v-row>
      </v-slide-y-transition>
      <v-slide-y-transition>
        <v-row v-show="importMethodSelected == 1" justify="center">
          <v-col sm="6" class="text-center">
            <v-file-input
              label="Upload iTunes playlist file"
              @change="readITunesFile"
              prepend-icon="fas fa-file-alt"
            >
            </v-file-input>
          </v-col>
        </v-row>
      </v-slide-y-transition>
      <v-slide-y-transition>
        <v-row v-show="importMethodSelected == 2" justify="center">
          <v-col sm="6" class="text-center">
            <v-file-input
              label="Upload rekordbox playlist file"
              @change="readRekordboxFile"
              prepend-icon="fas fa-file-alt"
            >
            </v-file-input>
          </v-col>
        </v-row>
      </v-slide-y-transition>
      <v-row>
        <v-col>
          <v-slide-x-transition>
            <v-row v-if="atLeastOneSpotifyPlaylistWasImported">
              <v-col>
                <TracklistCardWithPlaceholder
                  :tracklist="spotifyPlaylistWithTracksToDownload"
                  placeholderText="Once you select a Spotify playlist with tracks to download, it will appear here"
                  type="spotifyPlaylistWithTracksToDownload"
                  icon="mdi-download"
                  cardTitle="To download"
                />
              </v-col>
              <v-col>
                <TracklistCardWithPlaceholder
                  :tracklist="spotifyPlaylistWithTracksToBuy"
                  placeholderText="Once you select a Spotify playlist with tracks to buy, it will appear here"
                  type="spotifyPlaylistWithTracksToDownload"
                  icon="mdi-currency-usd"
                  cardTitle="To buy"
                />
              </v-col>
            </v-row>
          </v-slide-x-transition>
        </v-col>
        <v-col>
          <v-slide-x-reverse-transition>
            <ComparisonRow
              v-if="atLeastTwoPlaylistsWereImported"
              :leftTracklist="selectedTracklistToCompareLeft"
              :rightTracklist="selectedTracklistToCompareRight"
              :compareCallback="compare"
            />
          </v-slide-x-reverse-transition>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-slide-x-transition>
            <TracklistListCard
              v-if="atLeastOnePlaylistWasImported"
              cardTitle="Imported playlists"
              placeholderText="Your imported playlists will appear here"
              :tracklists="importedTracklists"
            />
          </v-slide-x-transition>
        </v-col>
        <v-col>
          <v-slide-x-reverse-transition>
            <TracklistListCard
              v-if="atLeastTwoPlaylistsWereImported"
              cardTitle="Generated tracklists"
              placeholderText="Your generated tracklists will appear here"
              :tracklists="generatedTracklists"
              :deleteTracklistCallback="deleteTracklist"
            />
          </v-slide-x-reverse-transition>
        </v-col>
      </v-row>
      <v-row>
        <v-col sm="6">
          <Dialog />
        </v-col>
      </v-row>
    </v-container>
    <SnackBar :text="snackBarText" />
  </div>
</template>

<script>
import { mapState } from 'vuex'

import SpotifyService from '@/services/SpotifyService'
import ImportPlaylistButton from '@/components/ImportPlaylistButton.vue'
import SpotifyPlaylistListCard from '@/components/SpotifyPlaylistListCard.vue'
import SnackBar from '@/components/SnackBar.vue'
import ComparisonRow from '@/components/ComparisonRow.vue'
import TracklistListCard from '@/components/TracklistListCard.vue'
import Dialog from '@/components/Dialog.vue'
import TracklistCardWithPlaceholder from '@/components/TracklistCardWithPlaceholder.vue'

import { generateRandomString, cleanTrackName, removeFeaturedArtistFromName } from '@/utils/utils'
import { ImportedTracklist, GeneratedTracklist } from '@/utils/tracklist'
import { contentTypes } from '@/utils/constants'

export default {
  components: {
    ImportPlaylistButton,
    SpotifyPlaylistListCard,
    SnackBar,
    ComparisonRow,
    TracklistListCard,
    Dialog,
    TracklistCardWithPlaceholder
  },
  data: () => ({
    clientId: 'e5d07ddf1fe64a6cbcd2d14ac0aac87b',
    scope: 'user-read-private user-read-email playlist-read-private user-library-read playlist-modify-private',
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
    spotifyPlaylistSearch: null
  }),
  computed: {
    ...mapState(
      [
        'selectedTracklistToCompareLeft',
        'selectedTracklistToCompareRight',
        'selectedImportMethod',
        'spotifyPlaylistWithTracksToDownload',
        'spotifyPlaylistWithTracksToBuy'
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
        this.$store.dispatch('setSelectedImportMethod', value)
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
    },
    findMatchingRightSideTrack (leftSideTrack) {
      let i = 0
      while (!leftSideTrack.match && i < this.selectedTracklistToCompareRight.tracks.length) {
        const rightSideTrack = this.selectedTracklistToCompareRight.tracks[i]
        if (leftSideTrack.name === rightSideTrack.name &&
              atLeastOneSpotifyArtistIsIncludedInITunesArtistString(leftSideTrack, rightSideTrack)) {
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
            alert('Spotify says "Computer says no". Refresh the page and try to login again =)')
          } else {
            this.canAccessSpotifyAPI = true
          }
        }
      }, 2000)
    },
    readITunesFile (file) {
      this.$store.dispatch('hideImporter')
      this.currentlyProcessingTextFileName = file.name.split('.')[0]
      this.iTunesFileReader.readAsText(file)
    },
    readRekordboxFile (file) {
      this.$store.dispatch('hideImporter')
      this.currentlyProcessingTextFileName = file.name.split('.')[0]
      this.rekordboxFileReader.readAsText(file)
    },
    processITunesPlaylistFile (file) {
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
          this.currentlyProcessingTextFileName,
          this.currentlyProcessingTextFileName,
          contentTypes.ITUNES,
          tracks
        )
      )
      this.currentlyProcessingTextFileName = ''
    },
    processRekordboxPlaylistFile (file) {
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
          this.currentlyProcessingTextFileName,
          this.currentlyProcessingTextFileName,
          contentTypes.REKORDBOX,
          tracks
        )
      )
      this.currentlyProcessingTextFileName = ''
    },
    getSpotifyPlaylistTracks (playlistName, playlistId, totalTracks) {
      const tracks = []
      const promisesArray = []
      const limit = playlistId === 'liked' ? 50 : 100
      let offset = 0

      while (offset < totalTracks) {
        promisesArray.push(SpotifyService.getPlaylistTracks(playlistId, { limit, offset }))
        offset += limit
      }

      Promise.all(promisesArray).then(responses => {
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

        this.importedTracklists.push(
          new ImportedTracklist(
            playlistId,
            playlistName,
            contentTypes.SPOTIFY,
            tracks
          )
        )
      }).catch(err => {
        this.handleAPIError(err)
      })
    },
    deleteTracklist (tracklist) {
      this.generatedTracklists.splice(this.generatedTracklists.indexOf(tracklist), 1)
    },
    handleAPIError (err) {
      console.log(err)
      if (err.response && err.response.status === 401) {
        this.snackbarText = 'I lost the Spotify connection, care logging in again please? Thanks!'
        this.$store.dispatch('toggleSnackBar', true)
        localStorage.removeItem('spotifyAccessToken')
        this.canAccessSpotifyAPI = false
      }
    }
  }
}
</script>
