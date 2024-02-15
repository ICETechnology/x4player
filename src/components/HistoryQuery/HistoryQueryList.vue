<template>
	<div class="flex-1 historyquerylist-ctn" >
		<ScrollBounce class="FULL" :refresh="true" @refresh="onRefresh" v-stop-propagation-y v-if="ctnClass=='HistoryQueryCard'">
			<HistoryQueryCard ref="cards" class="mg3" v-for="(obj,idx) in dataList" :column="column" :key="`hqc-${idx}`" 
				:data="obj" :index="idx" :type="param.type"/>
			<Stamp v-if="dataList.length === 0" :stampStatus="stampStatus" />
		</ScrollBounce>
		<QuoteTableX v-if="ctnClass=='QuoteTableX'" class="text-align-right" :param="{column: column, dataList: dataList, noFixedLeft: true, stampStatus:stampStatus}" @refresh="onRefresh" />
	</div>
</template>

<script>
import HistoryQueryCard from "@/components/HistoryQuery/HistoryQueryCard.vue";
import QuoteTableX from "@/components/QuoteTableX.vue";
export default {
	props: ['param'],
	data() {
		return {
			result: {},
			column: [],
			dataList: [],
		}
	},
	beforeMount() {
		this.result = M4C.HistoryQuery.query(this.param.type, this.begin, this.end);
	},
    mounted() {},
	beforeDestroy() {},
	components: {
		HistoryQueryCard,
		QuoteTableX
	},
    methods: {
		onRefresh() {
			this.dataList = [];
			this.result = M4C.HistoryQuery.query(this.param.type, this.begin, this.end);
		},
	},
	watch: {
		'result.$STATUS': function(nv) {
			if (nv === "DONE") {
				let data = this.result.data;
				if (data && data.d && data.$CD == 0) {
					this.column = this.result.data.d.COLUMN;
					this.dataList = this.result.data.d.DATA;
				}
			}
		},
		begin(nv) {
			this.result = M4C.HistoryQuery.query(this.param.type, this.begin, this.end);
		},
		end(nv) {
			this.result = M4C.HistoryQuery.query(this.param.type, this.begin, this.end);
		},
	},
    computed: {
		stampStatus() {
			return this.result.$STATUS;
		},
		ctnClass() {
			return this.param.ctnClass;
		},
		propsDate() {return this.param.date;},
		begin() {return this.propsDate.start;},
		end() {return this.propsDate.end},
	},
}
</script>

<style scoped>
</style>