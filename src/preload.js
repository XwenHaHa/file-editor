const { contextBridge, ipcRenderer } = require("electron");
const NodeWebcam = require("node-webcam");

// 默认选项
const opts = {
  width: 1280,
  height: 720,
  quality: 100,
  output: "jpeg",
  verbose: true,
  saveShots: true,
  output: "jpeg",
  callbackReturn: "buffer",
};

// 创建摄像头实例
const webcam = NodeWebcam.create(opts);

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    ...ipcRenderer,
    on: ipcRenderer.on.bind(ipcRenderer),
    removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
    fetchUsers: () => ipcRenderer.invoke("fetch-users"),
    fetchUserById: (id) => ipcRenderer.invoke("fetch-user-by-id", id),
    fetchUserByFiled: (field, value) =>
      ipcRenderer.invoke("fetch-user-by-field", field, value),
    saveUser: (newUser) => ipcRenderer.invoke("save-user", newUser),
  },
  capture: (fileName, callback) => {
    webcam.capture(fileName, (err, data) => {
      if (err) {
        callback(err.message, null);
      } else {
        callback(null, data);
      }
    });
  },
});

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});
