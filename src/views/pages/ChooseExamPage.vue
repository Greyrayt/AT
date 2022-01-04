<template>
  <div class="choose-exam-page">
    <b-container class="choose-exam-page__container">
      <b-row align-h="around" class="choose-exam-page__row">
        <b-col cols="12" md="3" class="choose-exam-page__button-wrapper">
          <b-button
            class="choose-exam-page__button"
            variant="primary"
            size="lg"
            :disabled="!testData.info.active"
            v-b-modal.test-begin
          >
            Пройти электронное тестирование
          </b-button>
          <div class="choose-exam-page__button-info">
            <p class="choose-exam-page__button-text">Дата: {{ dateFormatted(testData.info.date) }}</p>
            <p class="choose-exam-page__button-text">Время: {{ testData.info.time }}</p>
            <p class="choose-exam-page__button-text">{{ testData.info.message }}</p>
          </div>
        </b-col>
        <b-col cols="12" md="3" class="choose-exam-page__button-wrapper">
          <b-button
            class="choose-exam-page__button"
            variant="primary"
            size="lg"
            :disabled="!examData.info.active"
            v-b-modal.exam-begin
          >
            Пройти письменный экзамен
          </b-button>
          <div class="choose-exam-page__button-info">
            <p class="choose-exam-page__button-text">Дата: {{ dateFormatted(examData.info.date) }}</p>
            <p class="choose-exam-page__button-text">Время: {{ examData.info.time }}</p>
            <p class="choose-exam-page__button-text">{{ examData.info.message }}</p>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-modal
      id="test-begin"
      title="Электронное тестирование"
      ok-only
      size="xl"
      centered
      ok-title="Начать тестирование"
      @ok="examStart('test')">
      <p>На проведение тестирования Вам отводиться {{ testData.timer }} мин.</p>
      <p>Тестирование состоит из тридцати вопросов. На каждый вопрос дается несколько вариантов ответа. Вам нужно выбрать правильный.</p>
      <p>Если вы затрудняетесь в выборе ответа, можете перейти к другому ответу, вернувшись к нему позже.</p>
      <p>Выбранный ответ на вопрос фиксируется при переходе к следующему вопросу.</p>
      <p>Во избежание недоразумений, просим Вас не пользоваться кнопками браузера "вперед", "назад" и "обновить", функциональной клавишей F5 и менять адресную строку.</p>
      <p>Запрещается использовать технические средства, не предназначенные для проведения экзамена, пользоваться вспомогательными материалами, выходить из помещения, разговаривать и вставать с места. За нарушение порядка проведения экзамена экзаменуемый может быть отстранен от проведения экзамена.</p>
      Желаем удачи!
    </b-modal>
    <b-modal
      id="exam-begin"
      title="Письменный экзамен"
      size="xl"
      ok-only
      centered
      ok-title="Приступить к экзамену"
      @ok="examStart('exam')">
      <p>На проведение экзамена отводится {{ examData.timer }} мин.</p>
      <p>В течение этого времени вы можете покинуть помещение, предварительно, уведомив куратора, не более, чем 3 раза по 10 минут.</p>
      <p>Письменный экзамен состоит из четырех вопросов. На каждый вопрос требуется дать развернутый письменный ответ.</p>
      <p>Если вы затрудняетесь в ответе на вопрос, то вы можете перейти к другому Вопросу, вернувшись к нему позже.</p>
      <p>Ответ на вопрос фиксируется при переходе к следующему вопросу.</p>
      <p>Для ответа не некоторые вопросы вам будет необходимо заполнить и прикрепить приложенный к заданию бланк.</p>
      <p>Во избежание недоразумений, просим Вас не пользоваться кнопками браузера "вперед", "назад" и "обновить", функциональной клавишей F5 и менять адресную строку.</p>
      <p>Запрещается использовать технические средства, не предназначенные для проведения экзамена, пользоваться вспомогательными материалами, кроме раздаточных материалов, которые прикреплены внизу экрана, разговаривать, а также вставать с места и выходить из помещения вне перерыва. За нарушение порядка проведения экзамена экзаменуемый может быть отстранен от проведения экзамена.</p>

      Желаем удачи!

      <p style="text-align: right;" class="mt-5">Нажимая кнопку "Приступить к экзамену",<br>Вы соглашаетесь с обработкой
        персональных данных.</p>
    </b-modal>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'

import { apiRequest } from '../../utils/apiRequest'

const { mapGetters: mapStreamGetters } = createNamespacedHelpers('stream')
const { mapGetters: mapAttestationGetters, mapActions: mapAttestationActions } = createNamespacedHelpers('attestation')
export default {
  mounted() {
    this.loadParams()
  },
  computed: {
    ...mapStreamGetters({
      isStreamActive: 'isActive',
    }),
    ...mapAttestationGetters([
      'testData',
      'examData',
    ]),
  },
  methods: {
    ...mapAttestationActions(['loadParams']),

    startExam(examType) {
      return new Promise((resolve, reject) => {
        apiRequest
          .post(`/${examType}/start`)
          .then(({ data }) => {
            const { resultCode } = data
            if(resultCode === 1) {
              resolve(data.resultText)
            } else {
              reject(data.resultText)
            }

          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    examStart(examType) {
      this.startExam(examType)
        .then((resultText) => {
          if(resultText) {
            this.$bvToast.toast(resultText, {
              title: 'Ошибка',
              variant: 'danger',
              solid: true
            })
          }

          this.$router.push({ name: examType })
        })
        .catch((error) => {
          this.$bvToast.toast(error, {
            title: 'Ошибка',
            variant: 'danger',
            solid: true
          })
        })
    },

    dateFormatted(dateString) {
      if(dateString) {
        const date = new Date(dateString)
        return `${String(date.getDate()).padStart(2, '0')}.${date.getMonth()}.${date.getFullYear()}`
      }
      return

    }
  },
}
</script>

.<style lang="scss" scoped>
.choose-exam-page {
  padding-top: 60px;

  &__container {

  }

  &__row {

  }

  &__button {
    font-size: 18px;
    min-width: 270px;
    min-height: 76px;
    margin-bottom: 7px;

    &-wrapper {
      text-align: center;
    }

    &-info {
      text-align: left;
    }

    &-text {
      margin-bottom: 0;
      color: $black;
    }
  }
}
</style>
