<template>
	<div class="scitchart-kbar hidden" />
</template>

<script>
import SciChartFn from '@/components/SciChart/SciChart.Fn';
import {FastCandlestickRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastCandlestickRenderableSeries";
import { OhlcPaletteProvider } from '@/components/SciChart/SciChartPaletteProvider';
import {OhlcDataSeries} from "scichart/Charting/Model/OhlcDataSeries";
import { NumberRange } from "scichart/Core/NumberRange";
import {EAutoRange} from "scichart/types/AutoRange";
export default {
	mixins: [SciChartFn],
	props: ['sid', 'qo', 'mode'],
	data() {
		return {
			comName: "SciChart.Kbar",
			sciChartSurface: null,
			tickSeries: null,
			ohlcDataSeries: null,
			focusIndex: null,
			openValues: [],
			highValues: [],
			lowValues: [],
			closeValues: [],
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {
		if (!this.sciChartSurface) return;
		this.sciChartSurface.renderableSeries.remove(this.tickSeries);
	},
	components: {},
	methods: {
		createLine({sciChartSurface, wasmContext}) {
			this.sciChartSurface = sciChartSurface;
			this.tickSeries = new FastCandlestickRenderableSeries(wasmContext, {
				dataSeries: this.ohlcDataSeries,
				// 因scichart對於白色色碼#FFFFFF轉換不符預期。因此開收相同時白色以#EEEEEE設定
				paletteProvider: new OhlcPaletteProvider(this.ohlcDataSeries, "#D75442", "#6BA583", "#D75442", "#6BA583", '#eeeeee', '#eeeeee'),
				// animation: new WaveAnimation({ fadeEffect: true, duration: 800 })
			});
			// 圖形下單設定現價置中
			this.sciChartSurface.renderableSeries.add(this.tickSeries);
			if(this.mode && this.mode == 'order') {
				this.setPriceAtMiddle();
			}
		},
		onInitData({chartData, timeKeyList, dataSeries, wasmContext}) {
			let xValues = [];
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey]||{};
				this.openValues.push(tick.o || NaN);
				this.highValues.push(tick.h || NaN);
				this.lowValues.push(tick.l || NaN);
				this.closeValues.push(tick.c || NaN);
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
			});
			let data = {xValues, openValues: this.openValues, highValues: this.highValues, lowValues: this.lowValues, closeValues: this.closeValues};
			this.ohlcDataSeries = new OhlcDataSeries(wasmContext, data);
			// 發出KBar初始化資料完成通知
			this.$emit('passEmit', 'KBARINITDATA');
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				this.ohlcDataSeries.insert(index, this.timeKeyToUnixTimestamp(timeKey), tick.o || NaN, tick.h || NaN, tick.l || NaN, tick.c || NaN );
			});
		},
		onUpdateTick({index, tick, dataSeries, timeKey}) {
			this.ohlcDataSeries.update(index, tick.o || NaN, tick.h || NaN, tick.l || NaN, tick.c || NaN );
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			this.ohlcDataSeries.append(this.timeKeyToUnixTimestamp(timeKey), tick.o || NaN, tick.h || NaN, tick.l || NaN, tick.c || NaN );
		},
		// 關注Tick改變
		onFocusTick({xValue, tick, idx}) {
			let open = tick? tick.o: this.ohlcDataSeries.getNativeOpenValues().get(idx);
			let high = tick? tick.h: this.ohlcDataSeries.getNativeHighValues().get(idx);
			let low = tick? tick.l: this.ohlcDataSeries.getNativeLowValues().get(idx);
			let close = tick? tick.c: this.ohlcDataSeries.getNativeCloseValues().get(idx);
			// 前一根的收
			let preClose = this.ohlcDataSeries.getNativeCloseValues().get(idx - 1);
			// 與前一根的差
			let $CloseUD = close && preClose? this.$safeFloat(Number(close) - Number(preClose)): '--';
			let trend = $CloseUD > 0 ? 'trending_up': $CloseUD < 0? 'trending_down':'';
			// 更新 TickInfo 內容
			let time = this.unixTimestampToDate(xValue).dayTime11();
			this.idcObj.tickInfoHtml = `<div class="flex-col">
											<div class="flex-row flex-bottom-left flex-wrap ${this.getYvalueColor(idx)}">
												<span class="clr-white">${this.$ln('开')}</span><span class="mglr1">${this.showTickPrice(open) || '--'}</span>
												<span class="clr-white">${this.$ln('高')}</span><span class="mglr1">${this.showTickPrice(high) || '--'}</span>
												<span class="clr-white">${this.$ln('低')}</span><span class="mglr1">${this.showTickPrice(low) || '--'}</span>
												<span class="clr-white">${this.$ln('收')}</span><span class="mglr1">${this.showTickPrice(close) || '--'}</span>
												<span class="trend-span ${this.$clr0($CloseUD)}">
													<i class="material-icons font-size-mini pdr1 trend">${trend}</i>${$CloseUD}
												</span>
											</div>
										</div>`;
		},
		getYvalueColor(idx){
			return this.getOhlcTickUpDN(this.ohlcDataSeries, idx);
		},
		// 依ticksize轉換價格
		convertPrice(price) {
			let ts = M4C.Symbol.getTickSize(this.monthSid, price);
			return this.$safeFloat(Math.ceil(price/ts) * ts);
		},
		// 設定現價置中
		setPriceAtMiddle() {
			// 現價
			let price = this.qo.p || this.qo.r || this.qo.pc;
			let ts = M4C.Symbol.getTickSize(this.monthSid, price);
			// 最近100根最高、最低價
			let max = Math.max.apply(null, this.highValues.slice(-60));
			let min = Math.min.apply(null, this.lowValues.slice(-60));
			// 上下價差
			let topDiff = max - price;
			let bottomDiff = price - min;
			let diff = 0;
			// 取最高價差
			if(topDiff > bottomDiff)
				diff = topDiff;
			else
				diff = bottomDiff;
			diff = this.convertPrice(diff);
			// 重算最高、最低價
			max = this.$safeFloat(price + diff);
			min = this.$safeFloat(price - diff);
			// 最低價小於0時設定0為最低價
			min = min < 0? ts: min;
			// sciChart yAxes重設max、min
			this.sciChartSurface.yAxes.items[0].visibleRange = new NumberRange(min, max);
			// sciChart yAxes重設只第一次自動判斷max、min
			this.sciChartSurface.yAxes.items[0].autoRange = EAutoRange.Once;
			this.sciChartSurface.yAxes.items[0].visibleRangeLimit = new NumberRange(ts, Number.POSITIVE_INFINITY);
		},
	},
	watch: {},
	computed: {
		// 商品月份代碼
		monthSid() {return M4C.Symbol.toMonthSymbol(this.sid);},
		// 與0比取字色
		$clr0() {return this.$store.state.fn.$clr0;},
	},
}
</script>

<style scoped>
</style>