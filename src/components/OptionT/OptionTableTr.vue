<template>
	<tr class="option-table-tr" :class="{selected: this.sid===$store.state.selectedSymbol.ID}" :sid="sid">
		<td v-if="!suspend && !qo.$suspend" class="direction-ltr" v-for="(obj,idx) in columns" :isPrice="obj.p"
			@click="onCellClick(obj,$event)" :key="`${sid}-${obj.key}`">
			<span v-if="displayColumn(idx)" :class="columnClass(obj.key)">{{columnValue(obj.key)}}</span>
		</td>
	</tr>
</template>

<script>
export default {
	props: ["sid", "columns", "suspend"],
	data() {
		return {
			self: this,
			qo: M4C.Quote.getQuoteObject(this.sid),
		};
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	methods: {
		// 僅限畫面可視範圍內
		displayColumn(idx) {
			return idx >= this.scollOnIndex && idx <= (this.scollOnIndex + this.displayColumnCount);
		},
		/** 欄位資料 */
		columnValue(key) {
			let qo = this.qo;
			switch (key) {
				case 'BP':
					return this.updatePrice(qo.bp1);
				case 'SP':
					return this.updatePrice(qo.sp1);
				case 'P':
					return this.updatePrice(qo.p);
				case 'BR':
					return this.updatePrice(qo.br);
				case 'UD':
					return qo.$cg || '--';
				case 'UDR':
					return qo.$cgr ? (parseFloat(qo.$cgr.split('%')[0]).toFixed(1) + '%') : '--';
				case 'V':
					return this.$commas(qo.v);
				case 'BV':
					return this.$commas(qo.bv1);
				case 'SV':
					return this.$commas(qo.sv1);
				case 'OI':
					return qo.oi ? this.$commas(qo.oi) : this.$commas(qo.yoi);
				case 'IV':
					return this.greeksValue(qo.miv, 1);
				case 'DE':
					return qo.de=='' || isNaN(qo.de) ? '--' : (+Big(qo.de).div(100)).toFixed(4);
				case 'GA':
					return this.greeksValue(qo.ga);
				case 'VE':
					return this.greeksValue(qo.ve);
				case 'TH':
					return this.greeksValue(qo.th);
				case 'RH':
					return this.greeksValue(qo.rh);
				/** 美式选择权天数(無pdsetting值，預設300) */
				case 'AOD':
					return this.AOD || 300;
				/** 美式greeks偏移值(無pdsetting值，預設0.01) */
				case 'AO':
					return this.AO || 0.01;
				/** 标的中间价 */
				case 'TMP':
					return this.greeksValue(qo.tmp);
				/** 选择权中间价 */
				case 'MP':
					return this.greeksValue(qo.mp);
				/** 距离下市时间占每年比率(自然日) */
				case 'TX':
					return this.greeksValue(qo.tx);
				/** 距离下市时间占每年比率(交易日) */
				case 'TDTX':
					return this.greeksValue(qo.tdtx);
				case 'IV_CHG':
					return qo.cpiv && qo.piv ? (+Big(qo.cpiv).minus(qo.piv)).toFixed(1) : '--';
				case 'THP':
					return this.greeksValue(qo.thp);
				case 'GR':
					return this.greeksValue(qo.gr);
				case 'LV':
					return this.greeksValue(qo.lv);
				case 'PR':
					return this.greeksValue(qo.pr);
				case 'HV4':
					return this.greeksValue(qo.hv4);
				case 'OI_DIFF':
					return qo.oi && qo.yoi ? this.$commas(+Big(qo.oi).minus(qo.yoi)) : '--';
				case 'TV':
					return this.greeksValue(qo.tv);
				case 'EV':
					return this.greeksValue(qo.ev);
			}
		},
		/** 欄位 class */
		columnClass(key) {
			let qo = this.qo;
			switch (key) {
				case 'BP':
					return this.$clrUd(qo.bp1, qo.r);
				case 'SP':
					return this.$clrUd(qo.sp1, qo.r);
				case 'P':
					return this.$clrUd(qo.p, qo.r);
				case 'UD':
				case 'UDR':
					return this.$clr0(qo.$cg);
				case 'IV_CHG':
					return qo.iv && qo.piv ? this.$clr0(+Big(qo.iv).minus(qo.piv)) : '';
			}
		},
		/** 價格欄位 */
		updatePrice(val) {
			if (!val) return '--';
			return this.$symbolPrice(this.sid, val);
		},
		/** Greeks欄位 */
		greeksValue(val, len) {
			// 长度限制
			len = len || (val > 1000 ? 2: (val > 100 ? 3 : 4));
			return isNaN(val) ? '--' : Number(val).toFixed(len);
		},
		/** 點擊列 */
		onCellClick(obj,e) {
			// 更新當前合約列表
			let el = e.srcElement;
			try {
				let list = [];
				el.closest('tbody').querySelectorAll('tr').forEach((elm)=>{list.push(elm.getAttribute('sid'));});
				this.$store.state.status.curContractsList = list;
			}catch(e){}
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 避免 mouse 左右拖曳移動後，觸發 click 導致非預期的反應
			if (this.$store.state.status.lockClick)
				return;
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			
			// 桌機
			if (this.isDesktop) {
				// 將一般 click 過濾為 dbl-click (固定寫法)
				if (this.waitDoubleClick == null) {this.waitDoubleClick = true; setTimeout(self=>delete self.waitDoubleClick, 300, this); return;}
				this.popupOrder(obj);
			}
			// App
			else {
				// 彈出商品頁
				eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: this.sid});
			}
		},
		/** 彈出下單盒 */
		popupOrder(obj) {
			eventBus.$emit("ORDER", {orderType: 'LIMIT', orderPrice: this.columnValue(obj.key)});
		},
	},
	computed: {
		$clr0() {return this.$store.state.fn.$clr0;},
		$clrUd() {return this.$store.state.fn.$clrUd;},
		$commas() {return this.$store.state.fn.$commas;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		AOD() {if(this.$store.state.config.quotePdSetting.greeks) return this.$store.state.config.quotePdSetting.greeks.american_option_days;},
		AO() {if(this.$store.state.config.quotePdSetting.greeks) return this.$store.state.config.quotePdSetting.greeks.american_offset;},
		scollOnIndex() {
			return this.$store.state.optionT.scollOnIndex;
		},
		displayColumnCount() {
			return this.$store.state.optionT.displayColumnCount;
		},
	},
	watch: {
		sid() {
			this.qo = M4C.Quote.getQuoteObject(this.sid);
		}
	},
	components: {}
};
</script>

<style scoped>
.desktop .option-table-tr:hover {
	color: aqua;
	background-color: #333F5A;
}
.desktop tr.selected {
    background-color: rgb(26, 47, 71);
}
</style>