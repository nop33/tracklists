<template>
  <v-hover v-slot:default="{ hover }">
    <v-list-item @click="openDialog()" :class="{'grey lighten-5': hover, 'success lighten-5': highlight}">
      <v-list-item-content>
        <v-list-item-title class="tracklist__title text-subtitle-1">
          {{ tracklist.name }}
          <v-chip class="flex-grow-0" :color="chipColor" text-color="white" x-small>{{ tracklist.tracks.length }}</v-chip>
          <v-spacer />
        </v-list-item-title>
        <v-list-item-subtitle v-text="tracklist.contentType"></v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action class="flex-row align-center">

        <v-menu rounded="b-xl" offset-y>
          <template v-slot:activator="{ attrs, on }">
            <v-btn v-bind="attrs" v-on="on" text class="grey--text">
              Actions
              <v-icon right>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              link
              v-if="isComparisonTracklist || isGeneratedTracklist"
              @click="deleteTracklist()"
            >
              <v-list-item-title>
                <v-icon left>mdi-delete</v-icon>
                {{ isComparisonTracklist ? "Deselect tracklist" : "Delete tracklist"}}
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              link
              v-if="!isComparisonTracklist"
              @click="selectTracklist()"
            >
              <v-list-item-title>
                <v-icon left>mdi-selection-ellipse-arrow-inside</v-icon>
                Compare this tracklist with another
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              link
              v-if="tracklist.tracks.length"
              @click="openDialog()"
            >
              <v-list-item-title>
                <v-icon left>mdi-format-list-bulleted</v-icon>
                View tracks
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-list-item-action>
    </v-list-item>
  </v-hover>
</template>

<script>
import { mapState } from 'vuex'
import { contentTypes, origins, tracklistTypes } from '@/utils/constants'

export default {
  props: [
    'tracklist',
    'type',
    'deleteTracklistCallback'
  ],
  data: () => {
    return {
      highlight: false
    }
  },
  computed: {
    ...mapState([
      'selectedTracklistToCompareLeft',
      'selectedTracklistToCompareRight'
    ]),
    chipColor () {
      const colorMap = {
        [contentTypes.ITUNES]: 'blue',
        [contentTypes.REKORDBOX]: 'black',
        [contentTypes.SPOTIFY]: 'green'
      }
      return colorMap[this.tracklist.contentType]
    },
    isComparisonTracklist () {
      return this.$props.type === tracklistTypes.TO_COMPARE
    },
    isSpotifyImportedTracklist () {
      return this.tracklist.origin === origins.IMPORTED && this.tracklist.contentType === contentTypes.SPOTIFY
    },
    isGeneratedTracklist () {
      return this.tracklist.origin === origins.GENERATED
    }
  },
  created () {
    setTimeout(() => {
      this.highlight = true
    }, 200)
    setTimeout(() => {
      this.highlight = false
    }, 700)
  },
  methods: {
    setAsTracksToDownload () {
      this.$store.dispatch('setSpotifyToDownloadPlaylist', this.tracklist)
    },
    setAsTracksToBuy () {
      this.$store.dispatch('setSpotifyToBuyPlaylist', this.tracklist)
    },
    selectTracklist () {
      if (this.selectedTracklistToCompareLeft !== this.tracklist &&
         this.selectedTracklistToCompareRight !== this.tracklist) {
        this.$store.dispatch('setTracklistToCompare', this.tracklist)
      } else {
        this.$store.dispatch('pushNotification', `"${this.tracklist.name}" is already set for comparison`)
      }
    },
    deleteTracklist () {
      if (this.isComparisonTracklist) {
        this.$store.dispatch('unsetTracklistToCompare', this.tracklist)
      } else if (this.deleteTracklistCallback) {
        this.deleteTracklistCallback(this.tracklist)
      }
    },
    openDialog () {
      this.$store.dispatch('toggleDialog')
      this.$store.dispatch('setTracklistToShowTracks', this.tracklist)
    }
  }
}
</script>

<style lang="scss">
.v-list-item {
  transition: background-color 0.5s;
}

.v-list-item:hover {
  cursor: pointer;
}

.v-list-item__title.tracklist__title {
  white-space: normal;
}
</style>
