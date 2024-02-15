<template>
	<div class="scitchart-sar hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import { XyScatterRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/XyScatterRenderableSeries";
import { EllipsePointMarker } from "scichart/Charting/Visuals/PointMarkers/EllipsePointMarker";
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
export default {
	mixins: [SciChartFn],
	props: ['sid', 'qo'],
	data() {
		return {
			comName: "SciChart.SAR",
			BASE_NUM: 2,				// 當作base用來計算基底的根數
			EP_RANGE: 7,				// 極值區間
			AF_VAL: 0.02,				// 加速因子
			FILL_WORD: NaN,
			SARDataSeries: null,
			sarDataList: [],
			xValues: [],
			highValues: [],
			lowValues: [],
			closeValues: [],
			scatterSeries: null,
			sciChartSurface: null,
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.scatterSeries);
	},
	components: {},
	methods: {
		// 線圖設定
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			this.scatterSeries = new XyScatterRenderableSeries(wasmContext, {
				dataSeries: this.SARDataSeries,
				pointMarker: new EllipsePointMarker(wasmContext, {
					MaxWidth: 4,
					MaxHeight: 4,
					strokeThickness: 0,
					fill: "orange",
					// stroke: "orange",
				}),
			});
			this.sciChartSurface.renderableSeries.add(this.scatterSeries);
		},
		// 初始資料
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			this.xValues = [], this.highValues = [], this.lowValues = [], this.closeValues = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				this.highValues.push(tick.h || NaN);
				this.lowValues.push(tick.l || NaN);
				this.closeValues.push(tick.c || NaN);
			});
			this.processAllData();
			let yValues = this.sarDataList.map(sarObj=>(sarObj.data));
			if(this.xValues.length == 1 && yValues.filter(d=>(isNaN(d))).length == yValues.length) {
				yValues = new Array(this.xValues.length).fill(0);
			}
			this.SARDataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `SAR`, xValues: this.xValues, yValues: yValues});
		},
		// 回補舊資料
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.splice(index, 0, this.timeKeyToUnixTimestamp(timeKey));
				this.highValues.splice(index, 0, tick.h || NaN);
				this.lowValues.splice(index, 0, tick.l || NaN);
				this.closeValues.splice(index, 0, tick.c || NaN);
			});
			let moreLen = moreTimeKeyList.length;
			this.processAllData();
			let yValues = this.sarDataList.map(sarObj=>(sarObj.data));
			this.SARDataSeries.clear();
			this.SARDataSeries.appendRange(this.xValues, yValues);
		},
		// 更新資料
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			// 更新價位
			this.highValues.splice(index, 1, tick.h || NaN);
			this.lowValues.splice(index, 1, tick.l || NaN);
			this.closeValues.splice(index, 1, tick.c || NaN);
			// 計算SAR資料
			let sarData = this.calcSAR(index);
			// 更新SAR資料清單
			this.sarDataList.splice(index, 0, sarData);
			// 更新線圖資料。
			this.SARDataSeries.update(index, sarData.data || NaN );
		},
		// 新增資料
		onAppendTick({index, tick, dataSeries, timeKey}) {
			// 新增資料
			this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
			this.highValues.push(tick.h || NaN);
			this.lowValues.push(tick.l || NaN);
			this.closeValues.push(tick.c || NaN);
			// 計算SAR資料
			let sarData = this.calcSAR(index);
			// 新增SAR資料
			this.sarDataList.push(sarData);
			// 新增線圖資料。
			this.SARDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), sarData.data || NaN );
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let sar = this.SARDataSeries.getNativeYValues().get(idx);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">
											<span class="clr-white">SAR</span>
											<span class="clr-orange mgl1">${this.showTickPrice(sar)}</span>
										</div>`;
		},
		// 處理全部資料
		processAllData(){
			// 過濾後的 極高值Array
			this._extremeHighArr = [];
			this._extremeLowArr = [];
			this.sarDataList.splice(0);
			for (let c = 0; c < this.xValues.length; c++) {
				this._extremeHighArr.push(!isNaN(this.highValues[c])? this.highValues[c] : Number.NEGATIVE_INFINITY);
				this._extremeLowArr.push(!isNaN(this.lowValues[c])? this.lowValues[c]: Number.POSITIVE_INFINITY);
			}
			// 判斷s0的漲跌情勢
			let isRaise;
			let accFacter = 0;
			let extremePrice = null;
			let lastReverse = 0;
			for (let i = 0; i < this.xValues.length; i++) {
				let data;
				let extreme = this.getExtremeRange(lastReverse, i);
				if (i < this.BASE_NUM) {
					data = this.FILL_WORD;
				} else {
					if (i === this.BASE_NUM) {
						// 第一根直接看情勢判斷取最高價還是最低價
						isRaise = this.highValues[1] > this.highValues[0];
						lastReverse = i;
						if (isRaise) {
							data = extreme.MIN;
						} else {
							data = extreme.MAX;
						}
					} else {
						if (isRaise) {
							extremePrice = extreme.MAX;
						} else {
							extremePrice = extreme.MIN;
						}

						// 上一筆 SAR資料
						let lastData = this.sarDataList[i - 1].data;

						// 加速因子還沒到上限 0.2
						if (accFacter < this.SARConfig.MAX_VAL) {
							if (isRaise && this.highValues[i] > this.highValues[i - 1]) {
								// 看漲時，最高價高於前一天最高價
								accFacter = this.$safeFloat(accFacter + this.SARConfig.INCREMENTAL);
							} else if (!isRaise && this.lowValues[i] < this.lowValues[i - 1]) {
								// 看跌時，最低價低於前一天最低價
								accFacter = this.$safeFloat(accFacter + this.SARConfig.INCREMENTAL);
							}
						}
						data = this.$safeFloat(lastData + ((extremePrice - lastData) * accFacter));
						if ((isRaise && data > this.closeValues[i]) ||
							(!isRaise && data < this.closeValues[i])) {
							data = extremePrice;
							if (isRaise) {
								data = Math.max(extremePrice, this.highValues[i]);
							} else {
								data = Math.min(extremePrice, this.lowValues[i]);
							}
							accFacter = this.AF_VAL;
							lastReverse = i;
							isRaise = !isRaise;
						}
					}
				}
				this.sarDataList.push({"data": data, "afData": accFacter, "epData": extremePrice, "isRaise": isRaise, "reverse": lastReverse});
			}
		},
		// 取極限範圍
		getExtremeRange(startIndex, endIndex){
			startIndex = startIndex || (endIndex - this.EP_RANGE * 2);
			if (startIndex < 0) {
				startIndex = 0;
			}
			return {
				'MAX': Math.max.apply(Math, this._extremeHighArr.slice(startIndex, endIndex)),
				'MIN': Math.min.apply(Math, this._extremeLowArr.slice(startIndex, endIndex))
			};
		},
		// 計算SAR相關資料
		calcSAR(idx) {
			let preSarData = this.sarDataList[idx - 1];
			let preDataH = this.highValues[idx - 1];
			let preDataL = this.lowValues[idx - 1];
			let preAF = preSarData.afData;
			let preEP = preSarData.epData;
			let preIsRaise = preSarData.isRaise;
			let preSAR = preSarData.data;
			let preReverse = preSarData.reverse;
			let currDataH = this.highValues[idx];
			let currDataL = this.lowValues[idx];
			let currDataC = this.closeValues[idx];
			let accFacter = preAF, data = 0, extremePrice = preEP, isRaise = preIsRaise, reverse = preReverse;
			if(preIsRaise)
				extremePrice = Math.max(extremePrice, currDataH);
			else
				extremePrice = Math.min(extremePrice, currDataL);
			// 加速因子還沒到上限 0.2
			if(preAF < this.SARConfig.MAX_VAL) {
				if (preIsRaise && currDataH > preDataH) {
					// 看漲時，最高價高於前一天最高價
					accFacter = this.$safeFloat(accFacter + this.SARConfig.INCREMENTAL);
				} else if (!preIsRaise && currDataL < preDataL) {
					// 看跌時，最低價低於前一天最低價
					accFacter = this.$safeFloat(accFacter + this.SARConfig.INCREMENTAL);
				}
			}
			data = this.$safeFloat(preSAR + ((extremePrice - preSAR) * accFacter));
			// 反轉拋物線時
			if ((preIsRaise && data > currDataC) || (!preIsRaise && data < currDataC)) {
				data = extremePrice;
				if (preIsRaise) {
					data = extremePrice = Math.max(extremePrice, currDataH);
				} else {
					data = extremePrice = Math.min(extremePrice, currDataL);
				}
				accFacter = this.AF_VAL;
				reverse = idx;
				isRaise = !preIsRaise;
			}
			return {"data": data, "afData": accFacter, "epData": extremePrice, "isRaise": isRaise, "reverse": reverse};
		},
	},
	watch: {},
	computed: {
		SARConfig() {return this.$store.state.Kchart.config.SAR},
		INCREMENTAL() {return this.SARConfig.INCREMENTAL}, 	// 增量
		MAX_VAL() {return this.SARConfig.MAX_VAL}, 			// 最大值
	},
}
</script>

<style scoped>
</style>