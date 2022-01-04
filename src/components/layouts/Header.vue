<template>
  <header class="header">
    <div class="container-fluid">
      <div class="row">
        <div class="col-6 header__title">
          <div class="header__title-element">ПК Аттестация - Дистанционный экзамен</div>
          <div class="header__title-element">{{ specname }}</div>
        </div>
        <div class="col-2 header__timer">
          <Timer class="header__timer" />
        </div>
        <div class="col-4 header__user header-user">
          <div class="header-user__name">{{ username }}</div>
          <a href="#" @click="$bvModal.show('exit')" class="header-user__logout">Выход</a>
        </div>
      </div>
    </div>
    <b-modal id="exit" ref="exit" ok-only ok-title="Да" @ok="handleLogout" title="Выход">
      <div class="d-block text-center">
        <h3>Вы действительно хотите выйти?</h3>
      </div>
    </b-modal>
  </header>
</template>

<script>
import Timer from '../Timer'

import { createNamespacedHelpers } from 'vuex'
const { mapGetters: mapAuthGetters, mapActions: mapAuthActions } = createNamespacedHelpers('auth')

import '../../assets/styles/header.scss'

export default {
  components: {
    Timer
  },

  computed: {
    ...mapAuthGetters({
      username: 'hasUser',
      specname: 'hasSpec'
    })
  },

  methods: {
    ...mapAuthActions(['logout']),
    hideModal() {
      this.$refs.exit.hide()
    },
    handleLogout(e) {
      e.preventDefault()
      this.logout()
        .then(() => {
          this.$router.push({ name: 'login' })
          window.location.reload()
        })
        .catch((message) => {
          this.$bvToast.toast(message, {
            title: 'Ошибка',
            variant: 'danger',
            solid: true
          })
        })
    }
  }
}
</script>
