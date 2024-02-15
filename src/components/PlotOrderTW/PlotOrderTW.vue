<!-- 策略下單盒 -->
<template>
    <div class="plot-order-ctn flex-col">
		<!-- 表頭列 -->
		<PlotOrderHead :param="param"></PlotOrderHead>
		<!-- 合成期貨/標的物 -->
		<OptionUnderlying class="mgt2 mgl5 mgr4 tcef" :selectedMonth="param.selectedMonth" @onSubjectMatterPrice="(p)=>subjectMatterPrice=p" :suspend="suspend"/>
        <div class="mgt2 mglr5">
            <!-- 策略選擇按鈕 -->
            <PlotOrderStrategyBtn @click="expandSelector=!expandSelector" :selectedStrategy="selectedStrategy" />
        </div>
		<!-- PL損益圖/四個資訊 -->
		<div class="flex-row pl-ctn pdlr3 mgt1 posr">
			<div class="w55p mglr1 posr" :class="{'opacity0': !hasStrategyInstance}">
				<!-- ProfitLoss 線圖 -->
				<PlotOrderProfitLossChart class="FULL" :selectedStrategy="selectedStrategy" :contracts="param.contracts" />
			</div>
			<div class="w45p flex-col mgt1" :class="{'opacity0': !hasStrategyInstance}">
				<div class="flex-1 posr mgb1">
					<!-- 最大獲利 / 最大損失 / 損益兩平 -->
					<PlotOrderProfitLossContent :selectedStrategy="selectedStrategy" class="FULL font-size-mini" :gv="gv" />
				</div>
			</div>
			<div class="FULL mglr5 mgtb2 no-strategy flex-center" v-if="!hasStrategyInstance">
				{{$ln('無對應策略損益圖')}}
			</div>
		</div>
		<!-- 兩隻腳的 BS/CP/Strike 選擇器 -->
		<PlotOrderContracts class="pdlr4" :selectedStrategy="selectedStrategy" :from="param.from" :contracts="param.contracts" :closedPrice="closedPrice" :gv="gv"/>
		<SwipeUpContainer class="flex-1 posr overflow-hidden" v-model="expandSelector" :class="{'font-size-mini': isDesktop}" :disable="$store.state.device.isPad">
			<!-- 下單條件區 -->
			<PlotOrderConditionTW class="FULL pdlr4" :selectedStrategy="selectedStrategy" :param="param" :contracts="param.contracts" :closedPrice="closedPrice" :gv="gv"/>
			<!-- 策略選擇器 (隱藏/浮起) -->
			<PlotOrderStrategySelectorTW class="swipe-up-target" @change="obj=>selectedStrategy=obj" 
				@close="expandSelector=false" :defaultStrategyName="$store.state.plOrder.selectedStrategy.key"/>
		</SwipeUpContainer>
    </div>
</template>

<script>
import OptionUnderlying from "@/components/OptionT/OptionUnderlying.vue";
import PlotOrderStrategySelectorTW from "@/components/PlotOrderTW/PlotOrderStrategySelectorTW.vue";
import PlotOrderStrategyBtn from "@/components/PlotOrder/PlotOrderStrategyBtn.vue";
import PlotOrderProfitLossContent from "@/components/PlotOrder/PlotOrderProfitLossContent.vue";
import PlotOrderProfitLossChart from "@/components/PlotOrder/PlotOrderProfitLossChart.vue";
import PlotOrderContracts from "@/components/PlotOrderTW/PlotOrderContracts.vue";
import PlotOrderConditionTW from "@/components/PlotOrderTW/PlotOrderConditionTW.vue";

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
			gv: {contract1: {sid: '', mth: this.param.selectedMonth, oppositePrice: null, strike: this.param.strike1|| null}, contract2: {sid: '', mth: this.param.selectedMonth2||this.param.selectedMonth, oppositePrice: null, strike: this.param.strike2|| null}},
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {
		OptionUnderlying,
		PlotOrderStrategySelectorTW,
		PlotOrderStrategyBtn,
		PlotOrderProfitLossContent,
		PlotOrderProfitLossChart,
		PlotOrderContracts,
		PlotOrderConditionTW,
	},
    methods: {},
	watch: {
		// gv: {
		// 	handler: function(nv, ov) {
		// 		console.log('gv : ', JSON.stringify(nv));
		// 	},
		// 	deep: true
		// },
	},
    computed: {
		// 'selectedStrategy.key'(nv) {
		// 	this.selectedStrategy = this.$store.state.plOrder.selectedStrategy;
		// },
		/** 價平價格 */
		closedPrice() {
			return this.param.closedPrice || this.subjectMatterPrice;
		},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		hasStrategyInstance() {
			return !!StrategyProfitLossCore._getStrategyInstance(this.selectedStrategy.key);
		},
	},
}
</script>

<style scoped>
.pl-ctn {
	min-height: 34vw;
}
.w55p {
	width: 55%;
}
.w45p {
	width: 45%;
}
.no-strategy {
	border: 1px solid #393939;
	border-radius: 2vw;
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