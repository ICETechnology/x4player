<template>
	<div class="scitchart-pcration hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import {FastColumnRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastColumnRenderableSeries";
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
export default {
	mixins: [SciChartFn],
	props: [],
	data() {
		return {
			comName: "SciChart.PCRatio",
			FILL_WORD: NaN,
			sciChartSurface: null,
			lineSeries: null,
			dataSeries: null,
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.lineSeries);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, dataSeries}) {
			this.sciChartSurface = sciChartSurface;
			this.lineSeries = new FastColumnRenderableSeries(wasmContext, {
				dataSeries: this.dataSeries,
				fill: "#D75442",
				strokeThickness: 0,
				zeroLineY: 0,
			});
			// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 2;
			this.sciChartSurface.renderableSeries.add(this.lineSeries);
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			let xValues = [], yValues = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				let ratio = tick.coi? this.$safeFloat(tick.poi / tick.coi): this.FILL_WORD;
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				yValues.push(ratio);
			});
			// 只有一筆記錄且資料不為數字不處理
			if(xValues.length == 1 && yValues.filter(d=>(isNaN(d))).length == yValues.length) {
				yValues = new Array(xValues.length).fill(0);
			}
			this.dataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `PCRatio`, xValues: xValues, yValues: yValues});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			let xValues = [], yValues = [];
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				let ratio = tick.coi? this.$safeFloat(tick.poi / tick.coi): this.FILL_WORD;
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				yValues.push(ratio);
			});
			this.dataSeries.insertRange(0, xValues, yValues);
		},
		onUpdateTick({index, tick, dataSeries}) {
			let ratio = tick.coi? this.$safeFloat(tick.poi / tick.coi): this.FILL_WORD;
			this.dataSeries.update(index, ratio);
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			let ratio = tick.coi? this.$safeFloat(tick.poi / tick.coi): this.FILL_WORD;
			this.dataSeries.append(this.timeKeyToUnixTimestamp(timeKey), ratio);
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let pcRatio = this.dataSeries.getNativeYValues().get(idx);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">
											<span class="clr-white">P/C Ratio</span><span class="mglr1" style="color: #D75442">${pcRatio || '--'}</span>
										</div>`;
		},
	},
	watch: {},
	computed: {},
}
</script>

<style scoped>
</style>