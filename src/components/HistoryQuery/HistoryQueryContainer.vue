<template>
    <div class="bank-transfer-container flex-col">
		<div class="flex-center pdlr5">
			<DatePick v-model="dateObj" class="rd2 flex-row flex-1 bgc-black divider pdtb1"/>
		</div>
		<div class="divider-bottom mglr2 mgtb3" />
		<div class="flex-1 posr">
			<TabGroup class="FULL" :selectedIdx="0" :tabList="tabList" :disablePrevNext="true" />
		</div>
    </div>
</template>

<script>
import HistoryQueryList from "@/components/HistoryQuery/HistoryQueryList.vue";
export default {
	props: [],
	data() {
		return {
			dateObj: {start: "20210520", end: "20210525"},
			// tabList: [
			// 	{label: '历史委托', comClass: HistoryQueryList, param: {type: 'REPORT'}},
			// 	{label: '历史成交', comClass: HistoryQueryList, param: {type: 'FILL'}},
			// 	{label: '交割单', comClass: HistoryQueryList, param: {type: 'BILL'}},
			// 	{label: '对帐单', comClass: HistoryQueryList, param: {type: 'SETTLE'}},
            // ],
			// 查詢日數
			rangeDay: 30,
        }
	},
	created() {
		this.dateObj.end = new Date().day8();
		this.dateObj.start = new Date(new Date().getTime() - this.rangeDay*24*60*60*1000).day8();
	},
	beforeMount() {
		// this.$emit('styleLoopData', {data: this.$store.state.ui.HistoryQueryCtnStyle, useIcon: true});
		this.$emit('title', '历史查询');
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {
		tabList() {
			// Dcore sim模擬環境不支援交割單、帳帳單。如有支援後再做調整。
			if(this.$store.state.login.isSIM)
				return [
					{label: '历史委托', comClass: HistoryQueryList, param: {type: 'REPORT', date: this.queryDate, ctnClass: "QuoteTableX"}},
					{label: '历史成交', comClass: HistoryQueryList, param: {type: 'FILL', date: this.queryDate, ctnClass: "QuoteTableX"}}
				];
			else
				return [
					{label: '历史委托', comClass: HistoryQueryList, param: {type: 'REPORT', date: this.queryDate, ctnClass: "QuoteTableX"}},
					{label: '历史成交', comClass: HistoryQueryList, param: {type: 'FILL', date: this.queryDate, ctnClass: "QuoteTableX"}},
					{label: '交割单', comClass: HistoryQueryList, param: {type: 'BILL', date: this.queryDate, ctnClass: "QuoteTableX"}},
					{label: '对帐单', comClass: HistoryQueryList, param: {type: 'SETTLE', date: this.queryDate, ctnClass: "QuoteTableX"}},
				];
		},
		// 取vuex中歷史查詢的樣式清單(第一筆為選取資料)
		ctnStyle() {return this.$store.state.ui.HistoryQueryCtnStyle[0];},
		// 依樣式切換子組件
		ctnClass() {return this.ctnStyle == 'grid_view'? 'HistoryQueryCard': 'QuoteTableX';},
		queryDate() {return this.dateObj;},
	},
}
</script>

<style scoped>
</style>