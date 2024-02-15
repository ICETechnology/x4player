<template>
	<div class="report-card-ctn flex-row" :sid="sid" v-waypoint="{active: true, callback: onWaypoint}">
		<!-- 撐高度用 (讓畫面外的卡片有高度，避免捲動異常) -->
		<div class="base-height" />
		<div ref="ctn" class="flex-col tcend report-card" @click="onNameClick" v-press="onPress"
			:class="{hiLight: hiLight}" v-if="visibility">
			<div class="flex-row pdtb2">
				<div class="cell0 flex-center expand-btn" @click.stop="onBtnExpand" @touchstart.stop="" @touchend.stop="">
					<!-- 不支援的委託中商品不顯示展開icon -->
					<i class="material-icons" v-if="showExpand">{{expand ? "arrow_drop_up" : "arrow_drop_down"}}</i>
				</div>
				<div class="cell1">
					<SymbolCNM4 :sid="triggerSymbol? triggerSymbol: sid" :sid2="sid2" :optWrap="true" :showCP="true"/>
				</div>
				<div class="cell2 flex-top flex-col space-around">
					<span class="nowrap" :class="getStatusClass(rpt)">{{$ln(rpt.$STATUS)}}</span>
					<span class="flex-col order-price" v-html="getOrderPriceText" />
					<SymbolCNM4 :sid="sid" v-if="triggerSymbol" flexRow="true" :optWrap="true" :showCP="true"/>
				</div>
				<div class="cell3 flex-col">
					<div class="flex-1 flex-end clr-gray">{{new Date(rpt.UPDATE_TIME).time8()}}</div>
					<div class="flex-2 flex-top-right clr-gray" v-if="triggerValue">{{triggerValue}}</div>
					<div class="flex-1 flex-end">
						<span class="order-qty">{{rpt.$ORDER_QTY || 0}}</span>
						<span class="mglr1">/</span>
						<span>{{rpt.CUM_QTY || 0}}</span>
						<span class="mglr1">/</span>
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
		/** 點擊彈出商品頁 */
		onNameClick() {
			// 如果是觸A下B的委託，sid改取監看的商品(以免卡片上顯示A商品，USER點了之後顯示B商品的商品詳情)
			let sid = this.isABOrder? this.rpt.MARKET_WATCH[0].SYMBOL: this.sid;
			// 總表沒有這檔商品不支援其他操作功能。
			if(!this.supportItem) return;
			// 複式單 -> 不彈出商品詳情
			if (this.rpt.SYMBOL2) return;
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", sid);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: sid});
		},
		/** 長按彈出簡易下單盒 */
		onPress() {
			// 總表沒有這檔商品不支援其他操作功能。
			if(!this.supportItem) return;
			this.$store.commit("setSelectedSymbol", this.sid);
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
		sid() {
			return this.rpt.SYMBOL || (this.rpt.$IS_OCO ? this.rpt.OCO[0].SYMBOL : 'UNKNOW-SYMBOL');
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
		// 委託價文字
		orderPriceText() {
			let rpt = this.rpt;
			let result = "";
			if (rpt.ORDER_PRICE) {
				if (rpt.POSITION_EFFECT === "CWO" || rpt.POSITION_EFFECT === "CWC")
					result += this.$ln("备兑");
				result += ' ' + rpt.$ORDER_PRICE;
			}
			return result;
		},
		// 是否為期權商品
		isOpt() {
			return M4C.Option.isOpt(this.sid);
		},
		// 觸A下B委託
		isABOrder() {return this.rpt.MARKET_WATCH;},
	}
}
</script>

<style scoped>
.report-card-ctn {
	border-bottom: 1px solid #666;
}
/* 撐高度用 (讓畫面外的卡片有高度，避免捲動異常) */
.base-height {
	height: 20vw;
}
.report-data-ctn {
	padding-top: 2vw;
	padding-bottom: 2vw;
	padding-right: 2vw;
}
/* 委託狀態 */
.status-ctn {
	color: white;
	border-radius: 1.5vw;
	padding: 0 1vw;
}
</style>