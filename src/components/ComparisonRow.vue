<template>
  <v-row>
    <v-col>
      <TracklistsCard
        :tracklist="leftTracklist"
        cardTitle="To compare"
        :placeholderText="placeholderText"
        :placeholderIcon="icon"
        :type="type"
      />
    </v-col>
    <v-col md="auto" class="d-flex align-center justify-center">
      <v-btn @click="compareCallback">
        <v-icon left>mdi-arrow-right</v-icon>
        Compare
        <v-icon right>mdi-arrow-left</v-icon>
      </v-btn>
    </v-col>
    <v-col>
      <TracklistsCard
        :tracklist="rightTracklist"
        cardTitle="To compare"
        :placeholderText="placeholderText"
        :placeholderIcon="icon"
        :type="type"
      />
    </v-col>
  </v-row>
</template>

<script>
import TracklistsCard from '@/components/TracklistsCard.vue'

import { tracklistTypes } from '@/utils/constants.js'

export default {
  props: [
    'leftTracklist',
    'rightTracklist',
    'compareCallback'
  ],
  components: {
    TracklistsCard
  },
  data: () => {
    return {
      placeholderText: 'Your selected tracklist to compare will appear here',
      icon: 'mdi-selection-ellipse-arrow-inside'
    }
  },
  computed: {
    type () {
      return tracklistTypes.TO_COMPARE
    }
  }
}
</script>
