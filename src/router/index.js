import { createRouter, createWebHashHistory } from "vue-router";

export const rootRoute = {
  path: "/",
  name: "Root",
  redirect: "/home",
  meta: { layout: "blank", title: "极片刻码追溯系统-卷绕机" },
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
    path: "/home",
    name: "Home",
    hidden: false,
    isSimple: true,
    redirect: "/home/index",
    component: () =>
      import(/* webpackChunkName: "home" */ "@/views/home/index.vue"),
    meta: { title: "首页", code: "xxx", icon: "dashboard" },
    children: [
      {
        path: "/home/index",
        name: "HomeIndex",
        hidden: true,
        component: () =>
          import(/* webpackChunkName: "homeIndex" */ "@/views/home/index.vue"),
        meta: {
          title: "首页",
          icon: "peoples",
          noCache: true,
          link: "",
        },
        children: [],
      },
    ],
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
