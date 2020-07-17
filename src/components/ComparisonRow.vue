<template>
  <v-row justify="center">
    <v-col md="9">
      <v-row>
        <v-col>
          <ComparisonTracklistCard :tracklist="leftTracklist" />
        </v-col>
        <v-col class="d-flex align-center justify-space-around">
          <v-icon>mdi-arrow-right</v-icon>
          <v-btn @click="compareCallback">Compare</v-btn>
          <v-icon>mdi-arrow-left</v-icon>
        </v-col>
        <v-col>
          <ComparisonTracklistCard :tracklist="rightTracklist" />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
import ComparisonTracklistCard from '@/components/ComparisonTracklistCard.vue'

export default {
  props: [
    'leftTracklist',
    'rightTracklist',
    'compareCallback'
  ],
  components: {
    ComparisonTracklistCard
  }
}
</script>
