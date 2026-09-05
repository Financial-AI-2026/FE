import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { sessionStoragePersistPlugin } from "./stores/persist";

const pinia = createPinia();
pinia.use(sessionStoragePersistPlugin);

createApp(App).use(pinia).use(router).mount("#app");
