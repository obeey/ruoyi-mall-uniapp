<template>
  <s-layout
    title="入店码"
    navbar="custom"
    tabbar="/pages/entry/qr-entry"
    :show-header-button="false"
  >
    <view class="entry-wrap">
      <view class="qr-card">
        <view class="title">{{ cardTitle }}</view>
        <image v-if="canShowQr && qrImage" class="qr-img" :src="qrImage" mode="aspectFit" />
        <view v-else class="qr-loading" :class="{ 'agreement-loading': isLogin && !agreementAccepted }">
          {{ cardBodyText }}
        </view>
        <view class="hint">{{ hintText }}</view>

        <view v-if="isLogin && !agreementAccepted" class="agreement-panel">
          <view class="agreement-panel__title">入店前请先确认代扣授权</view>
          <view class="agreement-panel__desc">
            当前先使用模拟代扣协议流程。点击同意后展示入店二维码，后续接入正式代扣协议时再切换为真实签约。
          </view>
          <button class="ss-reset-button agreement-primary" @tap="agreeAndShowQr">
            同意代扣协议并展示入店码
          </button>
          <button class="ss-reset-button agreement-secondary" @tap="previewAgreement">
            查看代扣协议说明
          </button>
        </view>
      </view>

      <button v-if="canShowQr" class="ss-reset-button refresh-btn" @tap="refreshQr">
        刷新二维码
      </button>
      <button v-else-if="!isLogin" class="ss-reset-button refresh-btn" @tap="openLoginModal">
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

const ENTRY_AGREEMENT_KEY = "entryDeductAgreementAcceptedV1";
const AGREEMENT_TITLE = "代扣协议说明（模拟）";
const AGREEMENT_CONTENT = [
  "1. 您同意在离店结算时，系统可根据本次店内识别到的商品明细发起代扣。",
  "2. 当前版本仅模拟协议确认流程，不会实际发起自动代扣。",
  "3. 在正式代扣协议与支付通道接入后，系统将按正式签约结果执行扣款。",
  "4. 如对识别明细或扣款结果有异议，可联系门店客服处理。",
].join("\n\n");

const qrImage = ref("");
const errorMsg = ref("");
const agreementAccepted = ref(uni.getStorageSync(ENTRY_AGREEMENT_KEY) === true);
const instance = getCurrentInstance();
const userStore = sheep.$store("user");
const isLogin = computed(() => userStore.isLogin);
const canShowQr = computed(() => isLogin.value && agreementAccepted.value);
const cardTitle = computed(() => {
  if (!isLogin.value) return "登录后查看入店码";
  if (!agreementAccepted.value) return "同意代扣协议后查看入店码";
  return "入店二维码";
});
const cardBodyText = computed(() => {
  if (!isLogin.value) return "登录后生成当前用户专属二维码";
  if (!agreementAccepted.value) return "请先确认代扣协议，确认后再展示当前用户的专属入店二维码";
  return "正在生成...";
});
const hintText = computed(() => {
  if (!isLogin.value) return "扫码会识别当前登录用户身份";
  if (!agreementAccepted.value) return "确认协议后即可展示二维码给闸机扫码";
  return "将二维码对准闸机扫码口";
});
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

function previewAgreement() {
  uni.showModal({
    title: AGREEMENT_TITLE,
    content: AGREEMENT_CONTENT,
    showCancel: false,
    confirmText: "我知道了",
  });
}

async function agreeAndShowQr() {
  if (!isLogin.value) {
    openLoginModal();
    return;
  }
  agreementAccepted.value = true;
  uni.setStorageSync(ENTRY_AGREEMENT_KEY, true);
  await refreshQr();
}

async function refreshQr() {
  if (!canShowQr.value) {
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
    errorMsg.value = "入店码生成失败，请稍后重试";
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
  agreementAccepted.value = uni.getStorageSync(ENTRY_AGREEMENT_KEY) === true;
  if (!isLogin.value) {
    clearQrState();
    openLoginModal();
    return;
  }
  userStore.updateUserData();
  if (agreementAccepted.value) {
    refreshQr();
  } else {
    clearQrState();
  }
});

watch(isLogin, (loggedIn) => {
  if (!loggedIn) {
    clearQrState();
    return;
  }
  if (agreementAccepted.value) {
    refreshQr();
  }
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

.agreement-loading {
  height: 260rpx;
}

.hint {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #606266;
}

.agreement-panel {
  width: 100%;
  margin-top: 28rpx;
  padding: 28rpx;
  border-radius: 20rpx;
  background: linear-gradient(180deg, #fff8ef 0%, #fff3df 100%);
  border: 2rpx solid #ffd8ae;
}

.agreement-panel__title {
  font-size: 28rpx;
  font-weight: 600;
  color: #7a3b00;
}

.agreement-panel__desc {
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #8a5a2b;
}

.agreement-primary,
.agreement-secondary,
.refresh-btn {
  width: 100%;
  height: 76rpx;
  border-radius: 38rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.agreement-primary,
.refresh-btn {
  margin-top: 30rpx;
  background: linear-gradient(90deg, #ff7a00, #ffb347);
  color: #fff;
}

.agreement-secondary {
  margin-top: 18rpx;
  background: #fff;
  color: #c96a13;
  border: 2rpx solid #f3be7f;
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
