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
				stroke: "#518FF5",
				strokeThickness: 2,
				// 繪圖效果
				// animation: { type: EAnimationType.Wave, options: {zeroLine: -1, pointDurationFraction: 0.5, duration: 500 }},
				effect: new ShadowEffect(wasmContext, { brightness: 1, offset: new Point(5,-10), range: 0.7})
			});
			sciChartSurface.renderableSeries.add(lineSeries);			
		},
		onInitData({chartData, timeKeyList, dataSeries}) {
			timeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				dataSeries.update(index, tick.c || NaN);
			});
			this.idcObj.tickInfoHtml = `收 ${chartData[timeKeyList[timeKeyList.length-1]].c}`;
		},
		onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries}) {
			moreTimeKeyList.forEach((timeKey, index)=>{
				let tick = chartData[timeKey];
				dataSeries.update(index, tick.c || NaN);
			});
		},
		onUpdateTick({index, tick, dataSeries}) {
			dataSeries.update(index, tick.c || NaN);
		},
		onAppendTick({index, tick, dataSeries, timeKey}) {
			dataSeries.update(index, tick.c || NaN);
		},
		// 關注Tick改變
		onFocusTick(obj) {
			const {xValue, tick, hitTestInfo} = obj;
			// 更新 TickInfo 內容
			let time = this.unixTimestampToDate(xValue || hitTestInfo.xCategoryValue).dayTime11();
			this.idcObj.tickInfoHtml = `<span>${time}　</span><span class="clr-orange">${this.$ln('价')} ${tick && tick.c ? this.showPrice(tick.c) : '-'}</span>`;
		},
		showPrice(val) {
			return this.$symbolPriceX({sid: this.sid, val, noDeno: true});
		},
	},
	watch: {},
	computed: {
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
}
</script>

<style scoped>
</style>