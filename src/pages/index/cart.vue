<template>
  <s-layout title="购物车" tabbar="/pages/index/cart" :bgStyle="{ color: '#fff' }">
    <s-empty
      v-if="state.list.length === 0"
      text="购物车空空如也，快去逛逛吧~"
      icon="/static/cart-empty.png"
    />

    <view v-else class="cart-box ss-flex ss-flex-col ss-row-between">
      <view class="cart-header ss-flex ss-col-center ss-row-between ss-p-x-30">
        <view class="header-left ss-flex ss-col-center ss-font-26">
          共
          <text class="goods-number ui-TC-Main ss-flex">{{ state.list.length }}</text>
          件商品
        </view>
      </view>

      <view class="cart-content ss-flex-1 ss-p-x-30 ss-m-b-40">
        <view v-if="state.normalList.length" class="cart-section ss-m-b-24">
          <view class="section-header ss-flex ss-col-center ss-row-between">
            <view class="section-title">普通购物车</view>
            <view class="section-tip">可删除</view>
          </view>
          <view class="goods-box ss-r-10 ss-m-b-14" v-for="item in state.normalList" :key="getItemKey(item)">
            <s-goods-item
              :title="item.productName"
              :img="item.pic"
              :price="item.price"
              :skuText="item.spDataValue"
              priceColor="#FF3000"
              :titleWidth="450"
            >
              <template #tool>
                <view class="goods-tools">
                  <view class="goods-quantity">x{{ item.quantity }}</view>
                  <button class="delete-btn ss-reset-button" @tap.stop="handleDelete(item)">删除</button>
                </view>
              </template>
            </s-goods-item>
          </view>
        </view>

        <view v-if="state.entryStoreList.length" class="cart-section">
          <view class="section-header ss-flex ss-col-center ss-row-between">
            <view class="section-title">无人店购物车</view>
            <view class="section-tip section-tip-lock">门店内商品，暂不支持删除</view>
          </view>
          <view class="goods-box ss-r-10 ss-m-b-14" v-for="item in state.entryStoreList" :key="getItemKey(item)">
            <s-goods-item
              :title="item.productName"
              :img="item.pic"
              :price="item.price"
              :skuText="item.spDataValue"
              priceColor="#FF3000"
              :titleWidth="450"
            >
              <template #tool>
                <view class="goods-tools">
                  <view class="goods-quantity">x{{ item.quantity }}</view>
                  <view class="readonly-tag">到店结算</view>
                </view>
              </template>
            </s-goods-item>
          </view>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onHide, onPullDownRefresh, onShow, onUnload } from '@dcloudio/uni-app';

  const CART_POLLING_INTERVAL = 1000;

  const sys_navBar = sheep.$platform.navbar;
  const cart = sheep.$store('cart');

  const state = reactive({
    list: computed(() => cart.list),
    normalList: computed(() => cart.list.filter((item) => item.cartSource !== 'entry_store')),
    entryStoreList: computed(() => cart.list.filter((item) => item.cartSource === 'entry_store')),
    refreshTimer: null,
    isRefreshing: false,
  });

  async function refreshCartList() {
    if (state.isRefreshing) return;
    state.isRefreshing = true;
    try {
      await cart.getList();
    } finally {
      state.isRefreshing = false;
    }
  }

  function clearRefreshTimer() {
    if (state.refreshTimer) {
      clearInterval(state.refreshTimer);
      state.refreshTimer = null;
    }
  }

  function startRefreshTimer() {
    clearRefreshTimer();
    state.refreshTimer = setInterval(() => {
      refreshCartList();
    }, CART_POLLING_INTERVAL);
  }

  function getItemKey(item) {
    return `${item.cartSource || 'normal'}-${item.id}-${item.sessionId || ''}`;
  }

  async function handleDelete(item) {
    if (!item || item.deletable === false) {
      return;
    }
    await cart.delete(item.id);
  }

  onShow(() => {
    refreshCartList();
    startRefreshTimer();
  });

  onHide(() => {
    clearRefreshTimer();
  });

  onUnload(() => {
    clearRefreshTimer();
  });

  onPullDownRefresh(async () => {
    await refreshCartList();
    uni.stopPullDownRefresh();
  });
</script>

<style lang="scss" scoped>
  .cart-box {
    width: 100%;

    .cart-header {
      height: 70rpx;
      background-color: #f6f6f6;
      width: 100%;
      position: fixed;
      left: 0;
      top: v-bind('sys_navBar') rpx;
      z-index: 1000;
      box-sizing: border-box;
    }

    .cart-content {
      margin-top: 70rpx;

      .cart-section {
        .section-header {
          padding: 18rpx 4rpx 20rpx;
        }

        .section-title {
          font-size: 28rpx;
          font-weight: 600;
          color: #303133;
        }

        .section-tip {
          font-size: 22rpx;
          color: #909399;
        }

        .section-tip-lock {
          color: #c17b2d;
        }
      }

      .goods-box {
        background-color: #fff;
      }
    }
  }

  .goods-tools {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12rpx;
  }

  .goods-quantity {
    min-width: 72rpx;
    text-align: right;
    font-size: 24rpx;
    color: #999;
  }

  .delete-btn {
    font-size: 22rpx;
    color: #ff5a5f;
    line-height: 1;
  }

  .readonly-tag {
    font-size: 22rpx;
    color: #c17b2d;
    line-height: 1;
  }
</style>
