<template>
  <v-card outlined>
    <v-card-text v-if="!tracklist">
      <div class="font-weight-thin font-italic">
        Select a tracklist to compare
      </div>
      </v-card-text>
      <v-list dense v-else>
        <TracklistCard
          :key="tracklist.id"
          :name="tracklist.name"
          :id="tracklist.id"
          :tracks="tracklist.tracks"
          :type="tracklist.type"
          isSelectedForComparison="true"
        />
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
