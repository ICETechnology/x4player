<template>
	<div class="scitchart-atr hidden" />
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
			comName: "SciChart.ATR",
			FILL_WORD: NaN,
			ATRDataSeries: null,
			ATRDataList: [],
			TRDataList: [],
			tickList: [],
			sciChartSurface: null,
			lineSeries_ATR: null,
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.lineSeries_ATR);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			this.lineSeries_ATR = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.ATRDataSeries,
				stroke: this.ATRConfig.c,
				strokeThickness: 2,
			});
			// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 4;
			this.sciChartSurface.renderableSeries.add(this.lineSeries_ATR);
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
			if(xValues.length == 1 && this.ATRDataList.filter(d=>(isNaN(d))).length == this.ATRDataList.length) {
				this.ATRDataList = new Array(xValues.length).fill(0);
			}
			this.ATRDataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `ATR`, xValues: xValues, yValues: this.ATRDataList});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			let xValues = [];
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				xValues.push( this.timeKeyToUnixTimestamp(timeKey));
				this.tickList.splice(index, 0, tick || {});
			});
			this.processAllData();
			let moreLen = moreTimeKeyList.length;
			let range = this.ATRConfig.range;
			// 插入舊資料範圍
			this.ATRDataSeries.insertRange(0, xValues, this.ATRDataList.slice(0, moreLen));
			// 更新ATR設定的範圍
			for(let i = moreLen; i < moreLen + range; i++) {
				this.ATRDataSeries.update(i, this.ATRDataList[i]);
			}
		},
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			// 更新線圖資料。
			this.tickList.splice(index, 1, tick || {});
			this.analysisTick(index);
			this.ATRDataSeries.update(index, this.ATRDataList[index] || NaN );
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			// 新增線圖資料。
			this.tickList.push(tick || {});
			this.analysisTick(index);
			this.ATRDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), this.ATRDataList[index] || NaN );
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let atr = this.ATRDataSeries.getNativeYValues().get(idx);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left" style="color: ${this.ATRConfig.c}">
											<span class="clr-white">ATR</span><span class="mglr1">${atr}</span>
										</div>`;
		},
		// 更新最新tick區塊資料。
		analysisTick(idx){
			// 周期
			let range = this.ATRConfig.range;
			let latestIdx = idx || this.tickList.length - 1;
			let thisTick = this.tickList[latestIdx];
			let preTick = this.tickList[latestIdx - 1];
			// 計算當日TR
			this.TRDataList.splice(idx, 1, (Math.max(thisTick.h, preTick.c) - Math.min(thisTick.l, preTick.c)));
			// 計算當日ATR
			this.ATRDataList.splice(idx, 1, this.$safeFloat((this.TRDataList[latestIdx] + (this.ATRDataList[latestIdx - 1] * (range - 1))) / range));
		},
		// 計算ATR資料
		calcTickAvg() {
			// 周期
			let range = this.ATRConfig.range;
			for (let j = 0; j < this.tickList.length; j++) {
				// 有周期以上天數的資料才計算
				if ( j == range - 1) {
					let STR = 0;
					// 第一筆先計算SMA
					for (let k = 0 ; k < range - 1; k++) {
						STR += this.TRDataList[j - k];
					}
					STR = STR / range;
					this.ATRDataList.push(STR);
				} else if (j > range - 1) {
					//第二筆之後用加權算法
					let ATR = this.$safeFloat((this.TRDataList[j] + (this.ATRDataList[j-1] * (range - 1))) / range)
					this.ATRDataList.push(ATR);
				}
				// 小於周期
				else {
					this.ATRDataList.push(NaN);
				}
			}
		},
		processAllData(){
			this.TRDataList = [];
			this.TRDataList.push(0);
			// 計算所有TR
			for (let i = 1; i < this.tickList.length; i++) {
				let tick = this.tickList[i];
				let preTick = this.tickList[i-1];
				// TR=MAX(Ht,Lt,前日收) - MIN(Ht,Lt,前日收)
				this.TRDataList.push((Math.max(tick.h, preTick.c) - Math.min(tick.l, preTick.c)));
			}
			// 計算所有ATR
			this.calcTickAvg();
		},
	},
	watch: {},
	computed: {
		ATRConfig() {return this.$store.state.Kchart.config.ATR;},
	},
}
</script>

<style scoped>
</style>