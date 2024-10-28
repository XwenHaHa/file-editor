<template>
  <div class="camera-page">
    <div class="item">
      <div class="header">
        <el-button @click="handlePhoto" type="primary">点击拍照</el-button>
        <el-button @click="handleClear">清空图片</el-button>
        <el-upload :on-change="handleChangeImage" list-type="picture">
          <el-button type="primary">上传本地图片</el-button>
        </el-upload>
        <el-button @click="handleCompare">对比图片</el-button>
      </div>
      <div class="container">
        <div>
          <el-image
            style="width: 200px; height: 200px"
            :src="imageURL"
            fit="contain"
          />
          <div class="text">拍照后图片</div>
        </div>
        <div>
          <el-image
            style="width: 200px; height: 200px"
            :src="localImageURL"
            fit="contain"
          />
          <div class="text">本地图片</div>
        </div>
      </div>
    </div>
    <div class="item">
      <div class="header">
        <el-button type="primary" @click="handleInvokeCamera">
          点击调起取景框
        </el-button>
        <el-button type="primary" @click="handleCloseCamera">
          点击还原
        </el-button>
        <el-button type="primary" @click="handleRealTimeShot">
          实景拍摄
        </el-button>
        <el-upload :on-change="handleChangeRealTimeImage" list-type="picture">
          <el-button type="primary">上传对比图</el-button>
        </el-upload>
        <el-button @click="handleRealTimeCompare"> 实景对比 </el-button>
      </div>
      <div class="container">
        <video ref="videoItem" class="video-item" v-show="showVideo"></video>
        <canvas
          ref="videoCanvas"
          width="500"
          height="346"
          v-show="showCanvas"
        ></canvas>
        <div>
          <el-image
            style="width: 200px; height: 200px"
            :src="localRealTimeImageURL"
            fit="contain"
          />
          <div class="text">本地图片</div>
        </div>
      </div>
    </div>
    <div class="item">
      <el-button @click="handleQueryUserData">点击查询用户表</el-button>
      <el-button @click="handleAddUser" type="primary">新增用户</el-button>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="用户名" width="180" />
        <el-table-column prop="username" label="账号名" width="180" />
        <el-table-column prop="createtime" label="创建时间" width="180" />
        <el-table-column prop="updatetime" label="更新时间" />
      </el-table>
      <el-dialog
        v-model="userDialogVisible"
        title="新增用户"
        width="500"
        :before-close="handleCloseUserDialog"
      >
        <el-form ref="formRef" :model="form" label-width="140px" status-icon>
          <el-form-item label="用户名" prop="name">
            <el-input v-model="form.name" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="账号名" prop="username">
            <el-input v-model="form.username" placeholder="请输入账号名" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" placeholder="请输入密码" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="userDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirmUser(formRef)">
              确认
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup name="Camera">
import { ref, reactive, toRefs, onMounted } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";

const imageURL = ref("");
const localImageURL = ref("");

const handleConvertPicture = (imageData) => {
  let bytes = new Uint8Array(imageData);
  let data = "";
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    data += String.fromCharCode(bytes[i]);
  }
  return data;
};

const handlePhoto = () => {
  window.electron.capture("test_picture", (error, data) => {
    if (error) {
      console.error("捕获图片时出错:", error);
    } else {
      const imageData = handleConvertPicture(data);
      const picture = "data:image/png;base64," + window.btoa(imageData);
      imageURL.value = picture;
    }
  });
};

const handleClear = () => {
  imageURL.value = "";
  localImageURL.value = "";
};

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 800; // 设置最大宽度
        const MAX_HEIGHT = 800; // 设置最大高度
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result); // 返回 Base64 字符串
            };
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.7
        ); // 压缩为 JPEG 格式
      };
    };
    reader.readAsDataURL(file);
  });
};

const handleDetectFace = async (imageURL, localImageURL) => {
  if (imageURL && localImageURL) {
    const formData = new FormData();
    formData.append("api_key", "1VKcCS0B3QUMFsHb022mxq9WdpJvlAqL");
    formData.append("api_secret", "YTx16Bl5ZE0PqVOktyQIy24lPgzItLUA");

    // 压缩第一张图片
    const response1 = await fetch(imageURL);
    const blob1 = await response1.blob();
    const base64Image1 = await compressImage(blob1);
    formData.append("image_base64_1", base64Image1);

    // 压缩第二张图片
    const response2 = await fetch(localImageURL);
    const blob2 = await response2.blob();
    const base64Image2 = await compressImage(blob2);
    formData.append("image_base64_2", base64Image2);

    try {
      const response = await axios.post(
        "https://api-cn.faceplusplus.com/facepp/v3/compare",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (!response.data.confidence) {
        ElMessage({
          message: `没有可比性！`,
          type: "error",
        });
        return;
      }
      if (response.data.confidence) {
        ElMessage({
          message: `相似度为${response.data.confidence}%`,
          type: "success",
        });
      }
    } catch (error) {
      console.error("调用 API 出错:", error);
    }
  } else {
    console.log("请先上传图片");
  }
};

const handleCompare = () => {
  handleDetectFace(imageURL.value, localImageURL.value);
};

const handleChangeImage = async (file) => {
  const base64Image = await compressImage(file.raw);
  localImageURL.value = base64Image; // 保存 Base64 字符串
};

// 调起取景框
const videoItem = ref({});
let mediaStream = null; // 用于存储媒体流
const readSuccess = (stream) => {
  // 保存媒体流以便后续销毁
  mediaStream = stream;
  /* 将stream 分配给video标签 */
  videoItem.value.srcObject = stream;
  videoItem.value.play();
};

const showVideo = ref(false);
const showCanvas = ref(false);
const handleInvokeCamera = () => {
  showVideo.value = true;
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      /* 使用这个 stream 传递到成功回调中 */
      readSuccess(stream);
    })
    .catch(function (err) {
      /* 处理 error 信息 */
      console.error(err);
    });
};

const handleCloseCamera = () => {
  showVideo.value = false;
  showCanvas.value = false;
  localRealTimeImageURL.value = "";
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  // 重置 video 元素的源
  if (videoItem.value) {
    videoItem.value.srcObject = null;
  }
  // 可选：将 mediaStream 设置为 null，以便垃圾回收
  mediaStream = null;
};

const videoCanvas = ref(null);
const handleRealTimeShot = async () => {
  showCanvas.value = true;
  const context = videoCanvas.value.getContext("2d");
  // 使用 drawImage 将视频帧绘制到 Canvas
  context.drawImage(videoItem.value, 0, 0, 1000, 692, 0, 0, 500, 346);
  showVideo.value = false;
};

const localRealTimeImageURL = ref("");
const handleChangeRealTimeImage = async (file) => {
  const base64Image = await compressImage(file.raw);
  localRealTimeImageURL.value = base64Image; // 保存 Base64 字符串
};

const handleRealTimeCompare = async () => {
  const base64Url = videoCanvas.value.toDataURL();
  await handleDetectFace(base64Url, localRealTimeImageURL.value);
};

const tableData = ref([]);
const userDialogVisible = ref(false);
const formRef = ref();

const userData = reactive({
  form: {
    name: "", // 用户名
    username: "", // 账号名
    password: "", // 密码
  },
});
const handleQueryUserData = async () => {
  const users = await window.electron.ipcRenderer.fetchUsers();
  tableData.value = users.map((item) => ({
    ...item,
    createtime: dayjs(item.createtime).format("YYYY-MM-DD HH:mm:ss"),
    updatetime: dayjs(item.updatetime).format("YYYY-MM-DD HH:mm:ss"),
  }));
};
const handleAddUser = () => {
  userDialogVisible.value = true;
};
const handleCloseUserDialog = () => {
  userDialogVisible.value = false;
};
const handleConfirmUser = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      await window.electron.ipcRenderer.saveUser(JSON.stringify(userData.form));
      await handleQueryUserData();
      userDialogVisible.value = false;
    } else {
      console.log("error submit!", fields);
    }
  });
};
const { form } = toRefs(userData);

onMounted(() => {
  handleQueryUserData();
});
</script>

<style scoped lang="scss">
.camera-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  .item {
    width: 48%;
    height: 48%;
    background-color: #ccc;
    .header {
      display: flex;
      :nth-last-child(2) {
        margin: 0 5px;
      }
    }
    .container {
      display: flex;
      width: 100%;
      > div {
        margin: 0 10px;
      }
    }
    .video-item {
      width: 200px;
      height: 200px;
    }
  }
  .line {
    width: 1px;
    height: 100%;
    background-color: #ccc;
  }
}
</style>
