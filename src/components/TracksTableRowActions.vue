<template>
  <v-btn icon @click="copy()">
    <v-icon>{{ copied ? "mdi-check-bold" : "mdi-content-copy"}}</v-icon>
  </v-btn>
</template>

<script>
export default {
  props: ['track'],
  data: () => ({
    copied: false
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
    }
  }
}
</script>
