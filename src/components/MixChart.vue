<template>
    <div class="mix-chart-ctn" :class="[largeSize?'flex-row':'flex-col']" v-waypoint="{active: true, callback: onWaypoint}">
		<KChartLandHead v-if="showLandHead && visibility" :class="{'flex-1':largeSize,'top-conp': !isDesktop}" :suspend="suspend || !visibility" :isThumbMode="isThumbMode" :propsSid="sid"> </KChartLandHead>
		<div v-if="!isThumbMode" class="flex-1 posr">
			<div class="flex-col flex-1 FULL font-size-small" :class="{'font-size-normal':largeSize}">
				<div v-if="isPortrait || !enableTVC" class="head flex-row" :class="[{'ht4': isPortrait,'ht4-large':largeSize}, getRadioFocus]">
					<div class="k-selector flex-center flex-row flex-1" v-if="!isDesktop">
						<div class="flex-1 option-btn tcef flex-center" @click="onBS5">
							<span class="pdtb1" :class="{'focusitem': showBS5,'focusitem-large':largeSize&&showBS5}" >{{$ln('五檔')}}</span>
						</div>
						<div class="flex-1 option-btn tcef flex-center" @click="onDetail">
							<span class="pdtb1" :class="{'focusitem': showDetail,'focusitem-large':largeSize&&showDetail}" >{{$ln('盘口')}}</span>
						</div>
						<div class="flex-1 option-btn tcef flex-center" @click="onLBT">
							<span class="pdtb1" :class="{'focusitem': showLBT,'focusitem-large':largeSize&&showLBT}" >{{$ln('明細')}}</span>
						</div>
						<div v-if="enableTVC" class="flex-1 option-btn tcef flex-center" @click="onTvcLine">
							<span class="pdtb1" :class="{'focusitem': showTvcLine,'focusitem-large':largeSize&&showTvcLine}">{{$ln('即时')}}</span>
						</div>
						<div v-if="enableTVC && !twMode" class="flex-1 option-btn tcef flex-center" @click="onTvcKbar">
							<span class="pdtb1" :class="{'focusitem': showTvcKbar,'focusitem-large':largeSize&&showTvcKbar}">{{$ln('技术')}}</span>
						</div>
						<div class="flex-1 option-btn tcef flex-center" @click="onUnderlying" v-if="isOption && underlyingS || showUnderlying">
							<span class="pdtb1" :class="{'focusitem': showUnderlying,'focusitem-large':largeSize&&showUnderlying}" >{{$ln('标的')}}</span>
						</div>
						<div class="flex-1 option-btn flex-center" @click="onTchart" v-if="showChart && !enableTVC" :class="{tcef: Model=='market'}">
							<span class="pdtb1" ref="TChartOpt" v-if="Model=='market'" :class="{'focusitem': focusTChart,'focusitem-large':largeSize&&focusTChart}">{{$ln('分时')}}</span>
						</div>
					</div>
					<div class="flex-center flex-start mgl1" v-if="!isDesktop && showChart && !enableTVC">
						<div class="flex-1 option-btn tcef flex-center pdlr2" @click="onDayKClick">
							<span class="pdtb1 pdlr2" :class="{'focusitem': showDayK}">{{$ln('日')}}</span>
						</div>
						<span class="flex-center other-btn space-around rd1 tcef" :class="{'focusitem': isOtherSelected}" @click="onOtherCick">
							<span class="ss-label nowrap pdl2">{{otherSelectBtnText}}</span>
							<i class="material-icons">arrow_drop_down</i>
						</span>
					</div>
				</div>
				<div class="body flex-1 posr">
					<component class="FULL" :is="chartClass" :suspend="suspend"
						:ucid="ucid" :param="param" :propCev="reStoreData.localCev" :subChart="reStoreData.subChart" :model="Model" :key="randerKey"
						:symbol="reStoreData.localSid" :propNk="reStoreData.localNk" :subIdcList="reStoreData.subIdcList"></component>
				</div>
			</div>
		</div>
		<!-- 縮圖 -->
		<div class="body flex-1d5 posr" v-if="isThumbMode && visibility">
			<component class="FULL" :is="chartClass" :suspend="suspend || !visibility"
				:ucid="ucid" :param="param" :propCev="reStoreData.localCev" :subChart="reStoreData.subChart" :model="Model"
				:symbol="reStoreData.localSid" :propNk="reStoreData.localNk" :subIdcList="reStoreData.subIdcList"></component>
		</div>
    </div>
</template>

<script>
import KChartLandHead from "@/components/KChart/KChart.Land.Head.vue"
import KChartConfigSwitch from "@/components/KChart/KChart.Config.Switch.vue";
import miniKChart from "@/components/KChart/miniKChart.vue";
import ListByTime from "@/components/DesktopComponents/DesktopListByTime.vue";
import QuoteAgent from '@/components/QuoteAgent';
import BS5 from "@/components/BS5.vue";
import SymbolDetail from "@/components/SymbolDetail.vue";
import SciTChart from "@/components/SciTChart/SciTChart.vue";
// import SciKChart from "@/components/SciKChart/SciKChart.vue";
import TvcKbar from "@/components/TvcKbar.vue";
import TvcLine from "@/components/TvcLine.vue";
import TvcUnderlying from "@/components/TvcUnderlying.vue";


export default {
	mixins: [QuoteAgent],
	props: ["suspend", "param", "ucid"],
	data() {
		return {
			isMounted: false,
			toggleQuoteInfo: false,
			isHideHead: false,
			isToggleMenu: false,
			visibility: false,
			// 預設值
			_ucid: "MixChart",
			reStoreData: {
				isHideHead: false,
				// otherListSelected: "",
				otherList: [
					{"label": "1分", "value": "1"},
					{"label": "5分", "value": "5"},
					{"label": "15分", "value": "15"},
					{"label": "30分", "value": "30"},
					{"label": "60分", "value": "60"},
					{"label": "周", "value": "w"},
					{"label": "月", "value": "m"},
				],
				selectedOption: {},
				isLock: false,
				localSid: "",
				subChart: 2,
				subChartOptions: [
					{label: '0', value: 0},
					{label: '1', value: 1},
					{label: '2', value: 2},
				],
				subIdcList:["Volume"],
				localNk: 1,
				model: 'market',
				localCev: {
					/** 每根的寬度 */
					perBarWidth: 6,
					/** 每根的間隔 */
					perBarPadding: 4,
					/** 資料合併顯示級距 */
					merge: 1,
				},
			},
			chartClass: "",
			// 避免被覆用的 key (不同的 MixChart 或是不同的 chartClass 不覆用 instance)
			randerKey: "".random(),
		}
	},
    beforeMount() {
		// 啟動時若最後選擇在 [標的] -> 改為切在 [分時]
		if(this.showUnderlying) {
			this.$store.state.status.mixChartActivComclass = this.enableTVC ? "TvcLine" : "SciTChart";
		}
		// 回復local設定。
		for(let key in this.$readConfig) {
			if(Array.isArray(this.$readConfig[key])) {
				this.$set(this.reStoreData[key], this.$readConfig[key]);
			}
			else
				this.$set(this.reStoreData, key, this.$readConfig[key]);
		}
		// 桌機版k線圖、期權雲線圖不顯示副圖。
		if(this.isKbarMode || this.isOptMode || this.isThumbMode) {
			this.reStoreData.subChart = 0;
		}
		// 桌機版技術線圖顯示1個副圖
		else if(this.isDesktop) {
			this.reStoreData.subChart = 1;
		}
		// 縮圖設定
		if(this.isThumbMode) {
			this.reStoreData.isLock = true;
			this.reStoreData.localCev.perBarWidth = 1;
			this.reStoreData.localCev.perBarPadding = 1;
		}
		// 外層指定商品代碼
		if(this.propsSid) {
			this.reStoreData.localSid = this.propsSid;
		}
		// 無指定商品
		if(!this.reStoreData.isLock || this.reStoreData.localSid === "")
			this.reStoreData.localSid = M4C.Symbol.selectedSymbolToHot();
	},
	mounted() {
		// 如果是不顯示線圖的商品就改顯示5檔
		if(!this.showChart) {this.$store.state.status.mixChartActivComclass = "BS5";}
		this.isMounted = true;
	},
	beforeDestroy() {},
	components: {
		KChartLandHead,
		ListByTime,
		BS5,
		SymbolDetail,
		miniKChart,
		SciTChart,
		// SciKChart,
		TvcKbar,
		TvcLine,
		TvcUnderlying,
	},
    methods: {
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			// Waypoint:out 超過 1 秒才設定為不可視，已解決行情ScrollBounce發生會快速 out->in 導致隱藏後又顯示的問題
			if (going === 'in') {
				this.visibility = true;
				clearTimeout(this.offVisibilityTimeout);
			}
			else {
				this.offVisibilityTimeout = setTimeout((self)=>{self.visibility = false;}, 1000, this);
			}
		},
		onZoom(v){
			eventBus.$emit("perBarWidthChange", v);
		},
		onSubChartWheel(e) {
			let increase = e.deltaY < 0 ? 1 : -1;
			if(this.reStoreData.subChart < 3 && this.reStoreData.subChart > 0 && increase < 0 )
				this.reStoreData.subChart += increase;
			if(this.reStoreData.subChart >= 0 && this.reStoreData.subChart < 2 && increase > 0)
				this.reStoreData.subChart += increase;
		},
		getOtherSelectedValue() {
			return this.reStoreData.otherList.find(opt => opt.value == this.nk).label;
		},
		_onOtherClick() {
			let self = this;
			self.reStoreData.otherList.map(opt => {
				if(opt.value == this.nk) 
					opt.selected = true;
				else 
					delete opt.selected;
			});
			eventBus.$emit("SINGLESELECT-DIALOG", {
				options: self.reStoreData.otherList,
				confirmBtn: false,
				onfinish: option => {
					if(self.nk != option.value) {
						self.nk = option.value;
					}
				}
			});
		},
		onOtherCick() {
			let self = this;
			self.reStoreData.otherList.map(opt => {
				if(opt.value == this.nk && this.isOtherSelected) 
					opt.selected = true;
				else 
					delete opt.selected;
			});
			eventBus.$emit("SINGLESELECT-DIALOG", {
				options: self.reStoreData.otherList,
				confirmBtn: false,
				onfinish: option => {
					self.reStoreData.selectedOption = option;
					this.$store.state.status.mixChartActivComclass = "SciKChart";
					if(self.nk != option.value) {
						self.nk = option.value;
					}
				}
			});
		},
		onNkClick(){
			this.reStoreData.selectedOption = {};
		},
		onOcoIcon(){
			eventBus.$emit("POPUP-DIALOG", "StopLoss", "", {transName: 'float'});
		},
		onConfig(){
			if(this.isDesktop)
				eventBus.$emit("POPUP-DIALOG", KChartConfigSwitch);
			else
				eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: KChartConfigSwitch});
		},
		onReset(){
			eventBus.$emit("RESET-CHART");
		},
		/** 轉橫式 */
		onBtnRotate() {
			if (this.$store.state.device.isAPP) {
				// (非iOS) 利用 pushState + popState 以支持 Back-Button
				if (!this.$store.state.device.isIOS)
					history.pushState({isPortrait: this.$store.state.status.isPortrait}, '');
				// 鎖定为横向
				window.lockScreen('landscape');
			}
			else
				eventBus.$emit("FLASHMESSAGE", `请将装置转向`, {"bgClr": "black"});
		},
		onToggleQuoteInfo() {
			this.toggleQuoteInfo = !this.toggleQuoteInfo;
		},
		onDayKClick() {
			this.$store.state.Kchart.NK='d';
			this.$store.state.status.mixChartActivComclass = "SciKChart";
		},
		onBS5(){
			this.$store.state.status.mixChartActivComclass = "BS5";
		},
		onDetail() {
			this.$store.state.status.mixChartActivComclass = "SymbolDetail";
		},
		onLBT() {
			this.$store.state.status.mixChartActivComclass = "ListByTime";
		},
		onTvcLine() {
			this.$store.state.status.mixChartActivComclass = "TvcLine";
		},
		onTvcKbar() {
			this.$store.state.status.mixChartActivComclass = "TvcKbar";
		},
		onSciTChart() {
			this.$store.state.status.mixChartActivComclass = "SciTChart";
		},
		onSciKChart() {
			this.$store.state.status.mixChartActivComclass = "SciKChart";
		},
		onUnderlying() {
			this.$store.state.status.mixChartActivComclass = this.enableTVC ? "TvcUnderlying" : "Underlying";
		},
		onTchart() {
			if(this.Model !== 'market') return;
			this.$store.state.Kchart.NK='1';
			this.$store.state.status.mixChartActivComclass = "SciTChart";
		},
		setLocalNK(v) {
			if(!this.suspend)
				this.reStoreData.localNk = v;
		},
	},
	watch: {
		// 點選項目異動時 (桌機版不執行)
		"reStoreData.selectedOption"(nv, ov) {
			if (!nv.value || this.isDesktop) return;
			if(!this.reStoreData.isLock || this.isThumbMode)
				this.reStoreData.localNk = this.nk;
			else if(this.reStoreData.isLock)
				this.setLocalNK(nv.value);
		},
		"$store.state.Kchart.NK"(nv, ov) {
			if(!this.reStoreData.isLock || this.isThumbMode){
				this.setLocalNK(nv);
			}			
		},
		isHideHead(nv){
			this.$store.state.Kchart.zoom = nv;
		},
		"$store.state.selectedSymbol.ID"(nv, ov){
			if(!this.reStoreData.isLock){
				this.reStoreData.localSid = M4C.Symbol.selectedSymbolToHot();
			}
		},
		// mixchart local 設定變動就存。
		reStoreData: {
			handler: function(nv, ov) {
				this.$saveConfig(this, nv);
			},
			deep: true
		},
		propsSid(nv, ov) {
			if(nv) {
				// 使用外層給的sid
				this.reStoreData.localSid = nv;
				// 縮圖模式鎖定sid
				if(this.isThumbMode)
					this.reStoreData.isLock = true;
			}
		},
		isOption(nv){
			if(nv)
				this.tempSid = this.sid;
		},
		showUnderlying(nv) {
			// 顯示標的時變更商品sid並指定日K線圖。
			if(nv) {
				this.reStoreData.localSid = this.underlyingS;
				this.nk = this.reStoreData.localNk = 'd';
			}
			else{
				this.reStoreData.localSid = this.tempSid || M4C.Symbol.selectedSymbolToHot();
			}
		},
		_chartClass(nv, ov) {
			this.randerKey = ''.random();
			this.chartClass = nv;
		},
		suspend(nv ,ov){
			// 回復時重設comclass
			if(!nv && nv != ov && this.chartClass){
				this.nk = this.reStoreData.localNk;
			}
		},
		showSubIdcOnLandscape(nv, ov) {
			// 橫置時設定是否顯示副圖時，以更新key方式更新ui
			if(!this.isPortrait){
				let self = this;
				// 延遲0.5秒是為了避免設定切換的動畫因線圖同時更新卡頓
				setTimeout(() => {
					self.randerKey = "".random();
				}, 500);
			}
		}
	},
    computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		// 外層有指定使用組件
		propsComClass() {
			if(this.param)
				return this.param.comClass;
		},
		_chartClass() {
			// 暫停渲染時不變更當前使用的組件。(ex: 另外彈出圖形下單組件)
			if(this.suspend) return this.chartClass;
			// 外層有指定使用組件時，優先使用。
			else if(this.isMounted && this.propsComClass) {
				return this.propsComClass;
			}
			// 切換時，變更組件
			else if(this.isMounted){
				if(this.isDesktop) return "SciKChart";
				if(this.mixChartActivComclass == "SciTChart" && this.Model == 'market') return "SciTChart";
				else if(this.mixChartActivComclass !== "SciTChart" && this.mixChartActivComclass !== "Underlying") return this.mixChartActivComclass;
				else return "SciKChart";
			}
		},
		mixChartActivComclass() {return this.$store.state.status.mixChartActivComclass;},
		getRadioFocus() {
			let focus = 'normal-radio';
			if(this.Model == 'market' && this.showTChart)
				focus = 'TChart-radio';
			if(this.isOtherSelected)
				focus = 'other-radio';
			return focus;
		},
		sid() {return this.reStoreData.localSid || this.propsSid;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		$symbolChgTxt_v2() {return this.$store.state.fn.$symbolChgTxt_v2;},
		propsSid() {if(this.param) return this.param.propsSid;},
		isThumbMode() {return this.param && this.param.mode === "thumb";},
		isKbarMode() {return this.param && this.param.mode === "kbar";},
		isOptMode() {return this.param && this.param.mode === "option";},
		// 透過props設定開關kchart head組件
		propsShowHead() {return this.param && this.param.showHead;},
		// 透過props設定線圖是哪一種
		propsModel() {return this.param && this.param.model;},
		// 為了向前相容kbar因此保留isKbarMode的判斷
		showLandHead() {
			// 橫式且啟用TVC時，不顯示表頭
			if (!this.isPortrait && this.enableTVC)
				return false;
			return (!this.isPortrait && !this.isHideHead) || this.isKbarMode || this.propsShowHead || this.isThumbMode
		},
		// 台灣模式
        twMode(){
            return this.$store.state.config.CONFIG.OPERATING_MODE === 'tw';
		},
		// 其他選項
		isOtherSelected(){
			let list = this.reStoreData.otherList.map(list=>list.value);
			return this.chartClass == "SciKChart" && list.indexOf(this.nk.toString()) != -1;
		},
		nk: {
			set(v) {
				if(this.reStoreData.isLock) 
					this.setLocalNK(v);
				else 
					this.$store.state.Kchart.NK = v;
			},
			get(){
				if(this.reStoreData.isLock && !this.isThumbMode)
					return this.reStoreData.localNk;
				else return this.$store.state.Kchart.NK || 1; // 如果沒有全域NK，預設1分k。
			},
		},
		// 顯示標的
		showUnderlying() {return this.enableTVC ? (this.mixChartActivComclass === 'TvcUnderlying') : (this.mixChartActivComclass == "Underlying");},
		// 顯示分時明細
		showLBT() {return this.mixChartActivComclass == "ListByTime";},
		// 顯示TVC
		showTvcLine() {return this.mixChartActivComclass == "TvcLine";},
		showTvcKbar() {return this.mixChartActivComclass == "TvcKbar";},
		// 啟用TVC
		enableTVC() {
			try{return this.$store.state.config.publicPdSetting.function.tvc;}catch(e){}
		},
		// 顯示 SciTChart
		showSciTChart() {return this.mixChartActivComclass == "SciTChart";},
		// 顯示 SciKChart
		showSciKChart() {return this.mixChartActivComclass == "SciKChart";},
		// 顯示五檔
		showBS5() {return this.mixChartActivComclass == "BS5";},
		// 顯示明細
		showDetail() {return this.mixChartActivComclass == "SymbolDetail";},
		showTChart() {return this.chartClass == "SciTChart";},
		Model() {
			if(this.reStoreData.isLock)
				return this.reStoreData.model;
			else return this.propsModel || this.$store.state.Kchart.model;}
		,
		// 響應式轉向變數 (直向=true)
		isPortrait() {
			return this.$store.state.status.isPortrait;
		},
		$saveConfig() {return this.$store.state.fn.$saveComponentConfig;},
		$readConfig() {return this.$store.state.fn.$readComponentConfig(this);},
		isDesktop() {return this.$store.state.device.isDesktop;},
		isOption() {
			let sid = this.propsSid || M4C.Symbol.selectedSymbolToHot();
			return sid.split(".")[1] === "O";},
		focusTChart() {return this.showTChart && this.Model== 'market'},
		showDayK() {return this.nk==='d' && this.chartClass == "SciKChart" && !this.showUnderlying;},
		/** 要訂閱的 underlyingS 代碼(含月份) */
		underlyingS() {
			return M4C.Symbol.getUnderlyingS(this.sid);
		},
		otherSelectBtnText() {
			if(this.isOtherSelected)
				return this.$ln(this.getOtherSelectedValue());
			else return this.$ln("分钟");
		},
		/** 顯示線圖功能 */
		showChart() {
			// 非價差商品才顯示
			return !M4C.Symbol.isPriceDiff_FutSymbol(this.sid);
		},
		// 橫置時顯示副圖
		showSubIdcOnLandscape() {return this.$store.state.Kchart.showSubIdcOnLandscape},
	},
}
</script>

<style lang="scss" scoped>
.mix-chart-ctn .head {
	height: 10vw;
	background-color: #2a2a2a;
	padding: 0 2.6vw;
	border-bottom: 1px solid #666;
}
.mix-chart-ctn .head.landscape {
	height: 10vh;
}
.mix-chart-ctn .radio-wrapper {
	border: 0px;
	/* background-color: #333; */
}
.mix-chart-ctn .kchart-nk {
	border-radius: 0;
}
.kchart-nk>span.focus {
	background-color: rgba(0,0,0,0);
}
.mix-chart-ctn .normal-radio .focus {
	background-color: initial;
	border-bottom: 2px solid rgba(255, 152, 0, 0.932);
}
.btn-icon{
	border-radius: 2vw;
	width: 6vw;
	height: 6vw;
}
.circle-icon {
	border-radius: 50%;
	background: white;
	color:black;
}
.rotate{
	transform:rotate(180deg);
}
.symbol-name {
	white-space: nowrap;
	display: inline-block;
}
.cross-enable{
	color:rgba(255, 152, 0, 0.932);
}
.top-conp{
	min-height: 4em;
}
.k-selector /deep/ .radio-wrapper>*{
	padding: 4px 2px;
}
.oco-icon{
	padding: 2px;
	border: 1px white solid;
	border-radius: 4px;
	min-height: 1em;
	margin: 5px 10px;
}
.option-btn {
	height: 100%;	
}
.opt-btn {
	min-width: 6.6vw;
}
.opt-btn, .other-btn{
	border-bottom: 2px solid rgba(255, 255, 255, 0);
}
.other-btn {
	/* 要在 360/375 都可保持與右側按鈕同高 */
	height: 6.3vw;
	padding-left: 1.5vw;
	// background-color: white;
	// border-radius: 2vw;
	// color: black;
	min-width: 15vw;
	border: 1px solid gray;
}
.focusitem, .TChart-radio .option-btn .tcef.focusitem {
	border-bottom: 2px solid rgba(255, 152, 0, 0.932);
}
.other-btn.focusitem {
	border:1px solid rgba(255, 152, 0, 0.932);
	background-color: rgba(0,0,0,0);
	color: rgba(255, 152, 0, 0.932);;
}

.other-btn .ss-label {
	margin-right: -1vw;
}

.space-around {
	justify-content: space-around;
}
.not-use {
	pointer-events: none;
	opacity: 0.5;
	color: #DDD !important;
}
.layout-btn {
	margin: 0 4px;
	padding: 2px 8px;
}
@media screen and (orientation: landscape) {
	.k-selector /deep/ .radio-wrapper>*{
		padding: 5px 2px;
		height: auto;
	}
	.cross{
		margin: 5px 10px;
	}
	.mix-chart-ctn .head {
		height: 9.3vh;
		padding: 0 2.6vh;
	}
	.opt-btn, .option-btn .tcef {
		min-width: 6.6vh;
	}
	.ht3 {
		height: 11.7vh !important;
	}
	.other-btn{
		height: 7.3vh;
		border-radius: 2vh;
		min-width: 15vh;
	}
	.ss-label {
		padding-left: 0;
	}
	.pdtb2 {
		padding-top: 0.5em;
		padding-bottom: 0.5em;
	}
}
.ht4-large{
	height: 9vw !important;
}
.focusitem-large{
	padding-left: 5vw; padding-right: 5vw;
	border-bottom: 3px solid rgba(255, 152, 0, 0.932);
}
</style>