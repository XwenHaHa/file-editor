<template>
  <div class="home">
    <div class="editor">
      <div class="header">
        <div class="logo">
          <div class="image">
            <img src="@/assets/images/common/light-logo.png" alt="" />
          </div>
          <div class="text">Sparke-IDE</div>
        </div>
        <div class="instruction">
          <div class="operate-list">
            <div class="item" @click="handleToPage('document')">Document</div>
            <div class="item" @click="handleToPage('camera')">Camera</div>
          </div>
          <el-switch
            v-model="isDark"
            inline-prompt
            :active-icon="Moon"
            :inactive-icon="Sunny"
            @change="toggleDark"
          />
        </div>
      </div>
      <div class="container">
        <DragCol height="100%" width="100%" :leftPercent="15">
          <template #left>
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
                  :data="fileTreeData.children"
                  :props="fileTreeProps"
                  @node-click="handleNodeClick"
                />
              </div>
            </div>
          </template>
          <template #right>
            <div class="right">
              <el-scrollbar height="100%">
                <CodeEditor
                  v-model:value="code"
                  :readOnly="true"
                  :showCursorWhenSelecting="true"
                  theme="idea"
                />
              </el-scrollbar>
            </div>
          </template>
        </DragCol>
      </div>
    </div>
  </div>
</template>

<script setup name="HomeIndex">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { CodeEditor } from "@/components/code-editor";
import { DragCol } from "vue-resizer";
import { Sunny, Moon } from "@element-plus/icons-vue";
import { useDark, useToggle } from "@vueuse/core";

const router = useRouter();

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

// 主题切换
const isDark = useDark({
  // 暗黑class名字
  valueDark: "dark",
  // 高亮class名字
  valueLight: "light",
});
const toggleDark = useToggle(isDark);

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

// 跳转页面
const handleToPage = (name) => {
  router.push(`/${name}`);
};
</script>

<style scoped lang="scss">
.home {
  width: 100vw;
  height: 100vh;
  .editor {
    width: 100%;
    height: 100%;
    .header {
      width: 100%;
      height: 40px;
      line-height: 40px;
      padding: 0 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--light-font);
      background-color: var(--header-bg);
      border-bottom: 1px solid var(--base-border);
      .logo {
        display: flex;
        align-items: center;
        .image {
          width: 30px;
          height: 30px;
          img {
            width: 100%;
            height: 100%;
          }
        }
        .text {
          margin-left: 10px;
        }
      }
      .instruction {
        display: flex;
        align-items: center;
        .operate-list {
          display: flex;
          .item {
            margin-right: 20px;
            cursor: pointer;
          }
          :hover {
            color: #409eff;
          }
        }
      }
    }
    .container {
      display: flex;
      height: calc(100% - 40px);
      :deep(.slider_col) {
        width: 0px !important;
      }
      .left {
        height: 100%;
        background-color: var(--el-fill-color-blank);
      }
      .right {
        border-left: 1px solid var(--base-border);
        height: 100%;
      }
    }
  }
}
</style>
