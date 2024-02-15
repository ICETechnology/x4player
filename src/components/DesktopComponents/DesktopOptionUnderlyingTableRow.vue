<template>
	<tr>
		<td class="pdtb1" v-for="(obj, idx) in columns" :key="idx" :style="{'text-align': obj.align || 'right'}" :class="cellClass(obj)" @click="onCellClick(obj)">{{_self[obj.key]}}</td>
	</tr>
</template>
<script>
import QuoteAgent from '@/components/QuoteAgent';
export default {
	mixins: [QuoteAgent],
	data() {
		return {
			_self: this,
		}
	},
	props:["sid", "columns"],
	mounted() {
		
	},
	methods: {
		getSymbolMonth(sid) {return M4C.Symbol.getCIDM4(sid);},
		cellClass(obj) {
			let list = [];
			let qo = this.qo;
			if (obj.isPrice) {
				list.push('is-price');
				list.push(this.$clrUd(this[obj.key], qo.r));
			}
			if (obj.clrCp0) {
				list.push(this.$clr0(this[obj.clrCp0]));
			}
			return list;
		},
		onCellClick(obj) {
			if (obj.isPrice && this[obj.key]) {
				eventBus.$emit("ORDER", {orderType: 'LIMIT', orderPrice: this[obj.key]});
			}
			this.$store.commit("setSelectedSymbol", this.sid);
		},
	},
	watch: {},
	computed: {
		price() {return this.qo.p;},
		bp1() {return this.qo.bp1;},
		sp1() {return this.qo.sp1;},
		updnObj() {return this.$store.state.fn.$symbolChgTxt(this.qo);},
		updn() {
			if(this.updnObj)
				return this.updnObj.split(' ')[0];
		},
		updnPercent() {
			if(this.updnObj)
				return this.updnObj.split(' ')[1];
		},
		iv() {return this.qo.iv;},
		/** 隱含波動率差值 */
		diffIV() {
			return ((this.qo.iv || 0) - (this.qo.piv || 0)).toFixed(1);
		},
		hv4() {return this.qo.hv4;},
		/** 20天歷史波動率差值 */
		diffHV4() {
			return ((this.qo.hv4 || 0) - (this.qo.phv4 || 0)).toFixed(1);
		},
		qty() {return this.qo.q;},
		$clrUd() {return this.$store.state.fn.$clrUd;},
		$clr0() {return this.$store.state.fn.$clr0;},
		symbolMonth() {return M4C.Symbol.getCIDM4(this.sid);},
		mapSymbolContracts() {return M4C.Symbol.mapSymbolContracts;},
		futContracts() {
			// 轉成熱門月代碼
			let tmp = this.underlyingS.split('.');
				tmp.splice(-1,1);
				tmp.push('HOT');
			// 轉成熱門月月份代碼
			let symbol = M4C.Symbol.toMonthSymbol(tmp.join('.'));
			return this.mapSymbolContracts[symbol];
		},
		futMonth() {
			let list = []
			if(this.futContracts){
				list = this.futContracts.map(contracts => {
					let month = contracts.split('.')[4] || "";
					return month;
				});
			}
			// 最多5個標的。
			return list.splice(0, 5);
		},
		underlyingMonth() {
			if(this.$store.state.opt.underlyingSInfo.Type === "S")
				return [this.month];
			else return this.futMonth;
		},
		underlyingS() {return this.$store.state.opt.underlyingS;},
	},
}
</script>
<style scoped>

</style>