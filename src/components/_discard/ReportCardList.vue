<template>
    <div class="report-working-card-list-ctn">
		<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh">
			<ReportCard class="report-working-card-ctn" v-for="(rpt, i) in reportList" :mode="mode"
				:key="`ReportCardList-${param.mode}-${i}`" :rpt="rpt" @onExpand="onExpand" :expandRptKey="expandRptKey"/>
			<Stamp v-if="reportList.length===0" :stampStatus="stampStatus" />
		</ScrollBounce>
    </div>
</template>

<script>
import ReportCard from "@/components/ReportCard.vue";
export default {
	props: ["param"],
	data() {
		return {
			/** 當前模式："availableReportList" / "orderReportList" / "filledReportList" */
			mode: this.param.mode,
			/** 當前展開哪筆委託 (各委託展開互斥) */
			expandRptKey: "",
			/** 狀態章 */
			stampStatus: "EMPTY",
        }
	},
	methods: {
		onExpand(rptKey, cardCtn) {
			this.expandRptKey = rptKey;
			setTimeout(()=>{
				let el = this.$refs.sb.$el;
				// 展開後超過螢幕時，捲回來保持可以顯示完整
				let top = cardCtn.offsetTop + cardCtn.clientHeight - el.clientHeight;
				el.scrollTop = top > 0 ? top : 0;
			}, 100);
		},
		onRefresh() {
			this.stampStatus = "QUERY";
			M4C.Report.reloadReport().then(()=>{
				// 完成
				this.stampStatus = this.reportList.length === 0 ? "EMPTY" : "DONE";
			}).catch((error)=>{
				// 失敗
				this.stampStatus = "FAIL";
			}).then(()=>{
				// 總是
			});
		}
	},
	watch: {
		/** 資料數量變化時要重設 expandRptKey (以免下一列的商品被展開) */
		reportList(nv, ov) {
			this.expandRptKey = "";
		}
	},
	computed: {
		/** 有效委托回报 */
		reportList() {
			return this.$store.state.data[this.mode];
		},
	},
	components: {
		ReportCard,
	},
}
</script>

<style scoped>
</style>