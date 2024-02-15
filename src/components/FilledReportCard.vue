<template>
	<div class="filled-report-card-ctn report-card-ctn flex-row" :sid="sid" v-waypoint="{active: true, callback: onWaypoint}">
		<!-- 撐高度用 (讓畫面外的卡片有高度，避免捲動異常) -->
		<div class="base-height" />
		<div ref="ctn" class="flex-col tcend report-card" @click="onNameClick" v-press="onPress"
			:class="{hiLight: hiLight}" v-if="visibility">
			<div class="flex-row pdtb2">
				<div class="cell0 flex-center expand-btn" @click.stop="onBtnExpand" @touchstart.stop="" @touchend.stop="">
					<i class="material-icons">{{expand ? "arrow_drop_up" : "arrow_drop_down"}}</i>
				</div>
				<div class="cell1">
					<SymbolCNM4 :sid="sid" :sid2="sid2" :optWrap="true" :showCP="true"/>
				</div>
				<div class="cell2 flex-col">
					<div class="flex-1 flex-start">{{bsocText}}</div>
					<div class="flex-1 flex-start">
						<span class="nowrap">{{orderTypeText}}</span>
						<span class="mgl2">{{rpt.TIME_IN_FORCE}}</span>
					</div>
				</div>
				<div class="cell3 flex-col">
					<div class="flex-1 flex-end">{{rpt.$AVG_PRICE}}</div>
					<div class="flex-1 flex-end cum-qty">{{rpt.CUM_QTY}}</div>
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
			// 總表沒有這檔商品不支援其他操作功能。
			if(!this.supportItem) return;
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: this.sid});
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
			return this.rpt.SYMBOL || this.rpt.OCO[0].SYMBOL;
		},
		sid2() {
			return this.rpt.SYMBOL2;
		},
		propExpandRptKey() {
			return this.expandRptKey;
		},
		bsocText() {
			let rpt = this.rpt;
			return this.$ln(rpt.$SIDE==='BUY' ? '买' : '卖') + this.$ln(`${rpt.$POSITION_EFFECT}(short)`);
		},
		priceText() {
			return this.$ln(this.rpt.ORDER_PRICE==0 ? '市价' : '限价');
		},
		// 是否為期權商品
		isOpt() {
			return M4C.Option.isOpt(this.sid);
		},
	}
}
</script>

<style scoped>
.filled-report-card-ctn {
	border-bottom: 1px solid #666;
}
.base-height {
	min-height: 15vw;
}
.report-data-ctn {
	padding-top: 2vw;
	padding-bottom: 2vw;
	padding-right: 2vw;
}
.expand-ctn {
	padding: 2vw;
}
/* 委託狀態 */
.status-ctn {
	color: white;
	border-radius: 1.5vw;
	padding: 0 1vw;
}
</style>