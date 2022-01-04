<template>
  <div class="audit-page">
    <b-container>
      <b-row>
        <b-col md="4" v-for="exam in auditExams" :key="exam.rid">
          <div class="d-flex flex-column audit">
            <div class="audit__top">
              <div class="d-flex audit-stream">
                <div class="audit-stream__element audit-stream__camera">
                  <video class="audit-stream__video" autoplay :srcObject.prop="stream(exam.rid).camera.media" v-if="stream(exam.rid).camera.media"></video>
                  <img v-else class="audit-stream__cover" src="../../../assets/images/camera-audit.jpg" alt="">
                </div>
                <div class="audit-stream__element audit-stream__desktop">
                  <video class="audit-stream__video" autoplay :srcObject.prop="stream(exam.rid).screen.media" v-if="stream(exam.rid).screen.media"></video>
                  <img v-else class="audit-stream__cover" src="../../../assets/images/desktop.jpg" alt="">
                </div>
              </div>
            </div>
            <div class="audit__bottom audit-info">
              <div class="audit-info__title">
                <router-link :to="{ name: 'auditor-audit-exam', params: { agentExamId: exam.rid } }">
                  {{ exam.agentFIO }}
                </router-link>
              </div>
              <div class="audit-info__subtitle">{{ exam.examType }}</div>
              <div class="audit-info__status audit-info__status--green">{{ exam.stateName }}</div>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-container>
      <b-row>
        <b-col>
          <div class="d-flex justify-content-end">
            <b-button :to="{ name: 'auditor-exams-list' }" variant="danger" size="lg">Завершить аудит</b-button>
          </div>
        </b-col>
      </b-row>
    </b-container>

  </div>
</template>

<script>
import Events from "../../../components/websockets/events"
import { createNamespacedHelpers } from 'vuex'
import { apiRequest } from '../../../utils/apiRequest'

const { mapGetters: mapStreamsGetters, mapActions: mapStreamsActions } = createNamespacedHelpers('auditorStreams')
export default {
  data() {
    return {
      loading: true,
      rooms: {},
      currentExams: []
    }
  },
  computed: {
    ...mapStreamsGetters(['streams', 'stream']),
    auditExams() {
      const { exams } = this.$route.query || {}
      return this.currentExams.filter((exam) => exams.includes(exam.rid))
    }
  },
  methods: {
    ...mapStreamsActions(['initAudit','startStreams', 'resetStreams']),
    loadCurrentExams() {
      return new Promise((resolve, reject) => {
        apiRequest
          .get('/auditor/exams/active')
          .then((result) => {
            this.currentExams = result.data

            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    onSocketListReload() {
      this.loading = true
      this.loadCurrentExams()
      .then(() => {
        this.loading = false
        this.auditExams.forEach((exam) => {
          if(this.rooms[exam.rid] !== exam.rtcSession) {
            this.rooms[exam.rid] = exam.rtcSession
            this.startStreams([exam])
          }
        })
      })
    }
  },
  mounted() {
    this.initAudit()
    this.loadCurrentExams()
      .then(() => {
        this.auditExams.forEach((exam) => {
          if(this.rooms[exam.rid] !== exam.rtcSession) {
            this.rooms[exam.rid] = exam.rtcSession
            this.startStreams([exam])
          }
        })
        this.$eventBus.$on(Events.USERLISTRELOAD, this.onSocketListReload)
      })
  }
}
</script>

<style lang="scss" scoped>
.audit {
  margin-bottom: 40px;
  &-page {
    padding: 60px 0;
  }
  &-stream {
    &__element {
      flex: 1;
    }
    &__cover {
      width: 100%;
    }
    &__video {
      width: 100%;
      height: 100%;
    }
  }
  &-info {
    &__status {
      &--green {
        color: $green;
      }
    }
  }
}
</style>
