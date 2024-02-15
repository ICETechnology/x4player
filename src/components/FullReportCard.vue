<template>
	<div class="full-report-card-ctn flex-row" :sid="sid" v-waypoint="{active: true, callback: onWaypoint}">
		<!-- 撐高度用 (讓畫面外的卡片有高度，避免捲動異常) -->
		<div class="base-height" />
		<div ref="ctn" class="flex-col tcend report-card" @click="onBtnExpand" v-press="onPress"
			:class="{hiLight: hiLight}" v-if="visibility">
			<div class="flex-row pdtb2">
				<!-- #1. 展開圖示 -->
				<div class="cell0"/>
				<!-- #2. 名稱 -->
				<div class="cell1 flex-col">
					<!-- 一般情境 -->
					<SymbolCNM4 v-if="!isABOrder" :sid="sid" :sid2="sid2" :optWrap="true" :showCP="true"/>
					<!-- 觸Ａ下Ｂ -->
					<div v-if="isABOrder" class="flex-col">
						<div class="flex-row">
							<span class="trigger-txt-ctn flex-center mgr1">{{$ln('觸')}}</span>
							<SymbolCNM4 :sid="triggerSymbol" :optWrap="true" :showCP="true"/>
						</div>
						<div class="flex-row">
							<span class="trigger-txt-ctn flex-center mgr1">{{$ln('下')}}</span>
							<SymbolCNM4 :sid="sid" :optWrap="true" :showCP="true"/>
						</div>
					</div>
					<!-- 買賣/自開平 -->
					<div :class="[rpt.$SIDE==='BUY'?'clr-up':'clr-dn']">{{bsocText}}</div>
					<!-- 委託單別文字 -->
					<div class="order-type-text">{{orderTypeText}}</div>
				</div>
				<!-- #3. 狀態 -->
				<div class="cell2 flex-top flex-col space-around">
					<span class="nowrap" :class="getStatusClass(rpt)">{{$ln(rpt.$STATUS)}}</span>
					<div v-if="triggerValue" class="flex-row flex-center"><span class="mgr1 clr-gray2">{{$ln('觸')}}</span>
						<span class="h100p flex-center">{{triggerValue}}</span>
					</div>
					<div v-if="conditionPrice1" class="flex-row flex-center"><span class="mgr1 clr-gray2">{{touchTxt}}</span>
						<span class="h100p flex-center">{{conditionPrice1}}</span>
						<span v-if="conditionPrice2" class="mglr1 clr-gray2">|</span>
						<span v-if="conditionPrice2" class="h100p flex-center">{{conditionPrice2}}</span>
					</div>
					<div v-if="orderPrice1 != null" class="flex-row flex-center"><span class="mgr1 clr-gray2 order-price-type-text">{{$ln(rpt.$IS_PROTECTION ? '保护限价' : '委')}}</span>
						<span class="h100p flex-center">{{orderPrice1}}</span>
						<span v-if="orderPrice2" class="mglr1 clr-gray2">|</span>
						<span v-if="orderPrice2" class="h100p flex-center">{{orderPrice2}}</span>
					</div>
					<div v-if="rpt.$AVG_PRICE" class="flex-row flex-center"><span class="mgr1 clr-gray2">{{$ln('成')}}</span>
						<span class="h100p flex-center">{{rpt.$AVG_PRICE}}</span></div>
					<div class="flex-1"/>
				</div>
				<!-- #4. 時間/數量 -->
				<div class="cell3 flex-col">
					<div class="flex-end clr-gray">{{new Date(rpt.UPDATE_TIME).time8()}}</div>
					<div class="flex-1"/>
					<div class="flex-end">
						<span class="order-qty">{{rpt.$ORDER_QTY || 0}}</span>
						<span class="mglr1">|</span>
						<span>{{rpt.CUM_QTY || 0}}</span>
						<span class="mglr1">|</span>
						<span>{{rpt.$REMOVED_QTY || 0}}</span>
					</div>
				</div>
				<div class="cell4" />
			</div>
			<!-- 展開區塊 -->
			<OrderReportExpander v-if="expand" :rpt="rpt" />
		</div>
	</div>
</template>

<script>
import ReportCardFn from './ReportCardFn'
import OrderReportExpander from "@/components/Report/OrderReportExpander.vue"

export default {
	mixins: [ReportCardFn],
	props: ["rpt", "expandRptKey", "mode", "suspend"],
	data() {
		return {
			expand: false,
			lightUp: false,
		}
	},
	beforeMount() {
		this.qo = M4C.Quote.getQuoteObject(this.sid);
	},
	methods: {
		/** 長按彈出簡易下單盒 */
		onPress() {
			// 總表沒有這檔商品不支援其他操作功能。
			if(!this.supportItem) return;
			// 如果是觸A下B的委託，sid改取監看的商品(以免卡片上顯示A商品，USER點了之後顯示B商品的商品詳情)
			let sid = this.isABOrder && this.rpt.$IS_CLOUD? this.rpt.MARKET_WATCH[0].SYMBOL: this.sid;
			this.$store.commit("setSelectedSymbol", sid);
			eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
		},
	},
	components: {
		OrderReportExpander,
	},
	watch: {
		// 上層帶來的 expandSid 改變時，檢查自己是否應該閉合/展開
		propExpandRptKey(nv) {
			this.expand = nv==this.rpt.key;
		},
		expand(nv){
			eventBus.$emit("EXPAND");
		}
	},
	computed: {
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		sid() {
			return this.rpt.$SYMBOL || this.rpt.SYMBOL || (this.rpt.$IS_OCO ? this.rpt.OCO[0].SYMBOL : 'UNKNOW-SYMBOL');
		},
		sid2() {
			return this.rpt.SYMBOL2;
		},
		propExpandRptKey() {
			return this.expandRptKey;
		},
		// 已撤單數量
		reduceQty() {
			let qty = (this.rpt.ORDER_QTY || 0) - (this.rpt.$AVAILABLE_QTY || 0) - (this.rpt.CUM_QTY || 0);
			return qty < 0 ? 0 : qty;
		},
		// 是否為期權商品
		isOpt() {
			return M4C.Option.isOpt(this.sid);
		},
		// 是有效單
		isWorking() {
			return this.rpt.$ISWORKING;
		},
		// 觸A下B委託
		isABOrder() {
			return this.rpt.MARKET_WATCH;
		},
		// 買賣/自開平
		bsocText() {
			return this.$ln(this.rpt.$SIDE==='BUY' ? '买' : '卖') + this.$ln(`${this.rpt.$POSITION_EFFECT}(short)`);
		},
		// 委託價1
		orderPrice1() {
			// 複式單 & 價差期貨 => 顯示原始委託價 (0 不顯示市價)
			if (this.showPriceDiff)
				return this.rpt.$ORDER_PRICE_TXT;
			return this.rpt.$ORDER_PRICE_TXT || this.$ln('市价');
		},
		// 委託價2
		orderPrice2() {
			return this.rpt.$ORDER_PRICE_TXT2;
		},
		// 觸價1
		conditionPrice1() {
			return this.rpt.$CONDITION_VALUE;
		},
		// 觸價2
		conditionPrice2() {
			return this.rpt.$CONDITION_VALUE2;
		},
		// 觸 or 停
		touchTxt() {
			return this.rpt.TC_ORDER_TYPE === 'STOP' || this.rpt.TC_ORDER_TYPE === 'STPLMT' ? this.$ln('停') : this.$ln('觸');
		},
		// 是否為價差商品
		isDiffSymbol() {return M4C.Symbol.isPriceDiff_FutSymbol(this.sid);},
		// 組合單
		isMultiOrder() {
			return this.rpt.SYMBOL && this.rpt.SYMBOL2;
		},
		// 顯示價差價格 (委託價可以為 0)
		showPriceDiff() {
			// 複式單 & 價差期貨 => 要看 ORDER_TYPE 決定是否直接顯示委託價格數值
			if (this.isMultiOrder || this.isDiffSymbol) {
				if (this.rpt.TC_ORDER_TYPE === 'LIMIT' || this.rpt.TC_ORDER_TYPE === 'LIT' || this.rpt.TC_ORDER_TYPE === 'STPLMT')
					return true;
			}
		},
	}
}
</script>

<style scoped>
.full-report-card-ctn {
	border-bottom: 1px solid #666;
}
/* 撐高度用 (讓畫面外的卡片有高度，避免捲動異常) */
.base-height {
	height: 20vw;
}
/* 委託狀態 */
.status-ctn {
	color: white;
	border-radius: 1.5vw;
	padding: 0 1vw;
}
/* 觸 */
.trigger-txt-ctn {
	max-width: 20px;
	max-height: 20px;
	padding: 1px;
	border: 1px solid #666;
	border-radius: 1vw;
}
/* 錯誤單字色 */
.full-report-card-ctn .clr-warn {
	color: #9933FF !important;
}
</style>