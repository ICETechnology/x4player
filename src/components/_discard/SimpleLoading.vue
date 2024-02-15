<template>
	<div v-if="text" class="simple-loading FULL">
		<!-- 建立中/登入中 -->
		<div class="FULL loading-mask"/>
		<div class="loading-ctn flex-col">
			<div class="flex-1"></div>
			<div class="flex-1 flex-bottom posr"><LoadingIcon/></div>
			<div class="flex-1 flex-top mgt1">{{$ln(text)}}</div>
			<div class="flex-1"></div>
		</div>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			text: null,
		}
	},
	beforeMount() {
		let self = this;
		this.$store.state.components.simpleLoading = this;
		eventBus.$on("START-SIMPLE-LOADING", (text)=>{
			self.text = this.$ln(text);
			// 最多顯示 30 秒 (避免發生異常而無法停止)
			self.showTimeout = setTimeout(()=>{self.text = null;}, 30000);
		});
		eventBus.$on("STOP-SIMPLE-LOADING", (text)=>{
			self.text = null;
			clearTimeout(self.showTimeout);
		});
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {},
	watch: {
	},
	computed: {
	},
}
</script>

<style scoped>
.loading-mask {
	z-index: 999;
	opacity: 0.3;
	background-color: black;
}
.loading-ctn {
	z-index: 999;
	position: absolute;
	top: 30%;
	left: 25vw;
	width: 50vw;
	height: 30vw;
	border-radius: 1vw;
	color: white;
	background-color: #363C42;
}
</style>