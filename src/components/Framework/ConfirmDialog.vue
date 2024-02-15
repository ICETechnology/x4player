<template>
	<transition name="show">
		<div class="confirm-dialog wrapper font-size-small" v-if="confirmData && Object.keys(this.confirmData).length>0" @click.self="close" >
			<div class="container fd-content-bgc" :style="{top: param.top}">
				<div class="title warring-word pd3 clr-gray" :class="[param.titleClass]" >{{$ln(confirmData.title||"")}}</div>
				<div v-if="!param.contentComponent" class="content pdlr3 pdb5">
					{{confirmData.content||""}}
					<span v-html="confirmData.htmlContent||''"></span>
				</div>
				<div v-if="param.contentComponent" class="content pdlr3 pdb5">
					<component :is="param.contentComponent" />
				</div>
				<div class="foot flex-row">
					<div v-if="!confirmData.confirmOnly" class="flex-center flex-1 fd-content-bdc tcef cancel-btn" @click="cancel">{{$ln(confirmData.cancelText || `取消`)}}</div>
					<div class="flex-center flex-1 fd-content-bdc tcef confirm-btn" :class="{'confirm-only': confirmData.confirmOnly}" @click="excute">{{$ln(confirmData.confirmText || `确认`)}}</div>
				</div>
			</div>
		</div>
  </transition>
</template>
<script>
export default {
	data() {
			return {
				param: {},
			};
	},
	beforeMount(){
		let self = this;
		// 彈出確認視窗(新)
		eventBus.$on("CONFIRM-DIALOG", (param)=>{
			self.$store.state.confirmDialog.data = this.param = param;
			// (非iOS) 利用 pushState + popState 以支持 Back-Button
			if (!self.$store.state.device.isDeviceIOS)
				history.pushState({isPortrait: self.$store.state.status.isPortrait}, '');
		});
		// 關閉確認視窗(新)
		eventBus.$on("CLOSE-CONFIRM", ()=>{
			if (self.$store.state.device.isDeviceIOS)
				self.$store.state.confirmDialog.data = null;
			else
				history.back();
		});
	},
	beforeDestroy() {
		eventBus.$off("CONFIRM-DIALOG");
		eventBus.$off("CLOSE-CONFIRM");
	},
	watch: {
	},
	components: {},
	computed:{
		/** 確認設定資料 */
		confirmData() {
			return this.$store.state.confirmDialog.data;
		},
	},
	methods: {
		close(){
			// 若有帶入『不要在點擊遮罩時關閉』
			if (this.param.disableClickMaskClose)
				return;
			eventBus.$emit("CLOSE-CONFIRM");
			eventBus.$emit("LOGIN-CLOSE-CONFIRM");
		},
		cancel() {
			if (this.confirmData.cancel)
				this.confirmData.cancel();
			// 延遲關窗以確保不會因關窗把 confirmData 清掉而產生 exception
			setTimeout(()=>{
				eventBus.$emit("CLOSE-CONFIRM");
				eventBus.$emit("LOGIN-CLOSE-CONFIRM");
			}, 10);
		},
		excute() {
			let result;
			if (this.confirmData.confirm)
				result = this.confirmData.confirm(this);
			// 支持回传值指定不要关闭弹窗
			if (result === 'NOT-CLOSE') {
				return;
			}
			// 延遲關窗以確保不會因關窗把 confirmData 清掉而產生 exception
			setTimeout(()=>{
				eventBus.$emit("CLOSE-CONFIRM");
				eventBus.$emit("LOGIN-CLOSE-CONFIRM");
			}, 10);
		},
	},
};
</script>
<style scoped>
.wrapper {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	margin: auto;
	z-index: 8;
	background-color: rgba(0,0,0,0.5);
}
.container {
	width: 70%;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	/* background-color: rgba(63, 63, 63); */
	border-radius: 2vw;
}
.title {
	text-align: center;
	/* color: rgba(255, 133, 52); */
	/* padding-top: 1em; */
}
.content {
	max-height: 180px;
	border-radius: 2vw 0;
	text-align: center;
	overflow-y: auto;
	word-wrap: break-word;
}
.mt5{
	margin-top: 5px;
}
.clr-white{
	color: white !important;
}
.footer {
	text-align: center;
	border-top: 1px solid #333;
}
.warring-word {
	/* font-size: 1.2em; */
}
.remove-btn {
	width: 100%;
	background-color: red;
	border-radius: 5px;
	padding: 10px;
	color: white;
	border: 0px;
}
.btn {
	background: none;
	border: none;
	/* background-color: rgba(63, 63, 63, 0.747); */
	border-radius: 2px;
	color: inherit;
	width: 100%;
	padding: 15px 0;
}
.btnL {
  	border-radius: 0 0 15px 0;
}
.btnF {
	border-radius: 0 0 0 15px;
	border-right: 1px solid #333;
}
.show-leave-to,
.show-enter {
	/* transform: translate(-100%,-100%) scale(0); */
	opacity: 0.5;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.show-leave-active,
.show-enter-active {
	transition-duration: 0.3s;
	transition-property: all;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.show-leave,
.show-enter-to {
	/* transform: translate(0) scale(1); */
	opacity: 1;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}

/* 桌機版 */
.desktop .wrapper {
	z-index: 99;
}
.desktop .container {
	width: 300px;
	max-width: 300px;
}
</style>


