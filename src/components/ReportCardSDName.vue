<template>
	<div class="flex-start font-size-small flex-row">
		<span class="mgl2">{{symbol}} {{cnm4}}</span>
	</div>
</template>

<script>
export default {
	props: ['sid'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {
		minfo() {
			return M4C.Symbol.getMainformInfo(this.sid);
		},
		sids() {
			return this.sid.split('.');
		},
		/** 代碼 */
		symbol() {
			return this.minfo ? this.minfo.Symbol : this.sids[3];
		},
		cnm4() {
			return M4C.Symbol.getCNM4(this.sid);
		},
	},
}
</script>

<style scoped>
</style>