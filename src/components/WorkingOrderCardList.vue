<template>
    <div class="working-order-card-list-ctn flex-col">
		<div class="flex-row head clr-gray sys-bgc zindex-1 font-size-small">
			<div class="cell0 flex-center"></div>
			<div class="cell1 flex-center"></div>
			<div class="cell2 flex-start">{{$ln(`开平/单别`)}}</div>
			<div class="cell3 flex-end">{{$ln(`委托价/量`)}}</div>
			<div class="cell4"></div>
		</div>
		<div class="flex-1 posr font-size-little">
			<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh" :status="stampStatus">
				<WorkingOrderCard class="report-working-card-ctn" v-for="(rpt, i) in reportList"
					:key="`WorkingOrderCardList-${i}`" :rpt="rpt" @onExpand="onExpand" :expandRptKey="expandRptKey"/>
				<Stamp v-if="reportList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
		<CancelAllAvailableReport class="cancelAllBtn" />
    </div>
</template>

<script>
import ReportCardListFn from '@/components/ReportCardListFn';
import WorkingOrderCard from "@/components/WorkingOrderCard.vue";
import CancelAllAvailableReport from "@/components/CancelAllAvailableReport.vue";

export default {
	mixins: [ReportCardListFn],
	computed: {
		/** 有效委託回報 */
		reportList() {
			return this.$store.state.data.availableReportList.filter((rpt)=>{
				return !rpt.$IS_CLOUD;
			});
		},
	},
	components: {
		WorkingOrderCard,
		CancelAllAvailableReport
	},
}
</script>

<style>
.working-order-card-list-ctn .head {
	height: 10vw;
	border-bottom: 1px solid #575C61;
}
/* 寬度設定 */
.working-order-card-list-ctn .cell0 {width: 10vw; max-width: 10vw;}
.working-order-card-list-ctn .cell1 {width: 34vw; max-width: 34vw;}
.working-order-card-list-ctn .cell2 {width: 26vw; max-width: 26vw;}
.working-order-card-list-ctn .cell3 {width: 25vw; max-width: 25vw;}
.working-order-card-list-ctn .cell4 {width: 5vw;  max-width: 5vw;}
.cancelAllBtn{
	position: absolute;
    right: 5vw;
	bottom: 5vw;
}
</style>