<template>
  <v-card outlined>
    <v-toolbar dark dense v-if="cardTitle">
      <v-toolbar-title>{{ cardTitle }}</v-toolbar-title>
    </v-toolbar>
    <v-card-text v-if="!tracklist">
      <div class="font-weight-thin font-italic d-flex">
        <v-icon left color="grey lighten-1">{{ icon }}</v-icon>
        {{ placeholderText }}
      </div>
      </v-card-text>
      <v-list v-else>
        <TracklistCard :tracklist="tracklist" :type="type" />
      </v-list>
  </v-card>
</template>

<script>
import TracklistCard from '@/components/TracklistCard.vue'

export default {
  props: [
    'tracklist',
    'placeholderText',
    'type',
    'icon',
    'cardTitle'
  ],
  components: {
    TracklistCard
  }
}
</script>
