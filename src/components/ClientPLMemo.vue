<template>
	<div class="client-pl-info flex-col">
		<div class="mgb5 clr-gray">{{$ln('浮動損益計算公式：')}}</div>
		<div v-if="this.plMemo.bqty" class="flex-col mgb5">
			<div class="flex-row">
				<div class="flex-center mglr1 font-size-large">(</div>
				<div class="flex-col flex-center">
					<div class="nowrap font-size-micro clr-gray2">{{$ln($store.state.config.profitByOpposite ? '對手價' : '成交價')}}</div>
					<div class="font-size-normal">{{this.$symbolPrice(this.sid, this.plMemo.usePrice)}}</div>
				</div>
				<div class="flex-center mglr3 font-size-large">-</div>
				<div class="flex-col flex-center">
					<div class="nowrap font-size-micro clr-gray2">{{$ln('持倉均價')}}</div>
					<div class="font-size-normal">{{this.$symbolPrice(this.sid, this.plMemo.bavg, 1)}}</div>
				</div>
				<div class="flex-center mglr1 font-size-large">)</div>
			</div>
			<div class="flex-row mgt3">
				<div class="flex-center mgl1 mgr3 font-size-large">x</div>
				<div class="flex-col flex-center">
					<div class="nowrap font-size-micro clr-gray2">{{$ln('數量')}}</div>
					<div class="font-size-normal">{{this.plMemo.bqty}}</div>
				</div>
				<div class="flex-center mglr3 font-size-large">x</div>
				<div class="flex-col flex-center">
					<div class="nowrap font-size-micro clr-gray2">{{$ln('權重')}}</div>
					<div class="font-size-normal">{{this.plMemo.weight}}</div>
				</div>
				<div class="flex-center mglr3 font-size-large">=</div>
				<div class="flex-col flex-center">
					<div class="nowrap font-size-micro clr-gray2">{{$ln('損益')}}</div>
					<div class="font-size-normal">{{this.$displayPL(this.plMemo.buyOpenProfit)}}</div>
				</div>
			</div>
		</div>
		<div v-if="this.plMemo.sqty" class="flex-col">
			<div class="flex-row">
				<div class="flex-center mglr1 font-size-large">(</div>
				<div class="flex-col flex-center">
					<div class="nowrap font-size-micro clr-gray2">{{$ln('持倉均價')}}</div>
					<div class="font-size-normal">{{this.$symbolPrice(this.sid, this.plMemo.savg, 1)}}</div>
				</div>
				<div class="flex-center mglr3 font-size-large">-</div>
				<div class="flex-col flex-center">
					<div class="nowrap font-size-micro clr-gray2">{{$ln($store.state.config.profitByOpposite ? '對手價' : '成交價')}}</div>
					<div class="font-size-normal">{{this.$symbolPrice(this.sid, this.plMemo.usePrice)}}</div>
				</div>
				<div class="flex-center mglr1 font-size-large">)</div>
			</div>
			<div class="flex-row mgt3">
				<div class="flex-center mgl1 mgr3 font-size-large">x</div>
				<div class="flex-col flex-center">
					<div class="nowrap font-size-micro clr-gray2">{{$ln('數量')}}</div>
					<div class="font-size-normal">{{this.plMemo.sqty}}</div>
				</div>
				<div class="flex-center mglr3 font-size-large">x</div>
				<div class="flex-col flex-center">
					<div class="nowrap font-size-micro clr-gray2">{{$ln('權重')}}</div>
					<div class="font-size-normal">{{this.plMemo.weight}}</div>
				</div>
				<div class="flex-center mglr3 font-size-large">=</div>
				<div class="flex-col flex-center">
					<div class="nowrap font-size-micro clr-gray2">{{$ln('損益')}}</div>
					<div class="font-size-normal">{{this.$displayPL(this.plMemo.sellOpenProfit)}}</div>
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
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {},
	watch: {},
	computed: {
		sid() {return this.$store.state.selectedSymbol.ID;},
		$displayPL() {return this.$store.state.fn.$displayPL;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},

		plMemo() {
			return vuex.selectedSymbol.plMemo;
		},
	},
}
</script>

<style scoped>
</style>