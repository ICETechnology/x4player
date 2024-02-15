<template>
	<div class="FULL flex-col pdlr3 pdb3">
		<!-- 趨勢圖 -->
		<TickChart class="flex-1" :suspend="suspend" />
		<!-- 持倉、委託組合元件 -->
		<MixPosRpt class="mgt1 font-size-small mgb5" emptyText="你目前没有任何部位与委托"/>
		<!-- 委託按鈕 -->
		<OrderBtn :suspend="suspend" :param="{orderType: 'MARKET', orderBoxMode: 0, from: 'FastOrder'}" :useComName="selfComName" />
	</div>
</template>

<script>
import TickChart from "@/components/TickChart.vue";
import MixPosRpt from "@/components/MixPosRpt.vue";
import OrderBtn from "@/components/Order/OrderBtn.vue";

export default {
	props: ["suspend"],
	components: {
		TickChart,
		MixPosRpt,
		OrderBtn,
	},
	mounted() {
		this.$store.state.order.buyOrderPrice = 0;
		this.$store.state.order.sellOrderPrice = 0;
	},
	computed: {
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
	}
}
</script>
