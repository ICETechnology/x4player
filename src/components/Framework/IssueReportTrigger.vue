<template>
    <div ref="ctn" class="issue-report-trigger pointer-events-none" />
</template>

<script>
import IssueReport from '@/components/Framework/IssueReport.vue';
export default {
	props: [],
	data() {
		return {
			// 滑動距離超過此數值就觸發
			triggerDistance: 150,
		}
	},
	beforeMount() {
		document.addEventListener("touchstart", this.onDocumentTouchStart, true);
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onDocumentTouchStart(e) {
			let touch0 = e.targetTouches[0];
			let x = touch0.pageX;
			let y = touch0.pageY;
			let ctn = this.$refs.ctn;
			// 僅限 ctn 範圍內可觸發拖動
			if (x > ctn.offsetLeft && x < ctn.offsetLeft + ctn.offsetWidth && y > ctn.offsetTop && y < ctn.offsetTop + ctn.offsetHeight)
				this.onTouchStart(e);
		},
		onTouchStart(e) {
			if (this.isPopupIssueReport) return;			
			let touch0 = e.targetTouches[0];
			this.startX = touch0.pageX;
			this.startY = touch0.pageY;
			document.addEventListener('touchmove', this.onTouchMove, false);
			document.addEventListener('touchend', this.onTouchEnd, false);
		},
		onTouchMove(e) {
			let touch0 = e.targetTouches[0];
			this.moveX = touch0.pageX;
			this.moveY = touch0.pageY;
		},
		onTouchEnd(e) {
			document.removeEventListener('touchmove', this.onTouchMove, false);
			document.removeEventListener('touchend', this.onTouchEnd, false);
			let a = this.moveX - this.startX;
			let b = this.moveY - this.startY;
			let distance = Math.sqrt(a*a + b*b);
			if (distance > this.triggerDistance)
				this.catchScreen();
			delete this.moveX;
			delete this.moveY;
		},
		// 開始截圖
		catchScreen(){
			if (this.enableFeedBack) {
				// 進入截圖狀態
				this.$store.state.onScreenShot = true;
				// 延遲讓 OC 的 tabs-panel 的 transform(0.2s) 跑完
				setTimeout(()=>{M4C.Issue.catchScreen(this.popupIssueReport);}, 250);
			}
		},
		// 彈出問題回報
		popupIssueReport() {
			eventBus.$emit("POPUP-DIALOG", IssueReport, {}, {transName: 'float', zindex: 9});
			// 離開截圖狀態
			this.$store.state.onScreenShot = false;
		},
	},
	watch: {},
    computed: {
		// 是否啟用問題回報
		enableFeedBack() {
			try{return this.$store.state.wsConnMap.quote.acPdSetting.function.feedback.enable;}catch(e){}
		},
		// 是否已彈出問題回報。
		isPopupIssueReport(){
			return this.$store.state.popup.dialogList.find(dlg => {
				return M4C.Analysis.getComponentClassName(dlg.cls) == "IssueReport";
			});
		},
	},
}
</script>

<style scoped>
.issue-report-trigger {
	z-index: 99;
	position: absolute;
	top: 0;
	right: 0;
	width: 70px;
	height: 70px;
	opacity: 0;
	background-color: blue;
}
</style>