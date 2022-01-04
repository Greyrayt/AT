import { apiRequest  } from '../utils/apiRequest'

export default {
  namespaced: true,
  state: {
    exam: {
      info: {
        active: false,
        date: '',
        time: '',
        message: '',
      },
      time: {
        start: undefined,
        end: undefined
      }
    },
    test: {
      info: {
        active: false,
        date: '',
        time: '',
        message: '',
      },
      time: {
        start: undefined,
        end: undefined
      },
    },
    params: {},
  },
  getters: {
    testData: (state) => ({...state.test, timer: state.params['002']}),
    examData: (state) => ({...state.exam, timer: state.params['003']}),
    testTime: (state) => state.test.time,
    examTime: (state) => state.exam.time,
  },
  mutations: {
    SET_EXAMS_DATA(state, { test, exam }) {
      state.test.info = test
      state.exam.info = exam
    },
    SET_PARAMS(state, params) {
      const newParams = {}
      params.forEach(({ code, value }) => newParams[code] = value)
      state.params = newParams
    },
    SET_TIME(state, { examType, start }) {
      const startTime = Date.parse(`${start} GMT+0300`)
      const examParam = examType === 'test' ? '002' : '003'
      const interval = Number(state.params[examParam]) * 60 * 1000

      state[examType].time.start = startTime
      state[examType].time.end = startTime + interval
    }
  },
  actions: {
    checkAccess({ commit }) {
      return new Promise((resolve, reject) => {
        apiRequest
          .get('/exam/access')
          .then((result) => {
            commit('SET_EXAMS_DATA', result.data)

            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    loadParams({ commit }) {
      return new Promise((resolve, reject) => {
        apiRequest
          .get('/params')
          .then((result) => {
            commit('SET_PARAMS', result.data)

            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    loadTimes({ commit }, examType) {
      return new Promise((resolve, reject) => {
        apiRequest
          .get(`/${examType}/time`)
          .then(({ data }) => {
            commit('SET_TIME', {examType, start: data})

            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    finishExam({}, examType) {
      return new Promise((resolve, reject) => {
        apiRequest
          .post(`/${examType}/finish`)
          .then(() => {
            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
  },
}
