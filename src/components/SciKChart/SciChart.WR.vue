<template>
	<div class="scitchart-wr hidden" />
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
			comName: "SciChart.WR",
			FILL_WORD: NaN,
			WRDataSeries: null,
			WRDataList: [],
			tickList: [],
			sciChartSurface: null,
			lineSeries_WR: null,
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.lineSeries_WR);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			this.lineSeries_WR = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.WRDataSeries,
				stroke: "#518FF5",
				strokeThickness: 2,
			});
			// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 2;
			this.sciChartSurface.renderableSeries.add(this.lineSeries_WR);
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			let xValues = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				this.tickList.push(tick || {});
			});
			this.processAllData();
			// 只有一筆記錄且資料不為數字不處理
			if(xValues.length == 1 && this.WRDataList.filter(d=>(isNaN(d))).length == this.WRDataList.length) {
				this.WRDataList = new Array(xValues.length).fill(0);
			}
			this.WRDataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `WR(${this.WRConfig.period})`, xValues: xValues, yValues: this.WRDataList});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			let xValues = [];
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				xValues.push( this.timeKeyToUnixTimestamp(timeKey));
				this.tickList.splice(index, 0, tick || {});
			});
			let range = this.WRConfig.period;
			for(let i = 0; i < moreTimeKeyList.length + range; i++){
				let tick = this.tickList[i];
				// 更新舊的wr
				if(i >= moreTimeKeyList.length){
					this.WRDataList.splice(i, 1, this.analysisTick(this.tickList.slice(i - range, i), tick));
				}
				// 新增wr
				else if(i >= range)
					this.WRDataList.splice(i, 0, this.analysisTick(this.tickList.slice(i - range, i), tick));
				// 不足周期塞NaN
				else
					this.WRDataList.splice(i, 0, this.FILL_WORD);
			}
			let moreLen = moreTimeKeyList.length;
			// 插入舊資料範圍
			this.WRDataSeries.insertRange(0, xValues, this.WRDataList.slice(0, moreLen));
			// 更新WR設定的範圍
			for(let i = moreLen; i < moreLen + range; i++) {
				this.WRDataSeries.update(i, this.WRDataList[i]);
			}
		},
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			let range = this.WRConfig.period;
			// 更新線圖資料。
			this.tickList.splice(index, 1, tick || {});
			let wr = this.analysisTick(this.tickList.slice(index - range, index), tick);
			this.WRDataSeries.update(index, wr || NaN );
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			let range = this.WRConfig.period;
			// 新增線圖資料。
			this.tickList.push(tick || {});
			let wr = this.analysisTick(this.tickList.slice(index - range, index), tick);
			this.WRDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), wr || NaN );
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let wr = this.WRDataSeries.getNativeYValues().get(idx);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">
											<span class="clr-white">WR</span><span class="mglr1" style="color: #518FF5">${wr || '--'}</span>
										</div>`;
		},
		// 更新最新tick區塊資料。
		analysisTick(kbarList, kbar){
			// 比周期少就不計算。
			// if(kbarList.length < this.WRConfig.period) return "";
			let maxValue = Number.NEGATIVE_INFINITY;
			let minValue = Number.POSITIVE_INFINITY;
			for (let i = 0; i < kbarList.length; i++) {
				if (kbarList[i].h > maxValue) {
					maxValue = kbarList[i].h;
				}
				if (kbarList[i].l < minValue) {
					minValue = kbarList[i].l;
				}
			}
			let maxDiff = maxValue - minValue;
			if (maxDiff === 0) {
				maxDiff = 1;
			}
			let value = Number(parseFloat(this.$safeFloat((kbar.c - maxValue) / maxDiff * 100)).toFixed(2));
			return value;
		},
		processAllData(){
			let period = this.WRConfig.period;
			for (let i = 0; i < this.tickList.length; i++) {
				let tick = this.tickList[i];
				if(i >= period)
					this.WRDataList.push(this.analysisTick(this.tickList.slice(i - period, i), tick));
				else
					this.WRDataList.push(this.FILL_WORD);
			}
		},
	},
	watch: {},
	computed: {
		WRConfig() {return this.$store.state.Kchart.config.WR;},
	},
}
</script>

<style scoped>
</style>