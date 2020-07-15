<template>
  <v-list-item>
    <v-list-item-content>
      <v-list-item-title>
        {{ name }}
      </v-list-item-title>
    </v-list-item-content>
    <v-list-item-action class="flex-row align-center">
      <v-chip
        class="ma-2 flex-grow-0"
        :color="chipColor"
        text-color="white"
      >
        {{ tracks.length }}
      </v-chip>
      <v-tooltip bottom v-if="tracks.length">
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
      <v-tooltip v-if="isSelectedForComparison" bottom>
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
      <v-tooltip v-if="!isSelectedForComparison" bottom>
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
      <v-tooltip v-if="!isSelectedForComparison" bottom>
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
      <v-tooltip v-if="!isSelectedForComparison" bottom>
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
export default {
  props: ['id', 'name', 'type', 'tracks', 'isSelectedForComparison'],
  data: () => {
    return {
      toBuyIconColor: null,
      toDownloadIconColor: null
    }
  },
  computed: {
    chipColor () {
      const colorMap = {
        iTunes: 'blue',
        rekordbox: 'black',
        spotify: 'green'
      }
      return colorMap[this.$props.type]
    },
    tracklist () {
      return {
        name: this.$props.name,
        type: this.$props.type,
        id: this.$props.id,
        tracks: this.$props.tracks
      }
    }
  },
  methods: {
    setAsTracksToDownload () {
      this.$store.dispatch('setSpotifyToDownloadPlaylistId', this.$props.id).then(() => {
        this.toDownloadIconColor = 'green'
      })
    },
    setAsTracksToBuy () {
      this.$store.dispatch('setSpotifyToBuyPlaylistId', this.$props.id).then(() => {
        this.toBuyIconColor = 'green'
      })
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
