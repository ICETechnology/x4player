<template>
    <div class="float-order-ctn flex-col">
		<div class="flex-1 pdlr4 flex-col">
			<div class="mgt4 flex-row flex-center">
				<!-- 商品搜尋 -->
				<SymbolSearch class="symbol-search" isStopSub="true"/>
				<!-- 詢價 -->
				<InquiryPrice class="inquiry-btn mgl3" v-if="!twMode"/>
			</div>
			<!-- 上下檔商品 -->
			<ContractsSwitch v-if="curContractsList.length > 0" class="clr-gray2 font-size-mini mgt2" :preSidList="curContractsList" />
			<!-- 商品持倉列 -->
			<SymbolPositionRow class="mgt3 mgb3" />
			<!-- [1/2] 一般模式 (三顆按鈕情境) -->
			<div v-if="orderBoxMode===0" class="flex-1 posr">
				<!-- 委託輸入選項 -->
				<OrderCondition class="flex-row flex-wrap space-between FULL" :param="param" />
			</div>
			<!-- [2/2] 高級模式 (四顆按鈕情境) -->
			<div v-if="orderBoxMode===1" class="flex-1 posr">
				<ScrollBounce v-stop-propagation-y @scroll="scrollEvent">
					<div class="hidden condition-content"></div>
					<div class="flex-row">
						<!-- 左半邊 -->
						<div class="flex-1 flex-col pdl3 font-size-small overflow-auto order-sticky">
							<div class="pdr5"><SymbolPositionRow mode="orderBlockSimplePos" :showDeGa="true" v-if="!twMode" /></div>
							<div class="divider-bottom mgtb3 mgr3" />
							<div class="pdr5"><SymbolMiniQ :showBS1P="true" /></div>
							<!-- 當沖 -->
							<div v-if="showDayTrade" class="flex-row flex-start pdr5">
								<span class="font-size-small flex-1">{{$ln(`当冲`)}}</span>
								<Toggle class="toggle-mini" v-model="$store.state.order.dayTrade" :mode="'mini'" />
							</div>
							<div class="flex-1" />
						</div>
						<!-- 右半邊 -->
						<div class="flex-1 flex-row overflow-auto">
							<div class="flex-1"/>
							<!-- 委託輸入選項 -->
							<OrderCondition class="flex-col" :param="param" />
						</div>
					</div>
				</ScrollBounce>
			</div>
			<!-- GTD警示訊息 -->
			<div v-if="displayGTDWarring" class="gtd-warring-ctn mgtb3 word-break-all overflow-y-auto" v-stop-propagation-y>
				<div v-html="GTDWarring"/>
			</div>
			<!-- 以一定範圍市價送出 -->
			<div v-if="displayRangeMarket" class="mgb3 flex-center">
				<CheckBox v-model="$store.state.order.useRangeMarket" class="">{{$ln('市价单使用〖一定范围市价〗送出')}}</CheckBox>
			</div>

			<!-- 下拉提示 -->
			<transition name="fade">
				<div v-if="showMoreSetting" class="font-size-mini content mgtb1 mglr1 notice-down">
					<div  class="flex-row flex-1 flex-center">
						<div class="notice-label mgr2 clr-gray2">{{$ln('往下滑動查看更多委託設定')}}</div>
					</div>
				</div>
			</transition>
			<!-- 保證金試算 -->
			<TradingTrial v-if="showAvailableMarginAndTradingTrial" class="font-size-mini" />
			<!-- 委託按鈕 -->
			<OrderBtn class="mgb5" :param="param" :useComName="selfComName" :isDaytrade="showDayTrade" :displayRangeMarket="displayRangeMarket" />
		</div>
    </div>
</template>

<script>
import SymbolSearch from '@/components/SymbolSearch';
import ContractsSwitch from "@/components/ContractsSwitch.vue";
import QuoteAgent from '@/components/QuoteAgent';
import OrderCondition from "@/components/Order/OrderCondition.vue";
import InquiryPrice from '@/components/InquiryPrice';
import TradingTrial from "@/components/TradingTrial.vue";
import OrderBtn from "@/components/Order/OrderBtn.vue";

export default {
	mixins: [QuoteAgent],
	components: {
		SymbolSearch,
		ContractsSwitch,
		OrderCondition,
		InquiryPrice,
		TradingTrial,
		OrderBtn,
	},
	props: ['param'],
	data() {
		return {
			qo: {},
			showMoreSetting: false,
			// condition-content 的 parent
			scrollCtn: null,
        }
	},
	beforeMount() {
		this.updateTitle();
	},
	beforeDestroy() {
		// 讓 [市價轉設定價] 功能僅套用在 FloatOrder (一般下單盒/高級下單盒) 的簡易作法，解決 https://trello.com/c/T9vMJmXj
		this.$store.state.order.convertMarketPrice = null;
	},
	mounted(){
		const content = this.scrollCtn = document.querySelector('.condition-content').parentElement;
		const contentOffsetHeight = content.offsetHeight;
		const contentScrollHeight = content.scrollHeight;
		this.showMoreSetting = contentScrollHeight > contentOffsetHeight;
	},
    methods: {
		updateTitle() {
			this.$emit('title', this.orderBoxMode === 1 ? '高级下单盒' : '下单盒');
		},
		scrollEvent(){
			const content = this.scrollCtn;
			// 距離最上方的距離
			const scrollTopHeight = content.scrollHeight-content.offsetHeight;
			if(scrollTopHeight<=0) return;

			// 滑到最底下，提示條消失不再顯示
			if(content.scrollTop>=scrollTopHeight - 1){
				this.showMoreSetting = false
			}			
		}
	},
	watch: {
		orderBoxMode() {
			this.updateTitle();
		},
		'$store.state.order.orderType'(nv){	
			// 重置showMoreSetting，以免提示條空間的高度被減去
			this.showMoreSetting = false;
			// 等待DOM元素都完整在去抓高度
			this.$nextTick(() => {
				const content = this.scrollCtn;
				const contentScrollHeight = content.scrollHeight;
				const contentOffsetHeight = content.offsetHeight;
				this.showMoreSetting = contentScrollHeight > contentOffsetHeight;
			})
		},
		'$store.state.selectedSymbol.ID'(nv){
			// 重置showMoreSetting，以免提示條空間的高度被減去
			this.showMoreSetting = false;
			// 等待DOM元素都完整在去抓高度
			this.$nextTick(() => {
				const content = this.scrollCtn;
				const contentScrollHeight = content.scrollHeight;
				const contentOffsetHeight = content.offsetHeight;
				this.showMoreSetting = contentScrollHeight > contentOffsetHeight;
			})

		}
	},
	computed:{
		isFut(){return M4C.Symbol.isFut(this.sid);},
		isTWF(){return M4C.Symbol.isTWF(this.sid);},
		sid() {return this.$store.state.selectedSymbol.ID;},
		// 當前商品的部位
		ps() {
			return this.$store.state.data.normalPositionSumList.find(pos => pos.SYMBOL == this.sid) || {};
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 是否為價差商品
		isDiffSymbol() {return M4C.Symbol.isPriceDiff_FutSymbol(this.sid);},
		// 指定要停用保證金試算功能
		disableTradingTrial() {
			try{return vuex.config.publicPdSetting.CONFIG.TradingTrial.disable;}catch(e){}
		},
		// 是否顯示可用資金及保證金試算(平倉時不顯示) 目前使用情境，僅外層帶入positionEffect: CLOSE才是平倉
		showAvailableMarginAndTradingTrial() {
			// 若有指定要停用保證金試算功能
			if (this.disableTradingTrial)
				return false;
			// 平倉時不顯示		 
			if(this.param && this.param.positionEffect === "CLOSE") return false;		

			if(this.hideMarginTradingTrial) {
				if(this.isTWF && this.isFut) {
					// 內期
					return !this.hideMarginTradingTrial.IBFut;
				}else if(this.isTWF && this.isOpt){
					// 內選
					return !this.hideMarginTradingTrial.IBOpt;
				}else if(!this.isTWF && this.isFut){
					// 外期
					return !this.hideMarginTradingTrial.OBFut;
				}else if(!this.isTWF && this.isOpt){
					// 外選
					return !this.hideMarginTradingTrial.OBOpt;
				}
			}
			// 預設皆為顯示
			return true;
		},
		// 是否隱藏保證金試算的清單
		hideMarginTradingTrial(){
			try{return this.$store.state.config.CONFIG.hideMarginTradingTrial;} catch(e){};
		},
		// 當前關注合約列表
		curContractsList() {
			return this.$store.state.status.curContractsList;
		},
		// 下單盒模式 (0:普通, 1:高級)
		orderBoxMode() {
			return this.$store.state.config.orderBoxMode;
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		orderConditionClass() {

		},
		// 是否為期權商品
		isOpt() {return M4C.Option.isOpt(this.sid);},
		// 是否顯示當沖
		showDayTrade() {return this.twMode && !this.isOpt && !this.isDiffSymbol;},
		// OrderType 清單
		orderTypeList() {return M4C.Symbol.getOrderType(this.sid).split(';');},
		// 是否可用一定範圍市價
		isMWP() {return this.orderTypeList.indexOf("MWP") != -1},
		// 是否顯示勾選一定範圍市價
		displayRangeMarket() {
			// 台灣版 & DCore洗價單 & 設定包含一定範圍市價
			if (this.twMode && this.$store.state.order.orderTypeFromDCore && this.isMWP) {
				switch(this.$store.state.order.orderType) {
					case 'STOP':	// 停損市價
					case 'TSTOP':	// 移動停損市價
					case 'MIT':		// 觸價市價
						return true;
				}
			}
		},
		// GTD警示訊息(由pdsetting提供)
		GTDWarring() {try {
			return this.$store.state.config.publicPdSetting.GTDWarring;} catch(e) {}},
		// 是否顯示GTD警示訊息(有設定訊息及效期別是GTD)
		displayGTDWarring() {return this.GTDWarring && this.$store.state.order.inputTimeInForce === "GTD";},

	},
}
</script>

<style scoped>
.symbol-search {
	height: 2.4em;
	padding: 0 0.6em !important;
	border: 1px solid #393939 !important;
	box-sizing: border-box;
}
.inquiry-btn {
	height: 2.4em;
	color: white;
	background-color: #0065A4;
}

.desktop .margin-mini {
	margin-top: 1em;
}
.gtd-warring-ctn {
	min-height: 1em;
	max-height: 5em;
}

.content {
	border: 1px solid #191B1D;
}
.notice-down{
	background-color: #484848dc;
	border-radius: 5px ;
}
.notice-label{
	font-weight:bold
}
.order-sticky{
	position: sticky;
	height: 100%;
	top: 0;
}
.fade-enter-active, .fade-leave-active {
	transition: opacity 1s;
}
.fade-enter, .fade-leave-to {
	opacity: 0;
}
</style>