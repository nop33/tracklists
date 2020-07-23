export default {
  my: {
    tracks: '/me/tracks',
    playlists: '/me/playlists'
  },
  playlist: (playlistId) => `/playlists/${playlistId}`,
  playlistTracks: (playlistId) => `/playlists/${playlistId}/tracks`
}
