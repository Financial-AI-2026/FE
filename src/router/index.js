import { createRouter, createWebHistory } from "vue-router";
import LandingPage from "../pages/LandingPage.vue";
import QuestionIntroPage from "../pages/QuestionIntroPage.vue";
import SearchPage from "../pages/SearchPage.vue";
import DetailPage from "../pages/DetailPage.vue";
import DetailLoadingPage from "../pages/DetailLoadingPage.vue";
import ResultPage from "../pages/ResultPage.vue";

// S1~S6 화면 매핑. 기획 문서가 그리던 라우팅 취지를
// 따르되, 실제 페이지 컴포넌트 이름 기준으로 다시 잡았다 (2026-09 결정).
const routes = [
  { path: "/", name: "landing", component: LandingPage },
  { path: "/questions", name: "questions", component: QuestionIntroPage },
  { path: "/search", name: "search", component: SearchPage },
  { path: "/etf/:code", name: "detail", component: DetailPage, props: true },
  {
    path: "/etf/:code/loading",
    name: "detail-loading",
    component: DetailLoadingPage,
    props: true,
  },
  { path: "/etf/:code/result", name: "result", component: ResultPage, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
