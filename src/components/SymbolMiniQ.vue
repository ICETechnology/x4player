<template>
	<div class="symbol-mini-q-ctn" :class="[flexRow?'flex-row':'flex-col']">
		<!-- 最新價 -->
		<div v-if="!showBS1P" class="flex-start trading-price pdr1" :class="[qo.$clr, {'flex-1 font-size-xl':!flexRow}]">{{$symbolPrice(sid, qo.p)}}</div>
		<!-- 漲跌 (漲跌幅%) -->
		<div v-if="!showBS1P" class="flex-1 flex-start font-size-small" :class="[qo.$clr]">{{$symbolChgTxt(qo)}}</div>
		<div class="flex-row" v-if="showBS1P">
            <div class="flex-1 flex-col label-ctn">
                <span class="flex-1 flex-start clr-dn pdb2 nowrap">{{$ln('卖1')}}</span>
				<span class="flex-1 flex-start pdb2 nowrap">{{$ln('最新')}}</span>
				<span class="flex-1 flex-start clr-up pdb2 nowrap">{{$ln('买1')}}</span>                
            </div>
            <div class="flex-2 flex-col price-ctn">
              	<span class="flex-1 flex-end pdb2 pdlr1 clr-dn">{{$symbolPrice(qo.s, qo.sp1)}}</span>
                <span class="flex-1 flex-end pdb2 pdlr1">{{$symbolPrice(qo.s, qo.p)}}</span>
				<span class="flex-1 flex-end pdb2 pdlr1 clr-up">{{$symbolPrice(qo.s, qo.bp1)}}</span>
                
            </div>
            <div class="flex-1 flex-col vol-ctn">
                <span class="flex-1 flex-end pdb2 clr-dn">{{qo.sv1}}</span>
                <span class="flex-1 flex-end pdb2">{{qo.q}}</span>
                <span class="flex-1 flex-end pdb2 clr-up">{{qo.bv1}}</span>
            </div>
        </div>
	</div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';

export default {
	mixins: [QuoteAgent],
	props: ["symbol", "flexRow", "showBS1P"],
	data() {
		return {}
	},
	beforeMount() {},
	computed: {
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		$symbolChgTxt() {return this.$store.state.fn.$symbolChgTxt;},
		sid(){
			return this.symbol || this.$store.state.selectedSymbol.ID;
		},
	}
}
</script>

<style scoped>
.symbol-cnm4-ctn {
}
.symbol-name {
	white-space: nowrap;
	overflow: hidden;
}
</style>