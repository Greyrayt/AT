<template>
  <div class="d-flex flex-column justify-content-between  exam-result-page">
    <div class="exam-result-page__top">
      Письменный экзамен завершен.
      <br>
      Протокол выполнения письменного экзамена Вы получите на свою электронную почту.
    </div>
    <div class="d-flex justify-content-end exam-result-page__bottom">
      <b-button :to="{ name: 'home' }" variant="primary" class="btn--classic" size="lg">На главную</b-button>
    </div>
  </div>
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>
.exam-result-page {
  padding: 30px 0 60px;
  height: 100%;
  &__top {
    font-size: 18px;
    font-weight: 700;
    color: $black;
  }

  &__bottom {

  }
}
</style>
