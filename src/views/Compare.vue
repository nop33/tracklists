<template>
  <div class="compare">
    <v-container>
      <v-row v-if="iTunesTracks.length && spotifyTracks.length">
        <v-col>
          <v-btn>Compare</v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="6">
          <v-file-input
            label="Upload iTunes playlist file"
            @change="fileChanged"
          ></v-file-input>
          <v-card
            tile
          >
            <v-card-title>iTunes tracks</v-card-title>
            <v-list-item two-line v-for="(track, index) in iTunesTracks" :key="`${track.name}-${index}`">
              <v-list-item-content>
                <v-list-item-title>{{ track.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ track.artist }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-btn @click="getSpotifyTracks">Get Spotify tracks</v-btn>
          <v-card
            tile
          >
            <v-card-title>Spotify tracks</v-card-title>
            <v-list-item two-line v-for="(track, index) in spotifyTracks" :key="`${track.name}-${index}`">
              <v-list-item-content>
                <v-list-item-title>{{ track.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ track.artists }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import TracksService from '@/services/TracksService'

export default {
  data: () => ({
    reader: new FileReader(),
    iTunesTracks: [],
    spotifyTracks: [],
    totalSpotifyTracks: 0,
    spotifyOffset: 0,
    spotifyLimit: 50,
    spotifyReceivedTracksCounter: 0
  }),
  methods: {
    fileChanged (file) {
      localStorage.removeItem('iTunesTracks')
      this.reader.readAsText(file)
    },
    processITunesLibraryFile (file) {
      const lines = file.split(/[\r\n]+/)
      const trackProperties = lines.shift().split('\t')
      lines.pop() // remove empty last line

      lines.forEach(line => {
        const trackData = line.split('\t')
        const track = {}
        trackData.forEach((trackPropertyValue, index) => {
          track[trackProperties[index]] = trackPropertyValue
        })
        this.iTunesTracks.push({
          name: track.Name,
          artist: track.Artist
        })
      })
      localStorage.setItem('iTunesTracks', JSON.stringify(this.iTunesTracks))
    },
    getSpotifyTracks () {
      localStorage.removeItem('spotifyTracks')
      TracksService.get({
        limit: this.spotifyLimit,
        offset: this.spotifyOffset
      }).then(response => {
        console.log(response.data)
        const items = response.data.items
        if (this.totalSpotifyTracks === 0) {
          this.totalSpotifyTracks = response.data.total
        }
        this.spotifyOffset += this.spotifyLimit
        this.spotifyTracks.push(
          ...items.map(item => {
            return {
              name: item.track.name,
              artists: item.track.artists.map(artist => artist.name)
            }
          })
        )
        this.spotifyReceivedTracksCounter += items.length

        if (this.spotifyReceivedTracksCounter < this.totalSpotifyTracks) {
          console.log('received: ', this.spotifyReceivedTracksCounter)
          this.getSpotifyTracks()
        } else {
          localStorage.setItem('spotifyTracks', JSON.stringify(this.spotifyTracks))
        }
      })
    }
  },
  created () {
    this.reader.addEventListener('load', (event) => {
      const file = event.target.result
      this.processITunesLibraryFile(file)
      this.$store.dispatch('initializeITunesTracks', this.iTunesTracks)
    })

    if (localStorage.spotifyTracks) {
      this.spotifyTracks = JSON.parse(localStorage.getItem('spotifyTracks'))
    }

    if (localStorage.iTunesTracks) {
      this.iTunesTracks = JSON.parse(localStorage.getItem('iTunesTracks'))
    }
  }
}
</script>
