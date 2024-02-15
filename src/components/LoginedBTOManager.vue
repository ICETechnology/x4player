<template>
    <div class="FULL logined-bto-manager-ctn flex-col" v-stop-propagation-y>
		<div class="flex-1 posr">
			<ScrollBounce class="FULL" v-stop-propagation-y>
				<div class="" :class="{'pdlr5': !isDesktop}">
	    			<LoginedBTOCard v-for="(bto, idx) in sortedBTOList" :key="`bto-idx-${idx}`" :bto="bto" />
				</div>
			</ScrollBounce>
		</div>
    	<div class="flex-center mgtb5" v-if="loginMoreTrader">
			<Button class="btn-confirm dark" @click="onLoginTrade">{{$ln('登入其它帐号')}}</Button>
		</div>
    </div>
</template>

<script>
export default {
	props: ['suspend'],
	data() {
		return {}
	},
	beforeMount() {
		this.$emit('title', '帐号登入/登出管理');
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onLoginTrade() {
			eventBus.$emit("POPUP-DIALOG", this.$store.state.status.loginTradeClass, {}, {transName: 'float'});
		},
	},
	watch: {
		suspend(nv, ov) {
			if (ov && !nv) {
				// 畫面上沒有任何帳號時 -> 關閉自己
				if (this.sortedBTOList.length === 0) {
					eventBus.$emit("CLOSE-DIALOG");
				}
			}
		}
	},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
		sortedBTOList() {
			return this.$store.state.sortedBTOList;
		},
		/** 是否允許登入/切換其它交易帳號 */
		loginMoreTrader() {
			return this.$store.state.config.CONFIG.LOGIN_MORE_TRADER;
		},
	},
}
</script>

<style scoped>
.btn-confirm {
	width: 38vw;
	height: 10vw;
	border-radius: 2vw;
}
</style>