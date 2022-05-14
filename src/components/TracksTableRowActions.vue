<template>
  <div>
    <v-btn icon @click="copy()">
      <v-icon>{{ copied ? "mdi-check-bold" : "mdi-content-copy"}}</v-icon>
    </v-btn>
    <v-btn v-if="spotifyPlaylist && showDeleteBtn" icon @click="removeFromPlaylist()" class="mx-10">
      <v-icon>{{ "mdi-delete-outline" }}</v-icon>
    </v-btn>
  </div>
</template>

<script>
import SpotifyService from '../services/SpotifyService'

export default {
  props: ['track', 'spotifyPlaylist', 'onSuccessfulRemoval'],
  data: () => ({
    copied: false,
    showDeleteBtn: true
  }),
  methods: {
    async copy () {
      const self = this
      const text = `${this.track.name} ${this.track.artists.join(' ')}`
      const result = await navigator.permissions.query({ name: 'clipboard-write' })
      if (result.state !== 'granted' && result.state !== 'prompt') {
        alert('Cannot copy, permissions are not yet granted')
        return false
      }
      navigator.clipboard.writeText(text).then(() => {
        self.copied = true
        setTimeout(() => {
          self.copied = false
        }, 1000)
      }, () => console.log('copying failed...'))
    },
    async removeFromPlaylist () {
      try {
        const response = await SpotifyService.removeTrackFromPlaylist(this.spotifyPlaylist, this.track.uri)
        if (response.status === 200) {
          this.showDeleteBtn = false
        }
      } catch (e) {
        console.error(e)
      }
    }
  }
}
</script>
