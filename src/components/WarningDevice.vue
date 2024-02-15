<template>
	<div class="warning-device-ctn flex-col" v-if="!autoLogin">
		<div class="mgb5">启动阶段非手机模式，请切换为手机模式后重新启动</div>
		<Button @click="onBtnReload">重新启动</Button>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
    methods: {
		onBtnReload() {
			window.location.reload();
		}
	},
	computed: {
		autoLogin() {
			return this.$store.state.config.urlParam.login;
		},
	}
}
</script>

<style scoped>
.warning-device-ctn {
	margin: 5vw;
	padding: 5vw;
	border-radius: 3vw;
}
</style>