<template>
  <v-list-item>
    <v-list-item-content>
      <v-list-item-title class="tracklist__title">
        {{ tracklist.name }}
      </v-list-item-title>
    </v-list-item-content>
    <v-list-item-action class="flex-row align-center">
      <v-chip
        class="ma-2 flex-grow-0"
        :color="chipColor"
        text-color="white"
      >
        {{ tracklist.tracks.length }}
      </v-chip>
      <v-tooltip bottom v-if="tracklist.tracks.length">
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
            @click="openDialog()"
            >
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-btn>
        </template>
        <span>View tracks</span>
      </v-tooltip>
      <v-tooltip v-if="isComparisonTracklist" bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
            @click="deselectTracklist()"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
        </template>
        <span>Deselect tracklist</span>
      </v-tooltip>
      <v-tooltip v-if="!isComparisonTracklist" bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
            @click="selectTracklist()"
            >
              <v-icon>mdi-selection-ellipse-arrow-inside</v-icon>
            </v-btn>
        </template>
        <span>Select tracklist to compare</span>
      </v-tooltip>
      <v-tooltip v-if="!isComparisonTracklist && isSpotifyImportedTracklist" bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
            @click="setAsTracksToDownload()"
            >
              <v-icon :color="toDownloadIconColor">mdi-download</v-icon>
            </v-btn>
        </template>
        <span>Select as tracks to download</span>
      </v-tooltip>
      <v-tooltip v-if="!isComparisonTracklist && isSpotifyImportedTracklist" bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
            @click="setAsTracksToBuy()"
            >
              <v-icon :color="toBuyIconColor">mdi-currency-usd</v-icon>
            </v-btn>
        </template>
        <span>Select as tracks to buy</span>
      </v-tooltip>
    </v-list-item-action>
  </v-list-item>
</template>

<script>
import { mapState } from 'vuex'
import { contentTypes, origins } from '@/utils/constants'

export default {
  props: [
    'tracklist',
    'isSelectedForComparison'
  ],
  computed: {
    ...mapState([
      'spotifyPlaylistIdWithTracksToDownload',
      'spotifyPlaylistIdWithTracksToBuy'
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
      return this.$props.isSelectedForComparison !== undefined
    },
    isSpotifyImportedTracklist () {
      return this.tracklist.origin === origins.IMPORTED && this.tracklist.contentType === contentTypes.SPOTIFY
    },
    toDownloadIconColor () {
      return this.spotifyPlaylistIdWithTracksToDownload === this.tracklist.id ? 'green' : ''
    },
    toBuyIconColor () {
      return this.spotifyPlaylistIdWithTracksToBuy === this.tracklist.id ? 'green' : ''
    }
  },
  methods: {
    setAsTracksToDownload () {
      this.$store.dispatch('setSpotifyToDownloadPlaylistId', this.tracklist.id)
    },
    setAsTracksToBuy () {
      this.$store.dispatch('setSpotifyToBuyPlaylistId', this.tracklist.id)
    },
    selectTracklist () {
      this.$store.dispatch('setTracklistToCompare', this.tracklist)
    },
    deselectTracklist () {
      this.$store.dispatch('unsetTracklistToCompare', this.tracklist)
    },
    openDialog () {
      this.$store.dispatch('toggleDialog')
      this.$store.dispatch('setTracklistToShowTracks', this.tracklist)
    }
  }
}
</script>

<style lang="scss">
.v-list-item__title.tracklist__title {
  white-space: normal;
}
</style>
