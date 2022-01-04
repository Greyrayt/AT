<template>
  <div class="d-flex flex-column justify-content-between current-exams-page">
    <b-container fluid class="current-exams-page__top">
      <b-row class="mt-4 mb-3">
        <b-col>
          <h1>Список экзаменуемых</h1>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-table striped hover :fields="fields" :items="exams">
            <template #cell(audit)="data">
              <b-checkbox v-model="checkedValues" :value="data.item.rid"></b-checkbox>
            </template>
            <template #cell(agentFIO)="data">
              <router-link :to="{ name: 'auditor-audit-exam', params: { agentExamId: data.item.rid } }">{{ data.item.agentFIO }}</router-link>
              <b-badge class="ml-2" v-if="hasNewMessage(data.item.agentExamID)" variant="danger">+</b-badge>
            </template>
          </b-table>
        </b-col>
      </b-row>
    </b-container>
    <div class="d-flex justify-content-end current-exams-page__bottom">
      <b-button
        variant="primary"
        size="lg"
        v-show="checkedValues.length"
        :to="{ name: 'auditor-audit', query: { exams: checkedValues } }"
      >
        Начать аудит
      </b-button>
    </div>
  </div>
</template>

<script>
import Events from "../../../components/websockets/events"

import { apiRequest } from '../../../utils/apiRequest'
export default {
  data() {
    return {
      exams: [],
      fields: [
        {
          key: 'agentFIO',
          label: 'ФИО',
        },
        {
          key: 'specialName',
          label: 'Специализация',
        },
        {
          key: 'examType',
          label: 'Тип экзамена',
        },
        {
          key: 'examTime',
          label: 'Запланированное время',
        },
        {
          key: 'startExamTime',
          label: 'Время начала',
        },
        {
          key: 'finishExamTime',
          label: 'Время окончания',
        },
        {
          key: 'stateName',
          label: 'Статус',
        },
        {
          key: 'examResult',
          label: 'Результат',
        },
        {
          key: 'audit',
          label: 'Аудировать',
        },
      ],
      checkedValues: [],
      newMessages: []
    }
  },
  methods: {
    loadCurrentExams() {
      return new Promise((resolve, reject) => {
        apiRequest
          .get('/auditor/exams/active')
          .then((result) => {
            this.exams = result.data

            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    onSocketListReload() {
      this.loadCurrentExams()
    },
    onSocketNewMessage({ examId }) {
      this.newMessages.push(examId)
    },
    hasNewMessage(examId) {
      return this.newMessages.some((message) => message === examId)
    }
  },
  mounted() {
    this.loadCurrentExams()
    this.$eventBus.$on(Events.USERLISTRELOAD, this.onSocketListReload);
    this.$eventBus.$on(Events.  CHAT_ADD_MESSAGE, this.onSocketNewMessage);
  }
}
</script>

<style lang="scss" scoped>
.current-exams-page {
  height: 100%;
}
</style>
