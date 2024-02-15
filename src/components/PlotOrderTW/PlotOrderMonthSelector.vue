<!-- 策略下單盒 - 下方委託條件總成 - 履約價選擇器 -->
<template>
	<div class="po-month-selector-ctn flex-row">
		<SingleSelect :options="optionList" v-model="param.mth" />
	</div>
</template>

<script>
// import { parseArgbToHtmlColor } from 'scichart/utils/parseColor';

export default {
	props: ['param'],
	data() {
		return {
		}
	},
	beforeMount() {
		if (!this.param.mth)
			this.param.mth = Object.keys(this.contracts)[0];
	},
	mounted() {
	},
	beforeDestroy() {},
	components: {},
	methods: {
	},
	watch: {
	},
	computed: {
		contracts() {
			return this.$store.state.opt.contracts;
		},
		optionList() {
			let list = Object.keys(this.contracts).map(mth=>{
				return {label: mth, value: mth};
			});
			// 依月份排序
			return list.sort((a, b)=>{
				//  週月 202009W2 要排最前面
				if (a.label.length > b.label.length) return -1;
				return a.label > b.label ? 1 : -1;
			});
		},
	},
}
</script>

<style scoped>
.single-select-ctn {
	width: 100%;
}
</style>