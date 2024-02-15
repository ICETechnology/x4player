<template>
	<div class="scitchart-plugin hidden" :key="updateKey">
		<!-- 現價線 -->
		<SciChartPluginPriceLine class="hidden" :sciObj="firstSciChart" :sid="sid" :mode="mode" :qo="qo" :eventCall="priceLineCall" />
		<!-- 持倉線 -->
		<SciChartPluginPosition class="hidden" :sciObj="firstSciChart" :sid="sid" v-if="showPosLine && isSsps" :mode="mode" />
		<!-- 回報線 -->
		<SciChartPluginReportLine class="hidden" :sciObj="firstSciChart" :sid="sid" v-if="showWorkingLine && reportList.length" :mode="mode" />
		<!-- 其他操作(劃線) -->
		<SciChartPluginOptions class="hidden" :sciObj="firstSciChart" :sid="sid" />
		<!-- 委託線 -->
		<SciChartPluginOrderLine ref="SciChartPluginOrderLine" class="hidden" :sciObj="firstSciChart" :sid="sid" :qo="qo" v-if="showOrderLine"/>
	</div>
</template>
<script>
import QuoteAgent from '@/components/QuoteAgent';
import SciChartPluginPriceLine from '@/components/SciKChart/SciChart.Plugin.PriceLine';
import SciChartPluginPosition from '@/components/SciKChart/SciChart.Plugin.Position';
import SciChartPluginReportLine from '@/components/SciKChart/SciChart.Plugin.ReportLine';
import SciChartPluginOptions from '@/components/SciKChart/SciChart.Plugin.Options';
import SciChartPluginOrderLine from '@/components/SciKChart/SciChart.Plugin.OrderLine';
export default {
	mixins: [QuoteAgent],
	data() {
		return {
			updateKey: "".random(),
			priceLine: null,
			showOrderLine: false,
			priceLineCall: {
				touchstart: this.onPress,
				touchmove: this.onTouchMove,
				touchend: this.onTouchEnd,
			}
		}
	},
	props: ['sciObj', 'sciCB', 'sid', 'mode'],
	components: {
		SciChartPluginPriceLine,
		SciChartPluginPosition,
		SciChartPluginReportLine,
		SciChartPluginOptions,
		SciChartPluginOrderLine
	},
	beforeDestroy() {},
	mounted() {},
	methods: {
		onPress(e, yValue) {
			if(this.$store.state.sciChartPlugin.curClick) return;
			this.showOrderLine = true;
			// 延遲等待委託線組件實體化
			let self = this;
			setTimeout(() => {
				// 建立委託線annotation
				self.$refs.SciChartPluginOrderLine.creatAnnotation(e, yValue);
			}, 10);
		},
		onTouchMove(y) {
			if(this.$store.state.sciChartPlugin.curClick) return;
			let yValue = y || this.getYValueByEvent(event);
			if(this.$refs.SciChartPluginOrderLine)
				this.$refs.SciChartPluginOrderLine.onTouchMove(yValue);
			else {
				this.showOrderLine = true;
				// 延遲等待委託線組件實體化
				let self = this;
				setTimeout(() => {
					// 建立委託線annotation
					self.$refs.SciChartPluginOrderLine.creatAnnotation(event, yValue, !y);
				}, 10);
			}
		},
		onTouchEnd() {
			if(this.$refs.SciChartPluginOrderLine)
				this.$refs.SciChartPluginOrderLine.onTouchEnd();
			this.showOrderLine = false;
		},
		getYValueByEvent(e) {
			let rect = e.currentTarget.getBoundingClientRect();
			let range = this.firstSciChart.sciChartSurface.yAxes.items[0].visibleRange;
			let posY = e.offsetY || e.targetTouches[0].pageY;
			let Y = (posY / e.currentTarget.clientHeight);
			let price = range.max - Y * (range.max - range.min);
			return price;
		},
	},
	watch: {
		sciObj(nv) {
			this.updateKey = "".random();
		},
	},
	computed: {
		// 當前商品的月份代碼
		monthSid() {return M4C.Symbol.toMonthSymbol(this.sid);},
		// 是否有當前商品的持倉資料
		isSsps() {return Math.abs(this.$store.state.selectedSymbol.positionSum.$NET_QTY);},
		// 是否顯示持倉標籤
		showPosLine() {return this.$store.state.Kchart.showPosLine;},
		// 是否顯示委託標籤
		showWorkingLine() {return this.$store.state.Kchart.showWorkingLine;},
		// 第一個sciChart(預期為主指標的區塊)
		firstSciChart() {return this.sciObj[0];},
		// 當前商品的有效委託清單
		reportList() {
			let list = []
			this.$store.state.data.availableReportList.forEach(rpt => {
				// 複式權委託
				let isComposite = rpt.SYMBOL2;
				if(rpt.SYMBOL == this.monthSid && !isComposite) {
					list.push(rpt);
				}
			});
			return list;
		},
	},
}
</script>