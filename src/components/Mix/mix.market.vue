<template>
	<div>
		<component :is="$store.state.config.quoteComponentClass" class="FULL" :suspend="suspend"></component>
	</div>
</template>

<script>
import QuoteMarket from "@/components/QuoteMarket";
export default {
	props: ['suspend'],
	data() {
		return {};
	},
	created(){},
	beforeMount() {},
	mounted() {
	},
	beforeDestroy() {},
	components: {
		QuoteMarket,
	},
	methods: {},
	watch: {},
	computed: {}
};
</script>

<style scoped>
</style>