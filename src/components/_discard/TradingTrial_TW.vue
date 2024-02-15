<template>
	<div class="trading-trial-tw-ctn flex-row posr mgtb2">
		<div class="flex-row flex-1 space-between">
			<div class="item_label mgr2 clr-gray2">{{$ln('保证金')}}：</div>
			<div class="item_value">{{$commas(totalMarginAmount)}}</div>
		</div>
		<div class="flex-row flex-1" />
	</div>
</template>
<script>
export default {
	data(){
		return {}
	},
	props:[],
	beforeMount() {
		this.queryMarginAmount();
	},
	methods: {
		// 查詢商品保證金
		queryMarginAmount() {
			M4C.Margin.queryMarginAmount(this.sid);
		},
	},
	watch: {
		// 切換商品時重查保證金
		sid(nv) {
			this.queryMarginAmount();
		},
	},
	computed: {
	sid() {return this.$store.state.selectedSymbol.ID;},
	queryResult() {return this.$store.state.result.queryMarginAmountResult;},
	queryData() {try {return this.queryResult.data.d}catch(e){return {}}},
	// 商品保證金資料
	itemAmount() {return this.queryData.AMOUNT;},
	orderQty() {return this.$store.state.order.inputOrderQty;},
	totalMarginAmount() {return this.$safeFloat(this.itemAmount * this.orderQty) || 0;},
	$commas() {return this.$store.state.fn.$commas;},
	}
}
</script>
<style scoped>
.trading-trial-tw-ctn {
	line-height: 1.2;
}
</style>