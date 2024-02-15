<template>
    <div v-if="$store.state.onScreenShot" class="FULL zindex-9" data-html2canvas-ignore="true">
		<div class="FULL mask"></div>
		<div class="FULL flex-center">
			<div class="flex-row notify-ctn pd2 pdlr5">
				<div class="mgr2">{{$ln('截图中')}}</div>
				<div class="loading-ctn posr"><LoadingIcon/></div>
			</div>
		</div>
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
	watch: {},
    computed: {},
}
</script>

<style scoped>
.mask {
	opacity: 0.5;
	background-color: black;
}
.notify-ctn {
	opacity: 0.9;
	color: white;
	background-color: #253445;
	border: 1px solid white;
	border-radius: 0.5em;
}
.loading-ctn {
	width: 20px;
}
</style>