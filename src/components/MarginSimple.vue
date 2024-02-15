<template>
	<div class="margin-simple-ctn w100p" :class="{'bgc-1c2733': twMode}">
		<div class="flex-row">
			<div class="col-ctn" v-if="twMode" @click="onBtnClick">
				<div class="w100p col-label font-size-mini mgb1">{{$ln('交易帐号')}}</div>
				<div class="w100p font-bold flex-center font-size-small">{{displayTraderID}}</div>
			</div>
			<div class="col-ctn" v-if="!twMode">
				<div class="w100p col-label font-size-mini mgb1">{{$ln('市场权益')}}</div>
				<div class="w100p font-bold flex-center">{{displayCURRENT_BALANCE}}</div>
			</div>
			<div class="col-ctn">
				<div class="w100p col-label font-size-mini mgb1">{{$ln('逐笔浮盈')}}</div>
				<div class="w100p font-bold flex-center">{{displayUNREALIZED_PL}}</div>
			</div>
			<div class="col-ctn">
				<div class="w100p col-label font-size-mini mgb1">{{$ln('风险度')}}</div>
				<div class="w100p font-bold flex-center">{{displayRISK_RATE}}</div>
			</div>
			<div v-if="twMode" class="flex-center tcef" @click="onRefresh">
				<div class="flex-center pd0d5 mgr1 rd2"><i class="material-icons tcef">refresh</i></div>
			</div>
		</div>
	</div>
</template>

<script>
import TradingAccountManager from "@/components/TradingAccountManager.vue";
export default {
	props: [],
	data() {
		return {
			// 以幣別為 key 的響應式資金資料
			allMarginData: this.$store.state.data.marginData,
        }
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onRefresh() {
			M4C.Margin.queryMargin();
		},
		onBtnClick: function() {
			eventBus.$emit("POPUP-DIALOG", TradingAccountManager, {}, {transName: 'float'});
		}
	},
	watch: {},
    computed: {
		$displayPL() {return this.$store.state.fn.$displayPL;},
		$displayMoney() {
			return this.$store.state.fn.$displayMoney;
		},
		// 當前選擇幣別
		currency() {
			return this.$store.state.status.selectedCurrency;
		},
		// 所有幣別的資金資料
		marginData() {
			return this.$store.state.data.marginData || {};
		},
		/** 當前幣別的資金資料 */
		currencyMarginData() {
			return this.marginData[this.currency] || {};
		},
		displayCURRENT_BALANCE() {
			let val = parseFloat(this.currencyMarginData.CURRENT_BALANCE).toFixed(0);
			return this.$displayMoney(val);
		},
		// 因台湾PM(fred)說台灣版都看FUT_BALANCE因此只處理FUT_BALANCE。P.S. 台灣公版會沒有這個欄位
		displayFUT_BALANCE() {
			let val = parseFloat(this.currencyMarginData.FUT_BALANCE).toFixed(0);
			return this.$displayMoney(val);
		},
		displayUNREALIZED_PL() {
			return this.$displayPL(this.currencyMarginData.UNREALIZED_PL);
		},
		displayRISK_RATE() {
			let val = parseFloat(this.currencyMarginData.RISK_RATE);
			return !isNaN(val) ? `${val.toFixed(2)}%` : '--';
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		selectedBTO() {
			return this.$store.state.selectedBTO || {};
		},
		displayTraderID() {
			return M4C.Trader.getDisplayTraderID(this.selectedBTO.selectedAccountID);
		},
    }
}
</script>

<style lang='scss' scoped>
.margin-simple-ctn {
	overflow-x: auto;
	overflow-y: hidden;
	padding: 0 0 2px 0;
	// background-color: #333;
}
.col-ctn {
	padding: 0 4px;
	@extend .flex-1;
	@extend .flex-col;
	@extend .flex-center;
	@extend .nowrap;
}
.col-label {
	@extend .clr-orange3;
	@extend .flex-center;
}
.border {
	margin: 10px 2px;
	border-right: 1px solid gray;
}
</style>