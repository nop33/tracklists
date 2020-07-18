<template>
  <v-card>
    <v-toolbar dark dense>
      <v-toolbar-title>{{ cardTitle }}</v-toolbar-title>
    </v-toolbar>
    <v-card-text v-if="tracklists.length == 0">
      <div class="font-weight-thin font-italic">{{ placeholderText }}</div>
    </v-card-text>
    <v-list v-else>
      <v-list-item-group>
        <template v-for="(tracklist, index) in tracklists">
          <TracklistCard
            :tracklist="tracklist"
            :key="tracklist.id"
            :deleteTracklistCallback="deleteTracklistCallback"
          />
          <v-divider v-if="index + 1 !== tracklists.length" :key="`${tracklist.id} ${index}`"></v-divider>
        </template>
      </v-list-item-group>
    </v-list>
  </v-card>
</template>

<script>
import TracklistCard from '@/components/TracklistCard.vue'

export default {
  props: [
    'cardTitle',
    'placeholderText',
    'tracklists',
    'deleteTracklistCallback'
  ],
  components: {
    TracklistCard
  }
}
</script>
