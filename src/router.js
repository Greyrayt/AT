import Vue from 'vue'
import VueRouter from 'vue-router'

import store from './store'

import attorney from './routes/attorney'
import auditor from './routes/auditor'

Vue.use(VueRouter)

const routes = [
  ...attorney,
  ...auditor,
  {
    path: '*',
    name: 'not-found',
    component: () => import(/* webpackChunkName: "not-found-page" */ './views/pages/technical/NotFoundPage'),
    meta: {
      title: '404',
    },
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

router.beforeEach(async (to, from, next) => {
  store.dispatch('auth/init')
  store.dispatch('auditorAuth/init')

  const isAuthorized = store.getters['auth/isAuthorized']
  if(to.meta.requiredAuth) {
    const hasParams = store.getters['auth/hasParams']
    if(!hasParams) {
      const { agent_id: agentId, exam_id: examId } = to.query

      if(agentId && examId) {
        store.commit('auth/SET_PARAMS', { agentId, examId })
      } else {
        window.location.href = '/ru/client/exam/'
      }
    }
    if(!isAuthorized) {
      next({ name: 'login' })
      return
    }

  }

  if(to.meta.requiredAccess) {
    await store.dispatch('auth/checkSessionStatus')
    await store.dispatch('attestation/checkAccess')

    if(store.getters['auth/hasAccess']) {
      if(!store.getters['stream/isActive']) {
        store.commit('stream/INIT')
        if(store.getters['stream/selectedCamera']) {
          store.commit('stream/SET_CAMERA_STATUS', true)
          store.dispatch('stream/init', true)
        } else {
          next({ name: 'prepare' })
          return
        }
      }
    } else {
      next({ name: 'prepare' })
      return
    }
  }

  const isAuditorAuthorized = store.getters['auditorAuth/isAuthorized']
  if(to.meta.requiredAuditorAuth && !isAuditorAuthorized) {
    next({ name: 'auditor-login' })
    return
  }

  document.title = `${to.meta.title} - Attestation`
  next()
})

export default router
