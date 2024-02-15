<template>
	<div class="scitchart-iv hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import {FastColumnRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastColumnRenderableSeries";
export default {
	mixins: [SciChartFn],
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, dataSeries}) {
			this.sciChartSurface = sciChartSurface;
			let lineSeries = this.lineSeries = new FastColumnRenderableSeries(wasmContext, {
				dataSeries: dataSeries,
				fill: "#000000",
				stroke: "#000000",
				strokeThickness: 1,
				zeroLineY: 0,
			});
			sciChartSurface.renderableSeries.add(lineSeries);
		},
		onInitData({chartData, timeKeyList, dataSeries}) {
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
		},
		onUpdateTick({index, tick, dataSeries}) {
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
		},
		// 關注Tick改變
		onFocusTick({xValue, tick}) {
		},
	},
	watch: {},
	computed: {},
}
</script>

<style scoped>
</style>