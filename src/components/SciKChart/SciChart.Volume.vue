<template>
	<div class="scitchart-vol hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import {OhlcDataSeries} from "scichart/Charting/Model/OhlcDataSeries";
import {FastColumnRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastColumnRenderableSeries";
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import { OhlcPaletteProvider_V } from '@/components/SciChart/SciChartPaletteProvider';
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
import { EAxisAlignment } from "scichart/types/AxisAlignment";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import { ENumericFormat } from "scichart/types/NumericFormat";
import { ELabelAlignment } from "scichart/types/LabelAlignment";
import {EAutoRange} from "scichart/types/AutoRange";
export default {
	mixins: [SciChartFn],
	props: [],
	data() {
		return {
			comName: "SciChart.Volume",
			sciChartSurface: null,
			lineSeries: null,
			opidLineSeries: null,
			dataSeries: null,
			ohlcDataSeries: null,
			opidDataSeries: null,
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.lineSeries);
		this.sciChartSurface.renderableSeries.remove(this.opidLineSeries);
		this.sciChartSurface.yAxes.remove(this.yAxis2);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, dataSeries}) {
			this.sciChartSurface = sciChartSurface;
			this.lineSeries = new FastColumnRenderableSeries(wasmContext, {
				dataSeries: this.dataSeries,
				paletteProvider: new OhlcPaletteProvider_V(this.ohlcDataSeries, "#D75442", "#6BA583", "#D75442", "#6BA583"),
				// fill: "#b0c4de",
				// stroke: "#4682b4",
				strokeThickness: 1,
				zeroLineY: 0,
			});
			// 未平倉線初始設定。
			let lineConfig = {
				dataSeries: this.opidDataSeries,
				stroke: '#FFFFFF'
			}
			// 分K顯示第二個Y軸(因分K的未平倉量過大所以以另一個Y軸標示)
			if(this.isNK){
				lineConfig.yAxisId = 'ID_Y_AXIS_2';
				this.createSecYAxis(wasmContext);
			}
			// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 0;
			this.opidLineSeries = new FastLineRenderableSeries(wasmContext, lineConfig);
			this.sciChartSurface.renderableSeries.add(this.lineSeries);
			this.sciChartSurface.renderableSeries.add(this.opidLineSeries);
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			let xValues = [], yValues = [], openValues = [], highValues = [], lowValues = [], closeValues = [], opidValue = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				yValues.push(tick.q || NaN);
				openValues.push(tick.o || NaN);
				highValues.push(tick.h || NaN);
				lowValues.push(tick.l || NaN);
				closeValues.push(tick.c || NaN);
				opidValue.push(tick.oi || NaN);
				
			});
			let firstTick = chartData[timeKeyList[0]];
			// 以回補的第一根資料判斷是否有時間欄位(另外加判斷是否有未平倉資料)
			this.isNK = (firstTick.t || firstTick.d) && firstTick.oi;
			
			this.dataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `Volume`, xValues: xValues, yValues: yValues});
			this.opidDataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `OPID`, xValues: xValues, yValues: opidValue});
			this.ohlcDataSeries = new OhlcDataSeries(wasmContext, {xValues, openValues, highValues, lowValues, closeValues});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			let xValues = [], yValues = [], openValues = [], highValues = [], lowValues = [], closeValues = [], opidValue = [];
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				yValues.push(tick.q || NaN);
				openValues.push(tick.o || NaN);
				highValues.push(tick.h || NaN);
				lowValues.push(tick.l || NaN);
				closeValues.push(tick.c || NaN);
				opidValue.push(tick.oi || NaN);
			});
			this.dataSeries.insertRange(0, xValues, yValues);
			this.opidDataSeries.insertRange(0, xValues, opidValue);
			this.ohlcDataSeries.insertRange(0, xValues, openValues, highValues, lowValues, closeValues);
		},
		onUpdateTick({index, tick, dataSeries}) {
			this.dataSeries.update(index, tick.q || NaN);
			this.opidDataSeries.update(index, tick.oi || NaN);
			this.ohlcDataSeries.update(index, tick.o || NaN, tick.h || NaN, tick.l || NaN, tick.c || NaN );
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			this.dataSeries.append(this.timeKeyToUnixTimestamp(timeKey), tick.q || NaN);
			this.opidDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), tick.oi || NaN);
			this.ohlcDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), tick.o || NaN, tick.h || NaN, tick.l || NaN, tick.c || NaN );
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let volume = this.dataSeries.getNativeYValues().get(idx);
			let opid = this.opidDataSeries.getNativeYValues().get(idx);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left ${this.getYvalueColor(idx)}">
											<span class="clr-white">${this.$ln('量')}</span><span class="mglr1">${volume || 0}</span>
											<span class="clr-white">${this.$ln('未平仓量')}</span><span class="mglr1">${opid || '--'}</span>
										</div>`;
		},
		// 依開高低收資料判斷顏色
		getYvalueColor(idx){
			return this.getOhlcTickUpDN_V(this.ohlcDataSeries, idx);
		},
		// 建立第二個Y軸
		createSecYAxis(wasmContext) {
			const config = {
				labelFormat: ENumericFormat.Decimal,
				isInnerAxis: true,
				axisAlignment: EAxisAlignment.Left,
			};
			const labelStyle2 = {
				color: "#FFFFFF",
				alignment: ELabelAlignment.Right
			};
			this.yAxis2 = new NumericAxis(wasmContext, config);
			this.yAxis2.id = 'ID_Y_AXIS_2';
			this.yAxis2.labelStyle = labelStyle2;
			this.yAxis2.autoRange = EAutoRange.Always;
			this.sciChartSurface.yAxes.add(this.yAxis2);
		},
	},
	watch: {},
	computed: {},
}
</script>

<style scoped>
</style>