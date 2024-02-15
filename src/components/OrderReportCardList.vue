<template>
    <div class="order-report-card-list-ctn flex-col">
		<div class="flex-row head clr-gray sys-bgc zindex-1 font-size-small">
			<div class="cell0 flex-center"></div>
			<div class="cell1 flex-center"></div>
			<div class="cell2 flex-center">{{$ln(`状态`)}}</div>
			<div class="cell3 flex-end">{{$ln(`委托量/已成交/已撤单`)}}</div>
			<div class="cell4"></div>
		</div>
		<div class="flex-1 posr font-size-little">
			<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh" :status="stampStatus">
				<OrderReportCard class="report-working-card-ctn" v-for="(rpt, i) in reportList"
					:key="`OrderReportCardList-${i}`" :rpt="rpt" @onExpand="onExpand" :expandRptKey="expandRptKey"/>
				<Stamp v-if="reportList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
		<CancelAllAvailableReport class="cancelAllBtn" />
    </div>
</template>

<script>
import ReportCardListFn from '@/components/ReportCardListFn';
import OrderReportCard from "@/components/OrderReportCard.vue";
import CancelAllAvailableReport from "@/components/CancelAllAvailableReport.vue";

export default {
	mixins: [ReportCardListFn],
	props: [],
	data() {
		return {
        }
	},
	methods: {

	},
	computed: {
		/** 所有委託回報 */
		reportList() {
			return this.$store.state.data.orderReportList.filter((rpt)=>{
				// 非雲端單 && 非已轉換的預埋單 (預埋單進入盤中後會自動委託出現新回報，原預埋單直接隱藏)
				return !rpt.$IS_CLOUD && !rpt.REPORT_KEY.status==='Restated';
			});
		},
	},
	components: {
		OrderReportCard,
		CancelAllAvailableReport
	},
}
</script>

<style>
.order-report-card-list-ctn .head {
	height: 10vw;
	border-bottom: 1px solid #575C61;
}
/* 寬度設定 */
.order-report-card-list-ctn .cell0 {width: 10vw; max-width: 10vw;}
.order-report-card-list-ctn .cell1 {width: 30vw; max-width: 30vw;}
.order-report-card-list-ctn .cell2 {width: 17vw; max-width: 17vw;}
.order-report-card-list-ctn .cell3 {width: 40vw; max-width: 40vw;}
.order-report-card-list-ctn .cell4 {width: 3vw; max-width: 3vw;}
</style>