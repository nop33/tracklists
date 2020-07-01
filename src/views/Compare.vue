<template>
  <div class="compare">
    <v-container>
      <v-row v-if="iTunesTracks.length && spotifyTracks.length">
        <v-col>
          <ComparisonTable
            :buttonActionFunc="findTracksWithExactName"
            buttonText="Find tracks with exact same name"
            :items="tracksWithExactNames"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <ComparisonTable
            :buttonActionFunc="findTracksWithPartiallyExactName"
            buttonText="Find tracks where one name contains the other"
            :items="similaritiesArray"
          />
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
            <v-card-title>iTunes tracks ({{ iTunesTracks.length }})</v-card-title>
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
            <v-progress-linear v-model="percentageOfFetchedSpotifyTracks" :color="percentageOfFetchedSpotifyTracks >= 100 ? 'green' : 'blue'"></v-progress-linear>
            <v-card-title>Spotify tracks ({{ spotifyTracks.length }})</v-card-title>
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
import ComparisonTable from '@/components/ComparisonTable.vue'

export default {
  components: {
    ComparisonTable
  },
  data: () => ({
    reader: new FileReader(),
    iTunesTracks: [],
    spotifyTracks: [],
    totalSpotifyTracks: 0,
    spotifyOffset: 0,
    spotifyLimit: 50,
    spotifyReceivedTracksCounter: 0,
    similaritiesArray: [],
    tracksWithExactNames: [],
    tracksWhereOneNameContainsTheOther: [],
    oneOfTheTrackNamesIncludesTheOther: [],
    substringsToRemove: [
      ' - Original Mix',
      ' (Original Mix)',
      ' (original mix)',
      ' (Original mix)',
      ' - Original',
      ' (Original)',
      ' - Original Version',
      ' (Original Version)'
    ]
  }),
  computed: {
    percentageOfFetchedSpotifyTracks () {
      return (this.spotifyTracks.length / this.totalSpotifyTracks) * 100
    }
  },
  methods: {
    fileChanged (file) {
      localStorage.removeItem('iTunesTracks')
      this.iTunesTracks = []
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
          if (index === 0) {
            this.substringsToRemove.forEach(substringToRemove => {
              trackPropertyValue = trackPropertyValue.replace(substringToRemove, '')
            })
          }
          track[trackProperties[index]] = trackPropertyValue
        })
        this.iTunesTracks.push({
          name: track.Name.trim(),
          artist: track.Artist.trim()
        })
      })
      localStorage.setItem('iTunesTracks', JSON.stringify(this.iTunesTracks))
    },
    getSpotifyTracks () {
      localStorage.removeItem('spotifyTracks')
      this.spotifyTracks = []
      this.fetchPartOfTracks()
    },
    fetchPartOfTracks () {
      TracksService.get({
        limit: this.spotifyLimit,
        offset: this.spotifyOffset
      }).then(response => {
        const items = response.data.items
        if (this.totalSpotifyTracks === 0) {
          this.totalSpotifyTracks = response.data.total
        }
        this.spotifyOffset += this.spotifyLimit
        this.spotifyTracks.push(
          ...items.map(item => {
            let name = item.track.name.trim()
            this.substringsToRemove.forEach(substringToRemove => {
              name = name.replace(substringToRemove, '')
            })
            return {
              name,
              artists: item.track.artists.map(artist => artist.name.trim())
            }
          })
        )
        this.spotifyReceivedTracksCounter += items.length

        if (this.spotifyReceivedTracksCounter < this.totalSpotifyTracks) {
          this.fetchPartOfTracks()
        } else {
          localStorage.setItem('spotifyTracks', JSON.stringify(this.spotifyTracks))
        }
      })
    },
    findTracksWithExactName () {
      this.spotifyTracks.forEach(spotifyTrack => {
        this.iTunesTracks.forEach(iTunesTrack => {
          if (spotifyTrack.name === iTunesTrack.name) {
            this.tracksWithExactNames.push({
              iTunesTrack,
              spotifyTrack
            })
          } else {
            this.tracksWhereOneNameContainsTheOther.push({
              iTunesTrack,
              spotifyTrack
            })
          }
        })
      })
    },
    findTracksWithPartiallyExactName () {
      this.tracksWhereOneNameContainsTheOther.forEach(({ spotifyTrack, iTunesTrack }) => {
        if (spotifyTrack.name.includes(iTunesTrack.name) || iTunesTrack.name.includes(spotifyTrack.name)) {
          spotifyTrack.artists.some(spotifyArtist => {
            if (iTunesTrack.artist.includes(spotifyArtist)) {
              this.similaritiesArray.push({
                iTunesTrack,
                spotifyTrack
              })
              return true
            }
          })
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
