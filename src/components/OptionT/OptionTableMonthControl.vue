<template>
    <div class="option-table-month-control hidden" :month="month" />
</template>

<script>
export default {
	props: ["month", "contracts"],
	data() {
		return {
			qo: {},
		}
	},
	beforeMount() {
		// 期貨期權時，協助訂閱此月份的期貨商品
		if (this.sid) {
			M4C.Quote.sub(this.sid, this);
			this.qo = M4C.Quote.getQuoteObject(this.sid);
		}
		// 已經存在 [價平價格]與[價平合約列表]時，直接 set 進 contracts
		if (this.closedSP) {
			this.$set(this.contracts, "closedContracts", this.closedContracts);
			this.$set(this.contracts, "closedPrice", this.closedSP);
		}
	},
	beforeDestroy() {
		if (this.sid) {
			M4C.Quote.unsub(this.sid, this);
		}
	},
    methods: {
		/** 取得列表中指定idx的上下幾檔 */
		sliceList(list, idx) {
			let cnt = this.$store.state.opt.expandCnt;
			let s = Math.round(idx - cnt/2);
			s = s < 0 ? 0 : s;
			let e = Math.round(idx + cnt/2);
			return list.slice(s, e);
		},
	},
	watch: {
		closedContracts(nv) {
			this.$set(this.contracts, "closedContracts", nv);
			this.$set(this.contracts, "closedPrice", this.closedSP);
		},
	},
    computed: {
		// 期貨期權時，本月份所對應的期貨商品
		sid() {
			// 週台選情境 : 需要用合約回推標的代碼 (因為同個畫面同時包含台選/週台選時，會導致當前的 opt.underlying.F 是台選的，不試用於週台選)
			try{return this.isFeatureOption ? `${M4C.Symbol.getMainformInfo(this.contracts.C[0]).Underlying.F}.${this.month6}` : null;}catch(e){}
			return this.isFeatureOption ? `${this.$store.state.opt.underlying.F}.${this.month6}` : null;
		},
		// 固定取前六碼 (ex. "202009W2" -> "202009")
		month6() {
			return this.month.substr(0, 6);
		},
		// 是否為期貨期權
		isFeatureOption() {
			return this.$store.state.opt.isFeatureOption;
		},
		// 價平的價格 : 個股期權時->標的物最新價，期貨期權時->本月份期貨商品最新價
		closedSP() {
			let qo, p;
			// 期貨期權時->本月份期貨商品最新價
			if (this.isFeatureOption) {
				qo = this.qo;
				p = qo.p || qo.r || qo.pc;
			}
			// 個股期權 or 期貨期權但是抓不到對應的期貨月份商品最新價時 -> 取用標的物最新價
			if (!p) {
				qo = this.$store.state.opt.underlyingSQO;
				p = qo.p || qo.r || qo.pc;
			}
			// 檢查價平價格是否落在履約價區間，若不在時(仿真)，要改用虛擬出來的價平價格
			let sid1 = this.contracts.C[0];
			let sid2 = this.contracts.C[this.contracts.C.length - 1];
			let sp1 = Number(M4C.Option.getStrike(sid1));
			let sp2 = Number(M4C.Option.getStrike(sid2));
			if (p && ((p > sp1 && p > sp2) || (p < sp1 && p < sp2))) {
				p = (sp1 + sp2) / 2;
			}
			return p;
		},
		/** 價平 N檔 履約價 */
		closedContracts() {
			let result = {};
			let contractsC = this.contracts.C;
			let contractsP = this.contracts.P;
			let len = contractsC.length;
			if (this.closedSP) {
				// 遍歷合約來找尋價平的位置
				for (let i=0; i<len; i++) {
					let sid = contractsC[i];
					let thisSP = Number(M4C.Option.getStrike(contractsC[i]));
					let nextSP = Number(M4C.Option.getStrike(contractsC[i+1]));
					// 找到價平位置，往前後取 N/2 檔
					if ((this.closedSP >= thisSP && this.closedSP < nextSP) || 
						(this.closedSP < thisSP && this.closedSP >= nextSP)) {
						result.C = this.sliceList(contractsC, i+1);
						result.P = this.sliceList(contractsP, i+1);
						break;
					}
				};
			}
			return result;
		},
	},
}
</script>

<style scoped>
</style>