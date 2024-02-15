<template>
    <div class="FULL font-font-size-ctn">
		<div class="FULL mask"/>
		<div class="FULL flex-col">
			<div class="flex-row flex-center">
				<Radio v-model="selectedTag">
					<span value="mini">mini</span>
					<span value="small">small</span>
					<span value="normal">normal</span>
					<span value="big">big</span>
					<span value="large">large</span>
				</Radio>
			</div>
			<div class="flex-1 flex-center" @touchmove="onTouchMove" @touchend="onTouchEnd">
				<span class="font-size-text">{{$store.state.fontSize[selectedTag]}}vw</span>
			</div>
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			selectedTag: "normal",
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onTouchMove() {
			let touch0 = event.targetTouches[0];
			if (!this.lastY)
				this.lastY = touch0.pageY;
			let scale = parseInt((touch0.pageY - this.lastY) / 20);
			if (scale) {
				this.$store.state.fontSize[this.selectedTag] = 
					Big(this.$store.state.fontSize[this.selectedTag]).plus(Big(scale).div(10));
				this.lastY = touch0.pageY;
			}
		},
		onTouchEnd() {
			delete this.lastY;
		}
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
.font-font-size-ctn {
	z-index: 1;
}
.font-font-size-ctn .mask {
	opacity: 0.5;
	background-color: black;
}
.component-ctn {
	margin: 5%;
	border-radius: 6px;
}
.font-size-text {
	font-size: 32px;
}
</style>