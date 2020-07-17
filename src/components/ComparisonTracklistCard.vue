<template>
  <v-card outlined>
    <v-card-text v-if="!tracklist">
      <div class="font-weight-thin font-italic">
        Select a tracklist to compare
      </div>
      </v-card-text>
      <v-list v-else>
        <TracklistCard :tracklist="tracklist" isSelectedForComparison />
      </v-list>
  </v-card>
</template>

<script>
import TracklistCard from '@/components/TracklistCard.vue'

export default {
  props: ['tracklist'],
  components: {
    TracklistCard
  }
}
</script>
