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
        <v-col v-else sm="auto" class="text-center">
          Spotify Playlists:
          <v-list dense>
            <v-list-item v-for="playlist in spotifyPlaylists" :key="playlist.id">
              <v-list-item-content>{{ playlist.name }}</v-list-item-content>
            </v-list-item>
          </v-list>
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
        <v-col>
          <v-expansion-panels>
            <v-expansion-panel
              v-for="(item,i) in tracklists.level1"
              :key="i"
            >
              <v-expansion-panel-header>
                {{ item.name }}
                <v-chip
                  class="ma-2 flex-grow-0"
                  :color="getColorBasedOnType(item.type)"
                  text-color="white"
                >
                  {{ item.tracks.length }}
                </v-chip>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list dense>
                  <v-list-item two-line v-for="track in item.tracks" :key="track.id">
                    <v-list-item-content>
                      <v-list-item-title>{{ track.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ track.artists }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
    </v-container>
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
      level1: []
    },
    currentlyProcessingTextFileName: '',
    spotifyOffset: 0,
    spotifyLimit: 50,
    spotifyPlaylists: [],
    canAccessSpotifyAPI: false
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
    }
  },
  watch: {
    importMethodSelected: function (method) {
      if (method === 0 && this.canAccessSpotifyAPI) {
        this.getSpotifyPlaylists()
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
    this.canAccessSpotifyAPI = localStorage && localStorage.accessToken
  },
  methods: {
    loginToSpotify () {
      window.open(this.spotifyAuthUrl, '_blank', 'height=570,width=520')
      const checkForAccessToken = setInterval(() => {
        if (localStorage.accessToken) {
          clearInterval(checkForAccessToken)
          const receivedState = localStorage.spotifyReceivedState
          if (receivedState === null || receivedState !== this.state) {
            alert('Spotify says "Computer says no". Refresh the page and try to login again =)')
          } else {
            this.canAccessSpotifyAPI = true
            this.getSpotifyTracks()
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
      })
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
