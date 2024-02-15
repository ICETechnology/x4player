<template>
	<div class="simple-greeks-ctn flex-col">
		<div class="flex-row pdb2">
			<div class="mgr3">{{$ln('Delta$')}}</div>
			<div class="flex-end flex-1">
				{{$Delta || '-'}}
			</div>
		</div>
		<div class="flex-row">
			<div class="mgr3">{{$ln('Gamma$')}}</div>
			<div class="flex-end flex-1">
				{{$Gamma || '-'}}
			</div>
		</div>
	</div>
</template>
<script>
import QuoteAgent from '@/components/QuoteAgent';
export default {
	mixins: [QuoteAgent],
	data() {
		return {

		}
	},
	props: ["qty"],
	beforeMount() {},
	mounted() {},
	methods: {},
	computed: {
		// 當前關注的sid
		curSid() {return this.$store.state.selectedSymbol.ID;},
		curQo() {return this.$store.state.selectedSymbol.QO;},
		minfo() {return this.$store.state.selectedSymbol.MInfo;},
		// 標的sid
		sid() {return M4C.Symbol.getUnderlyingS(this.curSid);},
		underlyingSQO () {return M4C.Quote.getQuoteObject(this.sid);},
		// 顯示的資料		
		$Delta() {
			if(this.curQo.de){
				// $Delta = Delta x 合约单位 x 标的最新价 x 下单数量 (server给的delta资料需另外除100)
				// console.log("simplegreeks", this.curQo.de, this.minfo.Weight, this.underlyingSQO.p, this.qtys);
				let delta = this.$safeFloat((this.curQo.de * 0.01) * this.minfo.Weight * this.underlyingSQO.p * this.qty);
				return parseFloat(delta).toFixed(2);
			}
			else return "--";
		},
		$Gamma() {
			if(this.curQo.ga){
				// 1%$Gamma = 0.01 x Gamma x 合约单位 x 下单数量 x 标的最新价 x 标的最新价
				let gamma = 0.01 * this.curQo.ga * this.minfo.Weight  * this.qty * this.underlyingSQO.p * this.underlyingSQO.p;
				return parseFloat(gamma).toFixed(2);
			}
			else return "--";
		},
	},
}
</script>
<style scoped>

</style>