<template>
    <div class="po-strategybtn-ctn select-btn btn-default-ht-rd flex-row tcef pdl5 pdr3" @click="onStrategyBtn">
		<div class="flex-1 flex-start">{{$ln(selectedStrategy.label)}}</div>
		<div class="flex-center"><i class="material-icons md-24">arrow_drop_down</i></div>
    </div>
</template>

<script>
export default {
	props: ["selectedStrategy"],
	data() {
		return {

		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onStrategyBtn() {
			this.$emit("click");
		}
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
.select-btn {
	box-sizing: border-box;
	border: 1px solid #393939;
	color: white;
	background-color: rgba(0,0,0,0);
}
.select-btn > span {
	overflow: hidden;
	white-space: nowrap;
}


/** 桌機版 */
.desktop .po-strategybtn-ctn {
	margin: 0.4em;
	height: 2.13em;
	border-radius: 0.4em;
}
.desktop .po-strategybtn-ctn:hover {
	color: aqua;
	border: 2px solid aqua;
	cursor: pointer;
}
</style>