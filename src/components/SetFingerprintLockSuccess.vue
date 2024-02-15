<template>
	<div class="flex-center flex-col pdtb5">		
		<div v-if="param.active" class="mgtb5"><i class="material-icons md-48">check_circle</i></div>
		<div v-if="param.active" class="font-size-big clr-orange m10">{{$ln("啟用生物辨識功能")}}</div>
		<div v-if="!param.active" class="mgtb5"><i class="material-icons md-48">cancel</i></div>		
		<div v-if="!param.active" class="font-size-big clr-orange m10">{{$ln("取消生物辨識功能")}}</div>
		<div class="flex-1" />
		<Button class="btn-confirm" @click="onClose">{{$ln("完成")}}</Button>
	</div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
		}
	},
	beforeMount() {
		this.$emit('title', '生物辨識設定完成');
	},
	mounted() {
		alert(active);
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