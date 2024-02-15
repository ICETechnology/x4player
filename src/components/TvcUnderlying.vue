<template>
	<div class="tvc-underlying-ctn posa">
		<TradingView class="FULL pdt1" :containerID="key" :key="key" @restore="key=''.random()" :lineMode="true" :storeKey="'_underlying'" :propSid="sid" />
	</div>
</template>

<script>
import TradingView from "@/components/TradingView/TradingView.vue";
export default {
	data() {
		return {
			key: ''.random(),
		}
	},
	components: {TradingView},
	computed: {
		sid() {
			return vuex.opt.underlyingSid;
		},
	},
}
</script>

<style scoped>
</style>