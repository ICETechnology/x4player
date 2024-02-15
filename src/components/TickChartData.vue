<template>
    <div class="tick-chart-data-ctn hidden"/>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
export default {
	mixins: [QuoteAgent],
	props: [],
	data() {
		return {

		}
	},
	beforeMount() {
		this.$store.state.tickChart.tickList = [];
		this.$store.state.tickChart.maxSize = 0;
	},
    mounted() {
		this.$store.state.tickChart.tickList.push(this.qop);
	},
	beforeDestroy() {
		this.$store.state.tickChart.tickList = [];
		this.$store.state.tickChart.maxSize = 0;
	},
	components: {},
    methods: {},
	watch: {
		qop(nv) {
			if (!this.maxTickLength)
				return;
			this.$store.state.tickChart.tickList.push(nv);
			this.$store.state.tickChart.tickList = this.$store.state.tickChart.tickList.slice(-this.maxTickLength);
		},
	},
    computed: {
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
		qop() {
			return this.qo.p;
		},
		maxTickLength() {
			return this.$store.state.tickChart.maxSize;
		},
	},
}
</script>

<style scoped>
</style>