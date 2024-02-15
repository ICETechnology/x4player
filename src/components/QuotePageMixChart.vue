<template>
	<div class="FULL flex-col">
		<!-- 混和版線圖 -->
		<MixChart class="flex-1" :param="{model:'market'}" :suspend="suspend" :key="reRanderKey || isRender" />
	</div>
</template>

<script>
import MixChart from "@/components/MixChart.vue";
export default {
	data() {
		return {
			isRender: 0,
		}
	},
	props: ['suspend', 'reRanderKey'],
	components: {
		MixChart,
	},
	mounted() {
		// 新手教學
		eventBus.$emit("HEPLER", "kchart");
	},
	created() {
		this.$store.commit('setKChartModel', "market");
	},
	watch: {
		isPortrait(nv, ov) {
			// TVC 時想要直接覆用，不想要重新 initial，效果較好
			if(nv != ov && !this.enableTVC) {
				this.isRender ++;
			}
		}
	},
	computed: {
		isPortrait() {
			return this.$store.state.status.isPortrait;
		},
		// 啟用TVC
		enableTVC() {
			try{return this.$store.state.config.publicPdSetting.function.tvc;}catch(e){}
		},
	},
}
</script>
