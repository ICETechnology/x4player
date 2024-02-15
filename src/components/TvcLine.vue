<template>
	<div class="trading-view-ctn posa">
		<TradingView class="FULL" :containerID="key" :key="key" @restore="key=''.random()" :lineMode="true" :storeKey="'_line'" />
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
	computed: {},
}
</script>

<style scoped>
</style>