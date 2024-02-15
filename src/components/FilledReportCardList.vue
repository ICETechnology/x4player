<template>
    <div class="filled-report-card-list-ctn flex-col">
		<div class="flex-row head clr-gray sys-bgc zindex-1 font-size-small">
			<div class="cell0 flex-center"></div>
			<div class="cell1 flex-center"></div>
			<div class="cell2 flex-start">{{$ln(`开平/单别`)}}</div>
			<div class="cell3 flex-end">{{$ln(`成交价/量`)}}</div>
			<div class="cell4"></div>
		</div>
		<div class="flex-1 posr font-size-little">
			<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh" :status="stampStatus">
				<FilledReportCard v-for="(rpt, i) in reportList"
					:key="`FilledReportCardList-${i}`" :rpt="rpt" @onExpand="onExpand" :expandRptKey="expandRptKey"/>
				<Stamp v-if="reportList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
    </div>
</template>

<script>
import ReportCardListFn from '@/components/ReportCardListFn';
import FilledReportCard from "@/components/FilledReportCard.vue";

export default {
	mixins: [ReportCardListFn],
	props: ['visibility'],
	data() {
		return {
        }
	},
	mounted() {
		this.$store.state.status.isFillList = this.visibility;
	},
	methods: {

	},
	watch: {
		visibility(nv) {
			this.$store.state.status.isFillList = nv;
		},
	},
	computed: {
		/** 成交回報 */
		reportList() {
			return this.$store.state.data.filledReportList;
		},
	},
	components: {
		FilledReportCard,
	},
}
</script>

<style>
.filled-report-card-list-ctn .head {
	height: 10vw;
	border-bottom: 1px solid #575C61;
}
/* 寬度設定 */
.filled-report-card-list-ctn .cell0 {width: 10vw; max-width: 10vw;}
.filled-report-card-list-ctn .cell1 {width: 34vw; max-width: 34vw;}
.filled-report-card-list-ctn .cell2 {width: 26vw; max-width: 26vw;}
.filled-report-card-list-ctn .cell3 {width: 25vw; max-width: 25vw;}
.filled-report-card-list-ctn .cell4 {width: 5vw;  max-width: 5vw;}
</style>