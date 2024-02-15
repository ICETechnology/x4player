<template>
	<div class="flex-row desktop-btn mglr1 font-setting flex-center posr"
		@mousewheel="onMouseWheel" @click="onClick" :title="$ln('字体 (滚轮可直接调整)')">
		<i class="icon material-icons mgr0d5">font_download</i>
		<span class="flex-center">{{$store.state.desktop.selectedLayout.fontSizeRatio}}</span>
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
    methods: {
		/** 字體上滾輪 */
		onMouseWheel(e) {
			let ratio = this.$store.state.desktop.fontSizeRatio + (e.wheelDeltaY > 0 ? 1 : -1);
			let fontSizeRatio = this.$store.state.desktop.fontSizeRatio = ratio > this.minFontSize ? (ratio < this.maxFontSize ? ratio : this.maxFontSize) : this.minFontSize;
			this.$set(this.selectedLayout, 'fontSizeRatio', fontSizeRatio);

			// 若有勾選同步至所有版面
			if (this.fontSizeToAll) {
				// 將字體大小更新至所有版面
				this.$store.state.desktop.layout.forEach(obj=>{obj.fontSizeRatio = fontSizeRatio;});
			}
		},
		onClick() {
			eventBus.$emit("POPUP-DIALOG", "DesktopFontSize");
		},
	},
	watch: {},
    computed: {
		selectedLayout() {
			return this.$store.state.desktop.selectedLayout;
		},
		fontSizeOptions() {
			return this.$store.state.desktop.fontSizeOptions;
		},
		minFontSize() {
			return this.fontSizeOptions[0].value;
		},
		maxFontSize() {
			return this.fontSizeOptions[this.fontSizeOptions.length-1].value;
		},
		fontSizeToAll() {
			return this.$store.state.desktop.fontSizeToAll;
		},
	},
}
</script>

<style scoped>
</style>