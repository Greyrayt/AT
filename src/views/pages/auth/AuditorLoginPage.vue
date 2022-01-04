<template>
  <div class="page login-page">
    <div class="container d-flex flex-column login-page__container">
      <div class="row justify-content-center align-items-center login-page__row login-page__row--login-form">
        <div class="col-xs-8 col-md-6 col-lg-4 login-form">
          <h1 class="login-form__title">Логин и пароль</h1>
          <b-form class="login-form__form" @submit="handleSubmit">
            <b-form-input
              class="login-form__input"
              v-model="form.login"
              placeholder="Логин"
              required
            ></b-form-input>
            <b-form-input
              class="login-form__input"
              v-model="form.password"
              placeholder="Пароль"
              required
              type="password"
            ></b-form-input>
            <b-button
              class="btn-block login-form__button login-form__button--submit"
              type="submit"
              variant="primary"
            >
              Вход
            </b-button>
          </b-form>
        </div>
      </div>
      <footer class="row justify-content-between align-items-center login-page__row login-page__row--footer login-page-footer">
        <div class="col-12 col-md-6 col-lg-5 login-page-footer__title">
          Роспатент. Аттестация патентных поверенных
        </div>
        <div class="col-12 col-md-6 col-lg-3 d-flex align-items-center justify-content-end login-page-footer__designed-by">
          <span>Designed by</span>
          <img class="login-page-footer__logo" src="../../../assets/images/designer-logo.svg" alt="">
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'
const { mapActions: mapAuthActions } = createNamespacedHelpers('auditorAuth')
export default {
  name: 'AuditorLoginPage',
  data() {
    return {
      form: {
        login: '',
        password: ''
      }
    }
  },
  methods: {
    ...mapAuthActions(['login']),
    handleSubmit(e) {
      e.preventDefault()
      this.login(this.form)
        .then(() => {
          this.$router.push({ name: 'auditor-home' })
            .catch((error) => {
              console.log(error)
            })
        })
        .catch((error) => {
          this.$bvToast.toast(error.response.data.message, {
            title: 'Ошибка',
            variant: 'danger',
            solid: true
          })
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  background-image: url(../../../assets/login-page-background.jpg);
  background-size: cover;
  background-position: center center;

  &__container {
    height: 100%;
  }
  &__row {
    &--login-form {
      flex: 1;
    }
    &--footer {
      margin-bottom: 30px;
    }
  }

  &-footer {
    &__title {
      font-size: 18px;
      color: $blue-dark;
    }
    &__designed-by {
      text-align: right;
      font-size: 10px;
      color: $blue-dark;
    }

    &__logo {
      width: 170px;
      margin-left: 20px;
    }
  }
}

.login-form {
  &__title {
    font-size: 24px;
    margin-bottom: 20px;
  }
  &__input {
    margin-bottom: 30px;
  }
  &__button {
    font-size: 18px;
  }
}
</style>
