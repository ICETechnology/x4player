<template>
	<div class="scitchart-macd hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import { MacdHistogramPaletteProvider } from '@/components/SciChart/SciChartPaletteProvider';
import { FastColumnRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/FastColumnRenderableSeries";
import { FastBandRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/FastBandRenderableSeries";
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
import { XyyDataSeries } from "scichart/Charting/Model/XyyDataSeries";
export default {
	mixins: [SciChartFn],
	props: ['sid', 'qo'],
	data() {
		return {
			comName: "SciChart.MACD",
			sciChartSurface: null,
			// 寬帶圖資料列表
			bandSeries_Data: null,
			bandSeries: null,
			// 正負長條圖資料列表
			columnSeries_Data: null,
			columnSeries: null,
			// DF array
			divergenceArray: null,
			// DEM array
			signalArray: [],
			// DIF array
			macdArray: [],
			// 時間戳記列表
			xValues: [],
			// 收盤價列表
			closeValues: [],
			emaArray: {
				s: {},
				l: {},
			},
			demArray: {},
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.bandSeries);
		this.sciChartSurface.renderableSeries.remove(this.columnSeries);
		this.emaArray = {
				s: {},
				l: {},
			};
		this.demArray = null;
	},
	components: {},
	methods: {
		// 建立線圖
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			let config = this.MACDConfig;
			// 寬帶線圖設定
			this.bandSeries = new FastBandRenderableSeries(wasmContext, {
				dataSeries: this.bandSeries_Data,
				stroke: config.drawConfig.DEM,
				strokeY1: config.drawConfig.DIF,
			});
			
			// 長條圖線圖設定
			this.columnSeries = new FastColumnRenderableSeries(wasmContext, {
				dataSeries: this.columnSeries_Data,
				paletteProvider: new MacdHistogramPaletteProvider(config.drawConfig.UP, config.drawConfig.DN), // 正負長條圖顏色設定。
				dataPointWidth: 0.4	// 長條圖寬度
			});
			// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 4;
			this.sciChartSurface.renderableSeries.add(this.bandSeries);
			this.sciChartSurface.renderableSeries.add(this.columnSeries);
		},
		// 初始資料
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			this.emaArray = {
				s: {},
				l: {},
			};
			this.demArray = {};
			// 時間戳記、收盤價(清空)
			this.xValues = [], this.closeValues = [];
			// 塞入目前全部時間戳記、收盤價資料
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				this.closeValues.push(tick.c || NaN);
			});
			this.processAllData();
			// 都是NaN時給寬帶圖一個0.001的直，避免觸發sciChart的錯誤
			if(this.divergenceArray.filter(d=>(isNaN(d))).length == this.divergenceArray.length) {
				this.signalArray = new Array(this.divergenceArray.length).fill(0.001);
			}
			// 只有一筆記錄且資料不為數字不處理
			if(this.xValues.length == 1 && this.divergenceArray.filter(d=>(isNaN(d))).length == this.divergenceArray.length) {
				this.divergenceArray = new Array(this.divergenceArray.length).fill(0);
				this.macdArray = new Array(this.macdArray.length).fill(0);
			}
			this.bandSeries_Data = new XyyDataSeries(wasmContext, {dataSeriesName: "MACD", xValues: this.xValues, yValues: this.signalArray, y1Values: this.macdArray});
			this.columnSeries_Data = new XyDataSeries(wasmContext, {dataSeriesName: "Divergence", xValues: this.xValues, yValues: this.divergenceArray});
		},
		// 回補舊資料
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			// 塞入目前全部時間戳記、收盤價資料
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.splice(index, 0, this.timeKeyToUnixTimestamp(timeKey));
				this.closeValues.splice(index, 0, tick.c || NaN);
			});
			this.processAllData();
			let moreLen = moreTimeKeyList.length;
			this.bandSeries_Data.insertRange(0, this.xValues.slice(0,moreLen), this.signalArray.slice(0, moreLen), this.macdArray.slice(0, moreLen));
			this.columnSeries_Data.insertRange(0, this.xValues.slice(0, moreLen), this.divergenceArray.slice(0, moreLen));
			for(let i = moreLen; i < timeKeyList.length; i++) {
				this.bandSeries_Data.update(i, this.signalArray[i], this.macdArray[i]);
				this.columnSeries_Data.update(i, this.divergenceArray[i]);
			}
		},
		// 更新Tick資料
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			// 更新收盤價
			this.closeValues.splice(index, 1, tick.c || NaN);
			let data = this.analysisTick(index, tick, true);
			this.bandSeries_Data.update(index, data.DEM || NaN, data.DIF || NaN);
			this.columnSeries_Data.update(index, data.DF || NaN);
		},
		// 新增新一根Tick資料
		onAppendTick({index, tick, dataSeries, timeKey}) {
			// 新增收盤價
			this.closeValues.push(tick.c || NaN);
			let data = this.analysisTick(index, tick);
			this.bandSeries_Data.append(this.timeKeyToUnixTimestamp(timeKey), data.DEM || NaN, data.DIF || NaN);
			this.columnSeries_Data.append(this.timeKeyToUnixTimestamp(timeKey), data.DF || NaN);
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let config = this.MACDConfig;
			// 因M4C.Symbol.getDecimalLength取長度會因tw的乘數、分數取到非預期長度，所以改以ticksize取長度
			let tickSizeLen = M4C.Symbol.getTickSize(this.sid, this.closeValues[idx]).toString().getDecimalLength();
			let dem = this.bandSeries_Data.getNativeYValues().get(idx);
			let dif = this.bandSeries_Data.getNativeY1Values().get(idx);
			let df = this.columnSeries_Data.getNativeYValues().get(idx);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">
											<span class="clr-white">MACD</span>
											<span class="mgl1" style="color:${config.drawConfig.DIF}">${parseFloat(dif).toFixed(tickSizeLen)}</span>
											<span class="mgl1" style="color:${config.drawConfig.DEM}">${parseFloat(dem).toFixed(tickSizeLen)}</span>
											<span class="mgl1" style="color:${df>0?config.drawConfig.UP: config.drawConfig.DN}">${parseFloat(df).toFixed(tickSizeLen)}</span>
										</div>`;
		},
		// 處理全部資料
		processAllData(){
			// 短周期參數
			const shortPeriod = this.MACDConfig.short;
			// 長周期參數
			const longPeriod = this.MACDConfig.long;
			// DEM周期參數
			const signalPeriod = this.MACDConfig.MACD;
			// 開始計算DEM的第一筆資料索引
			var offset = longPeriod + signalPeriod -1 ;
			// 清空陣列資料
			this.macdArray = [];
			this.signalArray = [];
			this.divergenceArray = [];
			// 計算目前全部資料
			for (let i = 0; i < this.xValues.length; i++) {
				const maSlow = this.calcEMA(this.closeValues, shortPeriod, i, 's');			// shortEMA
				const maFast = this.calcEMA(this.closeValues, longPeriod, i, 'l');			// longEMA
				const macd = maSlow - maFast;												// DIF
				this.macdArray.push(macd);													// DIF array
				const signal = this.calcDEM(signalPeriod, this.macdArray, i, offset);		// DEM
				this.signalArray.push(signal || 0);											// DEM array
				const divergence = macd - signal;											// DF
				this.divergenceArray.push(divergence);										// DF array
			}
		},
		// 分析tick資料
		analysisTick(idx, tick, isUpdate) {
			// 短周期參數
			const shortPeriod = this.MACDConfig.short;
			// 長周期參數
			const longPeriod = this.MACDConfig.long;
			// DEM周期參數
			const signalPeriod = this.MACDConfig.MACD;
			const preMaSlow = this.emaArray['s'][idx - 1];	// 前一個shortEMA
			const preMaFast = this.emaArray['l'][idx - 1];	// 前一個longEMA
			// 短周期EMA計算 (當日收盤價 * 2 + 前日短周期平均收盤價 * (短周期天數 -1)) / (短周期天數 + 1)
			let shortEMA = (tick.c * 2 + preMaSlow * (shortPeriod - 1)) / (shortPeriod + 1);
			// 長周期EMA計算 (當日收盤價 * 2 + 前日長周期平均收盤價 * (長周期天數 -1)) / (長周期天數 + 1)
			let longEMA = (tick.c * 2 + preMaFast * (longPeriod - 1)) / (longPeriod + 1);
			let DIF = (longEMA != null && shortEMA != null) ? (shortEMA - longEMA) : null;
			const preSignal = this.signalArray[idx - 1];
			let DEM = (DIF * 2 + preSignal * (signalPeriod - 1)) / (signalPeriod + 1);
			if(!isUpdate) {
				this.macdArray.push(DIF);
				this.signalArray.push(DEM);
			}
			else {
				this.macdArray.splice(idx, 1, DIF);
				this.signalArray.splice(idx, 1, DEM);
			}
			let DF = DIF - DEM;
			return {"DIF": DIF, "DEM": DEM, "DF": DF, "shortEMA": shortEMA, "longEMA": longEMA};
		},
		calcEMA(closeArray, periods, count, key){
			var ema = null;
			// 有周期以上天數的資料才計算
			if ( count == periods - 1) {
				// 第一筆先計算SMA
				for (var j = 0 ; j < periods; j++) {
					ema += closeArray[count - j];
				}
				ema = ema / periods;				
			} else if (count > periods - 1) {
				//第二筆之後用加權算法
				ema = (closeArray[count] * 2 + this.emaArray[key][count-1] * (periods - 1)) / (periods + 1);
			}
			this.emaArray[key][count] = ema;			
			return ema;
		},
		calcDEM(signalPeriod, difArray, count, offset){
			var dem = null;
			if (count == offset - 1) {
				// 第一筆先計算SMA
				for (var j = 0; j < signalPeriod; j++) {
					dem += difArray[count - j];				
				}
				dem = dem / signalPeriod;			
			} else if (count > offset - 1) {
				dem = (difArray[count] * 2 + this.signalArray[count-1] * (signalPeriod - 1)) / (signalPeriod + 1);
			}
			return dem;
		},
	},
	watch: {},
	computed: {
		MACDConfig() {return this.$store.state.Kchart.config.MACD},
	},
}
</script>

<style scoped>
</style>