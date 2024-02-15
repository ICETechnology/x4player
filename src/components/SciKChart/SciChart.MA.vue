<template>
	<div class="scitchart-ma hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import {OhlcDataSeries} from "scichart/Charting/Model/OhlcDataSeries";
import { XyMovingAverageFilter } from "scichart/Charting/Model/Filters/XyMovingAverageFilter";
import { EDataSeriesField } from "scichart/Charting/Model/Filters/XyFilterBase";
export default {
	mixins: [SciChartFn],
	props: ['sid', 'qo'],
	data() {
		return {
			comName: "SciChart.MA",
			sciChartSurface: null,
			lineSeriesList: [],
			ohlcDataSeries: null,
			MADataList: [],
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		// 移除資料
		for(let i in this.MAConfig) {
			if(!this.lineSeriesList[i]) continue;	// 沒資料 -> 略過
			this.sciChartSurface.renderableSeries.remove(this.lineSeriesList[i]);
		}
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			for(let i in this.MAConfig) {
				let config = this.MAConfig[i];
				if(!config.s) continue;	// 沒啟用 -> 略過
				this.lineSeriesList[i] = new FastLineRenderableSeries(wasmContext, {
					dataSeries: this.MADataList[i],
					stroke: config.c,
					strokeThickness: 2,
					// 繪圖效果
					// animation: { type: EAnimationType.Wave, options: {zeroLine: -1, pointDurationFraction: 0.5, duration: 500 }},
					// effect: new ShadowEffect(wasmContext, { brightness: 1, offset: new Point(5,-10), range: 0.7})
				});
				sciChartSurface.renderableSeries.add(this.lineSeriesList[i]);
			}		
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			let xValues = [], openValues = [], highValues = [], lowValues = [], closeValues = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				openValues.push(tick.o || NaN);
				highValues.push(tick.h || NaN);
				lowValues.push(tick.l || NaN);
				closeValues.push(tick.c || NaN);
			});
			this.ohlcDataSeries = new OhlcDataSeries(wasmContext, {xValues, openValues, highValues, lowValues, closeValues});
			// 依設定清單建MA資料
			for(let i in this.MAConfig) {
				let config = this.MAConfig[i];
				if(!config.s) continue;	// 沒啟用 -> 略過
				// 資料長度不足計算不處理
				if(config.v > closeValues.length) continue;
				// field: EDataSeriesField.Close=>指定以哪個欄位計算移動平均
				this.MADataList[i] = new XyMovingAverageFilter(this.ohlcDataSeries,  { dataSeriesName: `${config.v} MA`, length: config.v , field: EDataSeriesField.Close});
			}
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			let xValues = [], openValues = [], highValues = [], lowValues = [], closeValues = [];
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				openValues.push(tick.o || NaN);
				highValues.push(tick.h || NaN);
				lowValues.push(tick.l || NaN);
				closeValues.push(tick.c || NaN);
			});
			this.ohlcDataSeries.insertRange(0, xValues, openValues, highValues, lowValues, closeValues);
		},
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			this.ohlcDataSeries.update(index, tick.o || NaN, tick.h || NaN, tick.l || NaN, tick.c || NaN );
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			this.ohlcDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), tick.o || NaN, tick.h || NaN, tick.l || NaN, tick.c || NaN );
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let contentHtml = '';
			for(let i in this.MAConfig) {
				let config = this.MAConfig[i];
				if(!config.s) continue;	// 沒啟用 -> 略過
				if(!this.MADataList[i]) continue;
				contentHtml += `<span class="clr-white">MA${config.v}</span><span class="mglr1" style="color:${config.c}"
				>${this.showTickPrice(this.MADataList[i].getYValues().get(idx))}</span>`;
			}
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">${contentHtml}</div>`;
		},
	},
	watch: {},
	computed: {
		MAConfig() {return this.$store.state.Kchart.config.MA},
	},
}
</script>

<style scoped>
</style>