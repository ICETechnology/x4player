<template>
	<div class="offset-pl-talbe-list-ctn flex-col flex-1 switch-row-bg mg5 rd3">
		<div class="flex-center flex-col pd5">
			<!-- 合約資料 -->
            <div class="contract-ctn flex-center mgb3">{{`${$contract}`}}</div>
			<DatePick v-model="param.dateObj" class="date-ctn flex-row flex-1 sys-bgc btn-default-ht-rd"/>
		</div>
		<div class="flex-1 posr offset-Record-ctn">
			<QuoteTableX class="text-align-right" mode='1' :param="{column: column, dataList: dataList, noExpand: true}"/>
		</div>
	</div>
</template>
<script>
import QuoteTableX from "@/components/QuoteTableX.vue";
export default {
	data() {
		return {
			// 欄位名稱
			column: [
				{key: '0', label:'交易日期', show: 1, noSort: true},
                {key: '1', label:'买卖别', show: 1, noSort: true},
                {key: '2', label:'口数', show: 1, noSort: true},
                {key: '3', label:'价格', show: 1, noSort: true},
                {key: '4', label:'手续费', show: 1, noSort: true},
                {key: '5', label:'交易税', show: 1, noSort: true},
                {key: '6', label:'损益', show: 1, noSort: true},
                {key: '7', label:'净损益', show: 1, noSort: true},
                {key: '8', label:'商品币别', show: 1, noSort: true},
			],
			dataList: [],
		}
	},
	props: ['param'],
	components: {QuoteTableX},
	beforeMount() {
		this.$emit('title', this.$ln('平仓损益明细资料'));
		this.record.forEach(rec => {
			let purePl = this.getPurePL(rec);
			let openSide = this.parseSide(rec.OPEN_SIDE);
			let offsetSide = this.parseSide(rec.OFFSET_SIDE)
			let plClass= this.$clr0(rec.REALIZED_DAILY_PL);
			let purePlClass = this.$clr0(purePl);
			let openData = [
				this.parseDate(rec.OPEN_DATE),
				{value: openSide, contentClass: this.parseBSClass(openSide)},
				rec.OPEN_QTY,
				this.showPrice(Number(rec.OPEN_PRICE)),
				Number(rec.OPEN_FEE),
				Number(rec.OPEN_TAX),
				"　", "　", "　"
			];
			let offsetData = [
				this.parseDate(rec.OFFSET_DATE),
				{value: offsetSide, contentClass: this.parseBSClass(offsetSide)},
				rec.OFFSET_QTY,
				this.showPrice(Number(rec.OFFSET_PRICE)),
				Number(rec.OFFSET_FEE),
				Number(rec.OFFSET_TAX),
				{value: this.parsePL(rec.REALIZED_DAILY_PL), contentClass: plClass},
				{value: this.parsePL(purePl), contentClass: purePlClass},
				rec.CURRENCY
			];
			this.dataList.unshift(offsetData);
			this.dataList.unshift(openData);
		});
	},
	mounted() {},
	methods: {
		 // 取買賣方向
        parseSide(side) {
            return side[0];
        },
        // 取日期資料並轉換顯示格式
        parseDate(date) {
            if(!date) return "--/--/--";
            let _date = date.split('-');
            _date[0] = _date[0].substr(2);
            return _date.join('/');
        },
        // 取損益資料
        parsePL(value) {
            if(isNaN(value)) return value;
            if(value >= 0) value = `+${value}`;
            let priceArr = value.toString().split('.');
            // 取到小數第一位
            let _pl = `${priceArr[0]}.${priceArr[1]?priceArr[1][0]||'':0}`;
            return _pl.commas();
        },
		getPurePL(rec){
			let totalFee = Number(rec.OPEN_FEE) + Number(rec.OFFSET_FEE);
			let totalTax = Number(rec.OPEN_TAX) + Number(rec.OFFSET_TAX);
			let pl = Number(rec.REALIZED_DAILY_PL);
			return this.$safeFloat(pl - totalFee - totalTax);
		},
		parseBSClass(side) {
			if(side == 'B') return 'clr-up';
			else return 'clr-dn';
		},
		showPrice(val) {
			return this.$symbolPrice(this.sid, val);
		},
	},
	computed: {
		$clr0() {return this.$store.state.fn.$clr0;},
		sid() {
			try{return this.record[0].SYMBOL;}catch(e){}
		},
		// 合約名稱
        $contract() {return M4C.Symbol.getCNM4(this.sid, " ");},
		record() {return this.param.record;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
	},
}
</script>
<style scoped>
.date-ctn {
	pointer-events: none;
}
/** QuoteTableX 樣式調整 */
.offset-pl-talbe-list-ctn  /deep/ .thead-fixed-x-ctn.th,
.offset-pl-talbe-list-ctn  /deep/ .tbody-fixed-x-ctn, 
.offset-pl-talbe-list-ctn  /deep/ .tbody-fixed-x-ctn .quote-table-tr {
	width: 23vw;
	min-width: 23vw;
	justify-content: center;
	align-items: center;
}
.offset-pl-talbe-list-ctn  /deep/ .tbody-fixed-x-ctn .quote-table-tr div {
	justify-content: center;
}
.offset-pl-talbe-list-ctn  /deep/ .tbody-fixed-x-ctn .tr, 
.offset-pl-talbe-list-ctn  /deep/ .tbody-scroll-x-ctn .tr {
	height: 2.5em;
}
.offset-pl-talbe-list-ctn  /deep/ .thead-scroll-x-ctn .th,
.offset-pl-talbe-list-ctn  /deep/ .tbody-scroll-x-ctn .td {
	text-align: center !important;
	justify-content: center;
}
.offset-pl-talbe-list-ctn  /deep/ .tbody-fixed-x-ctn .tr:nth-child(4n+1), 
.offset-pl-talbe-list-ctn  /deep/ .tbody-scroll-x-ctn .tr:nth-child(4n+1),
.offset-pl-talbe-list-ctn  /deep/ .tbody-fixed-x-ctn .tr:nth-child(4n+2),
.offset-pl-talbe-list-ctn  /deep/ .tbody-scroll-x-ctn .tr:nth-child(4n+2) {
	background-color: #111820;
}
</style>