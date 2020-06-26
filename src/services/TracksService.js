import BaseService from './BaseService'

class TracksService extends BaseService {
  static get (params) {
    return this.GET('/tracks', params)
  }
}

export default TracksService
