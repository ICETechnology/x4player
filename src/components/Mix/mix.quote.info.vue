<template>
    <TabGroup :tabList="infoTabList" :tab-key="tabKey || 'TG-INFO'" :suspend="suspend" class="mix-quote-info-ctn"></TabGroup>
</template>

<script>
import BS5 from "@/components/BS5.vue";
import SymbolDetail from "@/components/SymbolDetail.vue";

export default {
	props: ["tabKey", "suspend"],
	data() {
		return {
			infoTabList : [
				{"label": "五档", "comClass": BS5},
				{"label": "明细", "comClass": SymbolDetail},
			],			
		}
	},
	components: {
		BS5,
		SymbolDetail,
	}
}
</script>

<style scoped>
.mix-quote-info-ctn /deep/ .head {
	background-color: rgb(37, 52, 69);
	border-bottom: 1px solid #EAEAEA;
}
.mix-quote-info-ctn /deep/ .head .tab {
	padding: 0;
}
.mix-quote-info-ctn /deep/ .body .divider-bottom{
	border-bottom: 1px solid #7E8185;
}
</style>