import BaseService from './BaseService'
import api from './api'

class SpotifyService extends BaseService {
  static getPlaylists (params) {
    return this.GET(api.my.playlists, params)
  }

  static getPlaylistTracks (playlistId, params) {
    return playlistId === 'liked' ? this.GET(api.my.tracks, params) : this.GET(api.playlistTracks(playlistId), params)
  }
}
export default SpotifyService
