<template>
	<div class="popup-dialog-ctn" :class="{'bgc-transparent': $store.state.bgcTransparent}">
		<!-- 滑入視窗 -->
		<Dialog v-for="(obj, i) in dialogList" :comClass="obj.cls" :key="`Dialog-${i}`"
			:param="obj.param" :suspend="i != (dialogList.length - 1)" :config="obj.config" 
			:class="{'opacity0': $store.state.bgcTransparent && i != (dialogList.length-1)}" />
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
		// 全螢幕滑入視窗
		eventBus.$on("POPUP-DIALOG", (comClass, param, config)=>{
			// 未登入要彈出下單盒時 -> 要求交易登入
			if (this.requireTradeLoginMap[comClass] && !M4C.Trader.checkLoginTrade()) {
				// 登入完成後需自動彈出原本要彈的畫面 (需延後以免 LoginTrade 關到本彈窗)
				self.$store.state.login.loginReadyAction = function(){
					setTimeout(()=>{eventBus.$emit('POPUP-DIALOG', comClass, param, config);}, 50);
				};
				return;
			}
			let dialogObj = {'cls': comClass, 'param': param, 'isPortrait': self.$store.state.status.isPortrait, 'config': config};
			// 檢查是否有要求鎖定在頂層的彈窗
			let fixedIdx = self.dialogList.findIndex((obj)=>{return obj.config && obj.config.fixedTop;});
			if (fixedIdx !== -1) {
				// 插入至鎖定頂層彈窗之前(被遮蓋)
				self.dialogList.splice(fixedIdx, 0, dialogObj);
			}
			else {
				// 新增到最後一個(最上層)
				self.dialogList.push(dialogObj);
			}
			// 關閉 SideMenu
			this.$store.state.status.showSideMenu = false;
			// 關閉 更多
			this.$store.state.status.displayExtraMenu = false;
			// (非iOS) 利用 pushState + popState 以支持 Back-Button
			if (!self.$store.state.device.isDeviceIOS)
				history.pushState({isPortrait: self.$store.state.status.isPortrait}, '');
		});
		// 關閉全螢幕滑入視窗
		eventBus.$on("CLOSE-DIALOG", ()=>{
			if (self.dialogList.length === 0)
				return
			// iOS 單純控制 UI，不操作 history (for SideMenu@PWA)
			if (self.$store.state.device.isDeviceIOS) {
				self.dialogList.pop();
			}
			else {
				// 透過 popState 關閉彈窗
				history.back();
			}
		});
		// 關閉全部彈窗
		eventBus.$on("CLOSE-ALL-DIALOG", ()=>{
			for (let i=0; i<self.dialogList.length; i++) {
				setTimeout(()=>{eventBus.$emit("CLOSE-DIALOG");}, i*100);
			}
		});
		// 關閉之後的彈窗
		eventBus.$on("CLOSE-DIALOG-AFTER", (cls, param)=>{
			const findIndex = this.dialogList.findIndex((obj)=>obj.cls === cls);
			if(findIndex < 0) return;
			for (let i=0; i<self.dialogList.length - 1 - findIndex; i++) {
				eventBus.$emit("CLOSE-DIALOG");
			}
		});
	},
    mounted() {},
	beforeDestroy() {
		eventBus.$off("POPUP-DIALOG");
		eventBus.$off("CLOSE-DIALOG");
	},
	components: {},
    methods: {},
	watch: {
		/** 關閉彈窗送出統計 */
		popupDialogCount(nv, ov) {
			if (nv < ov) {
				if (nv === 0) {
					M4C.Analysis.componentEnter(this.$store.state.layout.body);
				}
				else {
					let dlg = this.dialogList[this.dialogList.length-1];
					M4C.Analysis.componentEnter(dlg.cls);
				}
			}
		},
	},
    computed: {
		dialogList() {
			return this.$store.state.popup.dialogList;
		},
		/** 當前彈窗數量 */
		popupDialogCount() {
			return this.dialogList.length;
		},
		/** 需要有交易登入才可使用的元件 */
		requireTradeLoginMap() {
			return this.$store.state.config.requireTradeLoginMap;
		},
	},
}
</script>

<style scoped>
</style>