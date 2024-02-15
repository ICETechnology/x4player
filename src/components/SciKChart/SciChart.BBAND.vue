<template>
	<div class="scitchart-bband hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import { FastBandRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/FastBandRenderableSeries";
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import { XyyDataSeries } from "scichart/Charting/Model/XyyDataSeries";
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
export default {
	mixins: [SciChartFn],
	props: ['sid', 'qo'],
	data() {
		return {
			comName: "SciChart.BBAND",
			bandSeries_Data: [],
			meanLine_Data: [],
			xValues: [],
			closeValues: [],
			sciChartSurface: null,
			bandSeries: null,
			lineSeries: null,
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.bandSeries);
		this.sciChartSurface.renderableSeries.remove(this.lineSeries);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			// BBAND設定資料
			let config = this.BBANDConfig;
			// 寬帶線圖設定
			this.bandSeries = new FastBandRenderableSeries(wasmContext, {
				dataSeries: this.bandSeries_Data,
				strokeThickness: 2,
				fill: config.drawConfig.fill,
				fillY1: config.drawConfig.fill,
				stroke: config.drawConfig.upper,
				strokeY1: config.drawConfig.lower,
			});
			this.lineSeries = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.meanLine_Data,
				stroke: config.drawConfig.mean,
				strokeThickness: 2,
			});
			this.sciChartSurface.renderableSeries.add(this.bandSeries);
			this.sciChartSurface.renderableSeries.add(this.lineSeries);
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			this.xValues = [],  this.closeValues = [];
			const yValues = [], y1Values = [], meanValue = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				this.closeValues.push(tick.c || NaN);
				let data = this.analysisTick(index);
				yValues.push(data.upper);
				y1Values.push(data.lower);
				meanValue.push(data.mean);
			});
			this.bandSeries_Data = new XyyDataSeries(wasmContext, {dataSeriesName: "BBAND", xValues: this.xValues, yValues: yValues, y1Values: y1Values});
			this.meanLine_Data = new XyDataSeries(wasmContext, {dataSeriesName: "BBAND_mean", xValues: this.xValues, yValues: meanValue});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			// BBAND設定資料
			let config = this.BBANDConfig;
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.splice(index, 0, this.timeKeyToUnixTimestamp(timeKey));
				this.closeValues.splice(index, 0, tick.c || NaN);
			});
			let moreLen = moreTimeKeyList.length;
			// 插入各指標的空資料
			let yValues = new Array(moreLen).fill(NaN);
			this.bandSeries_Data.insertRange(0, this.xValues.slice(0, moreLen), yValues, yValues);
			this.meanLine_Data.insertRange(0, this.xValues.slice(0, moreLen), yValues);
			// 更新舊資料
			for(let i = 0; i < moreLen + config.period; i++) {
				let data = this.analysisTick(i);
				this.bandSeries_Data.update(i, data.upper, data.lower);
				this.meanLine_Data.update(i, data.mean);
			}
		},
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			// 更新收盤價
			this.closeValues.splice(index, 1, tick.c || NaN);
			let data = this.analysisTick(index);
			this.bandSeries_Data.update(index, data.upper, data.lower);
			this.meanLine_Data.update(index, data.mean);
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			// 新增收盤價
			this.closeValues.push(tick.c || NaN);
			let data = this.analysisTick(index);
			this.bandSeries_Data.append(this.timeKeyToUnixTimestamp(timeKey), data.upper, data.lower);
			this.meanLine_Data.append(this.timeKeyToUnixTimestamp(timeKey), data.mean);
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let config = this.BBANDConfig;
			let upper = this.bandSeries_Data.getNativeYValues().get(idx);
			let lower = this.bandSeries_Data.getNativeY1Values().get(idx);
			let mean = this.meanLine_Data.getNativeYValues().get(idx);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">
											<span class="clr-white">BBAND</span>
											<span class="mgl1" style="color:${config.drawConfig.upper}">${this.showTickPrice(upper)}</span>
											<span class="mgl1" style="color:${config.drawConfig.mean}">${this.showTickPrice(mean)}</span>
											<span class="mgl1" style="color:${config.drawConfig.lower}">${this.showTickPrice(lower)}</span>
										</div>`;
		},
		analysisTick(idx){
			let moving = this.BBANDConfig.period;
			let sum = 0, cnt = 0;
			// 周期平均	
			for(let i = idx - moving; i <= idx; i++){
				if(this.closeValues[i]){
					sum += this.closeValues[i];
					cnt++;
				}
			}		
			let x_m = this.$safeFloat(sum / cnt);
			// 標準差
			let sum_of_square = 0;
			for(let i = idx - moving; i <= idx; i++){
				if(i >= 0){
					sum_of_square = this.$safeFloat(sum_of_square + (Math.pow((x_m - (this.closeValues[i])), 2)));
				}
			}
			let distance = this.$safeFloat(Math.sqrt(sum_of_square / cnt) * this.BBANDConfig.std);
			// 上限
			let upper = this.$safeFloat(parseFloat(x_m + distance));
			// 下限
			let lower = this.$safeFloat(parseFloat(x_m - distance));
			// 平均
			let mean = parseFloat(x_m);
			return {'upper': upper, 'lower': lower, 'mean': mean};
		},
	},
	watch: {},
	computed: {
		BBANDConfig() {return this.$store.state.Kchart.config.BBAND},
	},
}
</script>

<style scoped>
</style>