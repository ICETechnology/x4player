<template>
	<div class="DesktopTickChart-ctn flex-col flex-1 bgc-black">
		<div class="flex-col FULL tick-ctn">
			<!-- 趨勢圖 -->
			<TickChart class="flex-1" />
		</div>
		<!-- TickChart 資料管理元件 -->
		<TickChartData/>
	</div>
</template>
<script>
import TickChart from "@/components/TickChart.vue";
import TickChartData from "@/components/TickChartData.vue";

export default {
	data() {
		return {}
	},
	components: {
		TickChart,
		TickChartData,
	}
}
</script>
<style scoped>
/deep/ .price-ctn .price-label {
	border-radius: 1em;
}
.DesktopTickChart-ctn {
	background-color: #0E121A;
}
.tick-ctn {
	top: 1em;
    bottom: 1em;
    left: 1em;
    right: 1em;
}
</style>