import {
  app,
  protocol,
  BrowserWindow,
  Menu,
  globalShortcut,
  Tray,
  ipcMain,
} from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
const path = require("path");
const { createConnection } = require("typeorm");
const User = require("./entity/userSchema"); // 导入用户实体

const isMac = process.platform === "darwin";
const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

let win;
let tray = null;

let willQuitApp = false;
async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600, //窗口大小
    webPreferences: {
      preload: path.join(__dirname, "../src/preload.js"),
      // 开始使用node
      nodeIntegration: true,
      // 不开启上下隔离（如果想使用require就要这个关闭）
      contextIsolation: true,
      // 关闭web安全策略，允许加载本地资源
      webSecurity: false,
      // 可以便用remote方法
      enableRemoteModule: true,
      // ？
      devTools: true,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  win.on("close", (e) => {
    if (!willQuitApp) {
      // 发送给渲染进程关闭信号
      win.webContents.send("win-close-tips", { isMac });
      // 组织默认关闭
      e.preventDefault();
    }
  });

  // 接收渲染事件回传的消息
  ipcMain.handle("win-close", (event, data) => {
    if (isMac) {
      if (win.isFullScreen()) {
        // 全屏状态下特殊处理
        win.once("leave-full-screen", function () {
          win.setSkipTaskbar(true);
          win.hide();
        });
        win.setFullScreen(false);
      } else {
        win.setSkipTaskbar(true);
        win.hide();
      }
    } else {
      if (data === 1) {
        // win缩小到托盘
        win.setSkipTaskbar(true); // 使窗口不显示在任务栏中
        win.hide(); // 隐藏窗口
      } else {
        app.quit(); // win退出
      }
    }
  });

  ipcMain.handle("win-focus", () => {
    // 聚焦窗口
    if (win.isMinimized()) {
      win.restore();
      win.focus();
    }
  });

  // 新建托盘
  tray = new Tray(path.join(__dirname, "../public/img/logo.png"));
  // 托盘名称
  tray.setToolTip("Sparke-IDE");
  // 托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "打开主窗口",
      click: () => {
        win.show();
      },
    },
    {
      label: "退出",
      click: () => {
        win.destroy();
      },
    },
  ]);
  // 载入托盘菜单
  tray.setContextMenu(contextMenu);
  // 双击触发
  tray.on("double-click", () => {
    if (win.isVisible()) {
      win.hide();
      win.setSkipTaskbar(false);
    } else {
      win.show();
      win.setSkipTaskbar(true);
    }
  });

  //注册调试工具快捷键
  globalShortcut.register("ctrl+shift+a", () => {
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  });
  if (process.env.NODE_ENV !== "production") {
    globalShortcut.register("f5", () => {
      if (!process.env.IS_TEST) win.reload();
    });
  }
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", () => {
  willQuitApp = true;
});

let connection;
async function initDatabase() {
  connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "123456",
    database: "electron",
    synchronize: true,
    logging: false,
    entities: [User],
  });
  console.log("Database connected!");
}

// 全量查用户表
ipcMain.handle("fetch-users", async () => {
  const userRepository = connection.getRepository(User);
  return await userRepository.find();
});

// 根据ID单查用户
ipcMain.handle("fetch-user-by-id", async (event, id) => {
  const userRepository = connection.getRepository(User);
  return await userRepository.findOne(id);
});

// 根据某个字段单查用户
ipcMain.handle("fetch-user-by-field", async (event, field, value) => {
  const userRepository = connection.getRepository(User);
  const user = await userRepository.findOne({ where: { [field]: value } });
  return user;
});

// 保存用户
ipcMain.handle("save-user", async (event, newUser) => {
  console.log(newUser);
  try {
    const userRepository = connection.getRepository(User);
    const currentUser = JSON.parse(newUser);

    // 使用账户名进行去重检查
    const existingUser = await userRepository.findOne({
      where: { username: currentUser.username },
    });

    if (existingUser) {
      return {
        isRepeat: true,
        user: existingUser,
      };
    } else {
      // 如果没有重复，保存用户
      const savedUser = await userRepository.save(currentUser);
      return {
        isRepeat: false,
        user: savedUser,
      };
    }
  } catch (error) {
    throw new Error("Error saving user: " + error.message);
  }
});

// 删除用户
ipcMain.handle("remove-user", async (event, existingUserId) => {
  try {
    const existingUser = await userRepository.findOne(existingUserId);
    if (existingUser) {
      await userRepository.remove(existingUser);
      return { success: true }; // 返回成功信息
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    throw new Error("Error removing user: " + error.message);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  console.log("Database connected!");
  //取消头部菜单
  Menu.setApplicationMenu(null);
  createWindow();
  initDatabase().catch((error) =>
    console.error("Database initialization error:", error)
  );
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
