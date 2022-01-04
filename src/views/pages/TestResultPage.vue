<template>
  <div class="d-flex flex-column justify-content-between test-result-page">
    <div class="test-result-page__top">
      <h1 class="test-result-page__title">Протокол компьютерного тестирования</h1>
      <b-container fluid class="test-result__container" :class="[`test-result__container--${testStatus}`]">
        <b-row class="test-result__row">
          <b-col class="test-result__status" :class="[`test-result__status--${testStatus}`]">{{ summary.testStatusName }}</b-col>
          <b-col class="test-result__info">Правильных ответов: {{ summary.testCountTrue }}</b-col>
        </b-row>
        <b-row class="test-result__row">
          <b-col></b-col>
          <b-col class="test-result__info">Неправильных ответов: {{ summary.testCountFalse }}</b-col>
        </b-row>
        <b-row class="test-result__row">
          <b-col>Израсходовано времени: {{ summary.testTime }}</b-col>
          <b-col class="test-result__info">Оставленных без ответа: {{ summary.testCountNull }}</b-col>
        </b-row>
      </b-container>

      <b-link @click="getProtocol" class="d-flex align-items-center test-result__download">
        Скачать протокол тестирования <img class="ml-2 test-result__download-icon" src="../../assets/images/attachment.svg" alt="">
      </b-link>
    </div>
    <div class="d-flex justify-content-end test-result-page__bottom">
      <b-button :to="{ name: 'home' }" variant="primary" class="btn--classic" size="lg">На главную</b-button>
    </div>
  </div>
</template>

<script>
import { apiRequest } from '../../utils/apiRequest'
export default {
  name: "Summary",
  data() {
    return {
      summary: {}
    }
  },
  computed: {
    testStatus() {
      return this.summary.testStatusCode === 1 ? 'success' : 'fail';
    },
    protocolLink() {
      return process.env.VUE_APP_API_URL + '/test/protocol'
    }
  },
  methods: {
    loadTestSummary() {
      apiRequest.get(`/test/summary`)
        .then(({ data }) => {
          this.summary = data
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getProtocol() {
      apiRequest.get('/test/protocol', {responseType: 'blob'})
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'protocol.pdf');
          document.body.appendChild(link);
          link.click();
        });
    }
  },
  mounted() {
    this.loadTestSummary()
  }
}
</script>

<style lang="scss" scoped>
.test-result {
  &__container {
    border-radius: 0.3em;
    padding: 18px 26px;

    &--success {
      background-color: rgba(#5CD37C, 0.2);
    }
    &--fail {
      background-color: rgba(#E44F20, 0.2);
    }
  }

  &__status {
    font-size: 30px;
    font-weight: 600;
    &--success {
      color: $green;
    }
    &--fail {
      color: #E44F20;
    }
  }

  &__info {
    font-size: 18px;
    color: $black;
    font-weight: 700;
  }

  &__download {
    margin-top: 30px;
    color: $grey;
    font-size: 18px;
    &-icon {
      width: 24px;
    }
  }

  &-page {
    padding-top: 30px;
    padding-bottom: 60px;
    height: 100%;
    &__title {
      font-size: 30px;
      color: $blue-dark;
      margin-bottom: 30px;
    }
  }
}
</style>
