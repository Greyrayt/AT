<template>
  <div class="page exams-page exam-page">
    <b-container class="exams-page__container">
      <b-row class="exams-page__row exams-questions">
        <b-col class="exams-questions__wrapper">
          <b-button
            @click="changeQuestion(i+1)"
            v-for="(question, i) in questions"
            :key="i"
            class="exams-questions__button"
            :class="{ active: currentQuestion === i+1 }"
          >
            {{ i+1 }}
          </b-button>
        </b-col>
      </b-row>
      <b-row class="exams-page__row exams-content">
        <b-col class="exams-content__wrapper">
          <div class="exams-content__title">Вопрос № {{ currentQuestion }}</div>
          <div class="exams-content__question">
            <div class="d-flex justify-content-between align-items-start exams-content__question-title">
              <span>{{ currentQuestionData.questionText }}</span>
            <b-link
              v-if="currentQuestionData.questionFileName"
              class="exams-content__download"
              @click="showFile('/exam/question/file?file_id=' + currentQuestionData.rid, currentQuestionData.questionFileName)">
              {{ currentQuestionData.questionFileName }}
            </b-link>
            </div>
            <b-link
              v-if="currentQuestionData.templateFileName"
              class="exams-content__download"
              :href="fullUrl('/answer/template?file_id=' + currentQuestionData.rid)"
              target="_blank"
            >
              Скачать шаблон бланка <img class="exams-content__download-icon" src="../../assets/images/attachment.svg" alt="">
            </b-link>
          </div>
          <div class="exams-content__textarea-wrapper">
            <b-textarea v-model="questionValue" class="exams-content__textarea" placeholder="Введите ответ здесь"></b-textarea>
            <template v-if="currentQuestionData.templateFileName">
              <div class="d-flex justify-content-between mt-2 exams-content__textarea-filename" v-if="currentQuestionData.agentFileName">
                {{ currentQuestionData.agentFileName }}
                <b-button @click="removeFile" variant="danger">Удалить</b-button>
              </div>
              <b-form-file
                v-else
                v-model="questionAnswerFile"
                :state="Boolean(questionAnswerFile)"
                placeholder="Выберите файл..."
                drop-placeholder="Вставить сюда..."
                @input="setFile"
              ></b-form-file>
            </template>

          </div>
        </b-col>
      </b-row>
      <b-row class="exams-page__row exams-actions">
        <b-col md="4" class="d-flex justify-content-center exams-actions__button-wrapper">
          <b-button block @click="prevQuestion" class="btn--classic exams-actions__button" variant="primary" size="lg" :disabled="currentQuestion <= 1">Предыдущий</b-button>
        </b-col>
        <b-col md="4" class="d-flex justify-content-center exams-actions__button-wrapper">
          <b-button block @click="$bvModal.show('exam-exit')" class="btn--classic exams-actions__button exams-actions__button--finish" variant="primary" size="lg">Завершить экзамен</b-button>
        </b-col>
        <b-col md="4" class="d-flex justify-content-center exams-actions__button-wrapper">
          <b-button block @click="nextQuestion" class="btn--classic exams-actions__button" variant="primary" size="lg" :disabled="currentQuestion >= questions.length">Следующий</b-button>
        </b-col>
      </b-row>
      <b-row class="mt-4">
        <b-col>
          <b-dropdown class="exams-materials" text="Раздаточные материалы" v-if="learnMaterial && learnMaterial.length">
            <b-dropdown-item v-for="material in learnMaterial"
              :key="material.rid"
              @click="showFile('/exam/file?file_id=' + material.rid, material.fileName)"
              placeholder="Открыть"
            >
              {{ material.fileName }}
            </b-dropdown-item>
          </b-dropdown>
        </b-col>

      </b-row>
    </b-container>
    <b-modal
      id="pdf-modal"
      centered
      size="xl"
      ok-only
      ok-title="Закрыть"
      :title="pdfData.title"
      scrollable
      hide-footer
    >
      <pdf
        :src="pdfData.src"
        v-for="page in pdfData.pages"
        :key="page"
        :page="page"
      ></pdf>
    </b-modal>
    <b-modal id="exam-exit" ref="exit" ok-only ok-title="Да" @ok="finish" title="Выход">
      <div class="d-block text-center">
        <h3>Вы действительно хотите завершить экзамен?</h3>
        <p>После завершения вы не сможете вернуться к прохождению экзамена.</p>
      </div>
    </b-modal>
    <div class="spinner" v-if="loading || !recordingLoaded"><b-spinner></b-spinner></div>
  </div>
</template>

<script>
import pdf from 'vue-pdf';
import { createNamespacedHelpers } from 'vuex'
import { apiRequest } from '../../utils/apiRequest'

const { mapActions: mapAttestationActions } = createNamespacedHelpers('attestation')
const { mapGetters: mapStreamGetters, mapActions: mapStreamActions } = createNamespacedHelpers('stream')

import '../../assets/styles/exams.scss'

export default {
  components: {
    pdf
  },
  data() {
    return {
      currentQuestion: 1,
      pdfData: {
        src: '',
        title: '',
        pages: 0
      },
      answers: {},
      answerFiles: {},
      loading: true,
      questions: [],
      learnMaterial: []
    }
  },
  async mounted() {
    if(this.$route.query.question) {
      this.currentQuestion = Number(this.$route.query.question)
    }

    await this.loadParams()
    await this.loadTimes('exam')

    this.loadQuestions('exam')
      .then(() => {
        this.setDefaultAnswers()
        this.loading = false
        this.startRecording({ type: 'recordingCamera', examType: 'exam' })
        this.startRecording({ type: 'recordingScreen', examType: 'exam' })
      })
  },
  beforeDestroy() {
    this.setAnswer()
    this.stopStream('recordingCamera')
    this.stopStream('recordingScreen')
  },
  computed: {
    ...mapStreamGetters(['recordingLoaded']),

    questionAnswerFile: {
      get() {
        return this.answerFiles[this.currentQuestionData.rid]
      },
      set(file) {
        this.answerFiles[this.currentQuestionData.rid] = file
      }
    },

    currentQuestionData() {
      return this.questions[this.currentQuestion - 1] || {}
    },
    questionValue: {
      set(val) {
        this.answers = {
          ...this.answers,
          [this.currentQuestion]: val
        }
      },
      get() {
        return this.answers[this.currentQuestion]
      }
    }
  },
  methods: {
    ...mapAttestationActions(['loadParams', 'loadTimes', 'finishExam']),
    ...mapStreamActions({
      startRecording: 'start',
      stopStream: 'stopStream'
    }),
    loadQuestions() {
      return new Promise((resolve, reject) => {
        apiRequest.get(`/exam/questions`)
          .then(({ data }) => {
            this.questions = data.questions
            this.learnMaterial = data.learnMaterial

            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    changeQuestion(qPosition) {
      if(this.answers[this.currentQuestion]) {
        this.loading = true
        this.setAnswer()
          .then(() => {
            this.loading = false
            this.currentQuestion = qPosition
            this.$router.push({ name: 'exam', query: { question: this.currentQuestion } })
          })
      } else {
        this.currentQuestion = qPosition
        this.$router.push({ name: 'exam', query: { question: this.currentQuestion } })
      }


    },
    prevQuestion() {
      this.changeQuestion(this.currentQuestion - 1)
    },
    nextQuestion() {
      this.changeQuestion(this.currentQuestion + 1)
    },
    finish() {
      this.loading = true
      this.setAnswer()
        .then(() => {
          this.finishExam('exam')
          .finally(() => {
            this.loading = false
            this.$router.push({ name: 'exam-result' })
          })
        })

    },
    setAnswer() {
      return apiRequest.post(`/exam/save`, {
        rid: this.currentQuestionData.rid,
        answerText: this.answers[this.currentQuestion] || ''
      })
    },
    fullUrl(url) {
      return process.env.VUE_APP_API_URL + url
    },
    showFile(url, title) {
      this.pdfData.src = pdf.createLoadingTask(process.env.VUE_APP_API_URL + url);
      this.pdfData.src.promise.then(pdf => {
        this.pdfData.pages = pdf.numPages;
      });

      this.pdfData.title = title;
      this.$bvModal.show('pdf-modal');
    },
    setFile(file) {
      this.loading = true
      const data = new FormData()
      data.append('rid', this.currentQuestionData.rid)
      data.append('fileName', file.name)
      data.append('dataFile', file)

      apiRequest.post('/exam/answer/addFile', data)
        .then(() => {
          this.loadQuestions('exam')
            .then(() => {
              this.setDefaultAnswers()
              this.loading = false
            })
        })
    },
    setDefaultAnswers() {
      this.questions.forEach((question, index) => {
        this.answers[index+1] = question.answerText
      })
    },
    removeFile() {
      this.loading = true
      apiRequest.delete('/exam/answer/removeFile', {
        params: {
          file_id: this.currentQuestionData.agentFileId
        }
      })
        .then(() => {
          this.loadQuestions('exam')
            .then(() => {
              this.setDefaultAnswers()
              this.loading = false
            })
        })
    }
  }
}
</script>
