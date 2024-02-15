<template>
	<div class="flex-col font-size-micro mgb2">
		<div class="tr flex-center bgc-opt-mth-line" :class="{'expand': monthExpand, 'is-feature-option': $store.state.opt.isFeatureOption}"></div>
		<div class="flex-1" v-if="monthExpand">
			<div class="tr" v-for="(sid,idx) in closedContracts" />
		</div>
	</div>
</template>

<script>
export default {
	props: ["month", "closedContracts"],
    computed: {
		/** 本 [商品+月份] 是否展開 */
		monthExpand() {
			let key = this.expandMapKey;
			return this.$store.state.opt.expandMap[key];
		},
		/** [商品+月份] 是否展開的 Key */
		expandMapKey() {
			if (!this.$store.state.opt.underlyingS)
				return "";
			let contractID = this.$store.state.opt.underlyingS;
			let symbolID = contractID.split('.').splice(0,4).join('.');
			return `${symbolID}.${this.month}`;
		},
	},
	watch: {
		monthExpand(nv){
			eventBus.$emit("EXPAND");
		}
	}
}
</script>

<style scoped>
</style>