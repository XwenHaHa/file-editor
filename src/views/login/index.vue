<template>
  <div class="loginForm">
    <el-card class="login-register-card">
      <div v-if="isLogin">
        <div class="login">
          <h2>登录</h2>
          <el-tooltip
            class="box-item"
            effect="dark"
            content="点击扫脸登录"
            placement="top-start"
          >
            <div class="login-face" @click="handleFaceLogin">
              <img src="@/assets/images/common/face.png" alt="" />
            </div>
          </el-tooltip>
        </div>
        <el-form :model="loginForm" label-width="80px">
          <el-form-item label="账户名">
            <el-input v-model="loginForm.username" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              type="password"
              v-model="loginForm.password"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="login">登录</el-button>
            <el-button @click="toggleForm">去注册</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div v-else>
        <h2>注册</h2>
        <el-form :model="registerForm" label-width="80px" ref="registerFormRef">
          <el-form-item
            prop="name"
            label="姓名"
            :rules="[
              { required: true, message: '请输入姓名', trigger: 'blur' },
            ]"
          >
            <el-input v-model="registerForm.name" />
          </el-form-item>
          <el-form-item
            prop="username"
            label="账户名"
            :rules="[
              { required: true, message: '请输入账户名', trigger: 'blur' },
            ]"
          >
            <el-input v-model="registerForm.username" />
          </el-form-item>
          <el-form-item
            prop="password"
            label="密码"
            :rules="[
              { required: true, message: '请输入密码', trigger: 'blur' },
            ]"
          >
            <el-input
              type="password"
              v-model="registerForm.password"
              show-password
            />
          </el-form-item>
          <el-form-item
            prop="photo"
            label="头像"
            :rules="[
              { required: true, message: '请上传头像', trigger: 'change' },
            ]"
          >
            <el-upload
              :on-change="handleAvatarChange"
              :before-upload="beforeAvatarUpload"
              list-type="picture-card"
              :show-file-list="false"
              :auto-upload="false"
            >
              <i class="el-icon-plus"></i>
              <img
                v-if="uploadedImage"
                :src="uploadedImage"
                class="avatar-preview"
              />
            </el-upload>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="register(registerFormRef)">
              注册
            </el-button>
            <el-button @click="toggleForm">去登录</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    <el-dialog v-model="faceDialogVisible" title="人脸识别" width="500">
      <video ref="videoItem" class="video-item"></video>
      <canvas
        ref="canvas"
        width="500"
        height="346"
        style="display: none"
      ></canvas>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const isLogin = ref(true);
const loginForm = ref({
  username: "",
  password: "",
});
const registerForm = ref({
  name: "",
  username: "",
  password: "",
  photo: "",
});

const toggleForm = () => {
  isLogin.value = !isLogin.value;
};

const uploadedImage = ref(null);
const handleAvatarChange = (file) => {
  // 使用 FileReader 转换为 Base64 格式
  const reader = new FileReader();
  reader.onload = (event) => {
    const base64String = event.target.result;
    registerForm.value.photo = base64String;
  };
  // 读取文件为 Data URL，这一步很重要
  reader.readAsDataURL(file.raw);
  // 创建一个 URL 对象并更新上传的图片
  uploadedImage.value = URL.createObjectURL(file.raw);
};
const beforeAvatarUpload = (file) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error("上传头像图片只能是 JPG、PNG 或 GIF 格式!");
    return false;
  }
  return true;
};

const login = async () => {
  try {
    const user = await window.electron.ipcRenderer.fetchUserByFiled(
      "username",
      loginForm.value.username
    );
    if (user && user.password === loginForm.value.password) {
      ElMessage({
        message: `欢迎回来，${user.name}！`,
      });
      router.push({ path: "/home" });
    }
  } catch (error) {
    console.error("登录错误：", error);
  }
};

const params = computed(() => {
  const form = { ...registerForm.value };
  for (const key in form) {
    if (form[key] === null) {
      form[key] = "";
    }
  }
  return form;
});

const registerFormRef = ref(null);
const register = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await window.electron.ipcRenderer.saveUser(
          JSON.stringify(params.value)
        );
        if (res.isRepeat) {
          ElMessage({
            message: `用户${params.value.username}已存在！`,
            type: "warning",
          });
        } else {
          ElMessage({
            message: `用户${params.value.username}注册成功！`,
            type: "success",
          });
        }
      } catch (error) {
        console.error("注册错误：", error);
      }
    }
  });
};

// 调起取景框
const videoItem = ref({});
const mediaStream = ref(null); // 用于存储媒体流
const faceDialogVisible = ref(false);
const canvas = ref();
const readSuccess = (stream) => {
  // 保存媒体流以便后续销毁
  mediaStream.value = stream;
  /* 将stream 分配给video标签 */
  videoItem.value.srcObject = stream;
  videoItem.value.play();
};

const handleCloseCamera = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => {
      track.stop();
    });
  }
  // 重置 video 元素的源
  if (videoItem.value) {
    videoItem.value.srcObject = null;
  }
  // 可选：将 mediaStream 设置为 null，以便垃圾回收
  mediaStream.value = null;
};

const handleFaceLogin = () => {
  faceDialogVisible.value = true;
  ElMessage({
    message: `人脸识别大概需要两秒钟时间，请耐心等待！`,
    type: "success",
  });
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      /* 使用这个 stream 传递到成功回调中 */
      readSuccess(stream);
      setTimeout(() => {
        captureImage();
      }, 2000);
    })
    .catch(function (err) {
      /* 处理 error 信息 */
      console.error(err);
    });
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

const handleDetectFace = async (imageURL, localImageURL, username) => {
  if (imageURL.length && localImageURL.length) {
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
      }
      if (response.data.confidence < 90) {
        ElMessage({
          message: `不存在该用户！`,
          type: "error",
        });
      }
      if (response.data.confidence > 90) {
        ElMessage({
          message: `用户${username}人脸数据匹配成功！，匹配度${response.data.confidence}%`,
          type: "success",
        });
      }
      faceDialogVisible.value = false;
      await handleCloseCamera();
    } catch (error) {
      console.error("调用 API 出错:", error);
    }
  } else {
    console.log("请先上传图片");
  }
};

const captureImage = async () => {
  const context = canvas.value.getContext("2d");
  // 使用 drawImage 将视频帧绘制到 Canvas
  context.drawImage(videoItem.value, 0, 0, 1000, 692, 0, 0, 500, 346);
  const base64Url = canvas.value.toDataURL();
  const allUsers = await window.electron.ipcRenderer.fetchUsers();
  // 遍历所有用户图像并逐个比较
  for (const user of allUsers) {
    const userImageUrl = user.photo; // 假设 user.photo 是用户的图像 URL
    const currentUserName = user.username;
    // 调用 handleDetectFace 进行比较
    if (user.photo) {
      await handleDetectFace(base64Url, userImageUrl, currentUserName);
    }
  }
};
</script>

<style scoped lang="scss">
.loginForm {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  .login-register-card {
    width: 400px;
    margin: 0 auto;
    .login {
      display: flex;
      justify-content: space-between;
      align-items: center;
      &-face {
        cursor: pointer;
        width: 30px;
        height: 30px;
        img {
          width: 100%;
          height: 100%;
        }
      }
    }
    .avatar-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .video-item {
    width: 100%;
    height: 100%;
  }
}
</style>
