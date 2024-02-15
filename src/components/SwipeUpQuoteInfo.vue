<!-- 未來若在其它地方需要類似此功能的元件時，應該此元件加以模組化 -->
<template>
    <div ref="quoteInfoParent" class="swipe-up-ctn flex-1 posr" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
		<!-- TChart / MixChart -->
		<slot></slot>
		<!-- 滑出式五檔明細 -->
		<div class="quote-info-ctn sys-bgc flex-col" :style="{top: infoCtnTop + 'px'}" :class="{duration: isDuration}" v-if="isPortrait">
			<MixQuoteInfo :tab-key="tabKey" v-if="$store.state.status.swipeUpContainerVisible || quoteInfoFullOpen"/>
		</div>
    </div>
</template>

<script>
import MixQuoteInfo from "@/components/Mix/mix.quote.info.vue";
export default {
	// 如果同一個頁面有兩份TabGroup則需要另外帶tabKey區分，不然會有問題。
	props: ["tabKey", "suspend", "value"],
	data() {
		return {
			/** 利用 isDuration 讓 touchmove 的時候不要套用漸變效果以免覺得遲鈍 */
			isDuration: false,
			infoCtnTop: 5000,
			swipeUpContainerVisible: false,
		}
	},
	beforeMount() {},
    mounted() {
		this.infoCtnHeight = this.infoCtnTop = this.$refs.quoteInfoParent.parentNode.offsetHeight;
	},
	beforeDestroy() {},
	components: {
		MixQuoteInfo,
	},
    methods: {
		onTouchStart(event) {
			let touch0 = event.targetTouches[0];
			this.startY = touch0.pageY;
			// 當前的 Top 位置
			this.curTop = this.infoCtnTop;
			// 本次位移
			this.moveY = 0;
			// 關閉漸變
			this.isDuration = false;
			// 點擊開始的時間
			this.touchStartTime = new Date();
		},
		onTouchMove(event) {
			let touch0 = event.targetTouches[0];
			this.moveY = touch0.pageY - this.startY;
			let top = this.curTop + this.moveY;
			this.infoCtnTop = top > 0 ? top : 0;
			// quoteInfo 是否可見 (可見時 KChart 的 move 不作動), 此作法是因為 KChart 與 QuoteInfo 同層級，無法透過 stopProgagation 阻止冒泡
			this.$store.state.status.swipeUpContainerVisible = this.infoCtnTop < this.infoCtnHeight;
		},
		onTouchEnd(event) {
			let moveY = Math.abs(this.moveY);
			if(moveY> 0 ) {
				// 支持快速滑動擴增滑動量
				let slideTime = new Date() - this.touchStartTime;
				let times = slideTime < 200 ? 10 : (slideTime < 500 ? 2 : 1);
				moveY *= times;
				// 方向
				let approveSide = (this.quoteInfoFullOpen && this.moveY > 0) ? false: true;
				this.isDuration = true;
				// 滑動達標 -> 切換顯示/隱藏
				if ( moveY > Math.abs(this.infoCtnHeight)/2) {
					// 反向拖曳才做處理
					if((this.quoteInfoFullOpen && this.moveY > 0) || (!this.quoteInfoFullOpen && this.moveY < 0)){
						this.$emit("input", !this.quoteInfoFullOpen);
						this.infoCtnTop = this.moveY > 0 ? this.infoCtnHeight: 0;
					}					
				}
				// 滑動未達標 -> 恢復
				else {
					this.infoCtnTop = this.quoteInfoFullOpen ? 0 : this.infoCtnHeight;
				}
				this.$store.state.status.swipeUpContainerVisible = this.infoCtnTop < this.infoCtnHeight;
			}
		},
	},
	watch: {
		/** 支持從 Vuex:quoteInfoFullOpen 控制是否要顯示出選單 */
		quoteInfoFullOpen(nv, ov) {
			// 根據顯示隱藏來設定
			if(nv != ov){
				this.isDuration = true;
				this.infoCtnTop = nv? 0: this.infoCtnHeight;
				this.$store.state.status.swipeUpContainerVisible = nv;
			}
		},
	},
    computed: {
		/** 支持從 Vuex:quoteInfoFullOpen 控制是否要顯示出選單 */
		quoteInfoFullOpen: function() {
			return this.value == true;
		},
		isPortrait() {
			return this.$store.state.status.isPortrait;
		},
	},
}
</script>

<style scoped>
/* InfoCtn 容器 */
.quote-info-ctn {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	height: 100%;
	transition-property: top;
}
/* 漸變效果期間 */
.quote-info-ctn.duration {
	transition-duration: .3s;
}
</style>