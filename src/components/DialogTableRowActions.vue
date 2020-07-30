<template>
  <v-btn icon small @click="openMuzonlyTab()">
    <v-icon small>mdi-open-in-new</v-icon>
  </v-btn>
</template>

<script>
export default {
  props: ['track'],
  methods: {
    openMuzonlyTab () {
      const url = `https://srv.muzonly2.com/#/search?text=${this.track.name} ${this.track.artists.join(' ')}`
      console.log(encodeURI(url))
      var win = window.open(encodeURI(url), '_blank')
      win.focus()
    }
  }
}
</script>
