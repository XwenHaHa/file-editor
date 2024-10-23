import { createRouter, createWebHashHistory } from "vue-router";
import blankLayout from "@/layouts/blank/index.vue";

export const rootRoute = {
  path: "/",
  name: "Root",
  redirect: "/home",
  meta: { layout: "blank", title: "Sparke-IDE" },
};

export const errorRoutes =
  // 解决动态加载的路由 控制台报警告 [Vue Router warn]: No match found for location with path
  // 若跳转的路由不存在，则报错误页面
  {
    path: "/404",
    hidden: true,
    name: "error",
    component: () =>
      import(/* webpackChunkName: "error" */ "@/views/Error.vue"),
    meta: {
      layout: "blank",
      title: "错误",
    },
  };

// 菜单的路由时动态加载控制的，在页面 菜单管理 中配置

// 其他非菜单路由如需用到可写在下面
export const otherRoutes = [
  {
    path: "/",
    component: blankLayout,
    name: "Root",
    redirect: "/home", // 直接重定向到/home路由
    meta: { layout: "blank", title: "首页" },
  },
  {
    path: "/home",
    name: "Home",
    component: () =>
      import(/* webpackChunkName: "homeIndex" */ "@/views/home/index.vue"),
    meta: {
      title: "首页",
      type: "nav",
    },
  },
  {
    path: "/camera",
    name: "Camera",
    component: () =>
      import(/* webpackChunkName: "camera" */ "@/views/camera/index.vue"),
    meta: {
      title: "摄像识别",
      type: "nav",
    },
  },
  {
    path: "/document",
    name: "Document",
    component: () =>
      import(/* webpackChunkName: "document" */ "@/views/document/index.vue"),
    meta: {
      title: "文档",
      type: "nav",
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: [rootRoute, ...otherRoutes, errorRoutes],
});

router.beforeEach((to, _, next) => {
  // 设置页面标题
  document.title = `${rootRoute.meta.title}-(${to.meta.title})`;
  next();
});

export default router;
