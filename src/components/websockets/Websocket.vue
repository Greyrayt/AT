<template>
</template>

<script>
import Actions from './actions.js';

export default {
  name: "Websocket",
  props: {
    token: String
  },
  data() {
    return {
      /** @type WebSocket */
      socket: null
    }
  },
  mounted() {
    this.socketConnect();
    this.$eventBus.$on(Actions.SEND_MESSAGE, this.submitMessage);
  },
  methods: {
    socketConnect: function () {
      if (this.socket) {
        return;
      }

      const socket = new WebSocket(`wss://${process.env.VUE_APP_WSS}/attestation/wss?token=${this.token}`);
      socket.onmessage = this.onSocketMessage;

      socket.onclose = (event) => {
        this.socket = null;
        this.socketConnect();
      };

      socket.onopen = () => {
        this.socket = socket;
        this.$eventBus.$emit(Actions.SOCKET_OPEN);
      };

      socket.onerror = function (error) {
        console.log(error);
      };
    },

    onSocketMessage: function (/** SocketMessage */event) {
      try {
        /** @type {ResponseMessage} */
        const result = JSON.parse(event.data)
        this.$eventBus.$emit(result.event, result);
      } catch (e) {
        console.log("Ошибка парсинга сообщения: " + event.data);
      }
    },

    submitMessage(/** RequestMessage */data) {
      if (!this.socket) {
        console.log("Ошибка отправки");
        return;
      }

      if (!data) {
        data = {};
      }

      let submitMessage = Object.assign({token: this.token}, data);

      this.socket.send(JSON.stringify(submitMessage));
    }
  }
}

/**
 * @typedef {Object} SocketMessage
 * @property {String} data
 */

/**
 * @typedef {Object} ResponseMessage
 * @property {String} event
 * @property {String} examId
 */

/**
 * @typedef {Object} RequestMessage
 * @property {String} event
 * @property {String} [examId]
 * @property {String} [messageText]
 */
</script>

<style scoped>

</style>
