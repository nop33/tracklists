<template>
  <div class="home">
    <v-container>
      <v-row>
        <v-col>
          <v-btn @click="loginToSpotify">Login to Spotify</v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  data: () => ({
    clientId: 'e5d07ddf1fe64a6cbcd2d14ac0aac87b',
    scope: 'user-read-private user-read-email playlist-read-private user-library-read',
    redirectUri: 'http://localhost:8080/spotify-auth-callback',
    state: generateRandomString(16)
  }),
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
      const checkForAccessToken = setInterval(() => {
        if (localStorage.accessToken) {
          clearInterval(checkForAccessToken)
          const receivedState = localStorage.spotifyReceivedState
          if (receivedState === null || receivedState !== this.state) {
            alert('Spotify says "Computer says no". Refresh the page and try to login again =)')
          } else {
            this.$router.push('/compare')
          }
        }
      }, 2000)
    }
  }
}

function generateRandomString (length) {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
</script>
