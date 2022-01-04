<template>
  <div class="auditor-exams-list-page">
    <b-container fluid class="d-flex flex-column exams-list">
      <b-row class="exams-list__tabs-wrapper">
        <b-col class="exams-list__tabs-col">
          <b-tabs class="exams-list__tabs">
            <b-tab @click="changeTab('current')" title="Текущий экзамен" :active="$route.name === 'auditor-current-exams'" />
            <b-tab @click="changeTab('completed')" title="Прошедшие экзамены" :active="$route.name === 'auditor-completed-exams'" />
          </b-tabs>
        </b-col>
      </b-row>
      <b-row class="exams-list__content-wrapper">
        <b-col class="exams-list__content-col">
          <router-view></router-view>
        </b-col>
      </b-row>
    </b-container>

  </div>
</template>

<script>
export default {
  methods: {
    changeTab(tab) {
      this.$router.push({ name: `auditor-${tab}-exams` })
    }
  }
}
</script>

<style lang="scss" scoped>
.auditor-exams-list-page {
  height: 100%;
  padding: 60px 0;
}
.exams-list {
  height: 100%;
  &__content {
    &-wrapper {
      flex: 1;
    }
  }
}
</style>
