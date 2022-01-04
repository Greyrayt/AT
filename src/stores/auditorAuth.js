import { apiRequest, setApiRequestToken, removeApiRequestToken  } from '../utils/apiRequest'

export default {
  namespaced: true,
  state: {
    user: undefined,
    token: undefined,
  },
  getters: {
    hasUser: (state) => state.user && state.user.fio,
    valideToken: (state) => state.token && Date.parse(state.token.expire) > Date.now() && state.token.value,
    isAuthorized: (state, getters) => getters.hasUser && getters.valideToken,
  },
  mutations: {
    READ_STORAGE(state) {
      state.user = JSON.parse(sessionStorage.getItem('auditor-user'))
      state.token = JSON.parse(sessionStorage.getItem('auditor-token'))
    },
    SET_USER(state, user) {
      sessionStorage.setItem('auditor-user', JSON.stringify(user))
      state.user = user
    },
    SET_TOKEN(state, tokenData) {
      sessionStorage.setItem('auditor-token', JSON.stringify(tokenData))
      setApiRequestToken(tokenData.value)
      state.token = tokenData
    },
    REMOVE_AUTH(state) {
      sessionStorage.removeItem('auditor-token')
      removeApiRequestToken()
      state.token = null
    },
  },
  actions: {
    login({ state, commit }, formData) {
      return new Promise((resolve, reject) => {
        apiRequest
          .post('/auth/auditor/login', {...formData, ...state.params})
          .then((result) => {
            const { accessToken, expireToken, fio, specialName } = result.data

            commit('SET_TOKEN', { value: accessToken, expire: expireToken })
            commit('SET_USER', { fio, specialName })

            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    init({ commit, getters }) {
      commit('READ_STORAGE')

      if(getters.isAuthorized) {
        setApiRequestToken(getters.valideToken)
      }
    },
    logout({ commit }) {
      return new Promise((resolve, reject) => {
        apiRequest
          .post('/auth/auditor/logout')
          .then((result) => {
            const { resultCode, resultText } = result.data
            if(resultCode === 1) {
              commit('REMOVE_AUTH')
              resolve()
            } else {
              reject(resultText)
            }
          })
          .catch((error) => {
            reject(error.response.data.message)
          })
      })
    },
  },
}
