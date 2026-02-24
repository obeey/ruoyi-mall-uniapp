<script setup>
	import {
		onLaunch,
		onShow,
		onError
	} from '@dcloudio/uni-app';
	import {
		ShoproInit
	} from './sheep';

	onLaunch(() => {
		// 加载Shopro底层依赖
		ShoproInit();

		// 默认进入入店码页面
		uni.reLaunch({
			url: '/pages/entry/qr-entry',
		});
	});

	onError((err) => {
		console.log('AppOnError:', err);
	});
	onShow(() => {
		// #ifdef APP-PLUS
		// 获取urlSchemes参数
		const args = plus.runtime.arguments;
		if (args) {}

		// 获取剪贴板
		uni.getClipboardData({
			success: (res) => {},
		});
		// #endif
	});
</script>

<style lang="scss">
	@import '@/sheep/scss/index.scss';
</style>
