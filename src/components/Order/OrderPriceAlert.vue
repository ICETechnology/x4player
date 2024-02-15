<template>
	<div class="order-price-alert hidden"></div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		// 自己塞假資料來測試 (此時總表還沒設定，市況也還沒支持 br 欄位)
		// let minfo = M4C.Symbol.mainformInfos['I.O.SZSE'];
		// minfo.BreakRefPercent = "0.5";
		// minfo.BreakRefMultiple = "10.0";
		// this.qo.br = this.qo.p;
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		check({orderInfo}) {
			// 僅有『限價』要檢查
			if (orderInfo.TC_ORDER_TYPE !== 'LIMIT')
				return;
			if (!this.refPrice)
                return;
			if (!this.refPercent && !this.refMultiple)
				return;
			console.log('熔斷機制上限值 check value : ', this.uplimit);
			console.log('熔斷機制下限值 check value : ', this.dnlimit);
			if (orderInfo.ORDER_PRICE >= this.uplimit)
				return `${orderInfo.ORDER_PRICE} >= ${this.uplimit}`;
			else if (orderInfo.ORDER_PRICE <= this.dnlimit)
				return `${orderInfo.ORDER_PRICE} <= ${this.dnlimit}`;
		},
	},
	watch: {},
	computed: {
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
		qo() {
			return this.$store.state.selectedSymbol.QO;
		},
		exgMinfo() {
			return M4C.Symbol.getExgMainformInfo(this.sid);
		},
		ticksize() {
			return M4C.Symbol.getTickSize(this.sid, this.qo.p);
		},
		refPrice() {
			return this.qo.br;
		},
		refPercent() {
			return Number(this.exgMinfo.BreakRefPercent);
		},
		refMultiple() {
			return Number(this.exgMinfo.BreakRefMultiple);
		},
		uplimit() {
			let v0, v1;
			if (this.refPercent)
				v0 = +Big(this.refPrice).times(+Big(1).plus(this.refPercent));
			if (this.refMultiple)
				v1 = +Big(this.refPrice).plus(Big(this.ticksize).times(this.refMultiple));
			console.log(`熔斷機制上限值 by percent  : ${this.refPrice} * (1 + ${this.refPercent}) = ${v0}`);
			console.log(`熔斷機制上限值 by multiple : ${this.refPrice} + ${this.ticksize} * ${this.refMultiple} = ${v1}`);
			if (v0 == null)
				return v1;
			if (v1 == null)
				return v0;
			return v0 > v1 ? v0 : v1;
		},
		dnlimit() {
			let v0, v1;
			if (this.refPercent)
				v0 = +Big(this.refPrice).times(this.refPercent);
			if (this.refMultiple)
				v1 = +Big(this.refPrice).minus(Big(this.ticksize).times(this.refMultiple));
			console.log(`熔斷機制下限值 by percent  : ${this.refPrice} * ${this.refPercent} = ${v0}`);
			console.log(`熔斷機制下限值 by multiple : ${this.refPrice} - ${this.ticksize} * ${this.refMultiple} = ${v1}`);
			if (v0 == null)
				return v1;
			if (v1 == null)
				return v0;
			return v0 < v1 ? v0 : v1;
		},
	},
}
</script>

<style scoped>
</style>