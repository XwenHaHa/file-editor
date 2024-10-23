<template>
  <router-view></router-view>
  <el-dialog v-model="dialogVisible" title="关闭提示" width="500">
    <el-radio-group v-model="exitValue">
      <el-radio :label="1" size="large">最小化到系统托盘</el-radio>
      <el-radio :label="2" size="large">退出Sparke-IDE</el-radio>
    </el-radio-group>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
const dialogVisible = ref(false);

// 确认
const handleConfirm = async () => {
  await window.electron.ipcRenderer.invoke("win-close", exitValue.value);
  dialogVisible.value = false;
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

<style></style>
