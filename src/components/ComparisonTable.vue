<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="items"
      :items-per-page="20"
      class="elevation-1"
    >
      <template v-slot:item.spotifyTrack.name="{ item }">
        <div>
          <div v-html="displayMatches(item.iTunesTrack.name, item.spotifyTrack.name)"></div>
          <div v-html="displayMatches(item.spotifyTrack.name, item.iTunesTrack.name)"></div>
        </div>
      </template>
      <template v-slot:item.spotifyTrack.artists="{ item }">
        <div>
          <div>{{ item.spotifyTrack.artists.join(', ') }}</div>
          <div>{{ item.iTunesTrack.artist }}</div>
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script>
export default {
  name: 'ComparisonTable',
  props: ['items'],
  data: () => ({
    headers: [
      { text: 'Track name', value: 'spotifyTrack.name' },
      { text: 'Track artists', value: 'spotifyTrack.artists' }
    ]
  }),
  methods: {
    displayMatches (text1, text2) {
      let regex = null
      let response = ''
      if (text2.includes(text1)) {
        regex = new RegExp(text1, 'gi')
        response = text2.replace(regex, str => {
          return "<span style='background-color: yellow;'>" + str + '</span>'
        })
      } else if (text1.includes(text2)) {
        response = "<span style='background-color: yellow;'>" + text2 + '</span>'
      }
      return response
    }
  }
}
</script>
