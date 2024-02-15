<!-- 這個元件本來是要做成通用，後來已經覺得沒必要，所以可以專為回報明細客製欄位處理 -->
<template>
	<div class="flex-row list-block">
		<div class="column-ctn flex-col mgt1" :class="[obj.w100p ? 'w100p' : `cnt-${rowColCnt}`]" v-for="obj in showList">
			<div v-if="display(obj)" class="nowrap clr-gray2" :class="'font-size-micro'">{{displayLabel(obj)}}</div>
			<div v-if="display(obj)" :class="getClass(obj)" v-html="cellText(obj)"></div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['sid', 'rpt'],
	data() {
		return {
		}
	},
	beforeMount() {
	},
    mounted() {
		console.log('[ReportCardSDContent] show List', JSON.stringify(this.$store.state.columnSD.report.show));
	},
	beforeDestroy() {},
	components: {},
    methods: {
		// 欄位的文字內容
		cellText(obj) {
			let key = obj.key;
			if (!key) return;
			return this[key] || this.rpt[key] || '--';
		},
		// 欄位標題
		displayLabel(obj) {
			// 註冊制 : 保护限价
			if (this.rpt.$IS_PROTECTION && obj.key === '$ORDER_PRICE')
				return this.$ln('保护限价');
			return this.$ln(obj.label);
		},
		// 取得 class
		getClass(obj) {
			let list = [{'nowrap': obj.key!='$TRG_PRICE'}];
			if (obj.fontSize)
				list.push(obj.fontSize);
			else
				list.push('font-size-little');
			return list;
		},
		// 是否顯示
		display(obj) {
			// 有效期限無值時不顯示
			if (obj.key === '$EXPIRE_TIME' && !this.rpt.EXPIRE_TIME)
				return false;
			return true;
		},
	},
	watch: {},
    computed: {
		$clr0() {return this.$store.state.fn.$clr0;},
		$clrUd() {return this.$store.state.fn.$clrUd;},
		$displayPL() {return this.$store.state.fn.$displayPL;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		showList() {
			return this.$store.state.columnSD.report.show;
		},
		rowColCnt() {
			return this.$store.state.columnSD.report.rowColCnt;
		},
		$STATUS() {
			return this.$ln(this.rpt.$STATUS);
		},
		$STATUS_CLASS() {
			return this.getStatusClass(this.rpt);
		},
		$SIDE_TEXT() {
			return this.$ln(this.rpt.$SIDE==='BUY' ? '买' : '卖');
		},
		$POSITION_EFFECT_TEXT() {
			return this.$ln(`${this.rpt.$POSITION_EFFECT}(short)`);
		},
		$EXPIRE_TIME() {
			return this.rpt.EXPIRE_TIME.replace(' ', '<br>');
		},
		// 委託別
		$ORDER_TYPE_TEXT() {
			if (this.rpt.$IS_OCO)
				return this.$ln(`止损止盈OCO`);
			if (this.rpt.IS_HOMOTO)
				return this.$ln('保本单');
			let result = this.$store.state.config.mapOrderTypeLabel[this.rpt.TC_ORDER_TYPE] || this.rpt.TC_ORDER_TYPE;
			result = this.$ln(result);
			if (result && (this.rpt.POSITION_EFFECT === "CWO" || this.rpt.POSITION_EFFECT === "CWC"))
				result += this.$ln("备兑");
			return result || "";
		},
		// 委託價
		$ORDER_PRICE() {
			if (this.rpt.$IS_OCO)
				return this.rpt.$ORDER_PRICE_TXT + ' / ' + this.rpt.$ORDER_PRICE_TXT2;
			// 複式情境時，直接回覆委託價(價差)
			if (this.rpt.SYMBOL2)
				return this.rpt.$ORDER_PRICE;
			return `${this.rpt.$ORDER_PRICE_TXT}`;
		},
		/** 效期別 ex. ROD/IOC/FOK */
		$TIMEINFORCE() {
			return this.rpt.TIME_IN_FORCE || this.rpt.OCO[0].TIME_IN_FORCE;
		},
		$TRG_PRICE() {
			if (this.rpt.$IS_OCO)
				return this.rpt.$CONDITION_VALUE + ' / ' + this.rpt.$CONDITION_VALUE2;
			if (this.rpt.$IS_SMO)
				return this.$symbolPrice(this.sid, this.rpt.$CONDITION_VALUE_NOR);
			if (this.rpt.TRAILING_TYPE)
				return this.rpt.$CONDITION_VALUE;
		},
		// 停損價
		$STOP_PRICE() {
			if (this.rpt.TC_ORDER_TYPE !== 'STOP' && this.rpt.TC_ORDER_TYPE != 'STPLMT')
				return '--';
			if (this.rpt.STOP_PRICE)
				return this.$symbolPrice(this.sid, this.rpt.STOP_PRICE);
		},
		$AVG_PRICE() {
			if (this.rpt.AVG_PRICE)
				return this.$symbolPrice(this.sid, this.rpt.AVG_PRICE);
		}
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
.msg-more {
	margin-left: 8vw;
	width: 70vw;
}
</style>