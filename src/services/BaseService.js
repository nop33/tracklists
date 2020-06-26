import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'https://api.spotify.com/v1/me',
  headers: {
    Authorization: `Bearer ${localStorage.accessToken}`
  }
})

class BaseService {
  static GET (url, params) {
    return axiosInstance.get(url, { params })
  }
}

export default BaseService
