<template>
  <div class="d-flex align-center flex-column">
    <h2 class="text-h4 mb-5">Import playlist from</h2>
    <v-btn-toggle v-model="importMethodSelected">
      <ImportPlaylistButton text="Spotify" :icon="spotifyIcon" color="green" />
      <ImportPlaylistButton text="iTunes" :icon="iTunesIcon" color="blue" />
      <ImportPlaylistButton text="Rekordbox" :icon="rekordboxIcon" color="black" />
    </v-btn-toggle>
    <v-dialog v-model="importerDialog" transition="dialog-bottom-transition" class="mx-auto" max-width="50vw">
      <SpotifyLogin v-if="importMethodSelected == 0 && !hasSpotifyAccessToken" />
      <SpotifyPlaylistListCard
        v-if="hasSpotifyAccessToken"
        v-show="importMethodSelected == 0"
        :playlistImportCallback="importSpotifyPlaylist"
        :handleAPIError="handleAPIError"
      />
      <v-card v-if="importMethodSelected == 1 || importMethodSelected == 2">
        <v-card-title></v-card-title>
        <v-card-text>
          <div v-show="importMethodSelected == 1">
            <div class="d-flex align-center flex-column">
              <input v-show="false" ref="iTunesFileUploader" type="file" @change="readITunesFile" />
              <v-btn class="primary" @click="$refs.iTunesFileUploader.click()">Upload iTunes file</v-btn>
              <v-img
                alt="iTunes guide"
                class="shrink mt-5"
                contain
                :src="require('../assets/itunes-guide.jpg')"
                transition="scale-transition"
              />
            </div>
          </div>
          <div v-show="importMethodSelected == 2">
            <div class="d-flex align-center flex-column">
              <input v-show="false" ref="rekordboxFileUploader" type="file" @change="readRekordboxFile" />
              <v-btn class="primary" @click="$refs.rekordboxFileUploader.click()">Upload Rekordbox file</v-btn>
              <v-img
                alt="Rekordbox guide"
                class="shrink mt-5"
                contain
                :src="require('../assets/rekordbox-guide.jpg')"
                transition="scale-transition"
              />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import { ImportedTracklist } from '@/utils/tracklist'
import { contentTypes, icons } from '@/utils/constants'
import { cleanTrackName, removeFeaturedArtistFromName } from '@/utils/utils'

import ImportPlaylistButton from '@/components/ImportPlaylistButton.vue'
import SpotifyPlaylistListCard from '@/components/SpotifyPlaylistListCard.vue'
import SpotifyLogin from '@/components/SpotifyLogin.vue'

export default {
  components: {
    ImportPlaylistButton,
    SpotifyPlaylistListCard,
    SpotifyLogin
  },
  props: [
    'getSpotifyPlaylistTracks',
    'handleAPIError'
  ],
  data: () => {
    return {
      currentlyProcessingTextFileName: '',
      importerDialog: false,
      iTunesFileReader: new FileReader(),
      rekordboxFileReader: new FileReader()
    }
  },
  computed: {
    ...mapState(
      [
        'selectedImportMethod'
      ]
    ),
    ...mapGetters(
      [
        'hasSpotifyAccessToken'
      ]
    ),
    importMethodSelected: {
      get () {
        return this.selectedImportMethod
      },
      set (value) {
        this.importerDialog = value >= 0
        this.$store.dispatch('setSelectedImportMethod', value)
      }
    },
    spotifyIcon () {
      return icons.SPOTIFY
    },
    iTunesIcon () {
      return icons.ITUNES
    },
    rekordboxIcon () {
      return icons.REKORDBOX
    }
  },
  watch: {
    selectedImportMethod (newValue) {
      if (newValue === null && this.importerDialog) {
        this.importerDialog = false
      }
    },
    importerDialog (newValue) {
      if (!newValue && this.selectedImportMethod !== null) {
        // TODO: Need to delay this until dialog transition has finished
        this.$store.dispatch('resetSelectedImportMethod')
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
  },
  methods: {
    async importSpotifyPlaylist (playlistName, playlistId, totalTracks) {
      this.$store.dispatch('toggleLoader')
      const tracks = await this.getSpotifyPlaylistTracks(playlistId, totalTracks)
      const tracklist = new ImportedTracklist(playlistId, playlistName, contentTypes.SPOTIFY, tracks)
      this.$store.dispatch('addImportedTracklist', tracklist)
      this.$store.dispatch('toggleLoader')
    },
    readITunesFile (event) {
      const file = event.target.files[0]
      if (file) {
        this.$store.dispatch('resetSelectedImportMethod')
        this.currentlyProcessingTextFileName = file.name.split('.')[0]
        this.iTunesFileReader.readAsText(file)
      }
    },
    readRekordboxFile (event) {
      const file = event.target.files[0]
      if (file) {
        this.$store.dispatch('resetSelectedImportMethod')
        this.currentlyProcessingTextFileName = file.name.split('.')[0]
        this.rekordboxFileReader.readAsText(file)
      }
    },
    processITunesPlaylistFile (file) {
      this.$store.dispatch('toggleLoader')
      const playlistName = this.currentlyProcessingTextFileName
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

      const tracklist = new ImportedTracklist(
        playlistName,
        playlistName,
        contentTypes.ITUNES,
        tracks
      )
      this.$store.dispatch('addImportedTracklist', tracklist)
      this.currentlyProcessingTextFileName = ''
      this.$store.dispatch('toggleLoader')
    },
    processRekordboxPlaylistFile (file) {
      this.$store.dispatch('toggleLoader')
      const playlistName = this.currentlyProcessingTextFileName
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

      const tracklist = new ImportedTracklist(
        playlistName,
        playlistName,
        contentTypes.REKORDBOX,
        tracks
      )
      this.$store.dispatch('addImportedTracklist', tracklist)
      this.currentlyProcessingTextFileName = ''
      this.$store.dispatch('toggleLoader')
    }
  }
}
</script>
