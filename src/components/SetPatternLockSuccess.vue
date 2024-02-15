<template>
	<div class="flex-center flex-col pdtb5">
		<div class="mgtb5"><i class="material-icons md-48">check_circle</i></div>
		<div class="font-size-big clr-orange m10">{{$ln("设定成功")}}</div>
		<div class="m10">{{$ln("已完成登入手势设定")}}</div>
		<div class="flex-1" />
		<Button class="btn-confirm" @click="onClose">{{$ln("完成")}}</Button>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		this.$emit('title', '手勢登入設定完成');
	},
	mounted() {
	},
	beforeDestroy() {
	},
	components: {
	},
	methods: {
		onClose() {
			eventBus.$emit('CLOSE-DIALOG');
		},
	},
	watch: {
	},
	computed: {

	}
}
</script>

<style scoped>
.btn-confirm {
	width: 38vw;
	height: 10vw;
	border-radius: 2vw;
}
</style>