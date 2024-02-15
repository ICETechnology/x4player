<template>
	<div class="symbol-position-row-ctn flex-col" @click="onClick" :class="{'bgc-1c2733': twMode}">
		<!-- app版 -->
		<div v-if="!mode" class="symbol-position-row pdtb2 bgc-2A flex-row font-size-mini">
			<!-- 台灣操作模式(QuotePageHead樣式) -->
			<div class="flex-center flex-col flex-3" v-if="twMode && isHead" @click.stop="onBtnClick">
				<div class="clr-gray2 mgb1">{{$ln('交易帐号')}}</div>
				<div class="font-bold text-align-center flex-center font-size-small">{{displayTraderID}}</div>
			</div>
			<!-- 台灣操作模式(QuotePageHead樣式) : 僅顯示 多/空 -->
			<div v-if="twMode && isHead" class="flex-2 flex-col flex-center">
				<div class="clr-gray2 mgb1 flex-bottom flex-1">{{$ln(`多 / 空`)}}<i v-if="psd.$BQTY || psd.$SQTY" class="mgl2 material-icons md-18">create_new_folder</i></div>
				<div class="flex-center text-align-center flex-1">
					<!-- 台灣版基本不會有多空併存情形 -->
					<span :class="$clr0(psd.$BQTY)" v-if="psd.$BQTY">+{{displayQty(psd.$BQTY)}} @{{$symbolPrice(sid, psd.$BAVG, precision)}}</span>
					<span :class="$clr0(-psd.$SQTY)" v-else-if="psd.$SQTY">-{{displayQty(psd.$SQTY)}} @{{$symbolPrice(sid, psd.$SAVG, precision)}}</span>
					<span v-else>--</span>
				</div>
			</div>
			<!-- 台灣操作模式(下單盒樣式) : 僅顯示 多/空 -->
			<div v-if="twMode && !isHead" class="flex-2 flex-col flex-center">
				<div class="clr-gray2 mgb1">{{$ln(`多 / 空`)}}</div>
				<div class="flex-center">
					<span :class="$clr0(psd.$BQTY)">{{displayQty(psd.$BQTY)}}</span>
					<span class="mglr1">/</span>
					<span :class="$clr0(-psd.$SQTY)">{{displayQty(psd.$SQTY)}}</span>
					<i v-if="psd.$BQTY || psd.$SQTY" class="mgl2 material-icons md-18">create_new_folder</i>
				</div>
			</div>
			<div class="flex-2 flex-col flex-center">
				<div class="clr-gray2 mgb1 flex-center">{{$ln(`逐笔浮盈`)}}<i v-if="plMemo" class="pl-info material-icons md-18" @click.stop="onPLInfo">info</i></div>
				<div :class="$clr0(psd.$PL)">{{$displayPL(psd.$PL)}}</div>
			</div>
			<!-- 重新查詢 -->
			<div v-if="displayOnThunderF && twMode" class="flex-center flex-0d75 tcef" @click="onRefresh"><i class="material-icons tcef" 
				:class="{'querying': queryPositionSumResult.$STATUS==='QUERY'}">refresh</i></div>
		</div>

		<!-- 簡易今、昨倉資料顯示-->
		<div v-if="mode=='orderBlockSimplePos'" class="symbol-position-row flex-col flex-1">
			<div class="flex-row pdb2">
				<div class="mgr3">{{$ln('今仓')}}</div>
				<div class="flex-row flex-1">
					<span class="clr-up pdlr2">{{$ln('多')}}</span>
					<span class="flex-1 flex-end">{{displayQty1(psd['BUY_QTY'])||'-'}}</span>
				</div>
				<div class="flex-row flex-1">
					<span class="clr-dn pdlr2">{{$ln('空')}}</span>
					<span class="flex-1 flex-end">{{displayQty1(psd['SELL_QTY'])||'-'}}</span>
				</div>
			</div>
			<div class="flex-row pdb2">
				<div class="mgr3">{{$ln('昨仓')}}</div>
				<div class="flex-row flex-1">
					<span class="clr-up pdlr2">{{$ln('多')}}</span>
					<span class="flex-1 flex-end">{{displayQty1(psd['PREV_BUY_QTY'])||'-'}}</span>
				</div>
				<div class="flex-row flex-1">
					<span class="clr-dn pdlr2">{{$ln('空')}}</span>
					<span class="flex-1 flex-end">{{displayQty1(psd['PREV_SELL_QTY'])||'-'}}</span>
				</div>
			</div>
			<!-- 依市況、數量試算Delta、Gamma資料 -->
			<SimpleGreeks v-if="showDeGa" :qty="$store.state.order.inputOrderQty"/>
		</div>
	</div>
</template>

<script>
import CloseOrAndCancel from "@/components/CloseOrAndCancel.vue";
import SimpleGreeks from "@/components/SimpleGreeks.vue";
import TradingAccountManager from "@/components/TradingAccountManager.vue";
import ClientPLMemo from "@/components/ClientPLMemo.vue";
export default {
	props: ['mode', 'showDeGa', 'isHead', 'displayOnThunderF'],
	data() {
		return {
			// 查詢持倉匯總結果
			queryPositionSumResult: {},
		}
	},
	beforeMount() {},
    mounted() {
		// 重算當前關注商品的即時損益 (持倉可能比報價晚到，所以需要這邊也刷新一次)
		M4C.Position.refreshPL();
	},
	beforeDestroy() {},
	components: {CloseOrAndCancel, SimpleGreeks, TradingAccountManager},
    methods: {
		onClick(){
			// 有持倉資料
			if(Object.keys(this.psd).length && this.isClosedAble)
				eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: CloseOrAndCancel, param: {useComName: this.selfComName}});
		},
		displayQty(qty) {
			return qty == null ? '--' : qty;
		},
		displayQty1(qty) {
			return !qty || qty=='0'? '-' : qty;
		},
		onBtnClick: function() {
			eventBus.$emit("POPUP-DIALOG", TradingAccountManager, {}, {transName: 'float'});
		},
		onRefresh() {
			this.queryPositionSumResult = M4C.Position.queryPositionSum();			
		},
		onPLInfo() {
			eventBus.$emit("CONFIRM-DIALOG", {
				contentComponent: ClientPLMemo,
				confirmOnly: true,
			});
		},
	},
	watch: {
		// 持倉查詢結果狀態
		'queryPositionSumResult.$STATUS'(nv) {
			switch(nv) {
				case 'DONE':
					this.$store.state.notify(this.$ln('持倉刷新完成'));
					// 解決刷新後浮動損益在收到新的tick前顯示 -- 
					M4C.Position.refreshPL();
					break;
				case 'FAIL':
					this.$store.state.notify(`error`, this.$ln('持倉查詢失敗'));
					break;
			}
		}
	},
    computed: {
		precisionBeyondTickSize() {try{return this.$store.state.config.CONFIG.POSITION.precisionBeyondTickSize;}catch(e){}},
		precision(){
			return isNaN(this.precisionBeyondTickSize) || this.precisionBeyondTickSize == null ? 1 : this.precisionBeyondTickSize
		},
		$clr0() {return this.$store.state.fn.$clr0;},
		$displayPL() {return this.$store.state.fn.$displayPL;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		sid() {return this.$store.state.selectedSymbol.ID;},
		// 當前商品的部位
		psd() {
			return this.$store.state.selectedSymbol.positionSum;
		},
		/** 開倉均價 (支持多空並存) */
		bsAVG() {
			let result = "";
			if (this.psd && this.psd.$BAVG)
				result += `<span>${this.$symbolPrice(this.sid, this.psd.$BAVG, this.precision)}</span>`;
			if (this.psd && this.psd.$BAVG && this.psd.$SAVG)
				result += `<span class="mglr0d5">/</span>`;
			if (this.psd && this.psd.$SAVG)
				result += `<span>${this.$symbolPrice(this.sid, this.psd.$SAVG, this.precision)}</span>`;
			return result || '--';
		},
		pjID(){
			return this.$store.state.config.projectID;
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		isClosedAble() {
			// 台灣版目前似乎不需要看可平部位來決定。
			if(this.twMode)
				return this.psd.$BQTY > 0 || this.psd.$SQTY > 0;
			else
				return this.psd.$OBQTY > 0 || this.psd.$OSQTY > 0;
		},
		isOption() {return this.sid.split(".")[1] === "O"},
		isDesktop() {return this.$store.state.device.isDesktop;},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		selectedBTO() {
			return this.$store.state.selectedBTO || {};
		},
		displayTraderID() {
			return M4C.Trader.getDisplayTraderID(this.selectedBTO.selectedAccountID);
		},
		plMemo() {
			return vuex.selectedSymbol.plMemo;
		},
	},
}
</script>

<style scoped>
.symbol-position-row {
	border-radius: 0.4em;
}
.desktop .split-ctn {
	min-width: 1.5em;
}
/* 查詢中效果 */
.querying {
	/* 每秒一轉，spin 效果已在 LoadingIcon 提供 */
	animation:spin 1s linear infinite;
}
.pl-info {
	color: #666 !important;
}
</style>