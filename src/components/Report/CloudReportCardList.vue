<template>
    <div class="cloud-report-card-list-ctn flex-col" v-stop-propagation-y>
		<div class="flex-row head clr-gray sys-bgc zindex-1 font-size-small">
			<div class="cell0 flex-center"></div>
			<div class="cell1 flex-center"></div>
			<div class="cell2 flex-start">{{$ln(`开平/单别`)}}</div>
			<div class="cell3 flex-end">{{$ln(`触发价/量`)}}</div>
			<div class="cell4"></div>
		</div>
		<div class="flex-1 posr font-size-little overflow-hidden">
			<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh">
				<CloudReportCard class="report-working-card-ctn" v-for="(rpt, i) in reportList"
					:key="`CloudReportCardList-${i}`" :rpt="rpt" @onExpand="onExpand" :expandRptKey="expandRptKey"/>
				<Stamp v-if="reportList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
    </div>
</template>

<script>
import ReportCardListFn from '@/components/ReportCardListFn';
import CloudReportCard from "@/components/Report/CloudReportCard.vue";

export default {
	mixins: [ReportCardListFn],
	props: [],
	data() {
		return {
        }
	},
	beforeMount() {
		this.$emit("title", `云端条件单`);
	},
	methods: {

	},
	computed: {
		/** 雲端委託回報 */
		reportList() {
			return this.$store.state.data.cloudReportList;
		},
	},
	components: {
		CloudReportCard,
	},
}
</script>

<style>
.cloud-report-card-list-ctn .head {
	height: 10vw;
	border-bottom: 1px solid #575C61;
}
/* 寬度設定 */
.cloud-report-card-list-ctn .cell0 {width: 10vw; max-width: 10vw;}
.cloud-report-card-list-ctn .cell1 {width: 34vw; max-width: 34vw;}
.cloud-report-card-list-ctn .cell2 {width: 26vw; max-width: 26vw;}
.cloud-report-card-list-ctn .cell3 {width: 25vw; max-width: 25vw;}
.cloud-report-card-list-ctn .cell4 {width: 5vw;  max-width: 5vw;}
</style>