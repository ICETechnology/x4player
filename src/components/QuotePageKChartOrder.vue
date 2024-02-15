<template>
	<div class="FULL flex-col">
		<!-- 混和版線圖 -->
		<MixChart v-if="!enableTVC" class="flex-1" :suspend="suspend" :key="reRanderKey" :param="{model:'order'}"/>
		<!-- 啟用TVC時不再使用MixChart(因為頁簽不再適用圖表下單)，改為載入 SciKChart -->
		<SciKChart v-if="enableTVC" class="flex-1 divider-top pdt2" :model="'order'" />
	</div>
</template>

<script>
import SciKChart from "@/components/SciKChart/SciKChart.vue";
export default {
	props: ['suspend', 'reRanderKey'],
	components: {
		SciKChart,
	},
	mounted() {
		// 新手教學
		eventBus.$emit("HEPLER", "kchart-order");
	},
	created() {
		this.$store.commit('setKChartModel', "order");
	},
	computed: {
		// 啟用TVC
		enableTVC() {try{return this.$store.state.config.publicPdSetting.function.tvc;}catch(e){}},
	}
}
</script>
