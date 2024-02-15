<template>
	<div>
		<QuoteSwipe class="FULL" :suspend="suspend"></QuoteSwipe>
	</div>
</template>

<script>
import QuoteSwipe from "@/components/QuoteSwipe";
export default {
	props: ['suspend'],
	data() {
		return {};
	},
	created(){},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	components: {
		QuoteSwipe,
	},
	methods: {},
	watch: {},
	computed: {}
};
</script>

<style scoped>
</style>