<template>
  <div class="d-flex flex-column justify-content-between completed-exams-page">
    <b-container fluid class="completed-exams-page__top">
      <b-row align-h="center" class="mt-5 mb-5">
        <b-col md="4">
          <b-form-select v-model="currentPeriod">
            <b-form-select-option
              v-for="period in periods"
              :key="period.rid"
              :value="period.rid"
            >
              {{ period.examPeriod }}
            </b-form-select-option>
          </b-form-select>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-table striped hover :fields="fields" :items="exams">
            <template #cell(view)="data">
              <div class="d-flex align-items-center justify-content-center play-button__wrapper">
                  <b-button
                    :to="{ name: 'auditor-watch-exam', params: { rid: data.item.rid } }"
                    variant="primary"
                    class="d-flex play-button"
                  >
                    <img src="../../../assets/images/play.svg" class="play-button__icon" alt="">
                  </b-button>
              </div>
            </template>
            <template #cell(examDate)="data">
              {{ dateFormatted(data.item.examDate) }}
            </template>
          </b-table>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import { apiRequest } from '../../../utils/apiRequest'

export default {
  data() {
    return {
      periods: [],
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
          key: 'examDate',
          label: 'Дата экзамена',
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
          key: 'examTime',
          label: 'Продолжительность экзамена',
        },
        {
          key: 'examType',
          label: 'Тип экзамена',
        },
        {
          key: 'examResult',
          label: 'Результат',
        },
        {
          key: 'view',
          label: 'Просмотр',
        },
      ],
      checkedValues: [],
      currentPeriod: undefined
    }
  },
  methods: {
    loadPeriods() {
      apiRequest.get('/auditor/exams/periods')
        .then((result) => {
          this.periods = result.data
          this.currentPeriod = this.periods[0].rid
        })
        .catch((error) => {
          console.log(error)
        })
    },
    dateFormatted(dateString) {
      const date = new Date(dateString)
      return `${String(date.getDate()).padStart(2, '0')}.${date.getMonth()}.${date.getFullYear()}`
    }
  },
  watch: {
    currentPeriod(period) {
      apiRequest.get(`/auditor/exams/inactive/${period}`)
        .then((result) => {
          this.exams = result.data
        })
        .catch((error) => {
          console.log(error)
        })
    }
  },
  mounted() {
    this.loadPeriods()
  }
}
</script>

<style lang="scss" scoped>
.completed-exams-page {
  height: 100%;
}

.play-button {
  padding: 8px 25px;
  border-radius: 15px;

  &__wrapper {
    height: 100%;
  }
}
</style>
