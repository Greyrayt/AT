<template>
  <div class="d-flex align-items-center justify-content-center prepare-page">
    <div class="d-flex flex-column align-items-center justify-content-center prepare-page__access-tab access-tab" v-if="!isStreamActive">
      <div class="camera-tab__no-camera mt-3" v-if="isCameraNotFound">
        <b-alert show variant="danger">
          <b>Камера не найдена.</b>
          <p>Пожалуйста, проверьте работоспособность камеры и перезагрузите страницу.</p>
        </b-alert>
      </div>
      <div class="camera-tab__no-camera mt-3" v-else-if="isPermissionDenied">
        <b-alert show variant="danger">
          <b>Ошибка доступа к камере.</b>
          <p>Пожалуйста, проверьте доступ сайта к камере и перезагрузите страницу.</p>
        </b-alert>
      </div>
      <div class="camera-tab__no-camera mt-3" v-else-if="isNeedReload">
        <b-alert show variant="danger">
          <b>Непредвиденная ошибка.</b>
          <p>Пожалуйста, перезагрузите страницу.</p>
        </b-alert>
      </div>
      <template v-else>
        <div class="access-tab__info">
          <p>Доступ к экзамену предоставляется только при условии, <br> если у экзаменуемого включены микрофон, камера и начата трансляция всего экрана.</p>
          <p>Приступая к экзамену, экзаменуемый соглашается с обработкой его персональных данных, <br>в том числе с записью трансляции рабочего стола и изображения с видеокамеры, а также их хранением.</p>
          <p>После подтверждения куратора вы сможете приступить к экзамену.</p>
        </div>
        <b-button
          class="access-tab__button"
          variant="primary"
          size="lg"
          @click="start"
          :disabled="!(isPluginLoaded('camera') || isPluginLoaded('screen'))"
        >
          Проверка камеры
        </b-button>
      </template>

    </div>
    <div class="d-flex flex-column justify-content-center align-items-center prepare-page__camera-tab camera-tab" v-else>
      <div class="camera-tab__selector mt-3" v-if="camerasList.length > 0">
        <b-form-select class="camera-tab__select" v-model="currentCameraId">
          <b-form-select-option
            v-for="camera in camerasList"
            :key="camera.deviceId"
            :value="camera.deviceId"
          >
            {{ camera.label }}
          </b-form-select-option>
        </b-form-select>
      </div>
      <div class="d-flex align-items-center justify-content-center camera-tab__viewer">
        <video class="camera-tab__viewer-video" autoplay :srcObject.prop="stream" v-if="stream"></video>
        <img
          v-else
          class="camera-tab__viewer-icon"
          src="../../assets/images/camera-icon.svg"
        />
      </div>
      <div class="d-flex flex-column align-items-center justify-content-center camera-tab__submit">
        <b-button
          class="btn--classic camera-tab__submit-button"
          variant="primary"
          size="lg"
          :disabled="isCameraSubmited"
          @click="setCamera"
        >
          Далее
        </b-button>
        <span
          class="camera-tab__submit-text"
          v-show="isCameraSubmited"
        >
          Ожидайте подтверждение куратора
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import Events from "../../components/websockets/events"
import { createNamespacedHelpers } from 'vuex'
const { mapGetters: mapStreamGetters, mapMutations: mapStreamMutations, mapActions: mapStreamActions } = createNamespacedHelpers('stream')
const { mapActions: mapAuthActions, mapGetters: mapAuthGetters } = createNamespacedHelpers('auth')
export default {
  data() {
    return {

    }
  },
  computed: {
    ...mapStreamGetters({
      camerasList: 'camerasList',
      stream: 'streamData',
      isStreamActive: 'isActive',
      selectedCamera: 'selectedCamera',
      isCameraSubmited: 'isCameraSubmited',
      jsep: 'jsep',
      completedRoom: 'completedRoom',
      isPluginLoaded: 'isPluginLoaded',
      isPermissionDenied: 'isPermissionDenied',
      isCameraNotFound: 'isCameraNotFound',
      isNeedReload: 'isNeedReload'
    }),
    ...mapAuthGetters({
      hasAccess: 'hasAccess'
    }),
    currentCameraId: {
      get() {
        return this.selectedCamera
      },
      set(deviceId) {
        this.selectCamera({deviceId})
      }
    }
  },
  methods: {
    ...mapStreamMutations({
      selectCamera: 'SET_STREAM_LIST_SELECTED',
      cameraConfirm: 'SET_CAMERA_STATUS'
    }),
    ...mapStreamActions({
      initStream: 'init',
      startStream: 'start',
      selectCamera: 'selectCamera',
      setRooms: 'setRooms'
    }),
    ...mapAuthActions({
      checkSessionStatus: 'checkSessionStatus'
    }),

    updatSessionStatus() {
      this.checkSessionStatus()
        .then(() => {
          if(this.hasAccess) {
            this.$router.push({ name: 'choose-exam' })
          }
        })
    },

    setCamera() {
      this.selectCamera({ deviceId: this.currentCameraId, save: true })
      this.setRooms({})
      this.cameraConfirm(true)
    },
    start() {
      this.startStream({ type: 'camera' })
        .then(() => {
          return this.startStream({ type: 'screen' })
        })
    }
  },
  mounted() {
    this.initStream()
    this.updatSessionStatus()
    this.$eventBus.$on(Events.ACTIVATE_EXAM, this.updatSessionStatus)
  }
}
</script>

<style lang="scss" scoped>
.prepare-page {
  height: 100%;
}

.access-tab {
  &__info {
    text-align: center;
    margin-bottom: 30px;
    font-size: 18px;
  }
}

.camera-tab {
  &__selector {
    width: 70%;
    margin-bottom: 15px;
  }
  &__select {
    width: 100%;
  }

  &__viewer {
    width: 600px;
    min-height: 370px;
    background-color: #333333;
    margin-bottom: 15px;

    &-icon {
      width: 124px;
    }
    &-video {
      width: 100%;
      height: 100%;
    }
  }

  &__submit {
    &-button {
      width: 260px;
    }
    &-text {
      font-size: 18px;
      color: $black;
      margin-bottom: 10px;
    }
  }
}
</style>
