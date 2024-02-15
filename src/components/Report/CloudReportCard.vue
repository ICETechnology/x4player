<template>
    <div ref="ctn" class="cloud-report-card-ctn flex-col tcend" @click="onNameClick" v-press="onPress">
    	<div class="flex-row pdtb2">
			<div class="cell0 flex-center expand-btn" @click.stop="onBtnExpand" @touchstart.stop="" @touchend.stop="">
				<i class="material-icons">{{expand ? "arrow_drop_up" : "arrow_drop_down"}}</i>
			</div>
			<div class="cell1">
				<SymbolCNM4 :sid="triggerSymbol? triggerSymbol: sid" :sid2="sid2" :optWrap="true" :showCP="true"/>
			</div>
			<div class="cell2 flex-col">
				<!-- 開平 -->
				<div class="flex-1 flex-start nowrap">{{bsocText}}</div>
				<!-- 單別 -->
				<div class="flex-1 flex-row">
					<SymbolCNM4 :sid="sid" v-if="triggerSymbol" :optWrap="true" :showCP="true"/>
					<!-- 价格别 -->
					<span class="flex-bottom nowrap" v-if="!triggerSymbol">{{orderTypeText}}</span>
					<!-- 效期别 -->
					<span class="flex-bottom mgl2" v-if="!triggerSymbol">{{timeInForceText}}</span>
				</div>
			</div>
			<div class="cell3 flex-col">
				<!-- 触发价 -->
				<div class="flex-1 flex-end flex-col" v-html="smoTrgPriceHtml" />
				<!-- 数量 -->
				<div class="flex-1 flex-bottom-right" v-html="smoAvailableQtyHtml" />
			</div>
			<div class="cell4" />
		</div>
		<!-- 展開區塊 -->
    	<div v-if="expand" class="expand-ctn flex-col">
			<div class="flex-end">
				<div class="rbtn w20vw tcef mglr1" @click.stop="onBtnModify(rpt, 'CANCEL')">{{$ln(`删单`)}}</div>
				<div class="rbtn w20vw tcef mglr1" v-if="isModifyAble" @click.stop="onBtnModify(rpt, 'REPRICE')">{{$ln(`改价`)}}</div>
				<div class="rbtn w20vw tcef mglr1" v-if="isModifyAble" @click.stop="onBtnModify(rpt, 'REDUCE')">{{$ln(`改量`)}}</div>
			</div>
		</div>		
    </div>
</template>

<script>
import ReportCardFn from '@/components/ReportCardFn';

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
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", sid);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: sid});
		},
		/** 長按彈出簡易下單盒 */
		onPress() {
			// 如果是觸A下B的委託，sid改取監看的商品(以免卡片上顯示A商品，USER點了之後顯示B商品的商品詳情)
			let sid = this.isABOrder? this.rpt.MARKET_WATCH[0].SYMBOL: this.sid;
			this.$store.commit("setSelectedSymbol", sid);
			eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
		},
	},
	components: {
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
		// 取得OCO觸價
		smoTrgPriceHtml() {
			let rpt = this.rpt;
			// 觸A下B (可能含有多組因server設計的market_watch是陣列。但因目前設計只有一組，因此先取第一組)
			if(this.marketWatchObj)
				return `<div class="w100p flex-1 flex-top-right">${this.marketWatchObj[0].CONDITION} ${this.marketWatchObj[0].PRICE}</div>`;
			if (!rpt.SMO)
				return;
			// 停損、觸價單情境
			if (!isNaN(rpt.SMO.TRG_PRICE)) {
				return `<div class="w100p flex-end">${rpt.$CONDITION_VALUE || this.$ln('市价')}</div>`;
			}
			// 移動停損單
			if (rpt.SMO.CONDITION == "TRAILINGSTOP") {
				return `<div class="w100p flex-end">${rpt.$CONDITION_VALUE}</div>`;
			}
			// OCO單情境
			let str = ``;
			if (rpt.$IS_OCO)
				str += `<div class="w100p flex-end">${rpt.$CONDITION_VALUE}</div>`;
				str += `<div class="w100p flex-end">${rpt.$CONDITION_VALUE2}</div>`;
			return str;
		},
		// 取得剩餘有效委託數量欄位HTML
		smoAvailableQtyHtml() {
			// 觸A下B (可能含有多組因server設計的market_watch是陣列。但因目前設計只有一組，因此先取第一組)
			if(this.marketWatchObj)
				return `<div class="w100p flex-1 flex-col">
							<div class="flex-row space-between"><span>${this.orderTypeText}</span><span>${this.rpt.ORDER_PRICE||'-'}</span></div>
							<div class="flex-row space-between"><span>${this.timeInForceText}</span><span>${this.rpt.$AVAILABLE_QTY}</span></div>
						</div>`;
			return `<div class="w100p flex-end">${this.rpt.$AVAILABLE_QTY}</div>`;
		},
		// 是否為期權商品
		isOpt() {
			return M4C.Option.isOpt(this.sid);
		},
		// 是否可改單(目前判斷觸A下B不可改單, 另增加OCO單)
		isModifyAble() {
			return !this.rpt.MARKET_WATCH && !this.rpt.OCO;
		},
		// 觸A下B委託
		isABOrder() {return this.rpt.MARKET_WATCH;},
	}
}
</script>

<style scoped>
.cloud-report-card-ctn {
	border-bottom: 1px solid #666;
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