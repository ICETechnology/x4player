<template>
	<div ref="ctn" class="report-card-sd bgc-head flex-col pd2 pdb5">
		<div class="flex-row mg2">
			<!-- 合約名稱(改用持倉UI顯示名稱) -->
			<PositionCardSDName :sid="sid" :sid2="sid2" class="w100p posCardSDName" />
		</div>
		<!-- 欄位內容 -->
		<ReportCardSDContent :sid="sid" :rpt="rpt" />
		<!-- 備註欄位 -->
		<div class="flex-col font-size-micro mgt2 memo-cell">
			<div class="clr-gray2">{{$ln('备注')}}</div>
			<div class="mgt1 break-all">{{rpt.$MEMO}}</div>
		</div>
	</div>
</template>

<script>
import ReportCardSDContent from '@/components/ReportCardSDContent';
import PositionCardSDName from '@/components/PositionCardSDName';
/** 滾動監聽 */
import Vue from 'vue';
import VueWaypoint from 'vue-waypoint'

export default {
	props: ['rpt'],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {PositionCardSDName, ReportCardSDContent},
    methods: {},
	watch: {},
    computed: {
		sid() {
			return this.rpt.SYMBOL || (this.rpt.$IS_OCO ? this.rpt.OCO[0].SYMBOL : 'UNKNOW-SYMBOL');
		},
		// 策略下單盒組合下單情境會有 SYMBOL2
		sid2() {
			return this.rpt.SYMBOL2;
		},
	},
}
</script>

<style scoped>
.report-card-sd {
	border-radius: 0.5em;
}
.memo-cell {
	margin-left: 8vw;
	margin-right: 8vw;
}
</style>