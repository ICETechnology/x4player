<template>
	<div class="FULL flex-col">
		<SciChart ref="sciChart" class="flex-1" :suspend="suspend" :sid="sid" :param="sciChartParam" :key="sciChartKey" :fullTradingDay="true" @reload="reloadSciChart()" />
		<div class="w100p flex-row mgtb2">
			<span class="sec-tab flex-1 flex-center clr-gray" :class="{selected: secondChartIdc==='VOL'}" @click="secondChartIdc = 'VOL'">{{$ln('成交量')}}</span>
			<span class="sec-tab flex-1 flex-center clr-gray" :class="{selected: secondChartIdc==='IV'}"  @click="secondChartIdc = 'IV'">{{$ln('隐含波动率')}}</span>
		</div>
	</div>
</template>

<script>
import SciChart from '@/components/SciChart/SciChart';
import SciTChartIdcPrice from '@/components/SciTChart/SciTChart.Idc.Price';
import SciTChartIdcAvg from '@/components/SciTChart/SciTChart.Idc.Avg';
import SciTChartIdcVolume from '@/components/SciTChart/SciTChart.Idc.Volume';
import SciTChartIdcIV from '@/components/SciTChart/SciTChart.Idc.IV';
import SciChartVIX from '@/components/SciKChart/SciChart.VIX';

export default {
	components: {SciChart},
	props: ['suspend'],
	data() {
		return {
			sciChartKey: "".random(),
            // 啟用十字線
            enableCross: false,
			// SciChart 參數
			sciChartParam: {
				// 分割區列表
				partitionList: [
					{
						class: 'flex-2',
						labelPrecision: 'DECIMAL_LENGTH',
						idcList: [
							{component: SciTChartIdcPrice},
							{component: SciTChartIdcAvg},
						],
						// 額外處理YAxis顯示
						formatLabelYAxis: true,
					},
					{
						class: 'flex-1',
						labelPrecision: '0',
						idcList: [
							{component: SciTChartIdcVolume},
						]
					}
				],
				callback: {
					// onTouchStart: this.onTouchStart,
					onTouchMove: this.onTouchMove,
					// onTouchEnd: this.onTouchEnd,
				},
			},
			secondChartIdc: 'VOL',
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	methods: {
		reloadSciChart() {
			this.sciChartKey = "".random();
		},
		onTouchMove(idx, hitTestInfo) {
			// console.log(idx, hitTestInfo);
		},
    },
	watch: {
		secondChartIdc(nv) {
			this.sciChartParam.partitionList[1].idcList[0].component = nv === 'VOL' ? SciTChartIdcVolume : SciChartVIX;
		},
		suspend(nv) {
			if(!nv)
				this.sciChartKey = "".random();
		}
	},
	computed: {
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
    },
}
</script>

<style scoped>
.cross-btn {
	position: absolute;
	top: 2px;
	right: 60px;
}
.cross-btn.selected {
	color: yellow;
}
.sec-tab:nth-child(1) {
	border-right: 1px solid gray;
}
.sec-tab.selected {
	color: yellow !important;
}
</style>