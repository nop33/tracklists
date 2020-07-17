<template>
  <v-dialog v-model="dialog" transition="dialog-bottom-transition">
    <v-card>
      <v-sheet class="pa-4">
        <div class="d-flex">
          <v-text-field
            v-model="tracklistSearchInput"
            label="Search track"
            clear-icon="mdi-close-circle-outline"
            flat hide-details clearable
          ></v-text-field>
          <v-btn dark @click="dialog = false" class="ml-4">
            <v-icon left>mdi-close</v-icon>
            Close
          </v-btn>
        </div>
      </v-sheet>
      <v-data-table
        v-if="tracklistInDialog"
        :headers="headers"
        :items="filteredTableContents"
        :items-per-page="10"
      ></v-data-table>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data: () => {
    return {
      dialog: false,
      tracklistSearchInput: null,
      headers: [
        { text: 'Track name', value: 'name' },
        { text: 'Track artists', value: 'artists' }
      ]
    }
  },
  computed: {
    ...mapState([
      'tracklistInDialog',
      'showDialog'
    ]),
    filteredTableContents () {
      if (this.tracklistSearchInput) {
        return this.tracklistInDialog.tracks.filter(track => {
          return (track.name.includes(this.tracklistSearchInput) ||
            track.artists.some(artist => artist.includes(this.tracklistSearchInput)))
        })
      }
      return this.tracklistInDialog.tracks
    }
  },
  watch: {
    showDialog: function (newValue) {
      this.dialog = newValue
    },
    dialog: function (newValue, oldValue) {
      if (!newValue) {
        this.$store.dispatch('toggleDialog')
      }
    }
  }
}
</script>
