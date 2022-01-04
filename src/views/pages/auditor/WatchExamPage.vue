<template>
  <div class="audit-exam-page">
    <b-container fluid>
      <b-col class="d-flex justify-content-end mt-3 mb-3">
        <b-button @click="$router.go(-1)">Назад</b-button>
      </b-col>
      <b-row class="mt-3 mb-3">
        <b-col>
          <b-form-select v-model="currentRecord">
            <b-form-select-option
              v-for="(record, i) in records"
              :key="i"
              :value="i"
            >
              Запись {{ Number(i) + 1 }}
            </b-form-select-option>
          </b-form-select>
        </b-col>
      </b-row>
      <b-row>
        <b-col lg="6">
          <vue-plyr v-if="record.camera" :options="baseSettings" ref="cameraInstance">
            <video :src="record.camera" muted></video>
          </vue-plyr>
          <div v-else class="no-source">
            <div class="no-source__wrapper">
              Нет данных
            </div>
          </div>
        </b-col>
        <b-col lg="6">
          <vue-plyr v-if="record.screen" :options="baseSettings" ref="screenInstance">
            <video :src="record.screen" muted></video>
          </vue-plyr>
          <div class="no-source" v-else>
            <div class="no-source__wrapper">
              Нет данных
            </div>
          </div>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <vue-plyr :options="controllerSettings" ref="controlInstance">
            <audio :src="record.camera || record.screen"></audio>
          </vue-plyr>  
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <div class="sidebar__chat chat">
            <div class="chat__title">Напишите аудитору</div>
            <div class="chat__outer-wrapper" ref="chatWrapper">
              <div class="chat__wrapper">
                <div
                  v-for="{ rid, owner, messageText } in history"
                  :key="rid"
                  class="chat__message"
                  :class="{ 'chat__message--me': owner }"
                >
                  {{ messageText }}
                </div>
              </div>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-modal id="in-proccess" ref="in-proccess" ok-only ok-title="Понятно" @ok="$bvModal.hide('in-proccess')" title="Внимание!">
      <div class="d-block text-center">
        <h3>Видео ещё обрабатывается.</h3>
        <p>Обновите странице через несколько минут.</p>
      </div>
    </b-modal>
    <b-modal id="not-found" ref="not-found" ok-only ok-title="Понятно" @ok="goToWatch" @hide="goToWatch" title="Внимание!">
      <div class="d-block text-center">
        <h3>Экзамен не найден!</h3>
        <p>Вы будете возвращены на страницу записей.</p>
      </div>
    </b-modal>
  </div>
</template>

<script>
import Events from "../../../components/websockets/events"
import Actions from "../../../components/websockets/actions"

import VuePlyr from 'vue-plyr'
import 'vue-plyr/dist/vue-plyr.css'

import { apiRequest } from '../../../utils/apiRequest'
import axios from 'axios'

import { createNamespacedHelpers } from 'vuex'
const { mapActions: mapAuthActions } = createNamespacedHelpers('auditorAuth')
export default {
  components: {
    VuePlyr
  },
  data() {
    return {
      history: [],
      loading: true,
      exam: {},
      recordPos: 0,
      records: {},
      baseSettings: {
        controls: [],
        clickToPlay: false,
        disableContextMenu: true,
        keyboard: { focused: false, global: false },
        tooltips: { controls: false, seek: false },
        fullscreen: { enabled: false, fallback: true, iosNative: false, container: null },
        muted: true
      },
      controllerSettings: {
        controls: ['play', 'progress', 'current-time', 'mute', 'volume'],
      }
    }
  },
  computed: {
    currentRecord: {
      set(i) {
        this.recordPos = i
        this.stopRecord()
      },
      get() {
        return this.recordPos
      }
    },
    record() {
      return this.records[this.recordPos] || {}
    }
  },
  methods: {
    ...mapAuthActions(['loadExam']),
    onSocketMessage: function (/** ResponseMessage */event) {
      this.history.push(event.message);
      setTimeout(() => {
        this.$refs.chatWrapper.scroll({
          top: this.$refs.chatWrapper.scrollHeight,
          left: 0,
          behavior: 'smooth'
        })
      }, 300)

    },
    submitMessage(event) {
      event.preventDefault();

      this.$eventBus.$emit(
        Actions.SEND_MESSAGE,
        {event: Events.CHAT_ADD_MESSAGE, messageText: event.target.value, examId: this.exam.agentExamID}
      );
      event.target.value = '';
    },
    getHistory: function () {
      apiRequest.get('/chat/history', {
        params: {
          exam_id: this.exam.agentExamID
        }
      })
        .then((response) => {
          this.history = response.data;
          setTimeout(() => {
            this.$refs.chatWrapper.scroll({
              top: this.$refs.chatWrapper.scrollHeight,
              left: 0,
              behavior: 'smooth'
            })
          }, 500)

        })
        .catch((event) => {
          console.log(event);
        });
    },
    seekRecord() {
      if(this.$refs.cameraInstance && this.$refs.screenInstance) {
        const currentTime = this.$refs.controlInstance.player.currentTime
        this.$refs.cameraInstance.player.currentTime = currentTime
        this.$refs.screenInstance.player.currentTime = currentTime
      }
    },
    stopRecord() {
      if(this.$refs.cameraInstance && this.$refs.screenInstance) {
        this.$refs.cameraInstance.player.pause()
        this.$refs.screenInstance.player.pause()
      }
    },
    playRecord() {
      this.seekRecord()
      if(this.$refs.cameraInstance && this.$refs.screenInstance) {
        this.$refs.cameraInstance.player.play()
        this.$refs.screenInstance.player.play()
      }
    },
    goToWatch() {
      this.$router.push({ name: 'auditor-completed-exams' })
    }
  },
  mounted() {
    apiRequest.get(`/auditor/exam/inactive/${this.$route.params.rid}`)
      .then(({ data }) => {
        if(data.resultCode === 0) {
          this.$bvModal.show('not-found')
          return
        }
        this.exam = data
        this.getHistory()
        this.$eventBus.$on(Events.CHAT_ADD_MESSAGE, this.onSocketMessage);
        axios.get(`${process.env.VUE_APP_RECORDS_API}/records/${this.exam.agentExamID}`)
          .then(({ data }) => {
            const type = this.exam.examType === 'Электронное тестирование' ? 'testVideo' : 'examVideo'
            data[type].forEach((video) => {
              let pos = 0
              const videoPos = video.match(/\/(\d)_/)

              if(videoPos) {
                pos = Number(videoPos[1])
              }
              if(!this.records[pos]) {
                this.records = {
                  ...this.records,
                  [pos]: {
                    camera: null,
                    screen: null
                  }
                }
              }

              if(video.match('_s.')) {
                this.records[pos].camera = video
              } else {
                this.records[pos].screen = video
              }
            })
            if(Object.keys(this.records).length <= 0) {
              this.$bvModal.show('in-proccess')
            }
          })
          .finally(() => {
            this.$refs.controlInstance.player
              .on('play', this.playRecord)
            this.$refs.controlInstance.player
              .on('pause', this.stopRecord)
            this.$refs.controlInstance.player
              .on('seeked', this.seekRecord)
          })
      })
  },
  beforeDestroy() {
    this.stopRecord()
  }
}
</script>

<style lang="scss" scoped>
.audit-exam-page {
  video {
    background-color: #333333;
    width: 100%;
    height: 100%;
  }
}

.chat {
  background-color: $grey-light;
  display: flex;
  flex-direction: column;

  &__title {
    background-color: $blue-dark;
    color: $white;
    padding: 5px 19px;
    text-align: center;
    font-size: 18px;
  }

  &__outer-wrapper {
    flex: 1;
    overflow-y: scroll;
    max-height: 400px;
  }

  &__wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  &__message {
    align-self: flex-start;
    background-color: $orange-light;
    padding: 5px 10px;
    border-radius: 10px;
    margin-bottom: 20px;
    margin: 0 10px 20px;
    color: $black;

    &--me {
      background-color: $blue-light;
      align-self: flex-end;
    }
  }

  &__breakline {
    width: 100%;
    padding: 0 11px;
    box-sizing: border-box;
  }

  &__input {
    width: 100%;
    background-color: transparent;
    border: none;
    padding: 14px 15px;
    outline: none;
  }
}

.no-source {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: $black;
  &__wrapper {
    color: $white;
  }
}
</style>
