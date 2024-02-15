<template>
	<div class="scitchart-dmi hidden" />
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
			comName: "SciChart.DMI",
			ADXDataSeries: null,
			negaDiDataSeries: null,
			posDiDataSeries: null,
			ADXDataList: [],
			negaDiDataList: [],
			posDiDataList: [],
			ATRDataList: [],
			TRDataList: [],
			negaDMDataList: [],
			posDMDataList: [],
			xValues: [],
			tickList: [],
			sciChartSurface: null,
			posDilineSeries: null,
			negaDilineSeries: null,
			ADXlineSeries: null,
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.posDilineSeries);
		this.sciChartSurface.renderableSeries.remove(this.negaDilineSeries);
		this.sciChartSurface.renderableSeries.remove(this.ADXlineSeries);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			let config = this.DMIConfig;
			this.ADXlineSeries = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.ADXDataSeries,
				stroke: config.adxColor,
				strokeThickness: 2,
			});
			this.negaDilineSeries = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.negaDiDataSeries,
				stroke: config.negaDiColor,
				strokeThickness: 2,
			});
			this.posDilineSeries = new FastLineRenderableSeries(wasmContext, {
				dataSeries: this.posDiDataSeries,
				stroke: config.posDiColor,
				strokeThickness: 2,
			});
			// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 4;
			sciChartSurface.renderableSeries.add(this.posDilineSeries);
			sciChartSurface.renderableSeries.add(this.negaDilineSeries);
			sciChartSurface.renderableSeries.add(this.ADXlineSeries);
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			this.xValues = []; this.tickList = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				this.tickList.push(tick || {});
			});
			// 計算當前所有資料
			this.processAllData();
			// 只有一筆記錄且資料不為數字不處理
			if(this.xValues.length == 1) {
				if(this.ADXDataList.filter(d=>(isNaN(d))).length == this.ADXDataList.length) {
					this.ADXDataList = new Array(this.xValues.length).fill(0);
				}
				if(this.negaDiDataList.filter(d=>(isNaN(d))).length == this.negaDiDataList.length) {
					this.negaDiDataList = new Array(this.xValues.length).fill(0);
				}
				if(this.posDiDataList.filter(d=>(isNaN(d))).length == this.posDiDataList.length) {
					this.posDiDataList = new Array(this.xValues.length).fill(0);
				}
			}
			this.ADXDataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `ADX`, xValues: this.xValues, yValues: this.ADXDataList});
			this.negaDiDataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `-DI`, xValues: this.xValues, yValues: this.negaDiDataList});
			this.posDiDataSeries = new XyDataSeries(wasmContext, { dataSeriesName: `+DI`, xValues: this.xValues, yValues: this.posDiDataList});
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.xValues.splice(index, 0, this.timeKeyToUnixTimestamp(timeKey));
				this.tickList.splice(index, 0, tick || {});
			});
			let moreLen = moreTimeKeyList.length;
			// 計算當前所有資料
			this.processAllData();
			this.ADXDataSeries.insertRange(0, this.xValues.slice(0, moreLen), this.ADXDataList.slice(0, moreLen));
			this.negaDiDataSeries.insertRange(0, this.xValues.slice(0, moreLen), this.negaDiDataList.slice(0, moreLen));
			this.posDiDataSeries.insertRange(0, this.xValues.slice(0, moreLen), this.posDiDataList.slice(0, moreLen));
			for(let j = moreLen; j < timeKeyList.length; j++) {
				this.ADXDataSeries.update(j, this.ADXDataList[j]);
				this.negaDiDataSeries.update(j, this.negaDiDataList[j]);
				this.posDiDataSeries.update(j, this.posDiDataList[j]);
			}
		},
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			// 更新TICK
			this.tickList.splice(index, 1, tick || {});
			// 更新資料。
			this.analysisTick(index);
			// 更新線圖資料。
			this.ADXDataSeries.update(index, this.ADXDataList[index]);
			this.negaDiDataSeries.update(index, this.negaDiDataList[index]);
			this.posDiDataSeries.update(index, this.posDiDataList[index]);
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			// 新增收盤價
			this.tickList.push(tick || {});
			this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
			// 更新資料。
			this.analysisTick(index);
			// 新增線圖資料。
			this.ADXDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), this.ADXDataList[index] || NaN );
			this.negaDiDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), this.negaDiDataList[index] || NaN );
			this.posDiDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), this.posDiDataList[index] || NaN );
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let config = this.DMIConfig;
			let adx = this.ADXDataSeries.getNativeYValues().get(idx);
			let negaDi = this.negaDiDataSeries.getNativeYValues().get(idx);
			let posDi = this.posDiDataSeries.getNativeYValues().get(idx);
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">
											<span class="clr-white">+DI</span><span class="mglr1" style="color: ${config.posDiColor}">${posDi}</span>
											<span class="clr-white">-DI</span><span class="mglr1" style="color: ${config.negaDiColor}">${negaDi}</span>
											<span class="clr-white">ADX</span><span class="mglr1" style="color: ${config.adxColor}">${adx}</span>
										</div>`;
		},
		processAllData() {
			this.TRDataList = [];
			this.negaDMDataList = [];
			this.posDMDataList = [];
			this.ATRDataList = [];
			this.PosADMDataList = [];
			this.NegaADMDataList = [];
			this.ADXDataList = [];
			this.negaDiDataList = [];
			this.posDiDataList = [];
			this.TRDataList.push(0);
			this.negaDMDataList.push(0);
			this.posDMDataList.push(0);
			// 計算所有-DM、+DM、TR
			for (let i = 1; i < this.tickList.length; i++) {
				let tick = this.tickList[i];
				let preTick = this.tickList[i-1];
				let dataDM = this.processCurrentDM(tick, preTick);
				this.negaDMDataList.push(dataDM.$NEGA_DM);
				this.posDMDataList.push(dataDM.$POS_DM);
				let tr = this.calcCurrentTr(tick, preTick);
				this.TRDataList.push(tr);
			}
			// 計算所有AVG
			this.calcTickAvg();
		},
		// 計算移動平均
		calcEMA(thisValue, preValue, range) {
			return (thisValue + preValue * (range - 1)) / (range);
		},
		// 計算ATR資料
		calcTickAvg() {
			// DI週期
			let diRange = this.DMIConfig.diRange;
			// ADX週期
			let adxRange = this.DMIConfig.adxRange;
			for (let j = 0; j < this.tickList.length; j++) {
				let pos_adm = null;
				let nega_adm = null;
				let atr = null;
				let $DX = 0;
				// 有周期以上天數的資料才計算
				if ( j == diRange - 1) {
					let STR = 0;
					// 第一筆先計算SMA
					for (let k = 0 ; k < diRange; k++) {
						pos_adm += this.posDMDataList[j - k] || 0;
						nega_adm += this.negaDMDataList[j - k] || 0;
						STR += this.TRDataList[j - k];
					}
					pos_adm = pos_adm / diRange;
					nega_adm = nega_adm / diRange;
					STR = STR / diRange;
					this.ATRDataList.push(STR);
					this.PosADMDataList.push(pos_adm);
					this.NegaADMDataList.push(nega_adm);
					this.posDiDataList.push(NaN);
					this.negaDiDataList.push(NaN);
				} else if (j > diRange - 1) {
					//第二筆之後用加權算法
					pos_adm = this.calcEMA(this.posDMDataList[j], this.PosADMDataList[j - 1], diRange);
					nega_adm = this.calcEMA(this.negaDMDataList[j], this.NegaADMDataList[j - 1], diRange);
					atr = this.calcEMA(this.TRDataList[j], this.ATRDataList[j - 1], diRange);
					let $POS_DI = this.$safeFloat(pos_adm / atr);
					let $NEGA_DI = this.$safeFloat(nega_adm / atr);
					$DX = this.$safeFloat(($POS_DI - Math.abs($NEGA_DI)) / ($POS_DI + $NEGA_DI));	
					if(j == diRange + adxRange - 1)
						this.ADXDataList.push($DX);
					this.ATRDataList.push(atr);
					this.PosADMDataList.push(pos_adm);
					this.NegaADMDataList.push(nega_adm);
					this.posDiDataList.push($POS_DI);
					this.negaDiDataList.push($NEGA_DI);
				}
				// 小於周期
				else {
					this.ATRDataList.push(NaN);
					this.PosADMDataList.push(NaN);
					this.NegaADMDataList.push(NaN);
					this.posDiDataList.push(NaN);
					this.negaDiDataList.push(NaN);
				}
				if(j > diRange + adxRange - 1){
					this.ADXDataList.push(this.$safeFloat(($DX + (this.ADXDataList[j - 1] * (adxRange - 1))) / adxRange));	
				}
				else if(j < diRange + adxRange - 1)
					this.ADXDataList.push(NaN);
			}
		},
		calcCurrentTr(tick, preTick){
			// TR=MAX(Ht,Lt,前日收) - MIN(Ht,Lt,前日收)
			return Math.max(tick.h, preTick.c) - Math.min(tick.l, preTick.c);
		},
		processCurrentDM(tick, preTick){
			/** 
			 * 1. 把當日最高價減去前一日最高價 = +DM。
			 * 2. 前一日最低價減去當日最低價 = -DM。
			 * 3. 若+DM>-DM成立，且+DM大於0，則「真實+DM」= +DM，若+DM小於等於0，則「真實+DM」= 0。
			 * 4. 同理，若+DM<-DM且-DM大於0，則「真實-DM」= -DM，若-DM小於等於0，則「真實-DM」= 0。
			*/
			// +DM
			let $POS_DM = this.$safeFloat(tick.h - preTick.h);
				$POS_DM = $POS_DM > 0? $POS_DM: 0;
			// -DM
			let $NEGA_DM = this.$safeFloat(preTick.l - tick.l);
				$NEGA_DM = $NEGA_DM > 0? $NEGA_DM: 0;
			// 取趨勢變動值(較大為主，另一個改為0，相同時皆為0)
			if($POS_DM > $NEGA_DM && $POS_DM > 0){
				$NEGA_DM = 0;
			}
			else if($POS_DM < $NEGA_DM && $NEGA_DM > 0){
				$POS_DM = 0;
			}
			else {
				$NEGA_DM = 0;
				$POS_DM = 0;
			}
			return {$NEGA_DM: $NEGA_DM, $POS_DM: $POS_DM};
		},
		// 分析tick區塊資料。
		analysisTick(idx){
			let latestIdx = idx || this.originData.length - 1;
			let latestTick = this.tickList[latestIdx];
			let preTick = this.tickList[latestIdx - 1];
			let diRange = this.DMIConfig.diRange;
			let adxRange = this.DMIConfig.adxRange;
			// 處理DM資料
			let dataDM = this.processCurrentDM(latestTick, preTick);
			// 計算TR
			let tr = this.calcCurrentTr(latestTick, preTick);
			// 計算各變數
			let $POS_ADM = this.calcEMA(dataDM.$POS_DM, this.PosADMDataList[latestIdx - 1], diRange);
			let $NEGA_ADM = this.calcEMA(dataDM.$NEGA_DM, this.negaDMDataList[latestIdx - 1], diRange);
			let $ATR = this.calcEMA(tr, this.ATRDataList[latestIdx - 1], diRange);
			let $POS_DI = this.$safeFloat($POS_ADM / $ATR);
			let $NEGA_DI = this.$safeFloat($NEGA_ADM / $ATR);	
			let $DX = this.$safeFloat(Math.abs($POS_DI - $NEGA_DI) / ($POS_DI + $NEGA_DI));
			let $ADX =  this.$safeFloat(($DX + this.ADXDataList[latestIdx - 1] * (adxRange - 1)) / adxRange);
			// 更新資料
			this.negaDMDataList.splice(idx , 1, dataDM.$NEGA_DM);
			this.posDMDataList.splice(idx , 1, dataDM.$POS_DM);
			this.TRDataList.splice(idx , 1, tr);
			this.NegaADMDataList.splice(idx , 1, $NEGA_ADM);
			this.PosADMDataList.splice(idx , 1, $POS_ADM);
			this.ATRDataList.splice(idx , 1, $ATR);
			this.posDiDataList.splice(idx , 1, $POS_DI);
			this.negaDiDataList.splice(idx , 1, $NEGA_DI);
			this.ADXDataList.splice(idx , 1, $ADX);
		},

	},
	watch: {},
	computed: {
		DMIConfig() {return this.$store.state.Kchart.config.DMI},
	},
}
</script>

<style scoped>
</style>