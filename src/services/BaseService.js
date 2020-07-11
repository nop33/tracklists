import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'https://api.spotify.com/v1',
  headers: {
    Authorization: constructAuthorizationString()
  }
})

axiosInstance.interceptors.request.use(function (config) {
  config.headers.Authorization = constructAuthorizationString()
  return config
})

function constructAuthorizationString () {
  return `Bearer ${localStorage.getItem('spotifyAccessToken')}`
}

class BaseService {
  static GET (url, params) {
    return axiosInstance.get(url, { params })
  }
}

export default BaseService
