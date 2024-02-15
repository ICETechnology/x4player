<template>
	<div class="positionPL-sum-row-ctn w100p bgc-1c2733 pdtb2">
		<div class="flex-row">
			<div class="col-ctn flex-1 mgl2">
				<!-- 交易帳號選擇器 -->
				<LoginedBTOSelector class="logined-bto-selector w100p" :orderMode="true" />
			</div>
			<div class="flex-row flex-1 font-size-mini">
				<div class="flex-col mglr2 ">
					<div class="flex-1 col-label mgb1">{{$ln('幣種')}}</div>
					<div class="flex-1 flex-center">{{$ln(selectedCurrency)}}</div>
				</div>
				<div class="flex-col flex-1 font-size-mini">
					<div class="flex-1 col-label mgb1">{{$ln('即時損益試算')}}</div>
					<div class="flex-1 flex-center" :class="{'clr-dn': $PositionPLSumTrial < 0, 'clr-up': $PositionPLSumTrial > 0}">
						{{showSumTrial == null ? '無法試算' : `$ ${showSumTrial}`}}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		// 取匯率表
		M4C.Symbol.sendSymbolGetCurreny();
	},
	methods: {},
	computed: {
		currency() {return this.$store.state.status.selectedCurrency;},
		// 顯示當前選取的幣別
		selectedCurrency() {
			let option = this.$store.state.status.currencyOptionList.find(obj=>(obj.value == this.currency));
			return option? option.label: '--';
		},
		// 依幣別加總部位未實現損益
		$PositionPLSumTrial() {
			// 沒有匯率資料直接回傳
			if (!Object.keys(vuex.data.xRate).length)
				return null;
			let sum = 0;
            this.totalPositionSumList.forEach(rec => {
				const Minfo = M4C.Symbol.getMainformInfo(rec.SYMBOL);
				// 總表沒有幣別時，預設為 TWD https://trello.com/c/JE2IeYs3
				let posCurrency = Minfo ? (Minfo.Currency || 'TWD') : 'TWD';
				// 國外幣種轉為國內幣種
				let pureCurrency = this.currency.split("OB-").slice(-1)[0];
				// 基幣的話直接用TWD當幣種，其他不變。(如果未來有其他基幣就需要另外處理)
				let currency = pureCurrency == "***"? 'TWD': pureCurrency;
				// 依匯率轉換未實現損益
				let _purePL = this.$exchageTrial(posCurrency, currency, rec.UNREALIZED_PL);
				// 是數字才做加總
				if (sum != null && !isNaN(_purePL)) {
                	sum += _purePL;
				}
				// 任何部位轉換失敗就不進行加總 ex. 無匯率表，或匯率表沒有該幣別 等等
				else {
					sum = null;
				}
            });
			return sum;
		},
		showSumTrial() {
			if (this.$PositionPLSumTrial == null)
				return null;
			// 取小數2位
			return this.$displayMoney(parseFloat(this.$PositionPLSumTrial).toFixed(2));
		},
		// 所有要呈現的持倉資料
		totalPositionSumList() {
			return [].concat(this.normalPositionSumList).concat(this.compositePositionSumList);
		},
		/** 持倉匯總資料 */
		normalPositionSumList() {
			return this.$store.state.data.normalPositionSumList;
		},
		// 台灣複式選擇權持倉資料
		compositePositionSumList() {
			return this.$store.state.data.compositePositionSumList;
		},
		// 計算匯率
		$exchageTrial() {return this.$store.state.fn.$exchageTrial;},
		$displayMoney() {return this.$store.state.fn.$displayMoney;},
	}
}
</script>
<style lang='scss' scoped>
.positionPL-sum-row-ctn {
	overflow-x: auto;
	overflow-y: hidden;
}
.col-ctn {
	padding: 0 4px;
	@extend .flex-1;
	@extend .flex-col;
	@extend .flex-center;
	@extend .nowrap;
}
.col-label {
	@extend .clr-gray2;
	@extend .flex-center;
}
</style>