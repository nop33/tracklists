<template>
  <div>
    <v-container>
      <v-row>
        <v-col>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  props: ['access_token', 'state'],
  created () {
    localStorage.setItem('spotifyAccessToken', this.$props.access_token)
    localStorage.setItem('spotifyReceivedState', this.$props.state)
    window.close()
  }
}
</script>
