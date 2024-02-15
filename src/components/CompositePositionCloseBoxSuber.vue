<template>
	<!-- <div class="composite-position-close-box-suber">{{oppositePrice || '--'}}</div> -->
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
export default {
	props: ['sid', 'param', 'BS', 'oppositePriceObj'],
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
			this.oppositePriceObj.price = nv;
        },
    },
	computed: {
		// 對手價
		oppositePrice() {
			return this.BS === 'BUY' ? this.qo.sp1 : this.qo.bp1;
		},
	}
}
</script>

<style scoped>
</style>