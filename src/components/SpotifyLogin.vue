<template>
  <v-btn @click="loginToSpotify" dark color="green">Login to Spotify</v-btn>
</template>

<script>
import { generateRandomString } from '@/utils/utils'

export default {
  data: () => {
    return {
      clientId: 'e5d07ddf1fe64a6cbcd2d14ac0aac87b',
      scope: 'playlist-read-private playlist-modify-private user-library-read user-library-modify',
      redirectUri: 'http://localhost:8080/spotify-auth-callback',
      state: generateRandomString(16)
    }
  },
  computed: {
    spotifyAuthUrl () {
      const baseUrl = 'https://accounts.spotify.com/authorize'
      const responseType = 'token'
      const clientId = encodeURIComponent(this.clientId)
      const scope = encodeURIComponent(this.scope)
      const redirectUri = encodeURIComponent(this.redirectUri)
      const state = encodeURIComponent(this.state)
      return `${baseUrl}?response_type=${responseType}&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`
    }
  },
  methods: {
    loginToSpotify () {
      window.open(this.spotifyAuthUrl, '_blank', 'height=570,width=520')

      const checkForSpotifyAccessToken = setInterval(() => {
        if (localStorage.getItem('spotifyAccessToken')) {
          clearInterval(checkForSpotifyAccessToken)
          const receivedState = localStorage.getItem('spotifyReceivedState')
          if (receivedState === null || receivedState !== this.state) {
            this.$store.dispatch('pushNotification', 'Spotify says no. Refresh the page and try to login again =)')
          } else {
            this.$store.dispatch('toggleSpotifyAccessTokenFlag', true)
          }
        }
      }, 2000)
    }
  }
}
</script>
