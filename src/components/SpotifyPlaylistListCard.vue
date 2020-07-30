<template>
  <v-card class="mx-auto text-left">
    <v-sheet class="pa-4 green lighten-2">
      <v-text-field
        v-model="spotifyPlaylistSearch"
        label="Search Spotify playlist"
        dark flat solo-inverted hide-details clearable
        clear-icon="mdi-close-circle-outline"
        prepend-icon="mdi-magnify"
      ></v-text-field>
    </v-sheet>
    <v-card-text class="spotify-playlist-list">
      <v-list dense>
        <v-list-item-group v-model="selectedSpotifyPlaylistToImport" color="green">
          <SpotifyPlaylistListItem v-if="!hideSpotifyLikedPlaylist"
            id="liked"
            color="red"
            icon="mdi-heart"
            name="Liked"
            :tracksTotal="totalSpotifyLikedTracksNumber"
            :onClickMethod="importSpotifyLikedTracks"
          />
          <SpotifyPlaylistListItem v-for="playlist in filteredSpotifyPlaylists" :key="playlist.id"
            :id="playlist.id"
            :imageUrl="playlist.images.length ? playlist.images[0].url : ''"
            color="green"
            icon="fab fa-spotify"
            :name="playlist.name"
            :tracksTotal="playlist.tracks.total"
            :onClickMethod="importSpotifyPlaylist"
          />
        </v-list-item-group>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import SpotifyService from '@/services/SpotifyService'
import SpotifyPlaylistListItem from '@/components/SpotifyPlaylistListItem.vue'

export default {
  props: [
    'playlistImportCallback',
    'handleAPIError'
  ],
  components: {
    SpotifyPlaylistListItem
  },
  data: () => {
    return {
      spotifyPlaylists: [],
      spotifyPlaylistSearch: null,
      selectedSpotifyPlaylistToImport: null,
      totalSpotifyLikedTracksNumber: 0,
      hideSpotifyLikedPlaylist: false
    }
  },
  computed: {
    filteredSpotifyPlaylists () {
      return this.spotifyPlaylistSearch
        ? this.spotifyPlaylists.filter(playlist => playlist.name.toLowerCase().includes(this.spotifyPlaylistSearch.toLowerCase()))
        : this.spotifyPlaylists
    }
  },
  created () {
    this.getSpotifyTotalLikedTracksNumber()
    this.getSpotifyPlaylists()
  },
  methods: {
    importSpotifyLikedTracks () {
      this.hideSpotifyLikedPlaylist = true
      this.$props.playlistImportCallback('Liked', 'liked', this.totalSpotifyLikedTracksNumber)
      this.$store.dispatch('resetSelectedImportMethod')
    },
    importSpotifyPlaylist (playlistId) {
      const spotifyPlaylist = this.spotifyPlaylists.find(playlist => playlist.id === playlistId)
      const index = this.spotifyPlaylists.indexOf(spotifyPlaylist)
      this.spotifyPlaylists.splice(index, 1)
      this.$props.playlistImportCallback(spotifyPlaylist.name, spotifyPlaylist.id, spotifyPlaylist.tracks.total)
      this.$store.dispatch('resetSelectedImportMethod')
    },
    getSpotifyPlaylists () {
      const limit = 50
      const offset = 0
      this.getSpotifyPlaylistsFromAPI(limit, offset, 0, 0)
    },
    getSpotifyPlaylistsFromAPI (limit, offset, totalSpotifyPlaylists, spotifyReceivedPlaylistsCounter) {
      SpotifyService.getPlaylists({ limit, offset }).then(response => {
        const playlists = response.data.items
        if (totalSpotifyPlaylists === 0) {
          totalSpotifyPlaylists = response.data.total
        }
        offset += limit

        this.spotifyPlaylists.push(...playlists)

        spotifyReceivedPlaylistsCounter += playlists.length
        if (spotifyReceivedPlaylistsCounter < totalSpotifyPlaylists) {
          this.getSpotifyPlaylistsFromAPI(limit, offset, totalSpotifyPlaylists, spotifyReceivedPlaylistsCounter)
        }
      }).catch(err => {
        this.handleAPIError(err)
      })
    },
    getSpotifyTotalLikedTracksNumber () {
      SpotifyService.getPlaylistTracks('liked', { limit: 1, offset: 0 }).then(response => {
        this.totalSpotifyLikedTracksNumber = response.data.total
      }).catch(err => {
        this.handleAPIError(err)
      })
    }
  }
}
</script>

<style lang="scss">
.spotify-playlist-list {
  max-height: 100%;
  overflow-x: auto;
}
</style>
