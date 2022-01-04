<template>
  <div class="sidebar">
    <div class="d-flex justify-content-center align-items-center sidebar__camera">
      <video class="sidebar__camera-video" autoplay :srcObject.prop="stream" v-if="isStreamActive"></video>
      <img class="sidebar__camera-icon" v-else src="../../assets/images/camera-icon-square.svg" alt="">
    </div>
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
  </div>
</template>

<script>
import Events from "../websockets/events"
import Actions from "../websockets/actions"

import { apiRequest } from '../../utils/apiRequest'

import { createNamespacedHelpers } from 'vuex'
const { mapGetters: mapStreamGetters } = createNamespacedHelpers('stream')

export default {
  data() {
    return {
      history: []
    }
  },
  computed: {
    ...mapStreamGetters({
      isStreamActive: 'isActive',
      stream: 'streamData'
    }),
  },
  mounted() {
    this.$eventBus.$on(Actions.SOCKET_OPEN, this.getHistory);
    this.$eventBus.$on(Events.CHAT_ADD_MESSAGE, this.onSocketMessage);
  },
  methods: {
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
        {event: Events.CHAT_ADD_MESSAGE, messageText: event.target.value}
      );
      event.target.value = '';
    },
    getHistory: function () {
      apiRequest.get('/chat/history')
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
    getOwnerClass: function (/** ChatMessage */ item) {
      return item.owner ? 'me' : '';
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);

  &__camera {
    background-color: $black;
    min-height: 150px;
    &-icon {
      width: 124px;
    }
    &-video {
      width: 100%;
      height: 100%;;
    }
  }

  &__chat {
    flex: 1;
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
