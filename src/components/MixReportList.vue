<template>
	<transition name="slide-left">
		<div class="mix-report-ctn flex-col" :class="cfg.css">
			<!-- 標題固定列 -->
			<div class="flex-row head clr-gray sys-bgc zindex-1 font-size-small">
				<div class="cell0 flex-center"></div>
				<div class="cell1 flex-center"></div>
				<div class="cell2 flex-start">{{$ln(`状态`)}}</div>
				<div class="cell3 flex-end">{{$ln(`委托/成交/撤单`)}}</div>
				<div class="cell4"></div>
			</div>
			
			<div class="flex-1 posr font-size-little">
				<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh" :status="stampStatus">
					<component :is="cfg.com" class="mix-report-card-ctn" v-for="(rpt, i) in reportList"
						:key="`mix-report-card-${i}`" :rpt="rpt" @onExpand="onExpand" :expandRptKey="expandRptKey"/>
					<Stamp v-if="reportList.length===0" :stampStatus="stampStatus" />
				</ScrollBounce>
			</div>
			<!-- 全刪按鈕 -->
			<CancelAllAvailableReport v-if="reportType==='All' || reportType==='Working'" class="cancel-all-btn" />
		</div>
	</transition>
</template>

<script>
import ReportCardListFn from '@/components/ReportCardListFn';
import FullReportCard from "@/components/FullReportCard.vue";
import CancelAllAvailableReport from "@/components/CancelAllAvailableReport.vue";

export default {
	mixins: [ReportCardListFn],
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {
		FullReportCard,
		CancelAllAvailableReport,
	},
    methods: {},
	watch: {},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		reportType() {
			return this.$store.state.mixReport.reportType;
		},
		cfg() {
			return {css: 'full-report-card-list-ctn', com: 'FullReportCard'};
		},
		reportList() {
			let result;
			switch(this.reportType) {
				case 'All':
					result = this.$store.state.data.orderReportList.filter((rpt)=>{
								// 非已轉換的預埋單 (預埋單進入盤中後會自動委託出現新回報，原預埋單直接隱藏)
								return rpt.REPORT_KEY.status!=='Restated';
							});
					break;
				case 'Error':
					result = this.$store.state.data.orderReportList.filter(rpt=>rpt.$IS_FAIL);
					break;
				case 'Working':
					result = this.$store.state.data.availableReportList.filter(rpt=>!rpt.$IS_CLOUD);
					break;
				case 'TotalFilled':
					result = this.$store.state.data.filledReportList.filter(rpt=>rpt.$IS_TOTAL_FILLED);
					break;
				case 'PartialFilled':
					result = this.$store.state.data.filledReportList.filter(rpt=>rpt.$IS_PARTIAL_FILLED);
					break;
			}
			return result || [];
		},
	},
}
</script>

<style scoped>
.order-report-card-list-ctn .head {
	height: 10vw;
	border-bottom: 1px solid #575C61;
}
/* 寬度設定 */
.order-report-card-list-ctn /deep/ .cell0 {width: 10vw; max-width: 10vw;}
.order-report-card-list-ctn /deep/ .cell1 {width: 31vw; max-width: 31vw;}
.order-report-card-list-ctn /deep/ .cell2 {width: 24vw; max-width: 24vw;}
.order-report-card-list-ctn /deep/ .cell3 {width: 32vw; max-width: 32vw;}
.order-report-card-list-ctn /deep/ .cell4 {width: 3vw;  max-width: 3vw;}

.full-report-card-list-ctn /deep/ .cell0 {width: 4vw; max-width: 4vw;}
.full-report-card-list-ctn /deep/ .cell1 {width: 32vw; max-width: 32vw;}
.full-report-card-list-ctn /deep/ .cell2 {width: 36vw; max-width: 36vw;}
.full-report-card-list-ctn /deep/ .cell3 {width: 25vw; max-width: 25vw;}
.full-report-card-list-ctn /deep/ .cell4 {width: 3vw;  max-width: 3vw;}

.working-order-card-list-ctn .head {
	height: 10vw;
	border-bottom: 1px solid #575C61;
}
/* 寬度設定 */
.working-order-card-list-ctn /deep/ .cell0 {width: 10vw; max-width: 10vw;}
.working-order-card-list-ctn /deep/ .cell1 {width: 34vw; max-width: 34vw;}
.working-order-card-list-ctn /deep/ .cell2 {width: 26vw; max-width: 26vw;}
.working-order-card-list-ctn /deep/ .cell3 {width: 25vw; max-width: 25vw;}
.working-order-card-list-ctn /deep/ .cell4 {width: 5vw;  max-width: 5vw;}

/* 全刪按鈕 */
.cancel-all-btn {
	position: absolute;
    right: 5vw;
	bottom: 5vw;
}
</style>