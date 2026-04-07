<template>
  <s-layout title="用户信息" class="set-userinfo-wrap">
    <uni-forms :model="state.model" labelPosition="left" border class="form-box">
      <view class="bg-white profile-card">
        <view class="upload-row">
          <view class="upload-label">头像</view>
          <view class="upload-content">
            <image
              class="preview-avatar"
              :src="avatarPreview"
              mode="aspectFill"
            />
            <button class="ss-reset-button action-btn" @tap="onChooseAvatar">
              更换头像
            </button>
          </view>
        </view>

        <view class="upload-row face-row">
          <view class="upload-label">刷脸照片</view>
          <view class="upload-content face-content">
            <image
              v-if="facePreview"
              class="preview-face"
              :src="facePreview"
              mode="aspectFill"
            />
            <view v-else class="face-placeholder">请上传清晰正脸照片</view>
            <view class="face-actions">
              <button class="ss-reset-button action-btn" @tap="onChooseFace(['album'])">
                从相册选择
              </button>
              <button class="ss-reset-button action-btn action-btn--plain" @tap="onChooseFace(['camera'])">
                拍照上传
              </button>
            </view>
          </view>
        </view>
      </view>

      <view class="bg-white ss-p-x-30">
        <uni-forms-item name="nickname" label="昵称">
          <uni-easyinput
            v-model="state.model.nickname"
            type="nickname"
            placeholder="设置昵称"
            :inputBorder="false"
            :placeholderStyle="placeholderStyle"
          />
        </uni-forms-item>

        <uni-forms-item name="gender" label="性别">
          <view class="ss-flex ss-col-center ss-h-100">
            <radio-group @change="onChangeGender" class="ss-flex ss-col-center">
              <label class="radio" v-for="item in genderRadioMap" :key="item.value">
                <view class="ss-flex ss-col-center ss-m-r-32">
                  <radio
                    :value="item.value"
                    color="var(--ui-BG-Main)"
                    style="transform: scale(0.8)"
                    :checked="String(item.value) === String(state.model.gender)"
                  />
                  <view class="gender-name">{{ item.name }}</view>
                </view>
              </label>
            </radio-group>
          </view>
        </uni-forms-item>

        <uni-forms-item name="mobile" label="手机号" @tap="onChangeMobile">
          <uni-easyinput
            v-model="state.model.phone"
            placeholder="请绑定手机号"
            :inputBorder="false"
            disabled
            :styles="{ disableColor: '#fff' }"
            :placeholderStyle="placeholderStyle"
            :clearable="false"
          >
            <template v-slot:right>
              <view class="ss-flex ss-col-center">
                <su-radio v-if="userInfo.verification?.mobile" :modelValue="true" />
                <button v-else class="ss-reset-button ss-flex ss-col-center ss-row-center">
                  <text class="_icon-forward" style="color: #bbbbbb; font-size: 26rpx"></text>
                </button>
              </view>
            </template>
          </uni-easyinput>
        </uni-forms-item>
      </view>

      <view class="bg-white ss-m-t-14">
        <uni-list>
          <uni-list-item
            clickable
            @tap="sheep.$router.go('/pages/user/address/list')"
            title="地址管理"
            showArrow
            :border="false"
            class="list-border"
          ></uni-list-item>
        </uni-list>
      </view>
    </uni-forms>

    <su-fixed bottom placeholder bg="none">
      <view class="footer-box ss-p-20">
        <button class="ss-rest-button logout-btn ui-Shadow-Main" :disabled="state.submitting" @tap="onSubmit">
          {{ state.submitting ? '保存中...' : '保存' }}
        </button>
      </view>
    </su-fixed>
  </s-layout>
</template>

<script setup>
  import { computed, reactive, onBeforeMount } from 'vue';
  import sheep from '@/sheep';
  import { clone } from 'lodash';
  import { showAuthModal } from '@/sheep/hooks/useModal';

  const defaultAvatar =
    'https://git-open.oss-cn-shenzhen.aliyuncs.com/ruoyi-mall/uniapp/icons/default_avatar.png';

  const state = reactive({
    model: {
      nickname: '',
      avatar: '',
      gender: 0,
      phone: '',
      faceImageUrl: '',
    },
    submitting: false,
  });

  const placeholderStyle = 'color:#BBBBBB;font-size:28rpx;line-height:normal';

  const genderRadioMap = [
    { name: '男', value: 1 },
    { name: '女', value: 2 },
    { name: '未知', value: 0 },
  ];

  const userInfo = computed(() => sheep.$store('user').userInfo);
  const avatarPreview = computed(() =>
    state.model.avatar ? sheep.$url.cdn(state.model.avatar) : sheep.$url.static(defaultAvatar),
  );
  const facePreview = computed(() =>
    state.model.faceImageUrl ? sheep.$url.cdn(state.model.faceImageUrl) : '',
  );

  function onChangeGender(e) {
    state.model.gender = Number(e.detail.value);
  }

  function onChangeMobile() {
    showAuthModal('changeMobile');
  }

  function onChooseAvatar() {
    chooseAndUploadImage(['album', 'camera'], 'avatar');
  }

  function onChooseFace(sourceType) {
    chooseAndUploadImage(sourceType, 'faceImageUrl');
  }

  function chooseAndUploadImage(sourceType, field) {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType,
      success: async (chooseImageRes) => {
        const tempUrl = chooseImageRes.tempFilePaths?.[0];
        if (!tempUrl) {
          return;
        }
        const uploadedUrl = await uploadFileToOss(tempUrl);
        if (uploadedUrl) {
          state.model[field] = uploadedUrl;
        }
      },
    });
  }

  async function uploadFileToOss(tempUrl) {
    try {
      const raw = await sheep.$api.app.upload(tempUrl, 'ugc');
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return parsed?.data || parsed?.path || parsed?.url || '';
    } catch (error) {
      sheep.$helper.toast('上传失败，请稍后重试');
      return '';
    }
  }

  async function onSubmit() {
    if (!state.model.nickname) {
      sheep.$helper.toast('请填写昵称');
      return;
    }
    state.submitting = true;
    try {
      await sheep.$api.user.update({
        avatar: state.model.avatar,
        nickname: state.model.nickname,
        gender: state.model.gender,
        faceImageUrl: state.model.faceImageUrl,
      });
      await getUserInfo();
    } finally {
      state.submitting = false;
    }
  }

  const getUserInfo = async () => {
    const profile = await sheep.$store('user').getInfo();
    state.model = {
      ...clone(profile),
      faceImageUrl: profile?.faceImageUrl || '',
    };
  };

  onBeforeMount(async () => {
    await getUserInfo();
  });
</script>

<style lang="scss" scoped>
  :deep() {
    .uni-list-item__content-title {
      font-size: 28rpx !important;
      color: #333333 !important;
      line-height: normal !important;
    }
  }

  .profile-card {
    padding: 24rpx 30rpx 10rpx;
  }

  .upload-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12rpx 0 28rpx;
  }

  .face-row {
    border-top: 1rpx solid #f2f2f2;
    padding-top: 28rpx;
  }

  .upload-label {
    width: 140rpx;
    font-size: 28rpx;
    color: #333;
    line-height: 88rpx;
  }

  .upload-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 20rpx;
  }

  .face-content {
    align-items: flex-end;
    flex-direction: column;
  }

  .preview-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: #f3f4f6;
  }

  .preview-face {
    width: 220rpx;
    height: 220rpx;
    border-radius: 24rpx;
    background: #f3f4f6;
  }

  .face-placeholder {
    width: 220rpx;
    height: 220rpx;
    border-radius: 24rpx;
    border: 2rpx dashed #d7dbe0;
    color: #999;
    font-size: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 24rpx;
    box-sizing: border-box;
    background: #fafafa;
  }

  .face-actions {
    display: flex;
    gap: 16rpx;
    margin-top: 18rpx;
  }

  .action-btn {
    min-width: 150rpx;
    height: 64rpx;
    padding: 0 24rpx;
    border-radius: 999rpx;
    background: var(--ui-BG-Main);
    color: #fff;
    font-size: 24rpx;
    line-height: 64rpx;
  }

  .action-btn--plain {
    background: #fff4eb;
    color: var(--ui-BG-Main);
  }
</style>
