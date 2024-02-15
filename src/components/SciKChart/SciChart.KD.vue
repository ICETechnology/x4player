<template>
	<div class="scitchart-kd hidden" />
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
			comName: "SciChart.KD",
			FILL_WORD: NaN,
			KDataSeries: null,
			DDataSeries: null,
			KDataList: [],
			DDataList: [],
			xValues: [],
			tickList: [],
			sciChartSurface: null,
			lineSeries_K: null,
			lineSeries_D: null,
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.lineSeries_K);
		this.sciChartSurface.renderableSeries.remove(this.lineSeries_D);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			let config = this.KDConfig;
			this.lineSeries_K = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.KDataSeries,
				stroke: config.drawConfig.K,
				strokeThickness: 2,
			});
			this.lineSeries_D = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.DDataSeries,
				stroke: config.drawConfig.D,
				strokeThickness: 2,
			});
			// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 2;
			this.sciChartSurface.renderableSeries.add(this.lineSeries_K);
			this.sciChartSurface.renderableSeries.add(this.lineSeries_D);
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			this.xValues = []; this.closeValues = []; this.tickList = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				this.tickList.push(tick || {});
			});
			this.processAllData();
			// 只有一筆記錄且資料不為數字不處理
			if(this.xValues.length == 1) {
				if(this.KDataList.filter(d=>(isNaN(d))).length == this.KDataList.length) {
					this.KDataList = new Array(this.xValues.length).fill(0);
				}
				if(this.DDataList.filter(d=>(isNaN(d))).length == this.DDataList.length) {
					this.DDataList = new Array(this.xValues.length).fill(0);
				}
			}
			this.KDataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `K`, xValues: this.xValues, yValues: this.KDataList});
			this.DDataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `D`, xValues: this.xValues, yValues: this.DDataList});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.splice(index, 0, this.timeKeyToUnixTimestamp(timeKey));
				this.tickList.splice(index, 0, tick || {});
			});
			let moreLen = moreTimeKeyList.length;
			this.processAllData();
			// 插入舊資料範圍
			this.KDataSeries.insertRange(0, this.xValues.slice(0, moreLen), this.KDataList.slice(0, moreLen));
			this.DDataSeries.insertRange(0, this.xValues.slice(0, moreLen), this.DDataList.slice(0, moreLen));
			// 更新剩餘資料
			for(let j = moreLen; j < timeKeyList.length; j++) {
				this.KDataSeries.update(j, this.KDataList[j]);
				this.DDataSeries.update(j, this.DDataList[j]);
			}
		},
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			// 更新tick
			this.tickList.splice(index, 1, tick || {});
			// 計算KD資料
			const data = this.analysisTick(index);
			// 更新線圖資料。
			this.KDataSeries.update(index, data.K || NaN );
			this.DDataSeries.update(index, data.D || NaN );
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			// 新增tick
			this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
			this.tickList.push(tick || {});
			// 計算KD資料
			const data = this.analysisTick(index);
			// 新增線圖資料。
			this.KDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), data.K || NaN );
			this.DDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), data.D || NaN );
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let config = this.KDConfig;
			// 因M4C.Symbol.getDecimalLength取長度會因tw的乘數、分數取到非預期長度，所以改以ticksize取長度
			let tickSizeLen = M4C.Symbol.getTickSize(this.sid, this.closeValues[idx]).toString().getDecimalLength();
			let k = this.KDataSeries.getNativeYValues().get(idx);
				k = k == Number.POSITIVE_INFINITY || k == Number.NEGATIVE_INFINITY? '--': parseFloat(k).toFixed(tickSizeLen);
			let d = this.DDataSeries.getNativeYValues().get(idx);
				d = d == Number.POSITIVE_INFINITY || d == Number.NEGATIVE_INFINITY? '--': parseFloat(d).toFixed(tickSizeLen);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">
											<span class="clr-white">K</span>
											<span class="mglr1" style="color:${config.drawConfig.K}">${k}</span>
											<span class="clr-white">D</span>
											<span class="mgl1" style="color:${config.drawConfig.D}">${d}</span>
										</div>`;
		},
		// 計算全部資料
		processAllData(){
			let n = this.$safeFloat(parseInt(this.KDConfig.range, 10) || 9);
			let alphaK = this.$safeFloat((1 / (parseInt(this.KDConfig.K, 10)) || 0));
			let alphaD = this.$safeFloat((1 / (parseInt(this.KDConfig.D, 10)) || 0));

			this.KDataList = [];
			this.DDataList = [];
			for (let i = 0; i < this.tickList.length; i++) {
				let closePrice = this.tickList[i].c;
				if (i >= n) {
					let high = 0;
					let low = 90000000000;
					let RSV = 0;
					let K = 0;
					let D = 0;
					// 期間內最高、最低價
					for (let j = i-n; j < i; j++) {
						let data = this.tickList[j];
						if (data.h > high)
							high = data.h;
						if (data.l < low)
							low = data.l;
					}

					if ((closePrice - low == 0) && (high - low == 0)) {
						RSV = 50;
					} else {
						RSV = this.$safeFloat((closePrice - low) / (high - low) * 100);
					}

					if (!this.KDataList[i - 1]) {
						K = 50;
					} else {
						// K = RSV*alphaK + K1*2/3
						K = this.$safeFloat((RSV * alphaK) + ((1 - alphaK) * this.KDataList[i - 1]));
					}

					if (!this.DDataList[i - 1]) {
						D = 50;
					} else {
						// D = K*alphaD + D1*2/3
						D = this.$safeFloat((K * alphaD) + ((1 - alphaD) * this.DDataList[i - 1]));
					}
					this.KDataList.push(K);
					this.DDataList.push(D);
				}
				else {
					this.KDataList.push(NaN);
					this.DDataList.push(NaN);
				}
			}
		},
		// 分析資料。
		analysisTick(idx) {
			let range = this.$safeFloat(parseInt(this.KDConfig.range, 10));
			let alphaK = this.$safeFloat(1 / (parseInt(this.KDConfig.K, 10)));
			let alphaD = this.$safeFloat(1 / (parseInt(this.KDConfig.D, 10)));
			let currentData = this.tickList[idx];
			let preDayKchartDataK = this.KDataList[idx - 1];
			let preDayKchartDataD = this.DDataList[idx - 1];
			// 前一日KD資料
			let preK = preDayKchartDataK || 50;
			let preD = preDayKchartDataD || 50;
			let high = Number.NEGATIVE_INFINITY;
			let low = Number.POSITIVE_INFINITY;
			let RSV = 50;
			// 期間內最高、最低價
			for (let j = idx - range; j < idx; j++) {
				if(j < 0) continue;
				let data = this.tickList[j];
				if (data.h > high)
					high = data.h;
				if (data.l < low)
					low = data.l;
			}
			// 該tick的RSV值(預設50)
			if ((currentData.c - low != 0) && (high - low != 0)) {
				RSV = (currentData.c - low) / (high - low) * 100;
			}
			// 當前 K = 1/3 RSV + 前日 2/3 K
			let K = this.$safeFloat((RSV * alphaK) + ((1 - alphaK) * preK));
			// 當前 D = 1/3 當前 K + 前日 2/3 D
			let D = this.$safeFloat((K * alphaD) + ((1 - alphaD) * preD));
			return {"K": K, "D": D};
		},
	},
	watch: {},
	computed: {
		KDConfig() {return this.$store.state.Kchart.config.KD},
	},
}
</script>

<style scoped>
</style>