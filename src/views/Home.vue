<template>
  <div class="home">
    <v-container fluid>
      <v-row>
        <v-col class="d-flex align-center flex-column">
          <h2 class="text-h4 mb-5">Import playlist from</h2>
          <v-btn-toggle v-model="importMethodSelected">
            <v-btn x-large class="pa-10">
              <v-icon left color="green">fab fa-spotify</v-icon>
              Spotify
            </v-btn>

            <v-btn x-large class="pa-10">
              <v-icon left color="blue">fab fa-itunes</v-icon>
              iTunes
            </v-btn>

            <v-btn x-large class="pa-10">
              <v-icon left color="black">fas fa-headphones</v-icon>
              Rekordbox
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
      <v-row v-if="importMethodSelected == 0" justify="center">
        <v-col v-if="!canAccessSpotifyAPI" sm="auto" class="text-center">
          <v-btn @click="loginToSpotify" dark color="green">Login to Spotify</v-btn>
        </v-col>
        <v-col v-else sm="6" class="text-center">
          <v-card
            class="mx-auto text-left"
            max-width="500"
          >
            <v-sheet class="pa-4 green lighten-2">
              <v-text-field
                v-model="spotifyPlaylistSearch"
                label="Search Spotify playlist"
                dark
                flat
                solo-inverted
                hide-details
                clearable
                clear-icon="mdi-close-circle-outline"
              ></v-text-field>
            </v-sheet>
            <v-card-text class="spotify-playlist-list">

              <v-list dense>
                <v-list-item-group v-model="selectedSpotifyPlaylistToImport" color="green">
                  <v-list-item v-for="playlist in filteredSpotifyPlaylists" :key="playlist.id">
                    <v-list-item-avatar>
                      <v-img v-if="playlist.images.length" :src="playlist.images[0].url"></v-img>
                      <v-icon v-else color="green">fab fa-spotify</v-icon>
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <v-list-item-title v-text="playlist.name"></v-list-item-title>
                    </v-list-item-content>
                    <v-list-item-icon>
                      <v-chip>{{ playlist.tracks.total }}</v-chip>
                    </v-list-item-icon>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-if="importMethodSelected == 1" justify="center">
        <v-col sm="6" class="text-center">
          <v-file-input
            label="Upload iTunes playlist file"
            @change="readITunesFile"
            prepend-icon="fas fa-file-alt"
          >
          </v-file-input>
        </v-col>
      </v-row>
      <v-row v-if="importMethodSelected == 2" justify="center">
        <v-col sm="6" class="text-center">
          <v-file-input
            label="Upload rekordbox playlist file"
            @change="readRekordboxFile"
            prepend-icon="fas fa-file-alt"
          >
          </v-file-input>
        </v-col>
      </v-row>
      <v-row>
        <v-col sm="6" md="4" lg="3">
          <v-card outlined>
            <v-card-text>
              <div
                v-if="tracklists.level1.length == 0"
                class="font-weight-thin font-italic"
              >
                Your imported playlists will appear here
              </div>
              <v-list dense v-else>
                <v-list-item-group color="primary">
                <v-list-item
                  v-for="(item, i) in tracklists.level1"
                  :key="i"
                >
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ item.name }}
                    <v-chip
                      class="ma-2 flex-grow-0"
                      :color="getColorBasedOnType(item.type)"
                      text-color="white"
                    >
                      {{ item.tracks.length }}
                    </v-chip>
                    </v-list-item-title>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-tooltip bottom v-if="item.tracks.length">
                      <template v-slot:activator="{ on, attrs }">
                        <v-btn
                          icon
                          v-bind="attrs"
                          v-on="on"
                          @click="openDialog(item)"
                          >
                            <v-icon>mdi-format-list-bulleted</v-icon>
                          </v-btn>
                      </template>
                      <span>View tracks</span>
                    </v-tooltip>
                  </v-list-item-action>
                </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col sm="6" md="4" lg="3">
          <v-card outlined>
            <v-card-text>
              <div
                v-if="tracklists.level2.length == 0"
                class="font-weight-thin font-italic"
              >
                Your generated tracklists will appear here
              </div>
              <v-list dense v-else>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col sm="6">
          <v-dialog v-model="dialog" transition="dialog-bottom-transition">
            <v-card>
              <v-sheet class="pa-4">
                <div class="d-flex align-center">
                  <v-text-field
                    v-model="spotifyPlaylistSearch"
                    label="Search track"
                    flat
                    solo-inverted
                    hide-details
                    clearable
                    clear-icon="mdi-close-circle-outline"
                  ></v-text-field>
                  <v-btn dark @click="dialog = false" class="ml-4">
                    <v-icon left>mdi-close</v-icon>
                    Close
                  </v-btn>
                </div>
              </v-sheet>
              <v-card-text>
                <v-list dense v-if="selectedTracklist">
                  <v-list-item two-line v-for="track in selectedTracklist.tracks" :key="track.id">
                    <v-list-item-content>
                      <v-list-item-title>{{ track.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ track.artists.join(', ') }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-dialog>
        </v-col>
      </v-row>
    </v-container>
    <v-snackbar v-model="snackbar">
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { generateRandomString, cleanTrackName, removeFeaturedArtistFromName } from '@/utils/utils'
import SpotifyService from '@/services/SpotifyService'

export default {
  data: () => ({
    clientId: 'e5d07ddf1fe64a6cbcd2d14ac0aac87b',
    scope: 'user-read-private user-read-email playlist-read-private user-library-read',
    redirectUri: 'http://localhost:8080/spotify-auth-callback',
    state: generateRandomString(16),

    iTunesFileReader: new FileReader(),
    rekordboxFileReader: new FileReader(),
    importMethodSelected: null,
    tracklists: {
      level1: [],
      level2: []
    },
    currentlyProcessingTextFileName: '',
    spotifyOffset: 0,
    spotifyLimit: 50,
    spotifyPlaylists: [],
    canAccessSpotifyAPI: false,
    snackbar: false,
    snackbarText: '',
    spotifyPlaylistSearch: null,
    selectedSpotifyPlaylistToImport: null,
    selectedTracklist: null,
    dialog: false
  }),
  computed: {
    spotifyAuthUrl () {
      const baseUrl = 'https://accounts.spotify.com/authorize'
      const responseType = 'token'
      const clientId = encodeURIComponent(this.clientId)
      const scope = encodeURIComponent(this.scope)
      const redirectUri = encodeURIComponent(this.redirectUri)
      const state = encodeURIComponent(this.state)
      return `${baseUrl}?response_type=${responseType}&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`
    },
    filteredSpotifyPlaylists () {
      return this.spotifyPlaylistSearch
        ? this.spotifyPlaylists.filter(playlist => playlist.name.toLowerCase().includes(this.spotifyPlaylistSearch.toLowerCase()))
        : this.spotifyPlaylists
    }
  },
  watch: {
    importMethodSelected: function (method) {
      if (method === 0 && this.canAccessSpotifyAPI && this.spotifyPlaylists.length === 0) {
        this.getSpotifyPlaylists()
      }
    },
    selectedSpotifyPlaylistToImport: function (index) {
      if (index >= 0) {
        const playlist = this.spotifyPlaylists[index]
        this.spotifyPlaylists.splice(index, 1)
        this.getSpotifyPlaylistTracks(playlist.name, playlist.id)
      }
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
    this.canAccessSpotifyAPI = localStorage && localStorage.getItem('spotifyAccessToken')
  },
  methods: {
    openDialog (tracklist) {
      this.dialog = true
      this.selectedTracklist = tracklist
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
            this.getSpotifyPlaylists()
          }
        }
      }, 2000)
    },
    readITunesFile (file) {
      this.currentlyProcessingTextFileName = file.name.split('.')[0]
      this.tracklists.level1.push({
        name: this.currentlyProcessingTextFileName,
        type: 'iTunes',
        tracks: []
      })
      this.iTunesFileReader.readAsText(file)
    },
    readRekordboxFile (file) {
      this.currentlyProcessingTextFileName = file.name.split('.')[0]
      this.tracklists.level1.push({
        name: this.currentlyProcessingTextFileName,
        type: 'rekordbox',
        tracks: []
      })
      this.rekordboxFileReader.readAsText(file)
    },
    processITunesPlaylistFile (file) {
      const tracklist = this.tracklists.level1.find(tracklist => tracklist.name === this.currentlyProcessingTextFileName)
      this.currentlyProcessingTextFileName = ''
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
        tracklist.tracks.push({
          id: `${track.name} - ${track.artists}`,
          name: track.name,
          artists: track.artists
        })
      })
    },
    processRekordboxPlaylistFile (file) {
      const tracklist = this.tracklists.level1.find(tracklist => tracklist.name === this.currentlyProcessingTextFileName)
      this.currentlyProcessingTextFileName = ''
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
        tracklist.tracks.push({
          id: `${track.name} - ${track.artists}`,
          name: track.name,
          artists: track.artists
        })
      })
    },
    getSpotifyPlaylistTracks (playlistName, playlistId) {
      const offset = 0
      const limit = 100

      this.tracklists.level1.push({
        name: playlistName,
        type: 'spotify',
        tracks: []
      })
      this.getSpotifyPlaylistTracksFromAPI(playlistName, playlistId, limit, offset, 0, 0)
    },
    getSpotifyPlaylistTracksFromAPI (playlistName, playlistId, limit, offset, totalSpotifyTracks, spotifyReceivedTracksCounter) {
      SpotifyService.getPlaylistTracks(playlistId, { limit, offset }).then(response => {
        const tracklist = this.tracklists.level1.find(tracklist => tracklist.name === playlistName)
        const items = response.data.items
        if (totalSpotifyTracks === 0) {
          totalSpotifyTracks = response.data.total
        }
        offset += limit
        tracklist.tracks.push(
          ...items.map(item => {
            const track = {
              name: cleanTrackName(item.track.name),
              artists: item.track.artists.map(artist => artist.name.trim().toLowerCase())
            }
            track.name = removeFeaturedArtistFromName(track)
            return {
              id: item.track.id,
              name: track.name,
              artists: track.artists
            }
          }))
        spotifyReceivedTracksCounter += items.length

        if (spotifyReceivedTracksCounter < totalSpotifyTracks) {
          this.getSpotifyPlaylistTracksFromAPI(playlistName, playlistId, limit, offset, totalSpotifyTracks, spotifyReceivedTracksCounter)
        }
      }).catch(err => {
        this.handleAPIError(err)
      })
    },
    getSpotifyTracks () {
      this.currentlyProcessingTextFileName = 'Liked'
      this.tracklists.level1.push({
        name: this.currentlyProcessingTextFileName,
        type: 'spotify',
        tracks: []
      })
      this.getSpotifyTracksFromAPI(this.limit, this.offset, 0, 0)
    },
    getSpotifyTracksFromAPI (limit, offset, totalSpotifyTracks, spotifyReceivedTracksCounter) {
      SpotifyService.getLikedTracks({ limit, offset }).then(response => {
        const tracklist = this.tracklists.level1.find(tracklist => tracklist.name === this.currentlyProcessingTextFileName)
        const items = response.data.items
        if (totalSpotifyTracks === 0) {
          totalSpotifyTracks = response.data.total
        }
        offset += limit
        tracklist.tracks.push(
          ...items.map(item => {
            const track = {
              name: cleanTrackName(item.track.name),
              artists: item.track.artists.map(artist => artist.name.trim().toLowerCase())
            }
            track.name = removeFeaturedArtistFromName(track)
            return {
              id: item.track.id,
              name: track.name,
              artists: track.artists
            }
          }))
        spotifyReceivedTracksCounter += items.length

        if (spotifyReceivedTracksCounter < totalSpotifyTracks) {
          this.getSpotifyTracksFromAPI(limit, offset, totalSpotifyTracks, spotifyReceivedTracksCounter)
        } else {
          this.currentlyProcessingTextFileName = ''
        }
      }).catch(err => {
        this.handleAPIError(err)
      })
    },
    getSpotifyPlaylists () {
      this.getSpotifyPlaylistsFromAPI(this.spotifyLimit, this.spotifyOffset, 0, 0)
    },
    getSpotifyPlaylistsFromAPI (limit, offset, totalSpotifyPlaylists, spotifyReceivedPlaylistsCounter) {
      SpotifyService.getPlaylists({ limit, offset }).then(response => {
        const playlists = response.data.items
        if (totalSpotifyPlaylists === 0) {
          totalSpotifyPlaylists = response.data.total
        }
        offset += limit

        this.spotifyPlaylists.push(...playlists)

        spotifyReceivedPlaylistsCounter += playlists.length
        if (spotifyReceivedPlaylistsCounter < totalSpotifyPlaylists) {
          this.getSpotifyPlaylistsFromAPI(limit, offset, totalSpotifyPlaylists, spotifyReceivedPlaylistsCounter)
        } else {
          this.currentlyProcessingTextFileName = ''
        }
      }).catch(err => {
        this.handleAPIError(err)
      })
    },
    handleAPIError (err) {
      if (err.response.status === 401) {
        this.snackbarText = 'I lost the Spotify connection, care logging in again please? Thanks!'
        this.snackbar = true
        localStorage.removeItem('spotifyAccessToken')
        this.canAccessSpotifyAPI = false
      }
    },
    getColorBasedOnType (type) {
      const colorMap = {
        iTunes: 'blue',
        rekordbox: 'black',
        spotify: 'green'
      }
      return colorMap[type]
    }
  }
}
</script>

<style lang="scss">
.spotify-playlist-list {
  max-height: 500px;
  overflow-x: auto;
}
</style>
