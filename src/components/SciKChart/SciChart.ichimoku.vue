<template>
	<div class="scitchart-ichimoku hidden" />
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
			comName: "SciChart.ichimoku",
			FILL_WORD: NaN,
			senkouSpanABandDataList: [],
			senkouSpanBBandDataList: [],
			TenkanSenDataList: [],
			KijunSenDataList: [],
			ChinkouSpanDataList: [],
			senkouSpanBandDataSeries: null,
			TenkanSenDataSeries: null,
			KijunSenDataSeries: null,
			ChinkouSpanDataSeries: null,
			xValues: [],
			tickList: [],
			sciChartSurface: null,
			senkouSpanBandSeries: null,
			TenkanSenSeries: null,
			KijunSenSeries: null,
			ChinkouSpanSeries: null,
			timestampMap: {
				d: 1440,
				w: 10080,
				m: 43200,
			},
			timeKeyList: [],
			chinkouLineAppendIndex: null,	// chinkou線改以append方式新增資料的位置
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.senkouSpanBandSeries);
		this.sciChartSurface.renderableSeries.remove(this.TenkanSenSeries);
		this.sciChartSurface.renderableSeries.remove(this.KijunSenSeries);
		this.sciChartSurface.renderableSeries.remove(this.ChinkouSpanSeries);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			// ichimoku設定資料
			let config = this.ichimokuConfig;
			// 寬帶線圖設定
			this.senkouSpanBandSeries = new FastBandRenderableSeries(wasmContext, {
				dataSeries: this.senkouSpanBandDataSeries,
				strokeThickness: 2,
				fill: config.drawConfig.Kumo,
				fillY1: config.drawConfig.Kumo,
				stroke: config.drawConfig.SenkouA,
				strokeY1: config.drawConfig.SenkouB,
			});
			this.TenkanSenSeries = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.TenkanSenDataSeries,
				stroke: config.drawConfig.Tenkan,
				strokeThickness: 2,
			});
			this.KijunSenSeries = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.KijunSenDataSeries,
				stroke: config.drawConfig.Kijun,
				strokeThickness: 2,
			});
			this.ChinkouSpanSeries = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.ChinkouSpanDataSeries,
				stroke: config.drawConfig.Chinkou,
				strokeThickness: 2,
			});
			this.sciChartSurface.renderableSeries.add(this.senkouSpanBandSeries);
			this.sciChartSurface.renderableSeries.add(this.TenkanSenSeries);
			this.sciChartSurface.renderableSeries.add(this.KijunSenSeries);
			this.sciChartSurface.renderableSeries.add(this.ChinkouSpanSeries);
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			this.timeKeyList = timeKeyList;
			this.chinkouLineAppendIndex = timeKeyList.length - 1;
			let timestamps = (this.timestampMap[this.NK] || this.NK) * 60000;
			let middle = this.ichimokuConfig.middle;
			this.xValues = [],  this.tickList = [], this.senkouSpanABandDataList = [], this.senkouSpanBBandDataList = [],
			this.TenkanSenDataList = [], this.KijunSenDataList = [], this.ChinkouSpanDataList = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				this.tickList.push(tick || {});
			});
			for(let i = 0; i < timeKeyList.length; i++) {
				let data = this.analysisTick(i);
				this.senkouSpanABandDataList.push(data.senkouSpanA);
				this.senkouSpanBBandDataList.push(data.senkouSpanB);
				this.TenkanSenDataList.push(data.tenkan);
				this.KijunSenDataList.push(data.kijun);
				this.ChinkouSpanDataList.push(data.chinkou);
			}
			if( this.xValues.length === 1) {
				if(this.senkouSpanABandDataList.filter(d=>(isNaN(d))).length == this.senkouSpanABandDataList.length) {
					this.senkouSpanABandDataList = new Array(this.senkouSpanABandDataList.length).fill(0);
				}
				if(this.senkouSpanBBandDataList.filter(d=>(isNaN(d))).length == this.senkouSpanBBandDataList.length) {
					this.senkouSpanBBandDataList = new Array(this.senkouSpanBBandDataList.length).fill(0);
				}
				if(this.TenkanSenDataList.filter(d=>(isNaN(d))).length == this.TenkanSenDataList.length) {
					this.TenkanSenDataList = new Array(this.TenkanSenDataList.length).fill(0);
				}
				if(this.KijunSenDataList.filter(d=>(isNaN(d))).length == this.KijunSenDataList.length) {
					this.KijunSenDataList = new Array(this.KijunSenDataList.length).fill(0);
				}
				if(this.ChinkouSpanDataList.filter(d=>(isNaN(d))).length == this.ChinkouSpanDataList.length) {
					this.ChinkouSpanDataList = new Array(this.ChinkouSpanDataList.length).fill(0);
				}
			}
			let middleYDataList = [];
			let preMiddleXDataList = [];
			for(let j = 0; j < middle; j++ ){
				middleYDataList.push(NaN);
				preMiddleXDataList.push(this.xValues.slice(-1)[0] + timestamps * (j + 1));
			}
			this.senkouSpanBandDataSeries = new XyyDataSeries(wasmContext, {
				dataSeriesName: "Senkou Span", xValues: this.xValues.concat(preMiddleXDataList), 
				yValues: middleYDataList.concat(this.senkouSpanABandDataList), y1Values: middleYDataList.concat(this.senkouSpanBBandDataList)});
			this.TenkanSenDataSeries = new XyDataSeries(wasmContext, {
				dataSeriesName: "TenkanSen", xValues: this.xValues, yValues: this.TenkanSenDataList});
			this.KijunSenDataSeries = new XyDataSeries(wasmContext, {
				dataSeriesName: "KijunSen", xValues: this.xValues, yValues: this.KijunSenDataList});
			// 處理當timeklist數量小於middle時出現與yvalues長度不一致導致scichart報錯問題。
			let _ChinkouSpanData = [];
			if(middle > this.xValues.length) {
				let end = middle - this.xValues.length;
				let baseTs = this.timeKeyToUnixTimestamp(timeKeyList.slice(-1)[0])
				for(let i = 0; i < end; i++) {
					_ChinkouSpanData.push(baseTs + timestamps * (i+1));
				}
			}
			this.ChinkouSpanDataSeries = new XyDataSeries(wasmContext, {
				dataSeriesName: "ChinkouSpan", xValues: this.xValues.concat(_ChinkouSpanData), yValues: this.ChinkouSpanDataList.slice(middle).concat(middleYDataList)});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			// this.timeKeyList = timeKeyList;
			// ichimoku設定資料
			let middle = this.ichimokuConfig.middle;
			let moreLen = moreTimeKeyList.length;
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.splice(index, 0, this.timeKeyToUnixTimestamp(timeKey));
				this.tickList.splice(index, 0, tick || {});
			});
			for(let i = 0; i < moreLen; i++) {
				let data = this.analysisTick(i);
				this.senkouSpanABandDataList.splice(i, 0, data.senkouSpanA);
				this.senkouSpanBBandDataList.splice(i, 0, data.senkouSpanB);
				this.TenkanSenDataList.splice(i, 0, data.tenkan);
				this.KijunSenDataList.splice(i, 0, data.kijun);
				this.ChinkouSpanDataList.splice(i, 0, data.chinkou);
			}
			for(let i = moreLen; i < moreLen + middle*2; i++) {
				let data = this.analysisTick(i);
				this.senkouSpanABandDataList.splice(i, 1, data.senkouSpanA);
				this.senkouSpanBBandDataList.splice(i, 1, data.senkouSpanB);
				this.TenkanSenDataList.splice(i, 1, data.tenkan);
				this.KijunSenDataList.splice(i, 1, data.kijun);
				this.ChinkouSpanDataList.splice(i, 1, data.chinkou);
			}
			let middleYDataList = new Array(middle).fill(NaN);
			
			// 插入各指標的空資料
			let yValues = new Array(moreLen).fill(NaN);
			this.senkouSpanBandDataSeries.insertRange(0, this.xValues.slice(0, moreLen), yValues, yValues);
			this.TenkanSenDataSeries.insertRange(0, this.xValues.slice(0, moreLen), yValues);
			this.KijunSenDataSeries.insertRange(0, this.xValues.slice(0, moreLen), yValues);
			this.ChinkouSpanDataSeries.insertRange(0, this.xValues.slice(0, moreLen), yValues);

			let _senkouSpanABandDataList = middleYDataList.concat(this.senkouSpanABandDataList);
			let _senkouSpanBBandDataList = middleYDataList.concat(this.senkouSpanBBandDataList);
			let _ChinkouSpanDataList= this.ChinkouSpanDataList.slice(middle).concat(middleYDataList)
			// 更新舊資料
			for(let k = 0; k < moreLen + middle * 3; k++) {
				this.senkouSpanBandDataSeries.update(k, _senkouSpanABandDataList[k], _senkouSpanBBandDataList[k]);
				this.TenkanSenDataSeries.update(k, this.TenkanSenDataList[k]);
				this.KijunSenDataSeries.update(k, this.KijunSenDataList[k]);
				this.ChinkouSpanDataSeries.update(k, _ChinkouSpanDataList[k]);
			}
		},
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			let middle = this.ichimokuConfig.middle - 1;
			// 更新收盤價
			this.tickList.splice(index, 1, tick || {});
			let data = this.analysisTick(index);
			this.senkouSpanBandDataSeries.update(index + middle, data.senkouSpanA, data.senkouSpanB);
			this.TenkanSenDataSeries.update(index, data.tenkan);
			this.KijunSenDataSeries.update(index, data.kijun);
			this.ChinkouSpanDataSeries.update(index - middle, data.chinkou);
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			let middle = this.ichimokuConfig.middle - 1;
			let timestamps = (this.timestampMap[this.NK] || this.NK) * 60000;
			let preTimeKey = this.timeKeyList.slice(-1)[0] + (middle * timestamps);
			let postTimeKey = this.timeKeyList[index - middle];
			// 新增收盤價
			this.tickList.push(tick || {});
			let data = this.analysisTick(index);
			this.senkouSpanBandDataSeries.append(this.timeKeyToUnixTimestamp(preTimeKey), data.senkouSpanA, data.senkouSpanB);
			this.TenkanSenDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), data.tenkan);
			this.KijunSenDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), data.kijun);
			// 超過界限才以append方式新增。
			if(index - middle > this.chinkouLineAppendIndex)
				this.ChinkouSpanDataSeries.append(this.timeKeyToUnixTimestamp(postTimeKey), data.chinkou);
			else 
				this.ChinkouSpanDataSeries.update(index - middle, data.chinkou);
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let config = this.ichimokuConfig;
			let SenkouA = this.senkouSpanBandDataSeries.getNativeYValues().get(idx);
			let SenkouB = this.senkouSpanBandDataSeries.getNativeY1Values().get(idx);
			let Tenkan = this.TenkanSenDataSeries.getNativeYValues().get(idx);
			let Kijun = this.KijunSenDataSeries.getNativeYValues().get(idx);
			let Chinkou = this.ChinkouSpanDataSeries.getNativeYValues().get(idx);
			Chinkou = Chinkou? Chinkou: this.ChinkouSpanDataList.slice(-1)[0];
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">
											<span class="clr-white">ichimoku</span>
											<span class="mgl1" style="color:${config.drawConfig.Tenkan}">${this.showTickPrice(Tenkan)}</span>
											<span class="mgl1" style="color:${config.drawConfig.Kijun}">${this.showTickPrice(Kijun)}</span>
											<span class="mgl1" style="color:${config.drawConfig.Chinkou}">${this.showTickPrice(Chinkou)}</span>
											<span class="mgl1" style="color:${config.drawConfig.SenkouA}">${this.showTickPrice(SenkouA)}</span>
											<span class="mgl1" style="color:${config.drawConfig.SenkouB}">${this.showTickPrice(SenkouB)}</span>
										</div>`;
		},
		analysisTick(idx){
			let shortCycle = this.ichimokuConfig.short;
			let middleCycle = this.ichimokuConfig.middle;
			let longCycle = this.ichimokuConfig.long;
			let _idx = idx + 1;
			// Tenkan-Sen(短期、短軸快線)
			let tenkanCycleStartIdx =_idx >= shortCycle? _idx - shortCycle: 0;
			let tenkanData = _idx >= shortCycle? this.getCycleAvg(this.tickList.slice(tenkanCycleStartIdx, _idx)): this.FILL_WORD;
			// Kijun-Sen(中期、中軸慢線)
			let kijunCycleStartIdx = _idx >= middleCycle? _idx - middleCycle: 0;
			let kijunData = _idx >= middleCycle? this.getCycleAvg(this.tickList.slice(kijunCycleStartIdx, _idx)): this.FILL_WORD;
			// Chinkou Span (長期、後移指標)
			let chinkouData = this.tickList[idx]? this.tickList[idx].c || this.FILL_WORD: this.FILL_WORD;
			// Senkou Span A (前移指標A)
			let senkouSpanAData = kijunData == this.FILL_WORD || tenkanData == this.FILL_WORD? this.FILL_WORD: this.$safeFloat((kijunData + tenkanData) / 2); 
			// Senkou Span B (前移指標B)
			let longCycleStartIdx = _idx >= longCycle? _idx - longCycle: 0;
			let senkouSpanBData = senkouSpanAData != this.FILL_WORD && _idx >= longCycle? this.getCycleAvg(this.tickList.slice(longCycleStartIdx, _idx)): this.FILL_WORD;
			return {'tenkan': tenkanData, 'kijun': kijunData, 'chinkou': chinkouData, 'senkouSpanA': senkouSpanAData, 'senkouSpanB': senkouSpanBData};
		},
		getCycleAvg(list){
			let max = this.reduceMax(list, 'h');
			let min = this.reduceMin(list, 'l');
			return this.$safeFloat((max + min) / 2);
		},
		reduceMax(bars, key) {
			return this.max(this.filter(bars, key), key);
		},
		reduceMin(bars, key) {
			return this.min(this.filter(bars, key), key);
		},
		filter(bars, key){
			return bars.filter(function (bar) {
				return bar[key] ;
			}).map(b => b[key]);
		},
		max(bars) {
			return Math.max.apply(Math, bars);
		},
		min(bars) {
			return Math.min.apply(Math, bars);
		},
	},
	watch: {},
	computed: {
		ichimokuConfig() {return this.$store.state.Kchart.config.ichimoku},
		NK() {return this.$store.state.Kchart.NK;},
	},
}
</script>

<style scoped>
</style>