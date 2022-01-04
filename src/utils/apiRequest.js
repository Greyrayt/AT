import axios from 'axios'

const API_URL = '/api'

export const apiRequest = axios.create({
  baseURL: API_URL,
})

export const setApiRequestToken = (token) => apiRequest.defaults.headers.common['Token'] = token
export const removeApiRequestToken = () => delete apiRequest.defaults.headers.common['Token']
