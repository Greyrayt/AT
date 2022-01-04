<template>
  <div class="page exams-page test-page">
    <b-container class="exams-page__container">
      <b-row class="exams-page__row exams-questions">
        <b-col class="exams-questions__wrapper">
          <b-button
            @click="changeQuestion(i+1)"
            v-for="(question, i) in questions"
            :key="i"
            class="exams-questions__button"
            :class="{ active: currentQuestion === i+1, disabled: isAnswered(i) }"
          >
            {{ i+1 }}
          </b-button>
        </b-col>
      </b-row>
      <b-row class="exams-page__row exams-content" :class="{ 'exams-content--disabled': !!answers[currentQuestionData.rid] }">
        <b-col class="exams-content__wrapper">
          <div class="exams-content__title">Вопрос № {{ currentQuestion }}</div>
          <div class="exams-content__question">{{ currentQuestionData.testText }}</div>
          <div class="exams-content__variants">
            <b-form-group label="Выберите ответ:">
              <b-form-radio
                v-for="answer in currentAnswers"
                :key="answer.rid"
                :name="currentQuestionData.rid"
                :value="answer.rid"
                v-model="currentAnswerC"
              >
                {{ answer.answerText }}
              </b-form-radio>
            </b-form-group>
          </div>
        </b-col>
      </b-row>
      <b-row align-h="between" class="exams-page__row exams-actions">
        <b-col md="4" class="d-flex justify-content-center exams-actions__button-wrapper">
          <b-button block @click="prevQuestion" class="btn--classic exams-actions__button" variant="primary" size="lg" :disabled="currentQuestion <= 1">Предыдущий</b-button>
        </b-col>
        <b-col md="4" class="d-flex justify-content-center exams-actions__button-wrapper">
          <b-button block @click="$bvModal.show('test-exit')" class="btn--classic exams-actions__button exams-actions__button--finish" variant="primary" size="lg">Завершить тестирование</b-button>
        </b-col>
        <b-col md="4" class="d-flex justify-content-center exams-actions__button-wrapper">
          <b-button block @click="nextQuestion" class="btn--classic exams-actions__button" variant="primary" size="lg" :disabled="currentQuestion >= questions.length">Следующий</b-button>
        </b-col>
      </b-row>
    </b-container>
    <div class="spinner" v-if="loading || !recordingLoaded"><b-spinner></b-spinner></div>
    <b-modal id="test-exit" ref="exit" ok-only ok-title="Да" @ok="finish" title="Выход">
      <div class="d-block text-center">
        <h3>Вы действительно хотите завершить тест?</h3>
        <p>После завершения вы не сможете вернуться к прохождению теста.</p>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'
import { apiRequest } from '../../utils/apiRequest'

const { mapActions: mapAttestationActions } = createNamespacedHelpers('attestation')
const { mapGetters: mapStreamGetters, mapActions: mapStreamActions } = createNamespacedHelpers('stream')

import '../../assets/styles/exams.scss'

export default {
  data() {
    return {
      currentQuestion: 1,
      currentAnswers: [],
      answers: {},
      currentAnswer: null,
      loading: true,
      questions: []
    }
  },
  async mounted() {
    if(this.$route.query.question) {
      this.currentQuestion = Number(this.$route.query.question)
    }
    await this.loadParams()
    await this.loadTimes('test')

    apiRequest.get(`/test/questions`)
      .then(({ data }) => {
        this.questions = data

        this.questions.forEach((question) => {
          this.answers[question.rid] = question.answerId
        })
        this.loadTestAnswers(this.currentQuestionData.testId)
        this.loading = false
        this.startRecording({ type: 'recordingCamera', examType: 'test' })
        this.startRecording({ type: 'recordingScreen', examType: 'test' })
      })
  },
  beforeDestroy() {
    this.setAnswer()
    this.stopStream('recordingCamera')
    this.stopStream('recordingScreen')
  },
  computed: {
    ...mapStreamGetters(['recordingLoaded']),

    currentQuestionData() {
      return this.questions[this.currentQuestion - 1] || {}
    },
    currentAnswerC: {
      get() {
        return this.answers[this.currentQuestionData.rid]
      },
      set(rid) {
        this.handleAnswer(rid)
      }
    }
  },
  methods: {
    ...mapAttestationActions(['loadParams', 'loadTimes', 'finishExam']),
    ...mapStreamActions({
      startRecording: 'start',
      stopStream: 'stopStream'
    }),
    loadTestAnswers(test_id) {
      apiRequest.get(`/test/answers`, {
          params: {test_id}
        })
        .then(({ data }) => {
          this.currentAnswers = data
        })
        .catch((error) => {
          console.log(error)
        })
    },
    changeQuestion(qPosition) {
      if(this.currentAnswer) {
        this.setAnswer()
          .then(() => {
            this.setQuestion(qPosition)
          })
      } else {
        this.setQuestion(qPosition)
      }
      
    },
    setQuestion(qPosition) {
      this.currentQuestion = qPosition
      this.loadTestAnswers(this.currentQuestionData.testId)
      this.$router.push({ name: 'test', query: { question: this.currentQuestion } })
    },
    prevQuestion() {
      this.changeQuestion(this.currentQuestion - 1)
    },
    nextQuestion() {
      this.changeQuestion(this.currentQuestion + 1)
    },
    handleAnswer(answerId) {
      this.currentAnswer = {
        rid: String(this.currentQuestionData.rid),
        answerId
      }
    },
    setAnswer() {
      this.loading = true
      return new Promise((resolve, reject) => {
        apiRequest.post(`/test/save`, this.currentAnswer)
          .then(() => {
            this.answers[this.currentAnswer.rid] = this.currentAnswer.answerId
            this.currentAnswer = null
            this.loading = false
            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    isAnswered(qPosition) {
      const question = this.questions[qPosition] || {}

      return !!this.answers[question.rid]
    },
    finish() {
      this.loading = true
      this.setAnswer()
      this.finishExam('test')
        .finally(() => {
          this.loading = false
          this.$router.push({ name: 'test-result' })
        })
    },
  }
}
</script>
