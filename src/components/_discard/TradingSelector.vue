<template>
	<div class="trading-selector-ctn flex-col">
		<MyHead class="head" :backType="1" :acc-btn=false :showText="$ln(`交易选择`)" :margin="false"></MyHead>
		<div class="flex-1 mg5 posr font-size-small">
			<div class="FULL">
				<div class="flex-row list-block">
					<Button	class="btn" @click="onBtnClick('TradeTab1')" :class="{'selected': $store.state.status.tradeTabID === 'TradeTab1'}">{{$ln(`持仓汇总`)}}</Button>
					<Button	class="btn" @click="onBtnClick('TradeTab2')" :class="{'selected': $store.state.status.tradeTabID === 'TradeTab2'}">{{$ln(`有效委托`)}}</Button>
					<Button	class="btn" @click="onBtnClick('TradeTab3')" :class="{'selected': $store.state.status.tradeTabID === 'TradeTab3'}">{{$ln(`全部委托`)}}</Button>
					<Button	class="btn" @click="onBtnClick('TradeTab4')" :class="{'selected': $store.state.status.tradeTabID === 'TradeTab4'}">{{$ln(`成交明细`)}}</Button>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	data() {
		return {
		};
	},
	created() {},
	components: {},
	mounted() {},
	methods: {
		onBtnClick(tabID) {
			this.$store.state.status.tradeTabID = tabID;
			eventBus.$emit("CLOSE-DIALOG");
		}
	},
	computed: {},
};
</script>
<style lang="scss" scoped>
.head {
	padding: 0 10px;
	background-color: #333;
}
.btn {
	margin: 5px 0;
	min-height: 2em;
	max-width: 40%;
	min-width: 40%;
	border: 1px solid #373737;
}
.selected {
	border: 1px solid rgb(255, 152, 0);
	color: rgb(255, 152, 0);
}
</style>
