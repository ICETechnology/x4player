<template>
	<div class="flex-center" v-stop-propagation-touchmove @touchmove="onTouchMove" @touchend="onTouchEnd">
		<div id="scichart-root" class="scichart-ctn"  @click="onScichartRootClick"></div>
		<LoadingIcon v-if="isLoading"></LoadingIcon>
	</div>
</template>

<script>
import {SciChartSurface} from "scichart/Charting/Visuals/SciChartSurface";
import {NumericAxis} from "scichart/Charting/Visuals/Axis/NumericAxis";
import {CategoryAxis} from "scichart/Charting/Visuals/Axis/CategoryAxis";
import { EAxisAlignment } from "scichart/types/AxisAlignment";
import {OhlcDataSeries} from "scichart/Charting/Model/OhlcDataSeries";
import {FastCandlestickRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastCandlestickRenderableSeries";
import {FastColumnRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastColumnRenderableSeries";
import { FastLineRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {ENumericFormat} from "scichart/types/NumericFormat";
import { SmartDateLabelProvider } from "scichart/Charting/Visuals/Axis/LabelProvider/SmartDateLabelProvider";
import {EAutoRange} from "scichart/types/AutoRange";
import { easing } from "scichart/Core/Animations/EasingFunctions";

import {MouseWheelZoomModifier} from "scichart/Charting/ChartModifiers/MouseWheelZoomModifier";
import {ZoomPanModifier} from "scichart/Charting/ChartModifiers/ZoomPanModifier";
import {ZoomExtentsModifier} from "scichart/Charting/ChartModifiers/ZoomExtentsModifier";
import { PinchZoomModifier } from "scichart/Charting/ChartModifiers/PinchZoomModifier";

import { NumberRange } from "scichart/Core/NumberRange";
import {WaveAnimation} from "scichart/Charting/Visuals/RenderableSeries/Animations/WaveAnimation";
import { XyMovingAverageFilter } from "scichart/Charting/Model/Filters/XyMovingAverageFilter";
import { EDataSeriesField } from "scichart/Charting/Model/Filters/XyFilterBase";

export default {
	props: [],
	data() {
		return {
			sciObj: null,
			qo: {},
			isLoading: true,
			tickDataSeries: null,
			volumeDataSeries: null,
			STROKE_THICKNESS: 1,
			movingAverage20DataSeries: null,
			movingAverage50DataSeries: null,
		}
	},
	beforeMount() {
		this.$store.state.components.scitchart = this;
	},
	mounted() {
		this.initSciChart();
		// 更新市況
		this.qo = M4C.Quote.getQuoteObject(this.sid);
		// 訂閱
		M4C.SciChartData.sub({com_instance: this, sid: this.sid, nk: '1'});
		// M4C.ChartData.sub(this, this.sid, '1', null, null, 1);
	},
	beforeDestroy() {
		M4C.ChartData.unsub(this, this.sid, '1');
		this.tickDataSeries.delete();
		this.volumeDataSeries.delete();
		this.tickSeries.delete();
		this.ma1.delete();
		this.ma2.delete();
		this.volRect.delete();
		this.sciObj.sciChartSurface.delete();
	},
	components: {},
	methods: {
		async initSciChart() {
			SciChartSurface.setRuntimeLicenseKey("MZEoxFh6gWZHB4pWv5wAorwThSpUFHdUyVLsopQrCbSabvip5kubry2XYHOekoZGXKSz3hY/HumQJT/hhSrU5qQWFfgfhWmQkQ3nOeAHq7yVnhmWBe7i9pQc/pDwz1rNeFM6/Del1XW/wTH8Ed8kTQDyXg/XYAdzYBjDEtmFmqhNfwqIAcXobJdG5IGkhBffQwKjh6UFa2piiPG1ZsZAvoWWnh1W8b3+ga3dOYSmQaHKhQTpVTIxCShk4UVYyFLCsuaXZvvWtQKV/qqNfWBbXJL4H0U1nOyDMxJyjZrfAf0SGKyZDdBrPVdOg9LeR9IE58t5P4lRIAw03YWW0xXrL6es4Vas+hnmY3H5eCZjH4nUB+AGQirCi5XorV8ffGbjZCKh0PbNFdMJ2EwMw8vscifLz+z607/EiemgbX0z0kkkCCfA+dW9fckPXV3Nr/Ily9Dk1FSXw+dZLsnnD5G2tVtQUBpLct5EuAYJjCGwMSA7BH/8ze3te3YOaDRJYJfm6MS5GuClJ7ZmhxyAcN4K6aWlooMYQSMQcMmJQDkOYoIbH/OxD7P9");
			const {sciChartSurface, wasmContext} = this.sciObj = await SciChartSurface.create("scichart-root");
		},
		// 收到首次回補(含已存在的)資料
		onFullData({sid, chartData, timeKeyList}) {
			let xValues = [], volValues = [], openValues = [], highValues = [], lowValues = [], closeValues = [];
			this.isLoading = false;
			this.timeKeyList = timeKeyList;
			// 建立 X,Y 軸
			this.initAxis();
			// 建立資料
			timeKeyList.forEach((timeKey, index)=>{
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				volValues.push(chartData[timeKey].q);
				openValues.push(chartData[timeKey].o);
				highValues.push(chartData[timeKey].h);
				lowValues.push(chartData[timeKey].l);
				closeValues.push(chartData[timeKey].c);
			});
			this.tickDataSeries = new OhlcDataSeries(this.sciObj.wasmContext, {xValues, openValues, highValues, lowValues, closeValues});
			this.volumeDataSeries = new XyDataSeries(this.sciObj.wasmContext, {xValues, yValues: volValues});
			this.movingAverage20DataSeries = new XyMovingAverageFilter(this.tickDataSeries,  { dataSeriesName: "MA 20", length: 20});
			this.movingAverage50DataSeries = new XyMovingAverageFilter(this.tickDataSeries,  { dataSeriesName: "MA 50", length: 50});
			// 建立線圖
			this.createLine();
			// 顯示區間從開盤時間開始
			let openTimeKey = M4C.SciChartData.getOpenTimeKey(this.sid, '1');
			let openTimeIdx = timeKeyList.indexOf(openTimeKey);
			// 顯示50根tick
			this.visibleRange = this.xAxis.visibleRange = new NumberRange(this.timeKeyList.length-50, this.timeKeyList.length);
			// this.xAxis.animateVisibleRange(openTimeIdx, timeKeyList.length-1);
			// this.xAxis1.visibleRange = new NumberRange(openTimeIdx, timeKeyList.length-1);
		},
		// 收到更多資料 (由 getMore 觸發補回來的)
		onMoreData({sid, chartData, timeKeyList, moreTimeKeyList}) {
			let xValues = [], volValues = [], openValues = [], highValues = [], lowValues = [], closeValues = [];
			this.isLoading = false;
			this.timeKeyList = timeKeyList;
			moreTimeKeyList.forEach(timeKey=>{
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				volValues.push(chartData[timeKey].q);
				openValues.push(chartData[timeKey].o);
				highValues.push(chartData[timeKey].h);
				lowValues.push(chartData[timeKey].l);
				closeValues.push(chartData[timeKey].c);
			});
			this.tickDataSeries.insertRange(0, xValues, openValues, highValues, lowValues, closeValues);
			this.volumeDataSeries.insertRange(0, xValues, volValues);
			// 計算新的顯示範圍
			let newMin = moreTimeKeyList.length + this.visibleRange.min;
			let newMax = newMin + this.visibleRange.max - this.visibleRange.min;
			// console.log(`append cnt : ${insertCnt}, new min : ${newMin}, new max : ${newMax}`);
			// this.xAxis1.visibleRange = new NumberRange(newMin, newMax);
			this.visibleRange = this.xAxis.visibleRange = new NumberRange(newMin, newMax);
		},
		// 收到即時更新Tick
		onUpdateTick(index, tick) {
			this.tickDataSeries.update(index, tick.o, tick.h, tick.l, tick.c);
			if(tick.q) this.volumeDataSeries.update(index, tick.q);
		},
		// 收到即時新的Tick
		onAppendTick(index, tick) {
			this.tickDataSeries.append(index, tick.o, tick.h, tick.l, tick.c);
			if(tick.q) this.volumeDataSeries.append(index, tick.q);
			// let newMin = this.visibleRange.min;
			// let newMax = this.visibleRange.max + 4; //this.visibleRange.max - this.visibleRange.min;
			// let shiftedRange = new NumberRange(newMin, newMax);
			// this.xAxis.animateVisibleRange(shiftedRange, 1, easing.inOutQuad);
		},
		onChartData(sid, chartData, timeKeyList, byRealTimeTick, errorcode, nk) {
			let newTimeKeyStart = timeKeyList[0];
			let newTimeKeyEnd = timeKeyList[timeKeyList.length-1];
			// console.log(`lastTimeKeyStart: ${this.lastTimeKeyStart}, lastTimeKeyEnd: ${this.lastTimeKeyEnd}, newTimeKeyStart: ${newTimeKeyStart}, newTimeKeyEnd: ${newTimeKeyEnd}`);
			this.isLoading = false;
			const {sciChartSurface, wasmContext} = this.sciObj;
			let xValues = [];
			let yValues = [];
			let openValues = [];
			let highValues = [];
			let lowValues = [];
			let closeValues = [];
			let volValues = [];
			// 首次回補完成
			if (!this.tickDataSeries) {
				// 建立 X,Y 軸
				this.initAxis();
				// 建立資料
				timeKeyList.forEach((timeKey)=>{
					xValues.push(this.timeKeyToUnixTimestamp(timeKey));
					yValues.push(chartData[timeKey].c);
					volValues.push(chartData[timeKey].q);
					openValues.push(chartData[timeKey].o);
					highValues.push(chartData[timeKey].h);
					lowValues.push(chartData[timeKey].l);
					closeValues.push(chartData[timeKey].c);
				});
				this.tickDataSeries = new OhlcDataSeries(wasmContext, {xValues, openValues, highValues, lowValues, closeValues});
				this.volumeDataSeries = new XyDataSeries(wasmContext, {xValues, yValues: volValues});
				// field: EDataSeriesField.Close=>指定以哪個欄位計算移動平均
				this.movingAverage20DataSeries = new XyMovingAverageFilter(this.tickDataSeries,  { dataSeriesName: "MA 20", length: 20 , field: EDataSeriesField.Close});
				this.movingAverage50DataSeries = new XyMovingAverageFilter(this.tickDataSeries,  { dataSeriesName: "MA 50", length: 50 , field: EDataSeriesField.Close});
				// 建立線圖
				this.createLine();
			}
			// 回補到更多的資料
			else if (timeKeyList[0] !== this.lastTimeKeyStart) {
				let insertCnt = timeKeyList.indexOf(this.lastTimeKeyStart);
				for (let i=0; i<insertCnt; i++) {
					let timeKey = timeKeyList[i];
					xValues.push(this.timeKeyToUnixTimestamp(timeKey));
					yValues.push(chartData[timeKey].c);
					volValues.push(chartData[timeKey].q);
					openValues.push(chartData[timeKey].o);
					highValues.push(chartData[timeKey].h);
					lowValues.push(chartData[timeKey].l);
					closeValues.push(chartData[timeKey].c);
				}
				this.tickDataSeries.insertRange(0, xValues, openValues, highValues, lowValues, closeValues);
				this.volumeDataSeries.insertRange(0, xValues, volValues);
				// 計算新的顯示範圍
				let newMin = insertCnt + this.visibleRange.min;
				let newMax = newMin + this.visibleRange.max - this.visibleRange.min;
				console.log(`append cnt : ${insertCnt}, new min : ${newMin}, new max : ${newMax}`);
				this.xAxis.visibleRange = new NumberRange(newMin, newMax);
				// let shiftedRange = new NumberRange(newMin, newMax);
				// this.xAxis.animateVisibleRange(shiftedRange, 250, easing.inOutQuad);
			}
			// 即時資料
			else if (byRealTimeTick) {
				let timeKey = timeKeyList.at(-1);
				if (timeKey === this.lastTimeKeyEnd){
					this.tickDataSeries.update(timeKeyList.length-1, chartData[timeKey].o, chartData[timeKey].h, chartData[timeKey].l, chartData[timeKey].c);
					this.volumeDataSeries.update(timeKeyList.length-1, chartData[timeKey].q);
				}
				else {
					this.tickDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), chartData[timeKey].o, chartData[timeKey].h, chartData[timeKey].l, chartData[timeKey].c);
					this.volumeDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), chartData[timeKey].q);
					// sciChartSurface.zoomExtents();
				}
			}
			this.lastTimeKeyStart = newTimeKeyStart; 
			this.lastTimeKeyEnd = newTimeKeyEnd;
		},
		// 建立 X,Y 軸
		initAxis() {
			const {sciChartSurface, wasmContext} = this.sciObj;
			// X 軸 (為了要使用 CategoryAxis 必須等到資料回來才能作)
			const xAxis = this.xAxis = new CategoryAxis(wasmContext, {
				drawMajorGridLines: true,
				drawMinorGridLines: true,
				labelFormat: ENumericFormat.Date_HHMM,
			});
			xAxis.labelProvider = new SmartDateLabelProvider();

			// Y 軸
			const yAxis = new NumericAxis(wasmContext, {
        		labelFormat: ENumericFormat.Decimal,
        		labelPrecision: M4C.Symbol.getDecimalLength(this.sid, this.qo.p),
				growBy: new NumberRange(0.25, 0.05),
				autoRange: EAutoRange.Always,
			});
			// yAxis.autoRange = EAutoRange.Always;
			sciChartSurface.xAxes.add(xAxis);
			sciChartSurface.yAxes.add(yAxis);

			const volumeYAxis = new NumericAxis(wasmContext, { id: "AXIS2_ID", axisAlignment: EAxisAlignment.Left });
			volumeYAxis.isVisible = false;
			volumeYAxis.autoRange = EAutoRange.Always;
			volumeYAxis.growBy = new NumberRange(0, 5);
			sciChartSurface.yAxes.add(volumeYAxis);
			// 擴增功能
			sciChartSurface.chartModifiers.add(
				new ZoomPanModifier(),
				new ZoomExtentsModifier(),
				new MouseWheelZoomModifier(),
				new PinchZoomModifier(),
			);
		},
		// 建立線圖
		createLine() {
			const {sciChartSurface, wasmContext} = this.sciObj;
			let tickSeries = this.tickSeries = new FastCandlestickRenderableSeries(wasmContext, {
				dataSeries:  this.tickDataSeries,
				strokeThickness: 1,
				brushUp: "#50ff50B2",
				brushDown: "#ff5050B2",
				strokeUp: "#50ff50",
				strokeDown: "#ff5050",
				// animation: new WaveAnimation({ fadeEffect: true, duration: 800 })
			});
			let ma1 = this.ma1 = new FastLineRenderableSeries(wasmContext, {
					stroke: "#ff6600",
					strokeThickness: 2,
					dataSeries: this.movingAverage20DataSeries
				});
			let ma2 = this.ma2 = new FastLineRenderableSeries(wasmContext, {
					stroke: "#ffffff",
					strokeThickness: 2,
					dataSeries: this.movingAverage50DataSeries
				});
			let volRect = this.volRect = new FastColumnRenderableSeries(wasmContext, {
				fill: "#b0c4de",
				stroke: "#4682b4",
				strokeThickness: 1,
				zeroLineY: 0,
				yAxisId: "AXIS2_ID",
				dataSeries: this.volumeDataSeries});
			sciChartSurface.renderableSeries.add(tickSeries);
			sciChartSurface.renderableSeries.add(ma1);
			sciChartSurface.renderableSeries.add(ma2);
			sciChartSurface.renderableSeries.add(volRect);
		},
		// '201906200601' -> Unix timestamp
		timeKeyToUnixTimestamp(s) {
			let d = new Date();
			d.setFullYear(s.substr(0,4));
			d.setMonth(parseInt(s.substr(4,2))-1);
			d.setDate(s.substr(6,2));
			d.setHours(s.substr(8,2));
			d.setMinutes(s.substr(10,2));
			d.setSeconds(0);
			return Math.floor(d.getTime() / 1000 + 28800);
		},
		onTouchMove() {
			const range = this.xAxis.visibleRange;
			// console.log(`xAxis.visibleRange.min : ${range.min}, max : ${range.max}`);
		},
		onTouchEnd() {
			const range = this.visibleRange = this.xAxis.visibleRange;
			if (range.min < 0) {
				this.isLoading = true;
				M4C.SciChartData.getMore(this);
				// M4C.ChartData.getMore(this);
			}
		},
		onScichartRootClick() {
			const scs = this.sciObj.sciChartSurface;
			const chart3 = scs.renderableSeries.get(3);
			if(scs && chart3)
				scs.renderableSeries.removeAt(3);
			else if(scs && !chart3){
				scs.renderableSeries.add(this.volRect);
			}
		},
	},
	watch: {},
	computed: {
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
	},
}
</script>

<style scoped>
.scichart-ctn {
	width: 100%;
	height: 100%;
	touch-action: none;
}
</style>