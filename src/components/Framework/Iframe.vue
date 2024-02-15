<template>
	<div class="FULL flex-col">
		<div v-if="param && param.title" class="head flex-row">
			<div class="mglr3 flex-center">
				<i class="material-icons tcef icon-back" @click="onBtnBack"></i>
			</div>
			<div class="flex-1 flex-start">
				{{param ? param.title : ''}}
			</div>
		</div>
		<div class="flex-1 body">
			<iframe class="iframe-ctn" :src="src" />
		</div>
	</div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		onBtnBack() {
			eventBus.$emit('CLOSE-DIALOG');
		},
	},
	watch: {},
	computed: {
		src() {
			return this.param && this.param.src ? this.param.src : vuex.layout.iframeSrc;
		},
	},
}
</script>

<style scoped>
.iframe-ctn {
	width: 100%;
	height: 100%;
	border: 0;
}
.head {
	background-color: #F58923;
	height: 10vw;
}
</style>