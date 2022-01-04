<template>
  <div class="base-layout">
    <Header class="base-layout__header" />
    <div class="container-fluid base-layout__content base-layout-content">
      <div class="row base-layout-content__row">
        <div class="col-9 base-layout-content__main">
          <router-view></router-view>
        </div>
        <div class="col-3 base-layout-content__sidebar">
          <Sidebar />
        </div>
      </div>
    </div>
    <div class="base-layout__loader" v-if="!isJanusLoaded">
      <b-spinner></b-spinner>
    </div>
    <websocket v-if="isAuthorized" :token="valideToken" />
    <b-modal
      id="terminate"
      ref="terminate"
      ok-only
      ok-title="Понял"
      @ok="$bvModal.hide('terminate')"
      title="Внимание!"
    >
      <div class="d-block text-center">
        <h3>Экзамен принудительно завершен в связи с нарушением порядка проведения экзамена. <br> Копия протокола будет направлена вам по электронной почте.</h3>
      </div>
    </b-modal>
  </div>
</template>

<script>
import Header from '../../components/layouts/Header'
import Sidebar from '../../components/layouts/Sidebar'
import Websocket from "../../components/websockets/Websocket"
import Actions from "../../components/websockets/actions"
import Events from "../../components/websockets/events"

import { createNamespacedHelpers } from 'vuex'
const { mapGetters: mapAuthGetters } = createNamespacedHelpers('auth')
const { mapGetters: mapStreamGetters } = createNamespacedHelpers('stream')

export default {
  components: {
    Header, Sidebar, Websocket
  },

  data() {
    return {
      timeout: null
    }
  },

  computed: {
    ...mapAuthGetters(['valideToken', 'isAuthorized']),
    ...mapStreamGetters(['isJanusLoaded'])
  },

  methods: {
    keepAlive() {
      this.$eventBus.$emit(Actions.SEND_MESSAGE, {event: Events.KEEPALIVE});
      this.timeout = setTimeout(this.keepAlive, 10000);
    },
    terminate() {
      this.$router.push({ name: 'choose-exam' })
      this.$bvModal.show('terminate')
    }
  },

  mounted() {
    this.$eventBus.$on(Actions.SOCKET_OPEN, this.keepAlive);
    this.$eventBus.$on(Events.TERMINATE_EXAM, this.terminate)
  }
}
</script>

<style lang="scss" scoped>
.base-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;

  &__loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__content {
    flex: 1;
  }

  &-content {
    &__row {
      height: 100%;
    }

    &__sidebar {
      padding-right: 0;
    }
  }
}
</style>
