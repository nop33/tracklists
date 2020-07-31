<template>
  <v-card outlined>
    <v-toolbar dense v-if="cardTitle" color="grey lighten-4" flat>
      <v-toolbar-title>{{ cardTitle }}</v-toolbar-title>
    </v-toolbar>
    <v-card-text v-if="tracklists.length === 0 && !tracklist">
      <div class="font-weight-thin font-italic d-flex">
        <v-icon left color="grey lighten-1">{{ placeholderIcon }}</v-icon>
        {{ placeholderText }}
      </div>
    </v-card-text>
    <v-list v-else-if="tracklists.length > 0">
      <template v-for="(tracklist, index) in tracklists">
        <Tracklist
          :tracklist="tracklist"
          :key="tracklist.id"
          :deleteTracklistCallback="deleteTracklistCallback"
          :type="type"
        />
        <v-divider v-if="index + 1 !== tracklists.length" :key="`${tracklist.id} ${index}`"></v-divider>
      </template>
    </v-list>
    <Tracklist
      v-else-if="tracklist"
      :tracklist="tracklist"
      :key="tracklist.id"
      :deleteTracklistCallback="deleteTracklistCallback"
      :type="type"
    />
  </v-card>
</template>

<script>
import Tracklist from '@/components/Tracklist.vue'
import { TracklistBase } from '@/models/tracklists'

export default {
  props: {
    cardTitle: String,
    placeholderText: String,
    placeholderIcon: String,
    tracklist: TracklistBase,
    tracklists: {
      type: Array,
      default: () => []
    },
    deleteTracklistCallback: Function,
    type: String
  },
  components: {
    Tracklist
  }
}
</script>
