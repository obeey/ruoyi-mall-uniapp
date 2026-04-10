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
        <view class="goods-box ss-r-10 ss-m-b-14" v-for="item in state.list" :key="item.id">
          <s-goods-item
            :title="item.productName"
            :img="item.pic"
            :price="item.price"
            :skuText="item.spDataValue"
            priceColor="#FF3000"
            :titleWidth="450"
          >
            <template #tool>
              <view class="goods-quantity">x{{ item.quantity }}</view>
            </template>
          </s-goods-item>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';

  const sys_navBar = sheep.$platform.navbar;
  const cart = sheep.$store('cart');

  const state = reactive({
    list: computed(() => cart.list),
  });

  onShow(() => {
    cart.getList();
  });

  onPullDownRefresh(() => {
    cart.getList();
    setTimeout(() => {
      uni.stopPullDownRefresh();
    }, 800);
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

      .goods-box {
        background-color: #fff;
      }
    }
  }

  .goods-quantity {
    min-width: 72rpx;
    text-align: right;
    font-size: 24rpx;
    color: #999;
  }
</style>
