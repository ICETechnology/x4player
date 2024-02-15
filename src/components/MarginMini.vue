<template>
	<div>
		<div class="ctn flex-row flex-start" v-if="!uiStyle">
			{{$ln('可用')}} : 
			{{format(allMarginData, currency, 'AVAILABLE_MARGIN')}}
			<span class="mglr3">|</span>
			{{$ln('浮盈')}} : 
			{{format(allMarginData, currency, 'REALIZED_DAILY_PL')}}
			<span class="mglr3">|</span>
			{{$ln('风险')}} : 
			{{format(allMarginData, currency, 'RISK_RATE')}} %
		</div>
		<div class="ctn flex-row flex-start" v-if="uiStyle=='2'">
			{{$ln('可用資金')}}  
			{{format(allMarginData, currency, 'AVAILABLE_MARGIN')}}
			<div class="flex-1" />
			{{$ln('风险度')}} 
			{{format(allMarginData, currency, 'RISK_RATE')}} %
		</div>
	</div>
</template>

<script>
export default {
	props: ["sid", "suspend", "uiStyle"],
	data() {
		return {
        }
	},
	beforeMount() {
	},
    mounted() {
    },
	beforeDestroy() {
	},
	components: {
	},
    methods: {
		format(allMarginData, currency, key) {
			if (!allMarginData || !allMarginData[currency])
				return;
			let str = allMarginData[currency][key];
			let val = parseFloat(str).toFixed(2);
			return isNaN(val) ? '--' : this.$commas(val);
		},
	},
	watch: {
	},
    computed: {
		$commas() {
			return this.$store.state.fn.$commas;
		},
		// 當前選擇幣別
		currency() {
			return this.$store.state.status.selectedCurrency;
		},
		// 以幣別為 key 的響應式資金資料
		allMarginData() {
			return this.$store.state.data.marginData;
		},
    }
}
</script>

<style scoped>
</style>