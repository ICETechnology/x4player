<template>
	<div class="convert-market-price-memo flex-col font-size-small pdl3 pdtb1 tcef" @click="onBtnConvertMarketPrice">
		<div class="flex-start">
			<span>{{$ln('市价转')}}</span>
			<div class="flex-1" />
			<i class="mglr2 material-icons md-18">settings</i>
		</div>
		<div class="flex-row flex-start">
			<span class="clr-orange">{{orderTypeText}}</span>
			<span class="mglr1">{{jumpsText}}</span>
			<span class="clr-aqua">{{orderConvertMarketPrice.timeInForce}}</span>
		</div>
	</div>
</template>

<script>
import ConvertMarketPrice from "@/components/ConvertMarketPrice.vue"
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		// 市價自動轉價
		onBtnConvertMarketPrice() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit("POPUP-DIALOG", ConvertMarketPrice, {}, {transName: 'float'});
		},
	},
	watch: {},
	computed: {
		orderConvertMarketPrice() {
			return this.$store.state.order.convertMarketPrice;
		},
		orderTypeText() {
			return this.$store.state.config.mapOrderTypeLabel[this.orderConvertMarketPrice.orderType];
		},
		jumpsText() {
			if (this.orderConvertMarketPrice.jumps) return `加 ${this.orderConvertMarketPrice.jumps} 跳`;
		},
	},
}
</script>

<style scoped>
.convert-market-price-memo {
	border: 1px dashed #393939;
	border-radius: 1vw;
	box-sizing: border-box;
}
</style>