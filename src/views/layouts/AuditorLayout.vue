<template>
  <div class="auditor-layout">
    <AuditorHeader class="auditor-layout__header" />
    <div class="container-fluid auditor-layout__content auditor-layout-content">
      <div class="row auditor-layout-content__row">
        <div class="col-12 auditor-layout-content__main">
          <router-view></router-view>
        </div>
      </div>
    </div>
    <websocket v-if="isAuthorized" :token="valideToken" />
  </div>
</template>

<script>
import AuditorHeader from '../../components/auditor/layouts/AuditorHeader'
import Websocket from "../../components/websockets/Websocket"

import { createNamespacedHelpers } from 'vuex'
const { mapGetters: mapAuthGetters } = createNamespacedHelpers('auditorAuth')

export default {
  components: {
    AuditorHeader,
    Websocket
  },
  computed: {
    ...mapAuthGetters(['valideToken', 'isAuthorized'])
  }
}
</script>

<style lang="scss" scoped>
.auditor-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;

  &__header {

  }

  &__content {
    flex: 1;
  }

  &-content {
    &__row {
      height: 100%;
    }
  }
}
</style>
