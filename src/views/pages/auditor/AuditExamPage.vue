<template>
  <div class="audit-exam-page">
    <b-container fluid>
      <b-row>
        <b-col class="d-flex justify-content-end mt-3 mb-3">
          <b-button @click="$router.go(-1)">Назад</b-button>
        </b-col>
      </b-row>
      <b-row>
        <b-col lg="6"><video autoplay :srcObject.prop="stream(currentExam.rid).camera.media" v-if="stream(currentExam.rid).camera.media"></video></b-col>
        <b-col lg="6"><video autoplay :srcObject.prop="stream(currentExam.rid).screen.media" v-if="stream(currentExam.rid).screen.media"></video></b-col>
      </b-row>
      <b-row>
        <b-col class="mt-2 mb-2">
          <b-button @click="activateExam(currentExam.agentExamID)" variant="primary" v-if="currentExam.stateCode === 1">Допустить</b-button>
          <b-button @click="terminateExam(currentExam.agentExamID)" variant="danger" v-if="currentExam.stateCode === 3">Прервать</b-button>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <div class="sidebar__chat chat">
            <div class="chat__title">Напишите экзаменуемому</div>
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
            <hr class="chat__breakline">
            <div class="chat__input-wrapper">
              <b-form-textarea
                placeholder="Введите сообщение"
                maxlength="20000"
                @keydown.enter="submitMessage"
                class="chat__input"
              ></b-form-textarea>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Events from "../../../components/websockets/events"
import Actions from "../../../components/websockets/actions"
import { createNamespacedHelpers } from 'vuex'

import { apiRequest } from '../../../utils/apiRequest'

const { mapGetters: mapStreamsGetters, mapActions: mapStreamsActions } = createNamespacedHelpers('auditorStreams')
export default {
  data() {
    return {
      history: [],
      loading: true,
      rooms: '',
      currentExam: {}
    }
  },
  computed: {
    ...mapStreamsGetters(['streams', 'stream']),
  },
  methods: {
    ...mapStreamsActions(['initAudit','startStreams', 'resetStreams']),
    loadCurrentExam() {
      return new Promise((resolve, reject) => {
        apiRequest.get(`/auditor/exam/active/${this.$route.params.agentExamId}`)
          .then(({ data }) => {
            this.currentExam = data
            resolve()
          })
          .catch((error) => {
            console.log(error)
          })
      })

    },
    activateExam(aEID) {
      apiRequest.post(`/auditor/exam/activate/${aEID}`)
    },
    terminateExam(aEID) {
      apiRequest.post(`/auditor/exam/terminate/${aEID}`)
    },
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
    onSocketListReload() {
      this.loading = true
      this.loadCurrentExam()
      .then(() => {
        this.loading = false
        if(this.rooms !== this.currentExam.rtcSession) {
          this.rooms = this.currentExam.rtcSession
          this.resetStreams()
          if(this.currentExam.rtcSession) {
          this.startStreams([this.currentExam])
          }
        }

      })
    },
    submitMessage(event) {
      event.preventDefault();

      this.$eventBus.$emit(
        Actions.SEND_MESSAGE,
        {event: Events.CHAT_ADD_MESSAGE, messageText: event.target.value, examId: this.currentExam.agentExamID}
      );
      event.target.value = '';
    },
    getHistory: function () {
      apiRequest.get('/chat/history', {
        params: {
          exam_id: this.currentExam.agentExamID
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
  },
  mounted() {
    this.initAudit()
    this.loadCurrentExam()
      .then(() => {
        this.getHistory()
        this.$eventBus.$on(Events.CHAT_ADD_MESSAGE, this.onSocketMessage);
        this.$eventBus.$on(Events.USERLISTRELOAD, this.onSocketListReload);
        if(this.rooms !== this.currentExam.rtcSession) {
          this.rooms = this.currentExam.rtcSession
          this.resetStreams()
          if(this.currentExam.rtcSession) {
          this.startStreams([this.currentExam])
          }
        }
      })
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
</style>
