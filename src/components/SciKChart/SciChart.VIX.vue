<template>
	<div class="scitchart-vix hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
export default {
	mixins: [SciChartFn],
	props: ['sid', 'qo'],
	data() {
		return {
			comName: "SciChart.VIX",
			FILL_WORD: NaN,
			VixDataSeries: null,
			sciChartSurface: null,
			lineSeries_VIX: null,
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.lineSeries_VIX);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface  = sciChartSurface;
			this.lineSeries_VIX = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.VixDataSeries,
				stroke: "red",
				strokeThickness: 2,
			});
			// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 2;
			this.sciChartSurface.renderableSeries.add(this.lineSeries_VIX);
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			let xValues = [], vixValues = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				vixValues.push(tick.iv || NaN);
			});
			this.VixDataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `${this.keyValue}`, xValues: xValues, yValues: vixValues});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			let xValues = [], vixValues = [];
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				xValues.push( this.timeKeyToUnixTimestamp(timeKey));
				vixValues.push(tick.iv || NaN);
			});
			// 插入舊資料範圍
			this.VixDataSeries.insertRange(0, xValues, vixValues);
		},
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			// 更新線圖資料。
			this.VixDataSeries.update(index, tick.iv || NaN );
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			// 新增線圖資料。
			this.VixDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), tick.iv || NaN );
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			if(idx < 0)	return;
			let vix = this.VixDataSeries.getNativeYValues().get(idx);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left" style="color: red">
											<span class="clr-white">${this.keyValue}</span><span class="mglr1">${vix || '--'}</span>
										</div>`;
		},
	},
	watch: {},
	computed: {
		keyValue() {return this.isOption? 'IV': 'VIX'},
		isOption() {return this.sid.split('.')[1] == 'O';},
	},
}
</script>

<style scoped>
</style>