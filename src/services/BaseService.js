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

  static POST (url, data) {
    return axiosInstance.post(url, data)
  }

  static PUT (url, data) {
    return axiosInstance.put(url, data)
  }

  static DELETE (url, data) {
    return axiosInstance.delete(url, { data })
  }
}

export default BaseService
