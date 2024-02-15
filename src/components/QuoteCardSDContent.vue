<template>
	<div class="flex-row list-block-left">
		<div class="column-ctn flex-col mgtb1" :class="[largeSize?'cnt-3':`cnt-${rowColCnt}`]" v-for="obj in showList">
			<div class="nowrap clr-gray2" :class="[fontMap[fontMapKey][0],{'font-size-little':largeSize}]">{{$ln(obj.label)}}</div>
			<div class="nowrap" :class="[cellClass(obj), fontMap[fontMapKey][1],{'font-size-large pdt1':largeSize}]">{{cellText(obj)}}</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['sid', 'qo', 'columnKey'],
	data() {
		return {
			fontMap: {
				'cnt3': ['font-size-mini', 'font-size-little'],
				'cnt4': ['font-size-micro', 'font-size-small'],
				'cnt5': ['font-size-nano', 'font-size-mini'],
			}
		}
	},
	beforeMount() {
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 欄位的 class
		cellClass(obj) {
			let list = [];
			let qo = this.qo;
			// 價格類欄位
			if (obj.isPrice) {
				list.push('is-price');
				list.push(this.$clrUd(qo[obj.key], qo.r));
			}
			// 依據最新價進行漲跌變色
			if (obj.udClr) {
				list.push(this.$clrUd(qo.p, qo.r));
			}
			return list;
		},
		// 欄位的文字內容
		cellText(obj) {
			if (obj.isPrice)
				return this.$symbolPrice(this.sid, this.qo[obj.key]) || '--';
			if(obj.isChange)
				return this.$symbolChgTxtX({qo: this.qo, mode: 0}) || '--';
			return this[obj.key] || this.qo[obj.key] || '--';
		},
	},
	watch: {},
    computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		fn() {return this.$store.state.fn;},
		$clrUd() {return this.$store.state.fn.$clrUd;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		$symbolChgTxtX() {return this.$store.state.fn.$symbolChgTxtX;},
		useColumnKey() {
			// 若指定的 columnKey 已經有存在設定，則使用指定的 columnKey (ex. 該合約已經有設定)
			if (this.columnKey && this.columnSD[this.columnKey])
				return this.columnKey;
			else
				return 'quote';
		},
		columnSD() {
			return this.$store.state.columnSD;
		},
		showList() {
			return this.columnSD[this.useColumnKey].show;
		},
		rowColCnt() {
			return this.columnSD.quote.rowColCnt;
		},
		fontMapKey() {
			return `cnt${this.rowColCnt}`;
		},
		// 成交量
		v() {
			return this.fn.$volUnit(this.qo.v);
		},
	},
}
</script>

<style scoped>
.column-ctn.cnt-2 {
	width: 50%;
}
.column-ctn.cnt-3 {
	width: 33%;
}
.column-ctn.cnt-4 {
	width: 25%;
}
.column-ctn.cnt-5 {
	width: 20%;
}
</style>