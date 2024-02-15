<template>
	<div class="over-updn-limit-alert hidden"></div>
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
			if (!this.enableSymbolList)
				return;
            // 檢查當前合約是否符合此機制要套用的品種 (ex. "I.F.INE.scTAS")
			if (this.enableSymbolList) {
                let enable = this.enableSymbolList.find(symbolID=>{
                    if (this.sid.indexOf(symbolID) !== -1)
                        return symbolID;
                });
                if (!enable)
				    return;
            }
			// 有漲停或跌停價才往下
			if (this.uplimit == null && this.dnlimit == null)
				return;
			console.log(`委託價超過漲跌停檢查機制 : 委託價=${orderInfo.ORDER_PRICE}, 漲停價=${this.uplimit}, 跌停價=${this.dnlimit}`);
			if (this.uplimit != null && this.uplimit != '' && orderInfo.ORDER_PRICE > this.uplimit)
				return `${orderInfo.ORDER_PRICE} > ${this.uplimit}`;
			else if (this.dnlimit != null && this.dnlimit != '' && orderInfo.ORDER_PRICE < this.dnlimit)
				return `${orderInfo.ORDER_PRICE} < ${this.dnlimit}`;
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
		uplimit() {
            return this.qo.hl;
		},
		dnlimit() {
            return this.qo.ll;
		},
		publicPdSetting() {
			return this.$store.state.config.publicPdSetting;
		},
        enableSymbolList() {
            try{return this.publicPdSetting.function.orderOverUpDnLimitCheck.symbol;}catch(e){}
        },
	},
}
</script>

<style scoped>
</style>