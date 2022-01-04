<<template>
  <header class="header auditor-header">
    <b-container fluid>
      <b-row>
        <b-col class="header__title">
          <div class="header__title-element">ПК Аттестация - Дистанционный экзамен</div>
          <div class="header__title-element">Администратор</div>
        </b-col>
        <b-col class="header__user header-user">
          <div class="header-user__name">{{ username }}</div>
          <a href="#" @click="$bvModal.show('exit')" class="header-user__logout">Выход</a>
        </b-col>
      </b-row>
    </b-container>
    <b-modal id="exit" ref="exit" ok-only ok-title="Да" @ok="handleLogout" title="Выход">
      <div class="d-block text-center">
        <h3>Вы действительно хотите выйти?</h3>
      </div>
    </b-modal>
  </header>
</template>

<script>

import { createNamespacedHelpers } from 'vuex'
const { mapGetters: mapAuthGetters, mapActions: mapAuthActions } = createNamespacedHelpers('auditorAuth')

import '../../../assets/styles/header.scss'

export default {
  computed: {
    ...mapAuthGetters({
      username: 'hasUser'
    })
  },

  methods: {
    ...mapAuthActions(['logout']),
    handleLogout(e) {
      e.preventDefault()
      this.logout()
        .then(() => {
        this.$router.push({ name: 'auditor-login' })
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
