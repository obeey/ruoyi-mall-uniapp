<template>
<view>
<!--  <view class="head-box ss-flex-col">-->
<!--    <view class="ss-flex ss-m-b-20">-->
<!--      <view class="head-title ss-m-r-40 head-title-animation">微信登录</view>-->
<!--    </view>-->
<!--  </view>-->
  <view>欢迎您登录【AI随时买】</view>
  <view style="margin-top: 200rpx">
    <button class="ss-reset-button buy-btn ui-Success-Main" open-type="getPhoneNumber"
            @getphonenumber="wechatLogin">
      <view class="ss-flex">
<!--        <image class="auto-login-img" :src="sheep.$url.static('/image/weixin.svg')"/>-->
        <view>手机号快捷登录</view>
      </view>
    </button>
    <view style="height: 10rpx"></view>
    <button class="ss-reset-button cancel-btn ui-Shadow-Pioneer-Main" @tap="wechatLoginWithoutPhone">
      <view class="ss-flex">
        <!--        <image class="auto-login-img" :src="sheep.$url.static('/image/weixin.svg')"/>-->
        <view>微信登录（不绑定手机号）</view>
      </view>
    </button>
  </view>

  <view class="agreement-text ss-flex">
    登录遇到问题？点此
    <button class="btnStyle" open-type="contact">联系客服</button>
  </view>
</view>
</template>

<script setup>
import sheep from '@/sheep'
import third from '@/sheep/api/third'
import {computed,reactive} from "vue";
import { closeAuthModal, showAuthModal } from '@/sheep/hooks/useModal';

const appInfo = computed(() => sheep.$store('app').info);

const state = reactive({
  protocol: false,
});

//勾选协议
function onChange() {
  state.protocol = !state.protocol;
}

async function wechatLogin(e) {
  if (e?.detail?.errMsg && e.detail.errMsg !== 'getPhoneNumber:ok') {
    sheep.$helper.toast('无法获取手机号授权，请使用短信登录');
    closeAuthModal();
    showAuthModal('smsLogin');
    return;
  }
  const loginRes = await sheep.$platform.useProvider("wechat").login(e.detail);
  if (loginRes) {
    sheep.$helper.toast('登录成功')
    closeAuthModal();
  }
}

async function wechatLoginWithoutPhone() {
  const loginResult = await uni.login();
  if (loginResult.errMsg !== 'login:ok') {
    sheep.$helper.toast('登录失败，请重试')
    return;
  }
  const res = await third.wechat.miniLogin({ code: loginResult.code });
  const openId = res?.data?.openId;
  if (openId) {
    uni.setStorageSync('openId', openId);
  }
  if (res?.data?.token) {
    sheep.$helper.toast('登录成功')
    closeAuthModal();
  } else {
    sheep.$helper.toast(res?.msg || '登录失败，请重试')
  }
}

// 查看协议
function onProtocol(id, title) {
  closeAuthModal();
  sheep.$router.go('/pages/public/richtext', {
    id,
    title,
  });
}

// 请先登录提示
function handleTip(){
  uni.showToast({
    title: "请勾选我已阅读并同意《用户协议》与《隐私政策》！",
    icon: "none",
    mask: true
  });
}

</script>


<style lang="scss" scoped>
.cancel-btn {
  width: 100%;
  height: 72rpx;
  font-weight: 500;
  font-size: 28rpx;

  border-radius: 40rpx;
  background: red;
  color: $white;
}
.btnStyle{
  border: none;
  font-size: 15px;
  padding: 0 !important;
  color: #82ABCC;
  margin: 0;
  background-color: transparent;
  &::after{
    border:none;
  }
}
.agreement-text{
  justify-content: center;
  position: absolute;
  bottom: 0;
  width: calc(100% - 68rpx);
}
.buy-btn {
  width: 100%;
  height: 72rpx;
  font-weight: 500;
  font-size: 28rpx;

  border-radius: 40rpx;
  background: #0DD116;
  color: $white;
}
.auto-login-img {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
}
</style>
