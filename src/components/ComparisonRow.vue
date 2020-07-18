<template>
  <v-row>
    <v-col>
      <v-row>
        <v-col >
          <TracklistCardWithPlaceholder
            :tracklist="leftTracklist"
            :placeholderText="placeholderText"
            :type="type"
            :icon="icon"
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
          <TracklistCardWithPlaceholder
            :tracklist="rightTracklist"
            :placeholderText="placeholderText"
            :type="type"
            :icon="icon"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
import TracklistCardWithPlaceholder from '@/components/TracklistCardWithPlaceholder.vue'

import { tracklistTypes } from '@/utils/constants.js'

export default {
  props: [
    'leftTracklist',
    'rightTracklist',
    'compareCallback'
  ],
  components: {
    TracklistCardWithPlaceholder
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
