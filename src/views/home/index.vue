<template>
  <div class="home">
    <div class="editor">
      <div class="header">Web-IDE-Demo</div>
      <div class="container">
        <div class="left">
          <div class="operate">
            <el-button type="primary" size="small" @click="handleOpenFile"
              >打开文件</el-button
            >
            <el-button type="primary" size="small" @click="handleOpenDir"
              >打开文件夹</el-button
            >
          </div>
          <div class="directory">
            <el-tree
              style="max-width: 600px"
              :data="fileTreeData.children"
              :props="fileTreeProps"
              @node-click="handleNodeClick"
            />
          </div>
        </div>
        <div class="right">
          <CodeEditor v-model:value="code" />
        </div>
      </div>
    </div>
    <el-dialog v-model="dialogVisible" title="关闭提示" width="500">
      <el-radio-group v-model="exitValue">
        <el-radio :label="1" size="large">最小化到系统托盘</el-radio>
        <el-radio :label="2" size="large">退出Web-IDE-Demo</el-radio>
      </el-radio-group>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm"> 确认 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { CodeEditor } from "@/components/code-editor";

const dialogVisible = ref(false);

const handleOpenFile = async () => {
  const [fileHandle] = await window.showOpenFilePicker();
  // 获取文件内容
  const fileData = await fileHandle.getFile();
  const reader = new FileReader();
  reader.readAsText(fileData);
  reader.onload = () => {
    code.value = reader.result;
  };
};

const processHandle = async (handle) => {
  if (handle.kind == "file") {
    return handle;
  }
  handle.children = [];
  const iter = handle.entries();
  for await (const item of iter) {
    handle.children.push(await processHandle(item[1]));
  }
  return handle;
};

const fileTreeData = ref({
  children: [],
});
const fileTreeProps = {
  children: "children",
  label: "name",
};
const handleOpenDir = async () => {
  const handle = await window.showDirectoryPicker();
  fileTreeData.value = await processHandle(handle);
};

// 确认
const handleConfirm = async () => {
  await window.electron.ipcRenderer.invoke("win-close", exitValue.value);
  dialogVisible.value = false;
};

const code = ref(`console.log('Hello, world!')`);
const handleNodeClick = async (item) => {
  if (item.kind == "directory") return;
  const file = await item.getFile();
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = () => {
    code.value = reader.result;
  };
};

const exitValue = ref(1);
onMounted(() => {
  window.electron.ipcRenderer.on("win-close-tips", (event, data) => {
    // 接受主进程的关闭通知
    dialogVisible.value = true;
    event.sender.invoke("win-focus", exitValue.value); // 显示关闭弹窗并聚焦
  });
});

onUnmounted(() => {
  window.electron.ipcRenderer.removeListener("win-close-tips");
});
</script>

<style scoped lang="scss">
.home {
  width: calc(100vw - 20px);
  height: calc(100vh - 40px);
  .editor {
    width: 100%;
    height: 100%;
    background-color: rgba(31, 31, 31);
    .header {
      width: 100%;
      height: 40px;
      line-height: 40px;
      color: #fff;
    }
    .container {
      display: flex;
      height: calc(100% - 50px);
      .left {
        width: 200px;
        height: 100%;
      }
      .right {
        flex: 1;
      }
    }
  }
}
</style>
