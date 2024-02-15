<template>
    <div class="FULL desktop-quote flex-col font-size-small">
		<!-- 工具列 -->
		<div class="flex-row flex-center">
			<radio class="radio-ctn flex-row mg1" v-model="reportType">
				<span value="All">{{$ln(`所有回报`)}}</span>
				<span value="Working">{{$ln(`有效回报`)}}</span>
				<span value="Filled">{{$ln(`成交回报`)}}</span>
				<span value="Error">{{$ln(`错误回报`)}}</span>
			</radio>
			<div class="flex-1" />
			<div class="flex-row">
				<!-- 自選星星 -->
				<FavoriteIcon ref="favoriteIcon" class="icon-btn" :symbol="selectedObj.rpt ? selectedObj.rpt.$SYMBOL : null" />
				<!-- 欄位設定 -->
				<ColumnConfigIcon ref="columnConfigIcon" :default="$store.state.desktop.reportDefaultColumns" 
					:current="$store.state.desktop.reportColumns" class="icon-btn" :title="`${$ln('栏位设定')}`" />
				<!-- 重新查詢 -->
				<span class="icon-btn" @click="onRefresh" :title="`${$ln('重新查询')}`"><i class="material-icons">refresh</i></span>
			</div>
		</div>
		<div class="flex-1 posr scrolling-x scrolling-y">
			<!-- 狀態章 -->
			<Stamp v-if="reportList.length===0" :stampStatus="stampStatus" />
			<table class="desktop mw100p" cellspacing="0">
				<!-- 支持拖曳欄位，點擊排序 -->
				<DesktopTableHead :columns="$store.state.desktop.reportColumns" />
				<tbody>
					<DesktopReportRow v-for="(rpt, idx) in reportList" :rpt="rpt" :selectedObj="selectedObj" @contextMenu="onContextMenu" />
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
			reportType: 'All',
			selectedObj: {'rpt': null},
		}
	},
	beforeMount() {
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onRefresh() {
			// 清除選擇回報
			this.selectedObj.rpt = null;
			// 重查
			M4C.Report.queryReport();
		},
		onBtnModify(action){
			eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderModify', param: {rpt: this.selectedObj.rpt, action: action}});
		},
		/** 右鍵選單 */
		onContextMenu(rpt, obj, row) {
			let self = this;
			this.selectedObj.rpt = rpt;
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", rpt.$SYMBOL);
			this.contextmenu.pop({
				list: [
					// 加入移除自選
					this.contextmenu.optFav(rpt.$SYMBOL),
					// --- 分隔線 ---
					{'line': true},
					// 下單盒
					this.contextmenu.optOrder(()=>{eventBus.$emit("ORDER", {orderType: 'LIMIT', orderPrice: rpt.ORDER_PRICE});}),
					// 刪單
					this.selectedRptIsWorking ? {'icon': 'delete', 'label': '删单', onclick: ()=>{self.onBtnModify('CANCEL')}} : null,
					// 改價
					this.selectedRptIsWorking ? {'icon': 'rate_review', 'label': '改价', onclick: ()=>{self.onBtnModify('REPRICE')}} : null,
					// 減量
					this.selectedRptIsWorking ? {'icon': 'vertical_align_bottom', 'label': '减量', onclick: ()=>{self.onBtnModify('REDUCE')}} : null,
					// --- 分隔線 ---
					{'line': true},
					// 欄位設定
					this.contextmenu.optColumn(this.$refs.columnConfigIcon.onColumnConfig),
					// 重新查詢
					this.contextmenu.optRefresh(this.onRefresh),
				],
				param: this.sid,
			});
		},
	},
	watch: {
		reportType() {
			// 清除選擇回報
			this.selectedObj.rpt = null;
		}
	},
    computed: {
		contextmenu() {
			return this.$store.state.desktop.contextmenu;
		},
		/** 所有委託回報 */
		reportList() {
			if (this.reportType === 'Working')
				return this.$store.state.data.availableReportList;
			else if (this.reportType === 'Filled')
				return this.$store.state.data.filledReportList;
			else if (this.reportType === 'Error')
				return this.$store.state.data.orderReportList.filter(rpt=>rpt.$IS_FAIL);
			else
				return this.$store.state.data.orderReportList;
		},
		stampStatus() {
			return this.$store.state.result.queryReportResult.$STATUS;
		},
		selectedRpt() {
			return this.selectedObj.rpt;
		},
		selectedRptIsWorking() {
			return this.selectedObj.rpt && this.selectedObj.rpt.$ISWORKING;
		},
		
	},
}
</script>

<style scoped>
</style>