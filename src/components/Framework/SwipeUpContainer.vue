<template>
    <div ref="swipeUpCtn" class="flex-center" v-stop-propagation-y
		@touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
		<slot></slot>
    </div>
</template>

<script>
export default {
	props: ["value", "disable"],
	data() {
		return {
			targetCtnTop: 5000,
		}
	},
	beforeMount() {},
    mounted() {
		this.targetCtn = this.$refs.swipeUpCtn.querySelector(".swipe-up-target");
		// 防錯判斷，因為如果沒有targetCtn，會在取offsetHeight出Exception問題。
		if(this.targetCtn)
			this.targetCtnTop = this.targetCtnHeight = this.targetCtn.offsetHeight;
	},
	beforeDestroy() {this.$store.state.status.swipeUpContainerVisible = false},
	components: {},
    methods: {
		onTouchStart(event) {
			// 無效時不執行
			if(this.disable_up) return;
			let touch0 = event.targetTouches[0];
			this.startY = touch0.pageY;
			// 當前的 Top 位置
			this.curTop = this.targetCtnTop;
			// console.log(`SwipeUpContainer.curTop`, this.curTop);
			// 本次位移
			this.moveY = 0;
			// 關閉漸變
			this.targetCtn.classList.remove("duration");
			// 點擊開始的時間
			this.touchStartTime = new Date();
		},
		onTouchMove(event) {
			if(this.disable_up) return;
			let touch0 = event.targetTouches[0];
			this.moveY = touch0.pageY - this.startY;
			let top = this.curTop + this.moveY;
			this.targetCtnTop = top > 0 ? top : 0;
			this.targetCtn.style.top = `${this.targetCtnTop}px`;
			this.$store.state.status.swipeUpContainerVisible =	this.targetCtnTop < this.targetCtnHeight;
		},
		onTouchEnd(event) {
			if(this.disable_up) return;
			// 支持快速滑動擴增滑動量
			let slideTime = new Date() - this.touchStartTime;
			let times = slideTime < 200 ? 10 : (slideTime < 500 ? 2 : 1);
			this.moveY *= times;
			// 方向正確性
			let approveSide = (this.value && this.moveY > 0) || (!this.value && this.moveY < 0);
			// 滑動達標 -> 切換顯示/隱藏
			if (approveSide && Math.abs(this.moveY) > Math.abs(this.targetCtnHeight)/2) {
				this.$emit("input", !this.value);
			}
			// 處理未達標時回復的動畫效果(會先執行)
			this.updateTop();
		},
		// 同步定位
		updateTop() {
			let offsetHeight = this.$refs.swipeUpCtn.querySelector(".swipe-up-target").offsetHeight;
			// 開啟漸變
			this.targetCtn.classList.add("duration");
			this.targetCtnTop = this.value ? 0 : this.targetCtnHeight || offsetHeight;			
			this.targetCtn.style.top = `${this.targetCtnTop}px`;
			this.$store.state.status.swipeUpContainerVisible = this.targetCtnTop < this.targetCtnHeight;
		},
	},
	watch: {
		value(nv) {
			// 處理達標時滑動至頂、底的動畫效果(非同步)
			this.updateTop();
		},
		// 處理當滑動過快而無觸發touchend事件導致v-model中的資料沒有變動問題。
		"$store.state.status.swipeUpContainerVisible"(nv) {
			if(this.value != nv) {
				this.$emit("input", nv);
			}
		}
	},
    computed: {
		// 判斷該是否可執行swipeUpContent
		disable_up() {
			return this.disable && !this.value;
		}
	},
}
</script>

<style>
/* ContentCtn 容器 */
.swipe-up-target {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	height: 100%;
	transition-property: top;
}
/* 漸變效果期間 */
.swipe-up-target.duration {
	transition-duration: .3s;
}
</style>