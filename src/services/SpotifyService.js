import BaseService from './BaseService'
import api from './api'

class SpotifyService extends BaseService {
  static getLikedTracks (params) {
    return this.GET(api.my.tracks, params)
  }

  static getPlaylists (params) {
    return this.GET(api.my.playlists, params)
  }

  static getPlaylistTracks (playlistId, params) {
    return this.GET(api.playlistTracks(playlistId), params)
  }
}
export default SpotifyService
