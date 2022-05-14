import BaseService from './BaseService'
import api from './api'

class SpotifyService extends BaseService {
  static getPlaylists (params) {
    return this.GET(api.my.playlists, params)
  }

  static getPlaylist (playlistId) {
    return this.GET(api.playlist(playlistId))
  }

  static getPlaylistTracks (playlistId, params) {
    return playlistId === 'liked'
      ? this.GET(api.my.tracks, params)
      : this.GET(api.playlistTracks(playlistId), params)
  }

  static addTracksToPlaylist (playlist, urisOfTracksToAdd) {
    return this.POST(api.playlistTracks(playlist.id), { uris: urisOfTracksToAdd })
  }

  static addTracksToLiked (idsOfTracksToAdd) {
    return this.PUT(api.my.tracks, { ids: idsOfTracksToAdd })
  }

  static removeTrackFromPlaylist (playlist, trackUri) {
    return this.DELETE(api.playlistTracks(playlist.id), { tracks: [{ uri: trackUri }] })
  }
}
export default SpotifyService
