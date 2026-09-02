<script setup>
import { ref } from 'vue'
import LandingPage from './pages/LandingPage.vue'
import QuestionIntroPage from './pages/QuestionIntroPage.vue'
import SearchPage from './pages/SearchPage.vue'
import DetailLoadingPage from './pages/DetailLoadingPage.vue'
import DetailPage from './pages/DetailPage.vue'
import ResultPage from './pages/ResultPage.vue'

const page = ref('landing')
</script>

<template>
  <LandingPage
    v-if="page === 'landing'"
    @start="page = 'question'"
  />
  <QuestionIntroPage
    v-else-if="page === 'question'"
    @finish="page = 'search'"
  />
  <SearchPage
    v-else-if="page === 'search'"
    @back="page = 'landing'"
    @open="page = 'detail'"
  />
  <DetailPage
    v-else-if="page === 'detail'"
    @back="page = 'search'"
    @diagnose="page = 'diagnosing'"
  />
  <DetailLoadingPage
    v-else-if="page === 'diagnosing'"
    @done="page = 'result'"
  />
  <ResultPage
    v-else
    @back="page = 'detail'"
    @retry="page = 'question'"
    @open="page = 'detail'"
  />
</template>
