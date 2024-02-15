<template>
    <div class="scitchart-avg hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import {ShadowEffect} from "scichart/Charting/Visuals/RenderableSeries/ShadowEffect";
import {Point} from "scichart/Core/Point";
export default {
	mixins: [SciChartFn],
	props: ['sid', 'qo'],
	data() {
		return {
			firstKey: '',
			lastKey: '',
			firstTradeTimekey: '',
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		createLine({sciChartSurface, wasmContext, dataSeries}) {
			let lineSeries = new FastLineRenderableSeries(wasmContext, {
				dataSeries: dataSeries,
				stroke: "#FFFF00",
				strokeThickness: 2,
				effect: new ShadowEffect(wasmContext, { brightness: 1, offset: new Point(5,-10), range: 0.7})
			});
			sciChartSurface.renderableSeries.add(lineSeries);		
		},
		onInitData({chartData, timeKeyList, dataSeries}) {
			this.chartData = chartData;
			this.timeKeyList = timeKeyList;
			this.dataSeries = dataSeries;
			// 由於分時查詢回來的資料，有時第一個開盤時間不太正確
			this.firstTradeTimekey = this.getFirstTradeTimekey(chartData, timeKeyList);
			for(let index = 0; index < this.timeKeyList.length; index++) {
				this.analysisTick(index);
			}
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			this.chartData = chartData;
			this.timeKeyList = timeKeyList;
			this.dataSeries = dataSeries;
			this.firstTradeTimekey = this.getFirstTradeTimekey(chartData, timeKeyList);
			for(let index = 0; index < this.timeKeyList.length; index++) {
				this.analysisTick(index);
			}
		},
		onUpdateTick({index, tick, dataSeries}) {
			this.analysisTick(index);
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			this.analysisTick(index);
		},
		// 關注Tick改變
		onFocusTick({xValue, tick}) {
			if (!xValue) return;
			// 更新 TickInfo 內容
			let time = this.unixTimestampToDate(xValue).dayTime11();
			this.idcObj.tickInfoHtml = `<span class="clr-gray">${this.$ln('均')} ${tick && tick.$AVG ? this.showPrice(tick.$AVG) : '-'}</span>`;
		},
		analysisTick(i){
			// 比第一個交易時段的第一根tick新才處理
			if(this.timeKeyList[i] < this.firstTradeTimekey) return;
			// 因M4C.Symbol.getDecimalLength取長度會因tw的乘數、分數取到非預期長度，所以改以ticksize取長度
			let dcmLen = M4C.Symbol.getTickSize(this.sid, this.qo.p).toString().getDecimalLength();
			let prevTick = this.chartData[this.timeKeyList[i-1]];
			let thisTick = this.chartData[this.timeKeyList[i]];
			/* 均价线的计算公式：sum(每个价格*成交量）/sum（成交量）= 成交总额 /（成交总量） */
			if(!prevTick) {
				// 由於server的chartData的資料，成交總量有時會異常大且與單量加總明顯不合，因此另外以單量加總資料並以該加總資料做後續計算。
				thisTick.$SUMQ = thisTick.q;
				thisTick.$AVG = Number(parseFloat(this.$safeFloat(thisTick.c * thisTick.q / thisTick.$SUMQ)).toFixed(dcmLen));				
				if(thisTick.q == 0)
					thisTick.$AVG = thisTick.c;
			}
			else {
				// 前一根的成交單量
				let preSumQ = prevTick.$SUMQ || 0;
				// 前一根的成交總額
				let prevSum = this.$safeFloat((prevTick.$AVG || prevTick.c) * (prevTick.$SUMQ));				
				// 利用總量變小來判別跨交易日清空成交總額及成交總量 (此邏輯未來應再優化)
				if (thisTick.v < prevTick.v) {
					prevSum = 0;
					preSumQ = 0;
				}
				thisTick.$SUMQ = preSumQ + thisTick.q;
				// 以ticksize長度為小數位數
				thisTick.$AVG = Number(parseFloat(this.$safeFloat((thisTick.c * thisTick.q + prevSum) / thisTick.$SUMQ)).toFixed(dcmLen));
				// 跨交易日(前日交易總量大於隔日交易總量)或遇到單量、總量皆是0時(可能是異常)，以前一根計算的均價或當前的收當均價。
				if(thisTick.q == 0 && (thisTick.$SUMQ == 0 || thisTick.v < prevTick.v)) {
					thisTick.$AVG = thisTick.c;
				}
				// 測試用(觀察總量)
				// if(i > this.timeKeyList.length - 5 && thisTick.$AVG > 4850)
				// 	console.log('analysisTick',prevTick.$AVG, prevTick.c, prevTick.v, thisTick.c, thisTick.q, prevSum, thisTick.v);
			}
			// 將資料更新入均價線DataSeries
			this.dataSeries.update(i, thisTick.$AVG || NaN);
		},
		// 取最早一個完整交易日的第一根tick(1分k)
		getFirstTradeTimekey(chartData, timeKeyList) {
			// console.time('getFirstTradeTimekey');
			let result = timeKeyList.find(timeKey=> {
				let tick = chartData[timeKey];
				// 以第一根tick的單量預期應等於總量來判斷
				return tick.q == tick.v;
			});
			// console.timeEnd('getFirstTradeTimekey');
			return result;
		},
		showPrice(val) {
			let decimalLengthWithMulti = M4C.Symbol.getDecimalLengthWithMulti(this.sid, val);
			return this.$symbolPriceX({sid: this.sid, val: this.$safeFloat(val).toFixed(decimalLengthWithMulti), noDeno: true});
		},
	},
	watch: {
		timeKeyList(nv) {
			// this.prepareAvgData();
			this.firstKey = nv[0];
			this.lastKey = nv[nv.length-1];
		},
	},
    computed: {
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
}
</script>

<style scoped>
</style>