<template>
	<div class="scichart-opt-iv hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
import { EllipsePointMarker } from "scichart/Charting/Visuals/PointMarkers/EllipsePointMarker";
export default {
	mixins: [SciChartFn],
	props: ['idcObj', 'sciObj', 'param'],
	data() {
		return {
			comName: "SciChart.Opt.IV",
			FILL_WORD: NaN,
			DataSeries: null,
			DataList: [],
			tickList: [],
			sciChartSurface: null,
			lineSeries: null,
			queryResult: {},
			focusStrike: "",
		}
	},
	beforeMount() {
		
	},
	mounted() {},
	beforeDestroy() {
		M4C.ChartData.unsubSmileCurve(this.sid);
		delete M4C.ChartData.smileCurveData[this.sid];

		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.lineSeries);
	},
	components: {},
	methods: {
		// 建立線圖
		createLine() {
			this.sciChartSurface = this.sciObj.sciChartSurface;
			this.lineSeries = new FastLineRenderableSeries(this.sciObj.wasmContext, {
				dataSeries: this.DataSeries,
				strokeThickness: 2,
				stroke: this.idcObj.color || "#518FF5",
				pointMarker: new EllipsePointMarker(this.sciObj.wasmContext, {
					width: 9,
					height: 9,
					fill: this.idcObj.color || "#518FF5",
				}),
			});
			this.sciChartSurface.renderableSeries.add(this.lineSeries);
		},
		// 初始化線圖資料
		onInitData() {
			let xValues = [];
			this.tickList = [];
			this.paramStrikeList.forEach((strike, index)=>{
				let tick = this.chartData[strike] || {};
				xValues.push(Number(strike));
				this.tickList.push(tick.iv || NaN);
			});
			this.DataSeries = new XyDataSeries(this.sciObj.wasmContext, { dataSeriesName: `${this.sid}IV`, xValues: xValues, yValues: this.tickList});
		},
		// 重建線圖
		resetData(){
			// 清除舊資料及線圖
			if(this.dataSeries)
				this.dataSeries.delete();
			if(this.lineSeries)
				this.sciChartSurface.renderableSeries.remove(this.lineSeries);
			// 重建資料及線圖
			this.onInitData();
			this.createLine();
		},

		// 關注Tick改變
		onFocusTick(obj) {
			if(!obj) {
				this.idcObj.tickInfoHtml = "";
				this.focusStrike = "";
				return;
			}
			if(!obj.hitTestInfo && !this.focusStrike) return;
			// 當前關注的履約價
			let strike = this.focusStrike = obj.hitTestInfo? obj.hitTestInfo.xValue: this.focusStrike;
			let iv = this.chartData[strike]? this.chartData[strike].iv: '';
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left tickinfo">
											<span class="clr-white">${this.month}</span><span class="flex-1 mglr1" style="color: ${this.idcObj.color || "#518FF5"}">${iv || '--'}</span>
										</div>`;
		},
	},
	watch: {
		// 資料時間更新時，重畫線圖
		updateTime(nv) {
			if(this.DataSeries && this.paramStrikeList && this.paramStrikeList.length) {
				this.resetData();
				this.onFocusTick({});
			}
		},
		// 線圖物件建立好時查詢線圖資料
		chartReady (nv) {
			if(nv)
				this.queryResult = M4C.ChartData.querySmileCurve(this.sid);
		},
		// 外層履約價清單改變時，初始或重建線圖及資料
		paramStrikeList: {
			handler(nv, ov){
				if(nv.length && !this.DataSeries){
					this.onInitData();
					this.createLine();
				}
				else
					this.resetData();
			}, deep:true,
		}
	},
	computed: {
		sid() {return this.idcObj.symbol;},
		// 線圖資料
		smileCurveData() {return M4C.ChartData.smileCurveData},
		chartData() {
			try { 
				return this.smileCurveData[this.sid].data;
			} catch(e) {
				return [];
			}
		},
		// 月份
		month() {return this.sid.split('.')[4];},
		// 資料更新時間
		updateTime() {
			try {return this.smileCurveData[this.sid].updateTime;} catch(e){}
		},
		// 外層整合的履約價清單(x軸)
		paramStrikeList() {
			return this.param.partitionList[0].strikeList;
		},
		// 線圖物件建立完成
		chartReady() {return !!(this.sciObj && this.sciObj.sciChartSurface && this.sciObj.wasmContext);},
	},
}
</script>

<style scoped>
</style>