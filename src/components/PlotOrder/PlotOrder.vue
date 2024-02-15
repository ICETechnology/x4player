<!-- 策略下單盒 -->
<template>
    <div class="plot-order-ctn flex-col">
		<!-- 表頭列 -->
		<PlotOrderHead :param="param" />
		<!-- 合成期貨/標的物 -->
		<OptionUnderlying class="mgt2 mgl5 mgr4 tcef" :selectedMonth="param.selectedMonth" @onSubjectMatterPrice="(p)=>subjectMatterPrice=p" :suspend="suspend"/>
		<!-- 策略选择器/获利资讯/PL损益图 -->
		<div class="flex-row pl-ctn pdlr3 mgt2">
			<div class="w55p mgt1 mglr1 posr">
				<!-- ProfitLoss 線圖 -->
				<PlotOrderProfitLossChart class="FULL" :selectedStrategy="selectedStrategy" :contracts="param.contracts" />
			</div>
			<div class="w45p flex-col mgt2">
				<div class="pdlr1">
					<!-- 策略選擇按鈕 -->
					<PlotOrderStrategyBtn @click="expandSelector=!expandSelector" :selectedStrategy="selectedStrategy" />
				</div>
				<div class="flex-1 posr mgb1">
					<!-- 最大獲利 / 最大損失 / 損益兩平 -->
					<PlotOrderProfitLossContent :selectedStrategy="selectedStrategy" class="FULL font-size-mini" :gv="gv" />
				</div>
			</div>
		</div>
		<SwipeUpContainer class="flex-1 posr overflow-hidden" v-model="expandSelector" :class="{'font-size-mini': isDesktop}" :disable="$store.state.device.isPad">
			<!-- 下單條件區 -->
			<PlotOrderCondition class="FULL pdlr4" :selectedStrategy="selectedStrategy" :contracts="param.contracts" :closedPrice="closedPrice" :gv="gv"/>
			<!-- 策略選擇器 (隱藏/浮起) -->
			<PlotOrderStrategySelector class="swipe-up-target" @change="obj=>selectedStrategy=obj"
				@close="expandSelector=false" :defaultStrategyName="param.strategyName "/>
		</SwipeUpContainer>
    </div>
</template>

<script>
import PlotOrderHead from "@/components/PlotOrder/PlotOrderHead.vue";
import OptionUnderlying from "@/components/OptionT/OptionUnderlying.vue";
import PlotOrderStrategySelector from "@/components/PlotOrder/PlotOrderStrategySelector.vue";
import PlotOrderStrategyBtn from "@/components/PlotOrder/PlotOrderStrategyBtn.vue";
import PlotOrderProfitLossContent from "@/components/PlotOrder/PlotOrderProfitLossContent.vue";
import PlotOrderProfitLossChart from "@/components/PlotOrder/PlotOrderProfitLossChart.vue";
import PlotOrderCondition from "@/components/PlotOrder/PlotOrderCondition.vue";

export default {
	props: ['param', 'suspend'],
	data() {
		return {
			/** 當前選擇策略 */
			selectedStrategy: {},
			/** 展開策略選擇器 */
			expandSelector: false,
			/** 標的物最新價 */
			subjectMatterPrice: 0,
			/** 此元件與子元件流通之元件內全域變數 */
			gv: {},
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {
		PlotOrderHead,
		OptionUnderlying,
		PlotOrderStrategySelector,
		PlotOrderStrategyBtn,
		PlotOrderProfitLossContent,
		PlotOrderProfitLossChart,
		PlotOrderCondition,
	},
    methods: {},
	watch: {},
    computed: {
		/** 價平價格 */
		closedPrice() {
			return this.param.closedPrice || this.subjectMatterPrice;
		},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
	},
}
</script>

<style scoped>
.pl-ctn {
	min-height: 40vw;
}
.w55p {
	width: 55%;
}
.w45p {
	width: 45%;
}

@media screen and (max-height: 620px) {
	.plot-order-ctn > div {
		padding-top: 0;
		padding-bottom: 0;
		margin-top: 0;
		margin-bottom: 0;
	}
	.plot-order-ctn /deep/ .plot-order-condition-ctn.mgt3 {
		margin-top: 1vw;
	}
	.plot-order-ctn /deep/ .plot-order-condition-ctn .mgt3 {
		margin-top: 1vw;
	}
	.plot-order-ctn /deep/ .plot-order-condition-ctn .line2 {
		margin-top: 1vw;
	}
	.plot-order-ctn /deep/ .plot-order-condition-ctn .mgb10 {
		margin-bottom: 5vw;
	}
	.plot-order-ctn /deep/ .strategy-selector-ctn .strategy-btn {
		margin: 1px 1vw;
		height: 11vw;
	}
}

/** 桌機版 */
.desktop .pl-ctn {
	min-height: 8.2em;
}
</style>