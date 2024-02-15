<template>
</template>

<script>
export default {
	props: ['ucid'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {
		this.emitContractList();
	},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 送出合約列表 */
		emitContractList() {
			this.$emit('contractList', this.$store.state.data.focusList);
		},
	},
	watch: {
		// 系統設定關開
		"$store.state.config.posListAddToFocusList"(nv, ov) {
			this.emitContractList();
		},
		// 關注列表變動
		"$store.state.data.focusList"(nv, ov) {
			this.emitContractList();
		}
	},
    computed: {},
}
</script>

<style scoped>
</style>