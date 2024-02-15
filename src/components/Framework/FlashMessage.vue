<template>
	<transition name="ease">
		<div class="flash-message wrapper" v-if="message">
			<div class="container" :style="cpuStyle">
				<div class="content">
					<slot>{{message}}</slot>
				</div>
			</div>
		</div>
	</transition>
</template>
<script>
export default {
	data() {
		return {
			/** 預設的背景色 */
			defaultBGClr: "red",
			/** 背景色響應式變數 */
			bgClr: "",
			/** 要顯示的文字訊息 */
			message: "",
			/** 預設顯示 2000ms */
			delay: 2000,
		};
	},
	beforeMount: function() {
		// 快閃訊息視窗
		eventBus.$on("FLASHMESSAGE", (msg, param)=>{
			this.active(this.$ln(msg), param);
		});
	},
	methods: {
		/** 
		 * param.bgClr : 本次彈出的背景色 
		 * param.delay : 本次彈出要顯示多久
		 * */
		active(msg, param = {}) {
			// 支持帶入 bgClr 決定本次彈出的背景色
			this.bgClr = param.bgClr || this.defaultBGClr;
			this.message = this.$ln(msg);
			if (this.flashMsg) {
				clearTimeout(this.flashMsg);
			}
			this.flashMsg = setTimeout(() => {
				this.close();
			}, param.delay || this.delay);
		},
		close() {
			this.message = "";
		}
	},
	computed: {
		cpuStyle() {
			return `background-color: ${this.bgClr}`;
		}
	}
};
</script>
<style lang='scss' scoped>
.wrapper {
	@extend .flex-item;
	@extend .FULL;
	justify-content: center;
	align-items: center;
	pointer-events: none;
	z-index: 999;
}
.container {
	border: 1px solid #FFF;
	border-radius: 5px;
	padding: 0 15px;
}
.content {
	@extend .flex-item;
	justify-content: center;
	align-items: center;
	text-align: center;
	max-width: 80vw;
	max-height: 80vh;
	min-width: 40vw;
	min-height: 10vh;
}
.ease-leave-to,
.ease-enter {
	opacity: 0;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.ease-leave-active,
.ease-enter-active {
	transition-duration: .5s;
	transition-property: opacity;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.ease-leave,
.ease-enter-to {
	opacity: 1;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
</style>