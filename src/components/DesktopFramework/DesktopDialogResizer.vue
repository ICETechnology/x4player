<template>
    <div class="FULL">
		<!-- 右下角 resize 感應容器 -->
		<div class="resize-rb" @mousedown="onResizeDown"></div>
    </div>
</template>

<script>
export default {
	props: ['dskDlgObj'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** resize 事件處理 */
		onResizeDown(e) {
			this.resizeDownX = e.pageX;
			this.resizeDownY = e.pageY;
			this.ctnWidth = this.parentCtn.offsetWidth;
			this.ctnHeight = this.parentCtn.offsetHeight;
			// 由 document 監聽 mousemove (可解決滑鼠快速移出本視窗會導致停止移動的問題)
			document.addEventListener('mousemove', this.onResizeMove, false);
			document.addEventListener('mouseup', this.onResizeUp, false);
		},
		onResizeMove(e) {
			if (!this.resizeDownX || !this.resizeDownY)
				return;
			let moveX = e.pageX - this.resizeDownX;
			let moveY = e.pageY - this.resizeDownY;
			let newWidth = this.ctnWidth + moveX;
			let newHeight = this.ctnHeight + moveY;
			this.parentCtn.style.width = (newWidth < 250 ? 250 : newWidth) + 'px';
			this.parentCtn.style.height = (newHeight < 250 ? 250 : newHeight) + 'px';
		},
		onResizeUp(e) {
			delete this.resizeDownX;
			delete this.resizeDownY;
			this.$set(this.dskDlgObj.position, 'width', this.parentCtn.offsetWidth);
			this.$set(this.dskDlgObj.position, 'height', this.parentCtn.offsetHeight);
			document.removeEventListener('mousemove', this.onResizeMove, false);
			document.removeEventListener('mouseup', this.onResizeUp, false);
		},		
	},
	watch: {},
    computed: {
		parentCtn() {
			return this.$parent.$refs.ctn;
		},
	},
}
</script>

<style scoped>
.resize-rb {
	position: absolute;
	right: -0.5em;
	bottom: -0.5em;
	width: 1em;
	height: 1em;
	/* background-color: red; */
	cursor: se-resize;
	z-index: 1;
}
</style>