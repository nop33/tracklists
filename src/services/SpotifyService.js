import BaseService from './BaseService'

class SpotifyService extends BaseService {
  static getLikedTracks (params) {
    return this.GET('/tracks', params)
  }

  static getPlaylists (params) {
    return this.GET('/playlists', params)
  }
}
export default SpotifyService
