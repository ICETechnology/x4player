<template>
	<div class="scitchart-vol hidden" />
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
				fill: "#b0c4de",
				stroke: "#4682b4",
				strokeThickness: 1,
				zeroLineY: 0,
			});
			sciChartSurface.renderableSeries.add(lineSeries);
		},
		onInitData({chartData, timeKeyList, dataSeries}) {
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				dataSeries.update(index, tick.q || NaN);
			});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				dataSeries.update(index, tick.q || NaN);
			});
		},
		onUpdateTick({index, tick, dataSeries}) {
			dataSeries.update(index, tick.q || NaN);
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			dataSeries.update(index, tick.q || NaN);
		},
		// 關注Tick改變
		onFocusTick({xValue, tick}) {
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<span class="clr-orange">${this.$ln('量')} ${tick && tick.q ? tick.q : '-'}</span>`;
		},
	},
	watch: {},
	computed: {},
}
</script>

<style scoped>
</style>