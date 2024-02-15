<template>
	<div class="plot-order-contract-suber">{{oppositePrice || '--'}}</div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
// import { parseArgbToHtmlColor } from 'scichart/utils/parseColor';
export default {
	props: ['sid', 'param', 'BS'],
    mixins: [QuoteAgent],
	data() {
		return {}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {},
	watch: {
		// 對手價跳動
        oppositePrice(nv) {
            this.param.oppositePrice = nv;
        },
    },
	computed: {
		// 對手價
		oppositePrice() {
			return this.BS === 'B' ? this.qo.sp1 : this.qo.bp1;
		},
	}
}
</script>

<style scoped>
</style>