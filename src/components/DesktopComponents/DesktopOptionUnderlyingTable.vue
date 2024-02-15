<template>
	<div class="DOUT-ctn flex-row flex-1 overflow-hidden">
		<!-- 展開圖示 -->
		<div class="cell0 flex-top expand-btn mgt1" v-if="futMonth.length" @click="expand = !expand">
			<i class="material-icons pd1">{{expand ? 'arrow_drop_up' : 'arrow_drop_down'}}</i>
		</div>
		<div class="flex-1 overflow-x-auto">
			<table class="desktop mw100p" cellspacing="0">
				<DesktopTableHead :columns="underlyingConfig" />
				<tbody>
					<DesktopOptionUnderlyingTableRow v-for="(sid, idx) in contractsList" :key="idx" :sid="sid" :columns="underlyingConfig" />
				</tbody>
			</table>
		</div>
	</div>
</template>
<script>
import DesktopOptionUnderlyingTableRow from './DesktopOptionUnderlyingTableRow.vue';

export default {
	data() {
		return {
			expand: false,
			underlyingConfig:[
				{label: '月份', key: "symbolMonth", align: "center"},
				{label: '最新价', key: "price", isPrice: 1},
				{label: '买价', key: "bp1", isPrice: 1},
				{label: '卖价', key: "sp1", isPrice: 1},
				{label: '当日涨跌', key: "updn", clrCp0: "updn"},
				{label: '当日涨跌幅', key: "updnPercent", clrCp0: "updn"},
				{label: '隐含波动率', key: "iv", clrCp0: "diffIV"},
				{label: '20天历史波动率', key: "hv4", clrCp0: "diffHV4"},
				{label: '交易量', key: "qty"},
			],
		}
	},
	props: [],
	components: {
		DesktopOptionUnderlyingTableRow,
	},
	mounted() {
		
	},
	methods: {
		getSymbolMonth(sid) {return M4C.Symbol.getCIDM4(sid);}
	},
	watch: {
		underlyingS(nv, ov) {
			// 切換商品時預設收合標的。
			this.expand = false;
		}
	},
	computed: {
		symbolMonth() {return M4C.Symbol.getCIDM4(this.underlyingS);},
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
		symbolList() {
			if(this.futContracts)
				return this.futContracts.slice(0, 5);
			else return [];
		},
		contractsList() {
			if(this.expand) {
				return [...this.symbolList];
			}
			else return [this.$store.state.opt.underlyingS];
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