<template>
  <div class="compare">
    <v-container>
      <v-row v-if="iTunesTracks.length && spotifyTracks.length">
        <v-col>
          <v-btn @click="compare">Compare libraries</v-btn>
          Matching tracks: {{ percentageOfMatchingTracks }}
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <h2>Spotify tracks missing from iTunes</h2>
          <TrackListTable :items="spotifyTracks.filter(track => !track.match)" />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <h2>iTunes tracks missing from Spotify</h2>
          <TrackListTable :items="iTunesTracks.filter(track => !track.match)" />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-btn @click="getSpotifyTracks">Get Spotify tracks</v-btn>
          <h2>Spotify tracks</h2>
          <v-progress-linear v-model="percentageOfFetchedSpotifyTracks" :color="percentageOfFetchedSpotifyTracks >= 100 ? 'green' : 'blue'"></v-progress-linear>
          <TrackListTable :items="spotifyTracks" />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-file-input
            label="Upload iTunes playlist file"
            @change="getITunesTracks"
          ></v-file-input>
          <h2>iTunes tracks</h2>
          <TrackListTable :items="iTunesTracks" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import TracksService from '@/services/TracksService'
import TrackListTable from '@/components/TrackListTable.vue'

export default {
  components: {
    TrackListTable
  },
  data: () => ({
    reader: new FileReader(),
    iTunesTracks: [],
    spotifyTracks: [],
    percentageOfMatchingTracks: '',
    totalSpotifyTracks: 0,
    spotifyOffset: 0,
    spotifyLimit: 50,
    spotifyReceivedTracksCounter: 0,
    similaritiesArray: [],
    tracksWithExactNames: []
  }),
  computed: {
    percentageOfFetchedSpotifyTracks () {
      return (this.spotifyTracks.length / this.totalSpotifyTracks) * 100
    }
  },
  methods: {
    getITunesTracks (file) {
      localStorage.removeItem('iTunesTracks')
      this.iTunesTracks = []
      this.reader.readAsText(file)
    },
    processITunesLibraryFile (file) {
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
        this.iTunesTracks.push({
          id: `${track.name} - ${track.artists}`,
          name: track.name,
          artists: track.artists
        })
      })
      localStorage.setItem('iTunesTracks', JSON.stringify(this.iTunesTracks))
    },
    getSpotifyTracks () {
      localStorage.removeItem('spotifyTracks')
      this.spotifyTracks = []
      this.callSpotifyAPI()
    },
    callSpotifyAPI () {
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
          })
        )
        this.spotifyReceivedTracksCounter += items.length

        if (this.spotifyReceivedTracksCounter < this.totalSpotifyTracks) {
          this.callSpotifyAPI()
        } else {
          localStorage.setItem('spotifyTracks', JSON.stringify(this.spotifyTracks))
        }
      })
    },

    compare () {
      this.spotifyTracks.forEach(spotifyTrack => {
        this.findMatchingITunesTrack(spotifyTrack)
        if (!spotifyTrack.match) {
          this.findSimilarITunesTrack(spotifyTrack)
        }
      })

      this.percentageOfMatchingTracks = this.calculatePercentageOfMatchingTracks()
    },
    findMatchingITunesTrack (spotifyTrack) {
      let i = 0
      while (!spotifyTrack.match && i < this.iTunesTracks.length) {
        const iTunesTrack = this.iTunesTracks[i]
        if (spotifyTrack.name === iTunesTrack.name &&
              atLeastOneSpotifyArtistIsIncludedInITunesArtistString(spotifyTrack, iTunesTrack)) {
          spotifyTrack.match = iTunesTrack.id
          iTunesTrack.match = spotifyTrack.id
        }
        i++
      }

      function atLeastOneSpotifyArtistIsIncludedInITunesArtistString (spotifyTrack, iTunesTrack) {
        return spotifyTrack.artists.some(spotifyArtist => iTunesTrack.artists.includes(spotifyArtist))
      }
    },
    findSimilarITunesTrack (spotifyTrack) {
      let i = 0
      while (!spotifyTrack.similar && i < this.iTunesTracks.length) {
        const iTunesTrack = this.iTunesTracks[i]

        if (oneTrackNameContainsTheOther(spotifyTrack, iTunesTrack) && haveSameArtists(spotifyTrack, iTunesTrack)) {
          spotifyTrack.similar = iTunesTrack.id
          iTunesTrack.similar = spotifyTrack.id
        }
        i++
      }

      function oneTrackNameContainsTheOther (spotifyTrack, iTunesTrack) {
        return spotifyTrack.name.includes(iTunesTrack.name) || iTunesTrack.name.includes(spotifyTrack.name)
      }

      function haveSameArtists (spotifyTrack, iTunesTrack) {
        return (spotifyTrack.artists.every(spotifyArtist => iTunesTrack.artists.includes(spotifyArtist)) &&
                iTunesTrack.artists.every(iTunesArtist => spotifyTrack.artists.includes(iTunesArtist)))
      }
    },
    calculatePercentageOfMatchingTracks () {
      return this.spotifyTracks.length > this.iTunesTracks.length
        ? `${this.spotifyTracks.filter(track => track.match).length} / ${this.spotifyTracks.length}`
        : `${this.iTunesTracks.filter(track => track.match).length} / ${this.iTunesTracks.length}`
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

function removeFeaturedArtistFromName (track) {
  const substringsToRemove = [
    ' - feat. ',
    ' feat. ',
    ' feat.',
    ' feat ',
    ' ft '
  ]
  substringsToRemove.some(substring => {
    const trackNameParts = track.name.split(substring)
    let afterFeatSubstrings = []
    let featuredArtist = ''

    if (trackNameParts.length > 1) {
      afterFeatSubstrings = trackNameParts[1].split(' - ')
      featuredArtist = afterFeatSubstrings[0]
    }

    if (trackNameParts.length > 1 && track.artists.includes(featuredArtist)) {
      track.name = afterFeatSubstrings.length === 1 ? trackNameParts[0] : `${trackNameParts[0]} - ${afterFeatSubstrings[1]}`
      return true
    }
  })
  return track.name
}

function cleanTrackName (trackName) {
  const substringsToRemove = [
    ' - original mix',
    ' (original mix)',
    ' - original version',
    ' (original version)',
    ' - original',
    ' (original)',
    ' (radio edit)',
    ' - radio edit',
    ' [radio edit]'
  ]
  trackName = trackName.trim().toLowerCase()
  substringsToRemove.forEach(substringToRemove => {
    trackName = trackName.replace(substringToRemove, '')
  })
  trackName = trackName.replace(' (', ' - ').replace(')', '')
  return trackName
}
</script>
