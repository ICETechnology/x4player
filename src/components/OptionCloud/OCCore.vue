<template>
    <div class="oc-core hidden">
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {
		/** 期權品種切換 */
		'$store.state.opt.selectedSymbol'(nv) {
			// 對應回以 [當前連動商品] 為 [標的] 的 [品種代碼]
			let sid = this.$store.state.outerSelectedSymbol = nv;
			console.log('OCCore selectedSymbol :', nv, '-> outerSelectedSymbol :', sid)
		}
	},
    computed: {},
}
</script>

<style scoped>
</style>