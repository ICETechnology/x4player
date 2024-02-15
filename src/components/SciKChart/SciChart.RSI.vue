<template>
	<div class="scitchart-rsi hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import { calcAverageForArray } from "scichart/utils/calcAverage";
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
export default {
	mixins: [SciChartFn],
	props: ['sid', 'qo'],
	data() {
		return {
			comName: "SciChart.RSI",
			RSIDataList: [],
			xValues: [],
			closeValues: [],
			sciChartSurface: null,
			lineSeries_RSI: [],
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		for(let i in this.RSIConfig) {
			if(!this.lineSeries_RSI[i]) continue;	// 沒資料 -> 略過
			this.sciChartSurface.renderableSeries.remove(this.lineSeries_RSI[i]);
		}
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			for(let i in this.RSIConfig) {
				let config = this.RSIConfig[i];
				if(!config.s) continue;	// 沒啟用 -> 略過
				this.lineSeries_RSI[i] = new FastLineRenderableSeries(wasmContext, {
					dataSeries: this.RSIDataList[i].data,
					stroke: config.c,
					strokeThickness: 2,
					// 繪圖效果
					// animation: { type: EAnimationType.Wave, options: {zeroLine: -1, pointDurationFraction: 0.5, duration: 500 }},
					// effect: new ShadowEffect(wasmContext, { brightness: 1, offset: new Point(5,-10), range: 0.7})
				});
				// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 2;
				this.sciChartSurface.renderableSeries.add(this.lineSeries_RSI[i]);
			}		
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			this.xValues = []; this.closeValues = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				this.closeValues.push(tick.c || NaN);
			});
			// 依設定清單建RSI資料
			for(let i in this.RSIConfig) {
				let config = this.RSIConfig[i];
				if(!config.s) continue;	// 沒啟用 -> 略過
				this.processAllData(i);
				if(this.xValues.length == 1 && this.RSIDataList[i].rsiArray.filter(d=>(isNaN(d))).length == this.RSIDataList[i].rsiArray.length) {
					this.RSIDataList[i].rsiArray = new Array(this.RSIDataList[i].rsiArray.length).fill(0);
				}
				this.RSIDataList[i].data = new XyDataSeries(wasmContext, { dataSeriesName: `RSI(${config.v})`, xValues: this.xValues, yValues: this.RSIDataList[i].rsiArray});
			}
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.splice(index, 0, this.timeKeyToUnixTimestamp(timeKey));
				this.closeValues.splice(index, 0, tick.c || NaN);
			});
			let moreLen = moreTimeKeyList.length;
			// 依設定清單建RSI資料
			for(let i in this.RSIConfig) {
				let config = this.RSIConfig[i];
				if(!config.s) continue;	// 沒啟用 -> 略過
				this.processAllData(i);
				this.RSIDataList[i].data.insertRange(0, this.xValues.slice(0, moreLen), this.RSIDataList[i].rsiArray.slice(0, moreLen));
				for(let j = moreLen; j < timeKeyList.length - 1; j++) {
					// 當回補處理時間過長時有時會有timeKeyList比rsiArray長的情況
					if(this.RSIDataList[i].rsiArray[j] == undefined)
						continue;
					this.RSIDataList[i].data.update(j, this.RSIDataList[i].rsiArray[j]);
				}
			}
		},
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			// 更新收盤價
			this.closeValues.splice(index, 1, tick.c || NaN);
			for(let i in this.RSIConfig) {
				let config = this.RSIConfig[i];
				if(!config.s) continue;	// 沒啟用 -> 略過
				// 週期
				const RSI_PERIOD = config.v;
				// 更新gainarray、lossarray資料。
				this.updateTick(this.RSIDataList[i].gainArray, this.RSIDataList[i].lossArray, -1, true);
				// 計算rsi資料
				const rsi = this.calcRSI(this.RSIDataList[i].gainArray, this.RSIDataList[i].lossArray, RSI_PERIOD);
				// 更新線圖資料。
				if(this.RSIDataList[1].data.getNativeXValues().size() > index)
					this.RSIDataList[i].data.update(index, rsi || NaN );
				else
					console.log('[error] index not correctly', this.RSIDataList[1].data.getNativeXValues().size(), index);
			}
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			// 新增收盤價
			this.closeValues.push(tick.c || NaN);
			for(let i in this.RSIConfig) {
				let config = this.RSIConfig[i];
				if(!config.s) continue;	// 沒啟用 -> 略過
				// this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				
				// 週期
				const RSI_PERIOD = config.v;
				// 新增gainarray、lossarray資料。
				this.updateTick(this.RSIDataList[i].gainArray, this.RSIDataList[i].lossArray, -1);
				// 計算rsi資料
				const rsi = this.calcRSI(this.RSIDataList[i].gainArray, this.RSIDataList[i].lossArray, RSI_PERIOD);
				// 新增線圖資料。
				this.RSIDataList[i].data.append(this.timeKeyToUnixTimestamp(timeKey), rsi || NaN );
			}
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let contentHtml = '';
			for(let i in this.RSIConfig) {
				let config = this.RSIConfig[i];
				if(!config.s) continue;	// 沒啟用 -> 略過
				let rsi = this.RSIDataList[i].data.getYValues().get(idx);
				rsi = isNaN(rsi)? '--' : parseFloat(rsi.toFixed(4));
				contentHtml += `<span class="clr-white">RSI(${config.v})</span><span class="mglr1" style="color:${config.c}"
				>${rsi}</span>`;
			}
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">${contentHtml}</div>`;
		},
		processAllData(idx) {
			let config = this.RSIConfig[idx];
			// if(!config.s) continue;	// 沒啟用 -> 略過
			if(!this.RSIDataList[idx]) this.RSIDataList[idx] = [];
			// 週期
			const RSI_PERIOD = this.RSIConfig[idx].v;
			const rsiArray = [];
			this.RSIDataList[idx].gainArray = [];
			this.RSIDataList[idx].lossArray = [];
			this.RSIDataList[idx].rsiArray = [];
			this.RSIDataList[idx].rsiArray.push(NaN);
			this.RSIDataList[idx].gainArray.push(NaN);
			this.RSIDataList[idx].lossArray.push(NaN);
			for (let j = 1; j < this.xValues.length; j++) {
				// 更新gainarray、lossarray資料。
				this.updateTick(this.RSIDataList[idx].gainArray, this.RSIDataList[idx].lossArray, j);
				// 計算rsi資料
				const rsi = this.calcRSI(this.RSIDataList[idx].gainArray, this.RSIDataList[idx].lossArray, RSI_PERIOD);
				this.RSIDataList[idx].rsiArray.push(rsi);
			}
		},
		// 計算rsi資料
		calcRSI (gainArray, lossArray, period) {
			const relativeStrength = calcAverageForArray(gainArray, period) / calcAverageForArray(lossArray, period);
			return this.$safeFloat(100 - 100 / (1 + relativeStrength));
		},
		// 更新gainarray、lossarray資料。
		updateTick(gainArray, lossArray, idx, isUpdate) {
			if(!this.closeValues.length) return;
			let index = idx < 0? this.closeValues.length - 1: idx;
			const previousClose = this.closeValues[index - 1];
			const currentClose = this.closeValues[index];
			const gain = currentClose > previousClose ? currentClose - previousClose : 0;
			if(!isUpdate)
				gainArray.push(gain);
			else
				gainArray.splice(gainArray.length - 1, 1, gain);
			const loss = previousClose > currentClose ? previousClose - currentClose : 0;
			if(!isUpdate)
				lossArray.push(loss);
			else
				lossArray.splice(lossArray.length - 1, 1, loss);
		},
	},
	watch: {},
	computed: {
		RSIConfig() {return this.$store.state.Kchart.config.RSI},
	},
}
</script>

<style scoped>
</style>