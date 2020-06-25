<template>
  <div class="compare">
    <v-container>
      <v-row>
        <v-col>
          <v-file-input
            label="Upload iTunes playlist file"
            @change="fileChanged"
          ></v-file-input>
          <v-card
            tile
          >
            <v-list-item two-line v-for="(track, index) in tracks" :key="`${track['Name']}-${index}`">
              <v-list-item-content>
                <v-list-item-title>{{ track['Name'] }}</v-list-item-title>
                <v-list-item-subtitle>{{ track['Artist'] }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-card>
        </v-col>
        <v-col>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  data: () => ({
    reader: new FileReader(),
    tracks: []
  }),
  methods: {
    fileChanged (file) {
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
        this.tracks.push(track)
      })
    }
  },
  created () {
    this.reader.addEventListener('load', (event) => {
      const file = event.target.result
      this.processITunesLibraryFile(file)
      this.$store.dispatch('initializeITunesTracks', this.tracks)
    })
  }
}
</script>
