<template>
    <div ref="ctn" class="drag-down-ctn pointer-events-none">
		<div class="content-ctn" :style="{top: `${top}px`, height: `${height}px`}" :class="{duration: duration}">
			<slot></slot>
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			top: -1000,
			height: 0,
			/** 顯示 OC 畫面 */
			display: false,
			/** 漸變效果期間 */
			duration: false,
		}
	},
	beforeMount() {
	},
    mounted() {
		document.addEventListener("touchstart", this.onDocumentTouchStart, true);
		// 由 slot 呼叫出來要求關閉的事件
		let self = this;
		this.$on('close', ()=>{
			self.display = false;
		});
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onDocumentTouchStart(e) {
			// 最上方是上滑式彈窗時 (floatName:"float")
			if (this.existFloatDialog)
				return;
			let touch0 = e.targetTouches[0];
			let x = touch0.pageX;
			let y = touch0.pageY;
			let ctn = this.$refs.ctn;
			// 已經在顯示狀態時，一律可拖動
			if (this.display)
				this.onTouchStart(e);
			// 僅限 drag-down-ctn 範圍內可觸發拖動
			if (x > ctn.offsetLeft && x < ctn.offsetLeft + ctn.offsetWidth && y > ctn.offsetTop && y < ctn.offsetTop + ctn.offsetHeight)
				this.onTouchStart(e);
		},
		onTouchStart(e) {
			// event.stopPropagation();
			// 首次 touchstart 才抓高度，避免在 mounted 就抓，在 iphone12 可能出現問題
			if (!this.height) {
				this.height = window.innerHeight;
				this.top = -this.height;
			}
			let touch0 = e.targetTouches[0];
			this.startY = touch0.pageY;
			this.startTop = this.top;
			this.touchStartTime = new Date();
			this.duration = false;
			this.moveY = 0;
			// 由 document 監聽 mousemove
			document.addEventListener('touchmove', this.onTouchMove, false);
			document.addEventListener('touchend', this.onTouchEnd, false);
		},
		onTouchMove(e) {
			// event.stopPropagation();
			let touch0 = e.targetTouches[0];
			this.moveY = touch0.pageY - this.startY;
			this.top = this.startTop + this.moveY;
			// 防止全開時又往下拉
			this.top = this.top > 0 ? 0 : this.top;
		},
		onTouchEnd(e) {
			// event.stopPropagation();
			document.removeEventListener('touchmove', this.onTouchMove, false);
			document.removeEventListener('touchend', this.onTouchEnd, false);
			// 支持快速滑動擴增滑動量
			let slideTime = new Date() - this.touchStartTime;
			let times = slideTime < 200 ? 10 : (slideTime < 500 ? 2 : 1);
			this.moveY *= times;
			// 方向正確性
			let approveSide = (this.display && this.moveY < 0) || (!this.display && this.moveY > 0);
			// 滑動達標 -> 切換顯示/隱藏
			if (approveSide && Math.abs(this.moveY) > Math.abs(this.height)/2)
				this.display = !this.display;
			if (this.moveY)
				this.updateTop();
		},
		updateTop() {
			// 開啟漸變
			this.duration = true;
			this.top = this.display ? 0 : -this.height;
		},
	},
	watch: {
		display(nv) {
			this.updateTop();
		},
	},
    computed: {
		existFloatDialog() {
			let dialogList = this.$store.state.popup.dialogList;
			try{return dialogList[dialogList.length-1].config.transName === "float";}catch(e){}
		},
	},
}
</script>

<style scoped>
.content-ctn {
	position: fixed;
	left: 0;
	right: 0;
	background-color: #111820;
	pointer-events:initial;
}
/* 漸變效果期間 */
.duration {
	transition-duration: .3s;
}
</style>