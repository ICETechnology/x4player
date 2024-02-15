<template>
	<div v-if="isDelay" class="flex-col flex-center pdtb5 pdlr2 reciprocal-ctn h60vw top">
		<div class="clr-orange3">{{$ln('侦测到问题回报手势!，请在倒数结束前移动到您想回报的页面，以利截图，或点击取消执行问题回报')}}</div>
		<div class="flex-1 count-text flex-center clr-white">
			{{count}}
		</div>
		<div class="flex-row space-around w100p">
			<Button class="btn btn-cancel" @click="onBtnCancel">
				<i class="material-icons md-24 mgr1">close</i>{{$ln('取消')}}
			</Button>
			<Button class="btn btn-cancel" @click="onBtnExec">
				<i class="material-icons md-24 mgr1">check</i>{{$ln('进入回报')}}
			</Button>
		</div>
	</div>
</template>
<script>
import IssueReport from '@/components/Framework/IssueReport.vue';
import Button from './Button.vue';
export default {
	components: { Button },
	data() {
		return {
			isDelay: false,
			recordPos: [],
			count: 10,
			reciprocalInter: "",
			minTrackingLength: 10, // 最低可判斷軌跡。
			isLock: false,
		}
	},
	mounted() {
		let self = this;
		window.addEventListener("touchstart", (e)=>{
			let touch0 = e.targetTouches[0];
			self.isLock = false;
			// 右上觸發區塊
			if(touch0.pageY < self.issueActiveBlockH && touch0.pageX > self.deviceWidth * 0.85){
				self.isLock = true;
				e.stopPropagation();
			}
			self.onTouchStart(e)}, true);
		window.addEventListener("touchmove", (e)=>{
			// 鎖定時攔截事件
			if(self.isLock) e.stopPropagation();
			self.onTouchMove(e)}, true);
		window.addEventListener("touchend", (e)=>{
			// 鎖定時攔截事件
			if(self.isLock) e.stopPropagation();
			self.onTouchEnd(e);}, true);
		this.count = this.delayTime;
	},
	methods: {
		// 執行問題回報(倒數用的)
		onBtnExec() {
			this.onBtnCancel();
			setTimeout(this.execReport, 200);
		},
		// 取消執行問題回報(倒數用的)
		onBtnCancel() {
			let self = this;
			clearInterval(self.reciprocalInter);
			self.count = self.delayTime;
			self.reciprocalInter = "";
			self.isDelay = false;
		},
		// 倒數執行
		reciprocal() {
			// 不重复执行问题回报。
			if(this.reciprocalInter) return;
			let self = this;
			self.isDelay = true;
			this.reciprocalInter = setInterval(() => {
				self.count--;
				if(self.count <= 0){
					self.onBtnExec();
				}
			}, 1000);
		},
		onTouchStart(event) {
			this.recordPos = [];
			let touch0 = event.targetTouches[0];
			this.recordPos.push({x: touch0.pageX, y: touch0.pageY});
		},	
		onTouchMove(event) {
			let touch0 = event.targetTouches[0];
			this.recordPos.push({x: touch0.pageX, y: touch0.pageY});
		},
		onTouchEnd(event) {
			let touch0 = event.targetTouches[0];
			this.isLock = false;
			this.onActiveFinished();
		},
		onMouseStart(event) {
			this.emulatorTouch = true;
			event.targetTouches = [].concat(event);
			this.onTouchStart(event);
		},	
		onMouseMove(event) {
			if(this.emulatorTouch){
				event.targetTouches = [].concat(event);
				this.onTouchMove(event);
			}
		},
		onMouseEnd(event){
			if(this.emulatorTouch){
				event.targetTouches = [].concat(event);
				this.onTouchEnd(event);
			}
			this.emulatorTouch = false;
		},
		parseRecordPos() {
            if(this.isCheck){
				return "check";
			}
			if(this.isRightTopDown)
				return 'rightTopDown';
			// 由上往下拉
            if(this.isTopDown && !this.isSlashPos){
                return "topdown";
            }
            // 斜率合法判斷
            if(this.isSlashPos && 
                // 起始位置合法判斷
                (this.recordPos[0].x > (this.deviceWidth * 0.85) && this.recordPos[0].y < this.issueActiveBlockH )
                // 結束位置合法判斷
                && Math.abs(this.$safeFloat(this.recordPos[0].y - this.recordPos.slice(-1)[0].y)) > this.deviceHeight * 0.3) {
                return "slash";
			}
		},
		// 彈出問題回報。
		popupIssueReport() {
			eventBus.$emit("POPUP-DIALOG", IssueReport, {}, {$HEAD: {title: this.$ln(`问题与建议`)}, transName: 'float', zindex: 3});
			// 離開截圖狀態
			this.$store.state.onScreenShot = false;
		},
		execReport(){
			if(this.enableFeedBack) {
				// 進入截圖狀態
				this.$store.state.onScreenShot = true;
				// 延遲讓 OC 的 tabs-panel 的 transform(0.2s) 跑完
				setTimeout(()=>{M4C.Issue.catchScreen(this.popupIssueReport);}, 250);
			}
		},
		onActiveFinished() {
			// 已彈出問題回報就不再處理。
			if(this.isPopupIssueReport) return;
			let handpose = this.parseRecordPos();
			switch(handpose){
				// 右側上至下滑動
                case "rightTopDown":
                    this.execReport();
                    break;
				// 右上至左下滑動
                case "slash":
                    // this.execReport();
                    break;
				default:
					break;
			}
			this.recordPos = [];
		},
	},
	computed: {
		// 最高滑動啟始位置
		issueActiveBlockH() {
			return this.$safeFloat(this.deviceHeight / 15);
		},
		// 最低滑動高度
		issueActiveRange() {
			return this.$safeFloat(this.deviceHeight / 3);
		},
		// 裝置長度
		deviceHeight(){
			return this.$store.state.device.height;
		},
		// 裝置寬度
        deviceWidth(){
            return this.$store.state.device.width;
        },
		// 延遲時間
		delayTime() {return this.$store.state.config.feedbackDelayTime;},
		// 是否已彈出問題回報。
		isPopupIssueReport(){
			return this.$store.state.popup.dialogList.find(dlg => {
				return M4C.Analysis.getComponentClassName(dlg.cls) == "IssueReport";
			});
		},
		// quote的pdsetting是否啟用問題回報
		enableFeedBack() {
			if(this.$store.state.wsConnMap.quote.acPdSetting.function.feedback)
				return this.$store.state.wsConnMap.quote.acPdSetting.function.feedback.enable;
		},
        // 是否為斜線
        isSlashPos() {
            if(this.recordPos.length < this.minTrackingLength) return false; // 軌跡過短不分析。
            let deviceSlope = this.deviceHeight / this.deviceWidth;// 裝置斜率
            let maxSlope = this.$safeFloat(deviceSlope * 1.2); // 斜率最大限值
            let minSlope = this.$safeFloat(deviceSlope * 0.8); // 斜率最小限值
            let slashCount = 0;
            for(let i = 1; i < this.recordPos.length; i++) {
				// 兩點斜率
                let slope = this.$safeFloat((this.recordPos[i].y - this.recordPos[i-1].y) / (this.recordPos[i].x - this.recordPos[i-1].x));
				// 符合斜率限值加1
                if((Math.abs(slope) < maxSlope && Math.abs(slope) > minSlope) && Math.abs(slope) != 0 && slope != Number.POSITIVE_INFINITY) {
                    slashCount ++;
                }
            }
            // 回傳斜率至少一半是否在限值內。
            return this.$safeFloat(slashCount / this.recordPos.length) > 0.4;
        },
		// 是否為右側由上往下滑
        isRightTopDown() {
            if(this.recordPos.length < this.minTrackingLength) return false; // 軌跡過短不分析。
			// 長度確認。(滑動啟始位置在最高滑動啟始位置內且滑動長度超過最低滑動高度)
			let rangeYCheck = this.recordPos[0].y < this.issueActiveBlockH && this.recordPos.slice(-1)[0].y > this.issueActiveRange;
			// 寬度確認。(滑動過程不偏移最大寬度)
			let vaildateWidth = this.deviceWidth * 0.85;
			let availableX =  this.recordPos.filter(pos=>(pos.x > vaildateWidth));
			// 偏移超過最大寬度則無效。
			let rangeXCheck = availableX.length / this.recordPos.length == 1;
			// console.log(`isRightTopDown`,availableX.length, this.recordPos.length,  rangeXCheck, rangeYCheck);
            if(rangeYCheck && rangeXCheck) return true;
        },
	},
	watch: {
		delayTime(nv) {this.count = nv;},
	}
}
</script>
<style scoped>
.top{
	z-index: 99;
}
.reciprocal-ctn{
	position: absolute;
	top: 20vw;
	background-color: rgba(0,0,0,0.8);
	pointer-events: none;
}
.btn {
	pointer-events: all;
}
.count-text{
	font-size: 20vw;
}
</style>