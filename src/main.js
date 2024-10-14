import { createApp } from "vue";
import App from "./App.vue";
import router from "@/router";
import * as ElIcons from "@element-plus/icons-vue";
import "element-plus/dist/index.css";

const app = createApp(App);

for (const name in ElIcons) {
  app.component(name, ElIcons[name]);
}

app.use(router).mount("#app");

export default app;
