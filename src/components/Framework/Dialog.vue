<template>
	<transition :name="popupStyle" appear>
		<div ref="dialogCtn" class="flex-col dialog-ctn sys-bgc"
			@touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd"
			:class="{transitionDuration: transitionDuration, 'bgc-transparent': $store.state.bgcTransparent}" :style="{'z-index': config ? config.zindex : null}">
			<!-- slide模式(預設)的表頭 -->
			<MyHead class="head zindex-1" :backType="1" :acc-btn=false 
				v-if="titleText && popupStyle == 'slide' && comClass != 'TvcKbar'" :showText="$ln(titleText)" :margin="false"></MyHead>
			<!-- tvcKbar的表頭 -->
			<TvcKbarHead class="head zindex-1" :backType="1" :acc-btn=false 
				v-if="titleText && popupStyle == 'slide' && comClass == 'TvcKbar'" :showText="$ln(titleText)" :margin="false"></TvcKbarHead>
			<!-- float模式的表頭 (同时支持外部传入或由内部元件传入标题文字) -->
			<div class="flex-row float-head pd3 zindex-1 posr" v-if="popupStyle == 'float' && !propParam.noHead" :style="propParam.headStyle">
				<span class="flex-1">{{$ln(titleText)}}</span>
				<!-- 支持更多功能按鈕 -->
				<component class="mgr3" v-for="objClass in config.moreBtns" :is="objClass" />
				<!-- 支持樣式切換-->
				<i @click="onBtnStyleLoop" class="material-icons mgr2 tcef" v-if="styleLoopData">{{styleLoopData.useIcon? styleLoopSelected: 'loop'}}</i>
				<!-- 文章內容字體調整按鈕 -->
				<FontSizeAdjustBtn v-if="showAdjustBtn" class="fontsize-adjust-btn flex-1 flex-center"/>
				<!-- 關閉圖示 -->
				<i class="material-icons tcef" v-if="enableClose" @click="onBtnBack" :class="{opacity0: !$store.state.sync.floatDialogCloseIcon}">close</i>
			</div>
			<div :class="[param && param.fixdTop? '': 'flex-1 posr']">
				<component class="FULL flex-1" :class="{'mgt3': param && param.fixdTop}" :is="comClass" @fontSizeAdjust="(v)=>{showAdjustBtn = v}"
					:param="param" :suspend="childSuspend" @title="txt => titleByChild = txt" @styleLoopData="onStyleLoopData">
				</component>
			</div>
			<!-- 滑動感應輔助區塊 -->
			<div class="side-sensor-ctn" v-if="this.$store.state.status.isPortrait"></div>
			<!-- tvcKbar底下 -->
			<div v-if="titleText && popupStyle == 'slide' && comClass == 'TvcKbar'" class="navigator-option flex-row pdtb4 pdlr2 flex-around">
				<OrderBSBtn v-model="$store.state.order.inputOrderQty" :orderType="'LIMIT'" class="mglr2 flex-3 space-around mgb1" :qoPrice="price" shortText="true" :useComName="selfComName"  />
			</div>
		</div>
	</transition>
</template>

<script>
import FontSizeAdjustBtn from '@/components/ArticleContentFontSizeAdjustBtn';
import OrderBSBtn from "@/components/OrderBSBtn.vue";
import QuotePageSub from "@/components/QuotePageSub.vue";

export default {
	props: ['comClass', 'param', 'suspend', 'config'],
	data() {
		return {
			/** 動畫過場 */
			transitionDuration: true,
			/** 子元件一律預設停用，等待動畫 */
			childSuspend: true,
			/** 由子組件決定標題文字 */
			titleByChild: '',
			/** 循環樣式資料 */
			styleLoopData: '',
			showAdjustBtn: false,
		}
	},
	beforeMount() {},
    mounted() {
		let self = this;
		// 動畫時間結束才讓子元素啟用 (延遲時間應配合動畫時間)
		setTimeout(()=>{
			self.childSuspend = self.suspend;
		}, 300);
		// 關閉按鈕恢復可視
		this.$store.state.sync.floatDialogCloseIcon = true;
		eventBus.$emit("DIALOG-ACTIVE");
	},
	beforeDestroy() {eventBus.$emit("DIALOG-DESTORY");},
	components: {FontSizeAdjustBtn, OrderBSBtn, QuotePageSub},
    methods: {
		// 子組件有丟出樣式資料時，設定dialog樣式清單資料
		onStyleLoopData(obj) {
			this.$set(this, "styleLoopData", obj);
		},
		// 循環切換樣式
		onBtnStyleLoop() {
			let idx = this.styleLoopList.indexOf(this.styleLoopSelected);
			this.styleLoopData.data.splice(0,1, this.styleLoopList[idx + 1] || this.styleLoopList[0]);
		},
		onBtnBack() {
			eventBus.$emit("CLOSE-DIALOG");
			eventBus.$emit("LOGIN-CLOSE-DIALOG");
		},
		onTouchStart(event) {
			if(this.isLock) return;
			let touch0 = event.targetTouches[0];
			// 本次點擊開始的 X
			this.touchStartX = touch0.pageX;
			this.touchStartY = touch0.pageY;
			// 本次位移
			this.moveX = 0;
			this.moveY = 0;
			// 關閉漸變 (為了跟隨手指)
			this.transitionDuration = false;
			// 點擊開始的時間
			this.touchStartTime = new Date();
		},
		onTouchMove(event) {
			if(this.isLock) return;
			let touch0 = event.targetTouches[0];
			if (this.popupStyle == "float") {
				let moveY = touch0.pageY - this.touchStartY;
				moveY = this.moveY = moveY >= 10 ? moveY : 0;
				this.$refs.dialogCtn.style.transform = `translate3d(0, ${moveY}px, 0)`;
			}
			else {
				let moveX = touch0.pageX - this.touchStartX;
				moveX = this.moveX = moveX >= 10 ? moveX : 0;
				this.$refs.dialogCtn.style.transform = `translate3d(${moveX}px, 0, 0)`;
			}
		},
		onTouchEnd(event) {
			if(this.isLock) return;
			// 支持快速滑動擴增滑動量
			let slideTime = new Date() - this.touchStartTime;
			let times = slideTime < 200 ? 10 : (slideTime < 500 ? 2 : 1);
			let move = this.popupStyle == "float" ? this.moveY : this.moveX;
			move *= times;

			// 開啟漸變
			this.transitionDuration = true;
			// 向右滑動達標 -> 關閉視窗
			if (move > this.$store.state.device.width/2) {
				// 關閉視窗 (ios 需要 setTimeout 以延遲到 duration 生效)
				setTimeout(()=>{
					eventBus.$emit("CLOSE-DIALOG");
					eventBus.$emit("LOGIN-CLOSE-DIALOG");
				}, 1);
			}
			// 向右滑動未達標 -> 恢復
			else {
				this.$refs.dialogCtn.style.transform = `translate3d(0, 0, 0)`;
			}
		},	
	},
	watch: {
		suspend(nv, ov){
				this.childSuspend = nv;
		}
	},
    computed: {
		sid() {return this.$store.state.selectedSymbol.ID;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		propParam() {
			return this.config || {};
		},
		popupStyle() {
			return this.propParam.transName || 'slide';
		},
		isLock() {return this.propParam.lock || false;},
		// 是否顯示關閉按鈕
		enableClose() {
			if (this.propParam.disableClose)
				return false;
			if (this.$store.state.status.orientation !== 'portrait')
				return false;
			return true;
		},
		dataKey() {
			return this.styleLoopData.key;
		},
		styleLoopList() {
			if(this.styleLoopData.data)
				// 以第二筆以後當清單
				return this.styleLoopData.data.slice(1);
		},
		styleLoopSelected() {
			if(this.styleLoopData.data)
				// 以第一筆當選取的資料
				return this.styleLoopData.data[0];
		},
		titleText() {
			return this.propParam.$HEAD ? this.propParam.$HEAD.title : this.titleByChild;
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		price(){
			try{return this.$symbolPrice(this.sid, this.$store.state.selectedSymbol.QO.p);}catch (e) {}
		}
    }
}
</script>

<style scoped>
.dialog-ctn {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	z-index: 3;
	/* 寬度使用 100% (避免使用 100vw) 以免觸發 vue + v-model(切分K) 產生套用 width 漸變效果，導致轉向時繪圖尺寸錯誤的問題 */
	width: 100%;
}
/* 漸變效果期間 (靠改變 style.transitionDuration 無效，需要用 class) */
.dialog-ctn.transitionDuration {
	transition-duration: .3s;
}

/* v-enter   ：定义进入过渡的开始状态 */
/* v-leave-to：定义离开过渡的结束状态 */
.slide-enter, .slide-leave-to {
    transform: translate3d(100%, 0, 0) !important;
}
/* v-enter   ：定义进入过渡的开始状态 */
/* v-leave-to：定义离开过渡的结束状态 */
.float-enter, .float-leave-to {
	transform: translate3d(0, 100%, 0) !important;
	opacity: 0;
}

/* 滑動感應輔助區塊 */
.side-sensor-ctn {
	position: absolute;
	top: 50px;
	left: 0;
	bottom: 0;
	width: 10px;
	z-index:2;
	/* background-color: blue; */
}
.toggle-btn{
	width: 9vw;
	height: 9vw;
	position: absolute;
	bottom: 1vw;
	left: 1vw;
	z-index: 2;
	background-color: rgba(0,0,0,0.4);
}
/* 文章內容字體調整按鈕位置 */
.fontsize-adjust-btn {
	position: absolute;
	top: 2vw;
	left: 50%;
    transform: translateX(-50%);
}
.divider-left {
	border-left: 1px solid gray;
	height: 1em;
}
@media screen and (max-height: 620px) {
	.float-head {
		padding: 1vw;
	}
}
@media screen and (orientation: landscape) {
	.navigator-option {
		position: absolute;
    	visibility: hidden;
	}
}
</style>