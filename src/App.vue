<script setup>
import { ref } from "vue";
import LandingPage from "./pages/LandingPage.vue";
import QuestionIntroPage from "./pages/QuestionIntroPage.vue";
import SearchPage from "./pages/SearchPage.vue";
import DetailLoadingPage from "./pages/DetailLoadingPage.vue";
import DetailPage from "./pages/DetailPage.vue";
import ResultPage from "./pages/ResultPage.vue";

const page = ref("landing");
// S3(검색)에서 고른 실제 종목 코드. S4/S6 화면에서 챗봇에 그대로 넘긴다.
const selectedProductCode = ref(null);
</script>

<template>
  <LandingPage v-if="page === 'landing'" @start="page = 'question'" />
  <QuestionIntroPage
    v-else-if="page === 'question'"
    @finish="page = 'search'"
  />
  <SearchPage
    v-else-if="page === 'search'"
    @back="page = 'landing'"
    @open="(code) => { selectedProductCode = code; page = 'detail'; }"
  />
  <DetailPage
    v-else-if="page === 'detail'"
    :product-code="selectedProductCode"
    @back="page = 'search'"
    @diagnose="page = 'diagnosing'"
    @retry="page = 'question'"
  />
  <DetailLoadingPage
    v-else-if="page === 'diagnosing'"
    @done="page = 'result'"
  />
  <ResultPage
    v-else
    :product-code="selectedProductCode"
    @back="page = 'detail'"
    @retry="page = 'question'"
    @open="page = 'detail'"
    @browse="page = 'search'"
  />
</template>
