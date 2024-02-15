<template>
    <div class="popup-float-dialog-ctn">
		<div class="FULL float-dialog-mask" v-if="floatDialogList.length>0" />
		<FloatDialog v-for="(obj, i) in floatDialogList" :comClass="obj.cls" :key="`FloatDialog-${i}`"
			:param="obj.param" :suspend="i != (floatDialogList.length - 1)" v-show="i===(floatDialogList.length - 1)" />
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		let self = this;
		// 中央彈出視窗 (非全螢幕型)
		eventBus.$on("POPUP-FLOAT-DIALOG", (data)=>{
			// 未登入要彈出下單盒時 -> 要求交易登入
			if (this.requireTradeLoginMap[data.comClass] && !M4C.Trader.checkLoginTrade()) {
				// 登入完成後需自動彈出原本要彈的畫面 (需延後以免 LoginTrade 關到本彈窗)
				self.$store.state.login.loginReadyAction = function(){
					setTimeout(()=>{eventBus.$emit('POPUP-FLOAT-DIALOG', data);}, 50);
				};
				return;
			}
			self.floatDialogList.push({'cls': data.comClass, 'param': data.param, 'isPortrait': self.$store.state.status.isPortrait});
			// (非iOS) 利用 pushState + popState 以支持 Back-Button
			if (!self.$store.state.device.isDeviceIOS)
				history.pushState({isPortrait: self.$store.state.status.isPortrait}, '');
		});
		// 關閉中央視窗
		eventBus.$on("CLOSE-FLOAT-DIALOG", ()=>{
			if (self.floatDialogList.length === 0)
				return
			// iOS 單純控制 UI，不操作 history (for SideMenu@PWA)
			if (self.$store.state.device.isDeviceIOS) {
				self.floatDialogList.pop();
			}
			else {
				// 透過 popState 關閉彈窗
				history.back();
			}
		});		
	},
    mounted() {},
	beforeDestroy() {
		eventBus.$off("POPUP-FLOAT-DIALOG");
		eventBus.$off("CLOSE-FLOAT-DIALOG");
	},
	components: {},
    methods: {},
	watch: {},
    computed: {
		/** 需要有交易登入才可使用的元件 */
		requireTradeLoginMap() {
			return this.$store.state.config.requireTradeLoginMap;
		},
		/** 中央繃出視窗 (背後不會 suspend) */
		floatDialogList() {
			return this.$store.state.popup.floatDialogList;
		},
	},
}
</script>

<style scoped>
.float-dialog-mask {
	z-index: 4;
	background-color: rgba(0, 0, 0, 0.5);
}
</style>