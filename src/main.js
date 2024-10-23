import { createApp } from "vue";
import App from "./App.vue";
import router from "@/router";
import * as ElIcons from "@element-plus/icons-vue";
import "@/assets/styles/init.scss";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "./assets/styles/dark/css-vars.css";
import "./assets/styles/light/css-vars.css";

const app = createApp(App);

for (const name in ElIcons) {
  app.component(name, ElIcons[name]);
}

app.use(router).mount("#app");

export default app;
