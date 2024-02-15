<template>
	<div class="setting-line pl20">
		<span class="setting-label">{{skey}}</span>
		<span class="setting-content">
			<Radio v-model="$store.state.logConsole[skey]">
				<span value="0">不印</span>
				<span value="1">列印</span>
			</Radio>
		</span>
	</div>
</template>

<script>
export default {
	props: ["skey"],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style lang='scss' scoped>
.setting-line {
	height: 45px;
	min-height: 45px;
	border-bottom: 1px solid #333;
	@extend .flex-row;
}
.setting-label {
	@extend .flex-start;
}
.setting-content {
	margin-right: 10px;
	@extend .flex-1, .flex-end;
}
</style>