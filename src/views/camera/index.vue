<template>
  <div>
    <el-button @click="handlePhoto" type="primary">点击拍照</el-button>
    <el-button @click="handleClear">清空图片</el-button>
    <el-button @click="handleDetectFace">对比图片</el-button>
    <div>
      <el-image
        style="width: 200px; height: 200px"
        :src="imageURL"
        fit="contain"
      />
    </div>
    <div>
      <el-upload :on-change="handleChangeImage" list-type="picture">
        <el-button type="primary">上传本地图片</el-button>
      </el-upload>
      <el-image
        style="width: 200px; height: 200px"
        :src="localImageURL"
        fit="contain"
      />
    </div>
  </div>
</template>

<script setup name="Camera">
import { ref } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";

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

const handleDetectFace = async () => {
  if (imageURL.value && localImageURL.value) {
    const formData = new FormData();
    formData.append("api_key", "1VKcCS0B3QUMFsHb022mxq9WdpJvlAqL");
    formData.append("api_secret", "YTx16Bl5ZE0PqVOktyQIy24lPgzItLUA");

    // 压缩第一张图片
    const response1 = await fetch(imageURL.value);
    const blob1 = await response1.blob();
    const base64Image1 = await compressImage(blob1);
    formData.append("image_base64_1", base64Image1);

    // 压缩第二张图片
    const response2 = await fetch(localImageURL.value);
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
const handleChangeImage = async (file) => {
  const base64Image = await compressImage(file.raw);
  localImageURL.value = base64Image; // 保存 Base64 字符串
};
</script>

<style scoped lang="scss"></style>
