<template>
  <s-layout
    title="入店码"
    navbar="custom"
    tabbar="/pages/entry/qr-entry"
    :show-header-button="false"
  >
    <view class="entry-wrap">
      <view class="qr-card">
        <view class="title">{{ isLogin ? "入店二维码" : "登录后查看入店码" }}</view>
        <image v-if="isLogin && qrImage" class="qr-img" :src="qrImage" mode="aspectFit" />
        <view v-else class="qr-loading">
          {{ isLogin ? "正在生成..." : "登录后生成当前用户专属二维码" }}
        </view>
        <view class="hint">
          {{ isLogin ? "将二维码对准闸机扫码口" : "扫码会识别当前登录用户身份" }}
        </view>
      </view>

      <button v-if="isLogin" class="ss-reset-button refresh-btn" @tap="refreshQr">
        刷新二维码
      </button>
      <button v-else class="ss-reset-button refresh-btn" @tap="openLoginModal">
        立即登录
      </button>
      <view v-if="isLogin && errorMsg" class="error-msg">{{ errorMsg }}</view>
    </view>

    <canvas
      canvas-id="entryQrCanvas"
      id="entryQrCanvas"
      class="qr-canvas"
      :style="{
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
      }"
    ></canvas>
  </s-layout>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, reactive, ref, watch } from "vue";
import { onShow } from "@dcloudio/uni-app";
import QSCanvas from "qs-canvas";
import sheep from "@/sheep";
import { showAuthModal } from "@/sheep/hooks/useModal";

const qrImage = ref("");
const errorMsg = ref("");
const instance = getCurrentInstance();
const userStore = sheep.$store("user");
const isLogin = computed(() => userStore.isLogin);
const canvasSize = reactive({
  width: 10,
  height: 10,
});

uni.hideTabBar();

function clearQrState() {
  qrImage.value = "";
  errorMsg.value = "";
}

function openLoginModal() {
  // #ifdef MP-WEIXIN
  showAuthModal("wechatMiniLogin");
  // #endif
  // #ifdef H5
  showAuthModal("smsLogin");
  // #endif
}

async function refreshQr() {
  if (!isLogin.value) {
    clearQrState();
    return;
  }
  errorMsg.value = "";
  qrImage.value = "";
  try {
    const res = await sheep.$api.entry.getEntryQrToken();
    const token = res?.data?.qr_token;
    if (!token) {
      throw new Error("empty token");
    }
    await drawQr(token);
  } catch (e) {
    errorMsg.value = "扫码失败，请重试";
  }
}

async function drawQr(value) {
  const size = 520;
  canvasSize.width = size;
  canvasSize.height = size;
  await nextTick();
  const qsc = new QSCanvas(
    {
      canvasId: "entryQrCanvas",
      width: size,
      height: size,
      setCanvasWH: (canvas) => {
        canvasSize.width = canvas.width;
        canvasSize.height = canvas.height;
      },
    },
    instance
  );

  await qsc.updateCanvasWH({
    width: size,
    height: size,
    delay: 80,
  });
  await qsc.drawQrCode({
    type: "qrcode",
    val: value,
    x: 0,
    y: 0,
    size,
  });
  await qsc.draw();
  await new Promise((resolve) => setTimeout(resolve, 80));
  qrImage.value = await qsc.toImage({
    width: size,
    height: size,
    destWidth: size,
    destHeight: size,
  });
}

onShow(() => {
  if (!isLogin.value) {
    clearQrState();
    openLoginModal();
    return;
  }
  refreshQr();
});

watch(isLogin, (loggedIn) => {
  if (!loggedIn) {
    clearQrState();
    return;
  }
  refreshQr();
});
</script>

<style scoped lang="scss">
.entry-wrap {
  padding: 60rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-card {
  width: 620rpx;
  padding: 40rpx 30rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1f1f1f;
  margin-bottom: 20rpx;
}

.qr-img {
  width: 420rpx;
  height: 420rpx;
}

.qr-loading {
  width: 420rpx;
  height: 420rpx;
  padding: 0 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #8c8c8c;
  font-size: 26rpx;
  background: #f7f7f7;
  border-radius: 16rpx;
}

.hint {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #606266;
}

.refresh-btn {
  margin-top: 30rpx;
  width: 320rpx;
  height: 76rpx;
  border-radius: 38rpx;
  background: linear-gradient(90deg, #ff7a00, #ffb347);
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
}

.error-msg {
  margin-top: 18rpx;
  color: #ff4d4f;
  font-size: 24rpx;
}

.qr-canvas {
  position: fixed;
  top: -99999rpx;
  left: -99999rpx;
  opacity: 0;
  pointer-events: none;
}
</style>
