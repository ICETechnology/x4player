<template>
    <div class="FULL desktop-history-query-ctn flex-col font-size-small">
		<!-- 工具列 -->
		<div class="flex-row flex-center option-select-ctn ht4">
			<radio class="radio-ctn flex-row mg1" v-model="reportType">
				<span value="REPORT">{{$ln(`历史委托`)}}</span>
				<span value="FILL">{{$ln(`历史成交`)}}</span>
				<span value="BILL">{{$ln(`交割单`)}}</span>
				<span value="SETTLE">{{$ln(`对帐单`)}}</span>
			</radio>
			<div class="flex-1" />
			<div class="flex-row">
				<!-- 查詢日期設定 -->
				<DatePick v-model="dateObj" class="rd2 flex-row flex-1 bgc-black divider pdtb1"/>
				<!-- 重新查詢 -->
				<span class="icon-btn" @click="onRefresh" :title="`${$ln('重新查询')}`"><i class="material-icons">refresh</i></span>
			</div>
		</div>
		<div class="flex-1 posr scrolling-x scrolling-y">
			<!-- 狀態章 -->
			<Stamp v-if="!dataList || dataList.length===0" :stampStatus="stampStatus" />
			<table class="desktop-history-query-table mw100p" cellspacing="0">
				<!-- 支持拖曳欄位，點擊排序 -->
				<thead>
					<tr>
						<th v-for="(title, hid) in column" :key="hid" :class="title.split('.')">{{$ln(title)}}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(rpt, rid) in dataList" :key="rid">
						<td v-for="(val, vid) in rpt" :key="vid">
							{{val || '--'}}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			dateObj: {start: "20210520", end: "20210525"},
			reportType: 'REPORT',
			selectedObj: {'rpt': null},
			result: {},
			column: [],
			dataList: [],
			// 查詢日數
			rangeDay: 30,
		}
	},
	created() {
		this.dateObj.end = new Date().day8();
		this.dateObj.start = new Date(new Date().getTime() - this.rangeDay*24*60*60*1000).day8();
	},
	beforeMount() {
		this.result = M4C.HistoryQuery.query(this.reportType, this.dateObj.start, this.dateObj.end);
		this.$emit('title', `${this.$ln(`历史查询`)} ${this.isDesktop? `${this.displayBrokerName} - ${this.tradeID}`:""}`);
		this.$emit('dialogClass', `dialog-size-big`);
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onRefresh() {
			// 清除選擇回報
			// this.selectedObj.rpt = null;
			// 重查
			// M4C.Report.queryReport();
			this.dataList = [];
			this.result = M4C.HistoryQuery.query(this.reportType, this.dateObj.start, this.dateObj.end);
		},
	},
	watch: {
		'result.$STATUS': function(nv) {
			if (nv === "DONE") {
				let data = this.result.data;
				if (data && data.d) {
					this.column = this.result.data.d.COLUMN;
					this.dataList = this.result.data.d.DATA;
				}
			}
		},
		reportType(nv) {
			this.onRefresh();
		}
	},
    computed: {
		contextmenu() {
			return this.$store.state.desktop.contextmenu;
		},
		stampStatus() {
			if(this.result.$STATUS)
				return this.result.$STATUS;
			else return "DONE";
		},
		btID() {
			return this.$store.state.login.btID;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		traderID() {
			return this.$store.state.login.traderID;
		},
		brokerKey() {
			return this.$store.state.login.brokerKey;
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
		displayBrokerName() {
			return this.$store.state.brokerNameMap[this.brokerKey];
		},
	},
}
</script>

<style lang='scss' scoped>
tr th, tr td{
	@extend .nowrap;
	@extend .pdlr2;
	@extend .pdtb1;
}
</style>