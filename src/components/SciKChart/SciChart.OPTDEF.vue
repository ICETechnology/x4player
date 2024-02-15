<template>
	<div class="scitchart-optdef hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import { FastBandRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/FastBandRenderableSeries";
import { XyyDataSeries } from "scichart/Charting/Model/XyyDataSeries";
export default {
	mixins: [SciChartFn],
	props: ['sid', 'qo'],
	data() {
		return {
			comName: "SciChart.OPTDEF",
			bandSeries_Data: null,
			xValues: [],
			timeKeyList: [],
			sciChartSurface: null,
			bandSeries: null,
			optDefenceData: {},
			queryOptDefResult: {},
			FILL_WORD: NaN,
			drawConfig: {
				stress: '#FF0000',
                strut: '#00FF50',
			},
		}
	},
	beforeMount() {
		// 期權防守線目前只有日k資料(期權商品不支持)。
		if(this.NK === 'd' && !this.isOpt) 
			this.queryOptDefResult = M4C.ChartData.queryOptionDefence(this.sid);
	},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.bandSeries);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext, }) {
			this.sciChartSurface = sciChartSurface;
			// BBAND設定資料
			let config = this.BBANDConfig;
			// 寬帶線圖設定
			this.bandSeries = new FastBandRenderableSeries(wasmContext, {
				dataSeries: this.bandSeries_Data,
				strokeThickness: 2,
				stroke: this.drawConfig.stress,
				strokeY1: this.drawConfig.strut,
			});
			// 設定y軸小數長度
			this.sciChartSurface.yAxes.items[0].labelProviderProperty.precision = 2;
			this.sciChartSurface.renderableSeries.add(this.bandSeries);
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			if(timeKeyList){
				this.timeKeyList = timeKeyList;
				this.xValues = [];
				let stressValues = [], strutValues = [];
				this.timeKeyList.forEach((timeKey, index)=>{
					let tick = this.OptionDefenceData[timeKey] || {};
					this.xValues.push(this.timeKeyToUnixTimestamp(timeKey));
					stressValues.push(Number(tick.call) || this.FILL_WORD);		// 壓力
					strutValues.push(Number(tick.put) || this.FILL_WORD);		// 支撐
				});
				// 只有一筆記錄且資料皆不是數字不處理
				if(this.xValues.length == 1 && isNaN(stressValues[0]) == isNaN(strutValues[0])) return;
				this.bandSeries_Data = new XyyDataSeries(wasmContext, {dataSeriesName: "OPTDEF", xValues: this.xValues, yValues: stressValues, y1Values: strutValues});
			}
			// 當線圖資料比期權防守線資料快時，防守線資料到後，會執行這段更新。
			else {
				this.timeKeyList.forEach((timeKey, index)=>{
					let tick = this.OptionDefenceData[timeKey] || {};
					// 在更新時遇到XyyDataSeries在更新"3"資料時，轉float會異常。所以這裡先轉float。
					this.bandSeries_Data.update(index, parseFloat(tick.call) || this.FILL_WORD, parseFloat(tick.put) || this.FILL_WORD)
				});
			}
		},
		// 暫時不會用到。但SciChart會轉call這個method，所以保留
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			const xValues = [], stressValues = [], strutValues = [];
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = this.OptionDefenceData[timeKey] || {};
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
				stressValues.push(tick.call || this.FILL_WORD);		// 壓力
				strutValues.push(tick.put || this.FILL_WORD);		// 支撐
			});
			this.bandSeries_Data.insertRange(0, xValues, stressValues, strutValues);
		},
		// 期權防守線只有日K資料且不是主推方式，因此暫時不會用到。但SciChart會轉call這個method，所以保留
		onUpdateTick({index, tick, dataSeries, timeKey}) {
		},
		// 期權防守線只有日K資料且不是主推方式，因此暫時不會用到。但SciChart會轉call這個method，所以保留
		onAppendTick({index, tick, dataSeries, timeKey}) {
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			if(!this.bandSeries_Data) return;
			let config = this.drawConfig;
			let stress = this.bandSeries_Data.getNativeYValues().get(idx);
				stress = stress? this.showTickPrice(stress): '--';
			let strut = this.bandSeries_Data.getNativeY1Values().get(idx);
				strut = strut? this.showTickPrice(strut): '--';
			// 更新 TickInfo 內容
			this.idcObj.tickInfoHtml = `<div class="flex-row flex-bottom-left">
											<span class="clr-white">${this.$ln('压')}</span>
											<span class="mgl1" style="color:${config.stress}">${stress}</span>
											<span class="clr-white">${this.$ln('支')}</span>
											<span class="mgl1" style="color:${config.strut}">${strut}</span>
										</div>`;
		},
	},
	watch: {
		// 期權防守線資料回的比線圖資料慢時，再call一次onInitData。
		optDefenceDataLength(nv, ov) {
			if(this.timeKeyList.length && !ov){
				this.onInitData({});
			}
		},
		"queryOptDefResult.$STATUS"(nv, ov){
			if(nv === "DONE" && nv !== ov){
				// 覆蓋資料
				for(let key in this.queryOptDefResult.OptionDefenceData){
					this.$set(this.optDefenceData, key, this.queryOptDefResult.OptionDefenceData[key]);
				}
				// 已無更多資料
				if(this.queryOptDefResult.$CD == -24)
					this.noData = true;
			}
		},
		// NK切换到日k才查期權防守線資料
		NK(nv, ov) {
			if(nv == 'd')
				this.queryOptDefResult = M4C.ChartData.queryOptionDefence(this.sid);
		},
	},
	computed: {
		NK() {return this.$store.state.Kchart.NK;},
		OptionDefenceData() {
			try {return this.queryOptDefResult.OptionDefenceData || [];}
			catch(e){return [];}
		},
		optDefenceDataLength() {return Object.keys(this.OptionDefenceData).length;},
		isOpt() {return M4C.Option.isOpt(this.sid)},
	},
}
</script>

<style scoped>
</style>