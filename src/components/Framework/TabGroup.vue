<template>
    <div class="tab-group-ctn flex-1 flex-column w100p">
    	<div v-if="!hiddenTab" class="head flex-row font-bold clr-gray" :class="{'fixHead': fixHead}">
			<div ref="tabCtn" class="flex-1 flex-row tab-ctn">
				<span v-for="(item, idx) in tabList" :key="'Tab'+idx" class="flex-1 flex-center flex-column tcef" @click="onTabClick(idx)">
					<!-- 文字型頁簽 -->
					<span v-if="item.label" class="tab flex-1 flex-center posr" :class="{selected: activeIdx==idx}">
						{{$ln(item.label)}}
						<span class="icon-alert" v-if="item.alert"></span>
					</span>
					<!-- 元件型頁簽 -->
					<component v-if="item.labelClass" :is="item.labelClass" class="tab flex-1 flex-center posr" :class="{selected: activeIdx==idx}" />
				</span>
			</div>
		</div>
    	<div class="body flex-1 posr">
			<div class="FULL swiper-container" :class="'swiper-container-'+tabKey" v-show="!$store.state.desktop.dragCom">
				<div class="swiper-wrapper">
					<div class="swiper-slide" :class="{'posr': !stretch}" v-for="(obj, idx) in tabList">
						<component ref="com" class="tab-group-component" :class="{'FULL': !stretch}" :is="obj.comClass" :param="obj.param" :sid="obj.sid" @alertTab="onAlertTab(obj)"
							v-if="activeIdx==idx || lastActiveIdx==idx || keepAliveMap[idx] || prevNextMap[idx]"
							:suspend="suspend || (activeIdx!=idx && lastActiveIdx!=idx)" :visibility="activeIdx===idx"
							></component>
					</div>
				</div>
			</div>
		</div>
    </div>
</template>

<script>
import Swiper from 'swiper';
import '@/css/swiper.4.5.0.min.css'
var VueScrollTo = require('vue-scrollto');

export default {
	// 帶入 tabKey 以啟用 [記憶最後選取] 的功能
	props: ['tabList', 'tabKey', 'suspend', 'keepAlive', 'hiddenTab', 'selectedIdx', 'ctn', 'stretch', 'fixHead', 'disablePrevNext'],
	data() {
		let storageKey = `${this.$store.state.config.projectID}_TABGROUP_${this.tabKey}_SELECTED_IDX`;
		return {
			storageKey: storageKey,
			/** 當前啟動的元件index */
			activeIdx: 0,
			/** 當前啟動的頁簽 */
			activeTab: null,
			/** 滑動過程中，activeIdx 的前/後想要呈現的元件的index */
			lastActiveIdx: -1,
			/** 有要求 keepAlive 時，已經開過的元件不消滅 */
			keepAliveMap: {},
			/** 當前頁簽的前後頁簽的index，用以讓前後頁簽存活 */
			prevNextMap: {},
        }
	},
	beforeMount() {
		let self = this;
		vuex.status.tabGroup = this;
		// 取得預設的 activeIdx (不可放在 data() 裡會拿不到 storageKey)
		this.activeIdx = this.getInitActiveIdx();
		// 若 activeIdx 大於現有的 tabList 數量 (受最後儲存影響) -> 切回第一個頁簽
		this.activeIdx = this.activeIdx >= this.tabList.length ? 0 : this.activeIdx;
		this.activeTab = this.tabList[this.activeIdx];
		// keepAlive : 已經開過的元件不消滅
		if (this.keepAlive) this.keepAliveMap[this.activeIdx] = true;

		// 支持 AlertByEvent 機制 : 指定 event 觸發該頁簽的小紅點
		this.tabList.forEach((tabItem, idx)=>{
			let evt = tabItem.AlertByEvent;
			if (evt) {
				// 以註冊事件傳遞資料決定是否顯示，是布林false就不顯示紅點。
				eventBus.$on(evt, function(v){
					if (this.idx != self.activeIdx) {
						let isAlert = v == false? v: true;
						self.$set(this.tabItem, 'alert', isAlert);
					}
				}.bind({'idx': idx, 'tabItem': tabItem}));
			}
		});
	},
    mounted() {
		this.delayCreateSwiper();
		this.updatePrevNextMap();
		// 移除當前頁簽的小紅點
		if (this.tabList[this.activeIdx])
			this.$set(this.tabList[this.activeIdx], 'alert', false);
	},
	beforeDestroy() {
		// 解除 eventBus 事件監聽
		this.tabList.forEach((tabItem, idx)=>{
			let evt = tabItem.AlertByEvent;
			if (evt) eventBus.$off(evt);
		});
		this.mySwiper.destroy();
	},
	components: {
	},
    methods: {
		/** 取得預設想要啟動的 index */
		getInitActiveIdx() {
			// 支持從 tgActiveClass 設定預設啟動的元件
			let comClass = this.$store.state.sync.tgActiveClass;
			if (comClass) {
				let idx = this.tabList.findIndex(item=>item.comClass === comClass);
				if (idx != null) {
					this.$store.state.sync.tgActiveClass = '';
					return idx;
				}
			}
			return !isNaN(this.selectedIdx) ? this.selectedIdx : (parseFloat(localStorage.getItem(this.storageKey)) || 0);
		},
		/** 準備延遲建立 swiper (因為需等 tabList 響應至 vue 建立好 element 才可以 createSwiper) */
		delayCreateSwiper(){
			let self = this;
			// 延遲階段若又有一次呼叫，則重新延遲一次
			if (self.createSwiperTimeout) {
				clearTimeout(self.createSwiperTimeout);
				delete self.createSwiperTimeout;
			}
			self.createSwiperTimeout = setTimeout(()=>{
				self.createSwiper();
			}, 100);
		},

		/** 重建 swiper */
		createSwiper() {
			let self = this;
			// 無內容直接 return
			if (!this.tabList.length)
				return;
			// 重建 swiper
			if (this.mySwiper)
				this.mySwiper.destroy(false);

			self.activeTab = self.tabList[self.activeIdx];
			// console.log(`TabGroup.createSwiper`, self.activeIdx, self.activeTab, self.tabList.length);
			self.mySwiper = new Swiper(`.swiper-container-${self.tabKey}`, {
				initialSlide: self.activeIdx,
				on: {
					slideChange: self.onSlideChange,
				},
				// 不要停止冒泡 (SideMenu 要聽 touchmove)..... 支持 Dialog 推移離開時，不可冒泡，所以註解掉
				// touchMoveStopPropagation: false,
			});
			self.saveSelectedIdx();
			self.scrollingCenter();
		},

		/** 頁簽被點擊時 */
		onTabClick(idx) {
			// 切到第幾個元件
			if (this.mySwiper)
				this.mySwiper.slideTo(idx);
		},

		/* 拉動切換成立時 */
		onSlideChange() {
			// 前個元件仍需要呈現直到動畫結束
			this.lastActiveIdx = this.activeIdx;
			setTimeout((self)=>{self.lastActiveIdx = -1;}, 500, this);
			// 切換至指定頁簽
			if (this.mySwiper){
				this.activeIndex(this.mySwiper.activeIndex);
				eventBus.$emit("TAB-ACTIVE");
			}
		},

		/** 切換到第幾個頁簽 */
		activeIndex(idx) {
			this.activeIdx = idx;
			this.activeTab = this.tabList[this.activeIdx];
			// keepAlive : 已經開過的元件不消滅
			if (this.keepAlive) this.keepAliveMap[this.activeIdx] = true;
			// 關閉此頁簽的警示
			this.$set(this.activeTab, 'alert', false);
			// 將頁簽捲到中央顯示
			this.scrollingCenter();
			// 記憶最後選取的 tab index
			this.saveSelectedIdx();
			this.$emit("onActiveTab", {idx: idx, tab: this.activeTab});
		},
		// 此頁簽收到 alert 事件
		onAlertTab(tabItem) {
			if (tabItem != this.activeTab)
				this.$set(tabItem, 'alert', true);
		},
		// 記憶最後選取的 tab index
		saveSelectedIdx() {
			if (this.tabKey)
				localStorage.setItem(this.storageKey, this.activeIdx);
		},
		/** 讓當前頁簽的前後一個頁簽活起來 (為了拖拉順暢) */
		updatePrevNextMap() {
			// 支持停用提早init前頁次頁的功能 (在每次顯示都應該重查的情境 ex. 歷史查詢)
			if (this.disablePrevNext)
				return;
			setTimeout((self)=>{
				self.prevNextMap = {};
				self.prevNextMap[self.activeIdx - 1] = true;
				self.prevNextMap[self.activeIdx + 1] = true;
			}, 1000, this);
		},
		// 動態捲動至當前已選定的tab
		scrollingCenter() {
			let ctn = this.$refs.tabCtn;
			if (!ctn) return;
			setTimeout(()=>{
				let tab = ctn.querySelector('.selected');
				if (tab) {
					// scrolling 效果
					var options = {
						container: '.tab-ctn',
						easing: 'ease-in',
						offset: -ctn.clientWidth/2 + tab.clientWidth/2,
						force: true,
						cancelable: true,
						x: true,
						y: false
					}
					VueScrollTo.scrollTo(tab, 250, options);
				}
			}, 10);
		},
	},
	watch: {
		/** activeIdx 改變時 -> 建立前後畫面 */
		activeIdx(nv, ov){
			this.updatePrevNextMap();
		},
		/** 監控頁簽文字加總，用以識別是否已經切換 tabList (不可僅看數量) */
		tabListLabels(nv) {
			// console.log(`TabGroup.tabListLabels`, nv);
			this.delayCreateSwiper();			
		},
		/** 父元件傳入的 selectedIdx 改變 */
		selectedIdx(nv) {
			// console.log(`TabGroup.selectedIdx : `, nv);
			this.activeIdx = nv;
		},
		tgActiveClass(comClass) {
			if (comClass) {
				let idx = this.tabList.findIndex(item=>item.comClass === comClass);
				if (idx != null) {
					this.onTabClick(idx);
					this.$store.state.sync.tgActiveClass = '';
				}
			}
		},
		activeTab(nv) {
			// 將 Active 的 Component 發佈統計元件
			if (nv) M4C.Analysis.onTabGroupActive(nv.comClass);
		},
	},
    computed: {
		/** 所有頁簽的 label 串起來 */
		tabListLabels() {
			if (!this.tabList || this.tabList.length===0)
				return "";
			return this.tabList.reduce((allVal, curVal, idx)=>{
				return allVal + curVal.label;
			}, '');
		},
		tgActiveClass() {
			return this.$store.state.sync.tgActiveClass;
		}
    }
}
</script>

<style scoped>
/* 主容器 */
.tab-group-ctn {
}
/* 標題區域 */
.head {
	height: 2.5em;
	background-color: #1D2127;
}
/* 黏性標題列 */
.head.fixHead {
	position: sticky;
	top: 0;
	z-index: 2;
}
/* 頁簽容器 */
.head .tab-ctn {
	/* has to be scroll, not auto */
	overflow-y: scroll;
}
.desktop .head .tab-ctn {
	overflow-y: hidden;
}

/* 頁簽們 */
.head .tab {
	padding: 0 3vw;
	border-bottom: 3px solid #1D2127;
	white-space: nowrap;
    text-align: center;
}
/* 選中的頁簽 */
.head .tab.selected {
	color: white;
	border-bottom: 3px solid #F5A623;
}
/* swiper 容器 */
.swiper-container {
	height: 100%;
	width: 100%;
}
/* 警示提示icon */
.icon-alert {
	position: absolute;
	top: 3px;
	right: -6px;
	width: 12px;
	height: 12px;
	border-radius: 6px;
	background-color: red;
}
.desktop .head .tab {padding: 0 0.6em;}
</style>