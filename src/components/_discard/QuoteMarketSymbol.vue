<!-- 指定 Symbol 的行情區塊 (，預設顯示熱門，支持展開其它月份) -->
<template>
	<div class="quote-market-symbol-ctn flex-col">
		<div class="flex-row">
			<!-- 展開圖示 -->
			<div v-touching-end class="flex-center expand-btn" @click="expand = !expand" v-if="moreContracts && moreContracts.length > 0">
				<i class="material-icons">{{expand ? 'expand_less' : 'expand_more'}}</i>
			</div>
			<!-- 熱門月 -->
			<QuoteCard class="flex-1" :sid="sid" :suspend="suspend"></QuoteCard>
		</div>
		<!-- 展開區塊 (其它月份) -->
		<transition name="show">
		<div class="flex-col expand-ctn" v-if="expand">
			<QuoteCard class="flex-1" v-for="otherSid in moreContracts" :sid="otherSid" :suspend="suspend" :key="`QuoteCard-${otherSid}`"></QuoteCard>
		</div>
		</transition>
	</div>
</template>

<script>
export default {
	props: ["expandObj", "suspend"],
	data() {
		return {
			/** 未停用 (彈出下層視窗/切到其它頁簽等等，都會進入 suspend===true 狀態) **/
			notSuspend: !this.suspend,
			/** 當前是否展開 */
			expand: false,
		};
	},
	mounted() {},
	beforeDestroy() {},
	methods: {},
	computed: {
		/** 本商品 sid */
		sid() {
			return this.expandObj.sid;
		},
		/** 本商品點擊展開的更多 sid */
		moreContracts() {
			return this.expandObj.moreContracts;
		},
	},
	watch: {},
	components: {},
};
</script>

<style scoped>
.quote-market-symbol-ctn {
	padding: 4px;
	border-bottom: 1px solid #999;
}
/* 展開按鈕圖示 */
.expand-btn {
	/* margin: 0 -8px 0 -4px; */
	/* min-width: 40px; */
}
/* 展開區 */
.expand-ctn {
	/* border: 1px solid #666; */
	background-color: #444;
}

.show-leave-to, .show-enter {
	opacity: 0;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.show-leave-active, .show-enter-active {
	transition-duration: 0.5s;
	transition-property: opacity;
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.show-leave-active {
	transition-duration: 0.1s;
}
.show-leave, .show-enter-to {
	opacity: 1;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
</style>