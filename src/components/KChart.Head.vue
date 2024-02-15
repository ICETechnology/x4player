<template>
	<div class="mgl1 kchart-head-wrapper" :class="{'flex-vertical-center mgtb1d5':!largeSize}" >
		<div class="flex-col flex-1">
			<!-- 小字版 -->
			<div v-if="!largeSize" >
				<!-- 合約名稱 -->
				<div class="flex-1 flex-center flex-row flex-1">
					<div class="name mgr2">{{getName}}</div>
					<div class="month mgr2 font-size-mini clr-gray">{{getSymbolMonth}}</div>
					<div class ="flex-1" />
				</div>
				<div class="flex-row font-size-small flex-bottom">
					<!-- 漲跌 (漲跌幅%) -->
					<div class="flex-start font-size-mini mgr1">{{$symbolChgTxt_v2(qo)}}</div>
					<div class ="flex-1" />
					<!-- 量 -->
					<div class="flex-start font-size-mini mgr1" :class="[qo.$clr]">{{$volUnit(qo.v)}}</div>
				</div>
			</div>
			<div v-else="largeSize" >				
				<!-- 合約名稱 -->
				<div class="name mgr2 font-size-large font-bold">{{getName}}</div>
				<div class="month mgr2 font-size-little clr-gray">{{getSymbolMonth}}</div>
				<!-- 量 -->
				<div class="flex-start font-size-big mgr1 font-bold">{{$volUnit(qo.v)}}</div>
				<!-- 漲跌 (漲跌幅%) -->
				<div class="flex-1 font-bold font-size-big" :class="[qo.$clr]">{{symbolChgTxtObj?symbolChgTxtObj[0]:'--'}}</div>
				<div class="flex-1 font-bold font-size-big" :class="[qo.$clr]">{{symbolChgTxtObj?symbolChgTxtObj[1]:'--%'}}</div>
			</div>		
		</div>
	</div>
</template>
<script>
import QuoteAgent from '@/components/QuoteAgent';

export default {
	mixins: [QuoteAgent],
	props:['suspend', 'propsSid'],
	data(){
		return{}
	},
	methods: {},
	watch:{},
	computed:{
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		symbolChgTxtObj() {
			if(this.qo.sn) {
				return this.$symbolChgTxt_v2(this.qo).split("/");
			}
		},
		largeSize(){return this.$store.state.config.largeSize;},
		// "澳幣"
		getName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		// "6A1906"
		getSymbolMonth() {
			return this.displayAsHot ? this.$ln("主连") : M4C.Symbol.getCIDM4(this.sid);
		},
		/** 視為熱門月(主連) */
		displayAsHot() {
			if(this.propsSid) {
				return this.propsSid.indexOf('HOT') != -1;
			}
			else
				return this.$store.state.selectedSymbol.displayAsHot;
		},
		$symbolChgTxt_v2() {return this.$store.state.fn.$symbolChgTxt_v2;},
		$volUnit() {return this.$store.state.fn.$volUnit;},
		model(){return this.$store.state.Kchart.model;},
		sid() {
			return this.propsSid || this.$store.state.selectedSymbol.ID;
		},
	},
}
</script>