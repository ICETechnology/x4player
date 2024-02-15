<template>
	<div class="scitchart-opid hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import { OhlcPaletteProvider_V } from '@/components/SciChart/SciChartPaletteProvider';
import {FastColumnRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastColumnRenderableSeries";
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
import {OhlcDataSeries} from "scichart/Charting/Model/OhlcDataSeries";
export default {
	mixins: [SciChartFn],
	props: ['sid'],
	data() {
		return {
			comName: "SciChart.OPID",
			sciChartSurface: null,
			lineSeries: null,
			dataSeries: null,
			ohlcDataSeries: null,
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
				paletteProvider: new OhlcPaletteProvider_V(this.ohlcDataSeries, "#D75442", "#6BA583", "#D75442", "#6BA583"),
				strokeThickness: 0,
				zeroLineY: 0,
			});
			// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 0;
			this.sciChartSurface.renderableSeries.add(this.lineSeries);
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			let xValues = [], yValues = [], openValues = [], highValues = [], lowValues = [], closeValues = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				yValues.push(tick.oi || NaN);
				openValues.push(tick.o || NaN);
				highValues.push(tick.h || NaN);
				lowValues.push(tick.l || NaN);
				closeValues.push(tick.c || NaN);
			});
			this.dataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `OPID`, xValues: xValues, yValues: yValues});
			this.ohlcDataSeries = new OhlcDataSeries(wasmContext, {xValues, openValues, highValues, lowValues, closeValues});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			let xValues = [], yValues = [];
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey], openValues = [], highValues = [], lowValues = [], closeValues = [];
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				yValues.push(tick.oi || NaN);
				openValues.push(tick.o || NaN);
				highValues.push(tick.h || NaN);
				lowValues.push(tick.l || NaN);
				closeValues.push(tick.c || NaN);
			});
			this.dataSeries.insertRange(0, xValues, yValues);
			this.ohlcDataSeries.insertRange(0, xValues, openValues, highValues, lowValues, closeValues);
		},
		onUpdateTick({index, tick, dataSeries}) {
			this.dataSeries.update(index, tick.oi || NaN);
			this.ohlcDataSeries.update(index, tick.o || NaN, tick.h || NaN, tick.l || NaN, tick.c || NaN );
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			this.dataSeries.append(this.timeKeyToUnixTimestamp(timeKey), tick.oi || NaN);
			this.ohlcDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), tick.o || NaN, tick.h || NaN, tick.l || NaN, tick.c || NaN );
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let opid = this.ohlcDataSeries.getNativeYValues().get(idx);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left ${this.getYvalueColor(idx)}">
											<span class="clr-white">OPID</span><span class="mglr1">${this.showTickPrice(opid)}</span>
										</div>`;
		},
		getYvalueColor(idx){
			return this.getOhlcTickUpDN_V(this.ohlcDataSeries, idx);
		}
	},
	watch: {},
	computed: {},
}
</script>

<style scoped>
</style>