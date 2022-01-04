<template>
  <div class="timer" v-if="clockUpdateInterval">
    <div class="timer__title">Оставшееся время</div>
    <div class="timer__countdown" :class="{ red: less5Minutes }">{{ clock.hours }}:{{ clock.minutes }}:{{ clock.seconds }}</div>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'
const { mapGetters: mapAttestationGetters, mapActions: mapAttestationActions } = createNamespacedHelpers('attestation')
export default {
  data() {
    return {
      clock: {
        minutes: 0,
        seconds: 0,
        hours: 0
      },
      clockUpdateInterval: undefined,
      less5Minutes: false
    }
  },
  mounted() {
    if(this.examTimeData.end) {
      this.updateCloak()
      this.clockUpdateInterval = setInterval(this.updateCloak, 1000)
    } else {
      clearInterval(this.clockUpdateInterval);
      this.clockUpdateInterval = null
    }
  },
  computed: {
    ...mapAttestationGetters(['testTime', 'examTime']),

    examType(){
      switch(this.$route.name) {
        case 'test':
          return 'test';
        case 'exam':
          return 'exam';
        default:
          return false
      }
    },

    examTimeData() {
      switch(this.examType) {
        case 'test':
          return this.testTime ;
        case 'exam':
          return this.examTime;
        default:
          return {}
      }
    },
  },
  watch: {
    'examTimeData.end'(newVal) {
      if(newVal) {
        this.updateCloak()
        this.clockUpdateInterval = setInterval(this.updateCloak, 1000)
      } else {
        clearInterval(this.clockUpdateInterval);
        this.clockUpdateInterval = null
      }
    }
  },
  methods: {
    ...mapAttestationActions(['finishExam']),
    updateCloak() {
      const diff = this.examTimeData.end - Date.parse(new Date())
      if(diff <= (5 * 60 * 1000)) {
        this.less5Minutes = true
      } else {
        this.less5Minutes = false
      }

      if (diff > 0) {
        this.clock.hours = ('0' + Math.floor((diff / 1000 / 60 / 60) % 60)).slice(-2);
        this.clock.minutes = ('0' + Math.floor((diff / 1000 / 60) % 60)).slice(-2);
        this.clock.seconds = ('0' + Math.floor((diff / 1000) % 60)).slice(-2);
      } else {
        clearInterval(this.clockUpdateInterval);
        this.clockUpdateInterval = null;
        if(this.examType) {
          this.finishExam(this.examType)
            .then(() => {
              this.$router.push({ name: 'home' })
            })
        }

      }
    }
  }
}
</script>

<style lang="scss" scoped>
.timer {
  text-align: center;

  &__title {
    font-size: 18px;
    color: $white;
  }
  &__countdown {
    font-size: 36px;
    color: $white;
    &.red {
      color: red;
    }
  }
}
</style>
