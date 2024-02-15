<template>
    <div class="mix-bs5-detail-ctn FULL flex-col">
		<SymbolDetail class="flex-1 symbol-detail-ctn"/>
		<BS5 class="mgt3"/>
    </div>
</template>

<script>
import BS5 from "@/components/BS5.vue";
import SymbolDetail from "@/components/SymbolDetail.vue";

export default {
	props: ["suspend"],
	data() {
		return {
		}
	},
	components: {
		BS5,
		SymbolDetail,
	}
}
</script>

<style scoped>
.symbol-detail-ctn {
	max-height: 220px;
}
</style>