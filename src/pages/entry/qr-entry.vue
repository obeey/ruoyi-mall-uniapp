<template>
  <s-layout title="入店码" navbar="custom" :show-header-button="false">
    <view class="entry-wrap">
      <view class="qr-card">
        <view class="title">入店二维码</view>
        <image v-if="qrImage" class="qr-img" :src="qrImage" mode="aspectFit" />
        <view v-else class="qr-loading">正在生成...</view>
        <view class="hint">将二维码对准闸机扫码口</view>
      </view>

      <button class="ss-reset-button refresh-btn" @tap="refreshQr">刷新二维码</button>
      <view v-if="errorMsg" class="error-msg">{{ errorMsg }}</view>
    </view>

    <canvas canvas-id="entryQrCanvas" id="entryQrCanvas" class="qr-canvas"></canvas>
  </s-layout>
</template>

<script setup>
import { getCurrentInstance, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import QSCanvas from 'qs-canvas'
import sheep from '@/sheep'

const qrImage = ref('')
const errorMsg = ref('')
const instance = getCurrentInstance()

async function refreshQr() {
  errorMsg.value = ''
  qrImage.value = ''
  try {
    const res = await sheep.$api.entry.getEntryQrToken()
    const token = res?.data?.qr_token
    if (!token) {
      throw new Error('empty token')
    }
    await drawQr(token)
  } catch (e) {
    errorMsg.value = '扫码失败，请重试'
  }
}

async function drawQr(value) {
  const size = 520
  const qsc = new QSCanvas(
    {
      canvasId: 'entryQrCanvas',
      width: size,
      height: size,
      setCanvasWH: () => {},
    },
    instance,
  )

  await qsc.drawQrCode({
    type: 'qrcode',
    val: value,
    x: 0,
    y: 0,
    size,
  })
  await qsc.draw()
  qrImage.value = await qsc.toImage()
}

onLoad(() => {
  refreshQr()
})
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
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: 0;
  height: 0;
  opacity: 0;
}
</style>
