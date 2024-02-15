<template>
	<div class="flex-col flex-1 quote-page-mixrt-ctn">
    	<TabGroup :tabList="infoTabList" :tab-key="tabKey || 'MIX-RT-INFO'" :suspend="suspend" class="tchart-detail-ctn"></TabGroup>
		<BS5 :noBSBtn="true" />
	</div>
</template>

<script>
import BS5 from "@/components/BS5.vue";
import TChart from "@/components/TChart.vue";
import SymbolDetail from "@/components/SymbolDetail.vue";

export default {
	props: ["tabKey", "suspend"],
	data() {
		return {
			infoTabList : [
				{"label": "走势", "comClass": TChart, "selected": true},
				{"label": "明细", "comClass": SymbolDetail},				
			],			
		}
	},
	components: {
		TChart,
		BS5,
		SymbolDetail,
	}
}
</script>

<style scoped>
.tchart-detail-ctn /deep/ .head {
	background-color: rgb(37, 52, 69);
	border-bottom: 1px solid #EAEAEA;
}
.tchart-detail-ctn /deep/ .head .tab {
	padding: 0;
}
.tchart-detail-ctn /deep/ .body .divider-bottom{
	border-bottom: 1px solid #7E8185;
}
</style>