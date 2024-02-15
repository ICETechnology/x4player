<template>
	<div class="multi-stock-row-card" :class="[largeSize? 'flex-row':'flex-col']" v-waypoint="{active: true, callback: onWaypoint}">
		<KChartLandHead v-if="visibility" :class="{'flex-1': largeSize}" :suspend="suspend" :propsSid="propsSid" />
		<div v-if="visibility" class="body flex-1d5 posr">
			<MiniTChart v-if="comClass==='MiniTChart'" class="FULL" :param="{propsSid: propsSid}" />
			<MiniKChart v-if="comClass==='miniKChart'" class="FULL" :symbol="propsSid" :propNk="propNk" />
		</div>
	</div>
</template>

<script>
import KChartLandHead from "@/components/KChart.Head.vue"
import MiniKChart from "@/components/MiniKChart.vue";

export default {
	props: ['suspend', 'propsSid', 'propNk'],
	data() {
		return {
			visibility: false,
		}
	},
	beforeMount() {},
	mounted() {
	},
	beforeDestroy() {},
	components: {
		KChartLandHead,
		MiniKChart,
	},
	methods: {
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			// Waypoint:out 超過 1 秒才設定為不可視，已解決行情ScrollBounce發生會快速 out->in 導致隱藏後又顯示的問題
			if (going === 'in') {
				this.visibility = true;
				clearTimeout(this.offVisibilityTimeout);
			}
			else {
				this.offVisibilityTimeout = setTimeout((self)=>{self.visibility = false;}, 1000, this);
			}
		},
	},
	watch: {},
	computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		// 當前使用的組件
		comClass() {return this.$store.state.config.multiStockComClass;},
	},
}
</script>

<style scoped>
</style>