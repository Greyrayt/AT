import { apiRequest, setApiRequestToken, removeApiRequestToken  } from '../utils/apiRequest'

export default {
  namespaced: true,
  state: {
    user: undefined,
    params: undefined,
    token: undefined,
    sessionState: undefined
  },
  getters: {
    hasUser: (state) => state.user && state.user.fio,
    hasSpec: (state) => state.user && state.user.specialName,
    hasParams: (state) => state.params && (state.params.agentId && state.params.examId),
    valideToken: (state) => state.token && Date.parse(state.token.expire) > Date.now() && state.token.value,
    isAuthorized: (state, getters) => getters.hasUser && getters.hasParams && getters.valideToken,
    hasAccess: (state) => state.sessionState !== 0
  },
  mutations: {
    READ_STORAGE(state) {
      state.params = JSON.parse(sessionStorage.getItem('params'))
      state.user = JSON.parse(sessionStorage.getItem('user'))
      state.token = JSON.parse(sessionStorage.getItem('token'))
    },
    SET_PARAMS(state, params) {
      sessionStorage.setItem('params', JSON.stringify(params))
      state.params = params
    },
    SET_USER(state, user) {
      sessionStorage.setItem('user', JSON.stringify(user))
      state.user = user
    },
    SET_TOKEN(state, tokenData) {
      sessionStorage.setItem('token', JSON.stringify(tokenData))
      setApiRequestToken(tokenData.value)
      state.token = tokenData
    },
    REMOVE_AUTH(state) {
      sessionStorage.removeItem('token')
      removeApiRequestToken()
      state.token = null
    },
    SET_SESSION_STATE(state, statusCode) {
      state.sessionState = statusCode
    }
  },
  actions: {
    login({ state, commit }, formData) {
      return new Promise((resolve, reject) => {
        apiRequest
          .post('/auth/login', {...formData, ...state.params})
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
    logout({ commit, dispatch }) {
      return new Promise((resolve, reject) => {
        apiRequest
          .post('/auth/logout')
          .then((result) => {
            const { resultCode, resultText } = result.data
            if(resultCode === 1) {
              commit('REMOVE_AUTH')
              dispatch('stream/clear', null, { root: true })
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
    appendSession({ state }, jsep) {
      return new Promise((resolve, reject) => {
        apiRequest
          .post('/webcam/activate', {
            agentExamID: state.params.examId,
            rtcSession: JSON.stringify(jsep)
          })
          .then(() => {
            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    checkSessionStatus({ state, commit }) {
      return new Promise((resolve, reject) => {
        apiRequest
          .get('/session/status')
          .then(({ data }) => {
            commit('SET_SESSION_STATE', data.sessionState)
            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
  },
}
