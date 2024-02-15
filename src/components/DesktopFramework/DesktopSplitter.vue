<template>
	<div class="desktop-splitter-ctn FULL">
		<!-- 左右切割 (預設) -->
		<div v-if="flex==='flex-row'" class="FULL flex-row">
			<div class="flex-1 posr h100p"><DesktopContainer :param="com1" /></div>
			<div class="splitter v" @mousedown="onSplitterMouseDown" /> 
			<div class="posr h100p" :style="{'min-width': c2wh}"><DesktopContainer :param="com2" /></div>
		</div>
		<!-- 上下切割 -->
		<div v-if="flex==='flex-col'" class="FULL flex-col">
			<div class="flex-1 posr w100p"><DesktopContainer :param="com1" /></div>
			<div class="splitter h" @mousedown="onSplitterMouseDown" /> 
			<div class="posr w100p" :style="{'min-height': c2wh}"><DesktopContainer :param="com2" /></div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
			dragC2WH: null,
			mousedownX: null,
			mousedownY: null,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onMouseMove() {
			if (this.flex==='flex-row') {
				let orgX = this.mousedownX;
				let clientW = this.$parent.$refs.ctn.clientWidth;
				let orgC2WH = clientW * parseFloat(this.param.c2wh) / 100;
				let newC2WH = orgC2WH - event.clientX + orgX;
				newC2WH = newC2WH < 100 ? 100 : newC2WH;
				newC2WH = clientW - newC2WH < 100 ? clientW - 100 : newC2WH;
				newC2WH = newC2WH / clientW * 100;
				this.dragC2WH = isNaN(newC2WH) ? `10%` : `${newC2WH}%`;
			}
			else {
				let orgY = this.mousedownY;
				let clientH = this.$parent.$refs.ctn.clientHeight;
				let orgC2WH = clientH * parseFloat(this.param.c2wh) / 100;
				let newC2WH = orgC2WH - event.clientY + orgY;
				newC2WH = newC2WH < 30 ? 30 : newC2WH;
				newC2WH = clientH - newC2WH < 30 ? clientH - 30 : newC2WH;
				newC2WH = newC2WH / clientH * 100;
				this.dragC2WH = isNaN(newC2WH) ? `10%` : `${newC2WH}%`;
				
			}
		},
		onMouseUp() {
			// 更新回 layout 設定
			if (this.dragC2WH)
				this.param.c2wh = this.dragC2WH;
			document.removeEventListener("mousemove", this.onMouseMove, false);
			document.removeEventListener("mouseup", this.onMouseUp, false);
		},
		onSplitterMouseDown() {
			this.mousedownX = event.clientX;
			this.mousedownY = event.clientY;
			document.addEventListener("mousemove", this.onMouseMove, false);
			document.addEventListener("mouseup", this.onMouseUp, false);
		},		
	},
	watch: {},
    computed: {
		flex() {
			return this.param.flex;
		},
		com1() {
			return this.param.com1 || {};
		},
		com2() {
			return this.param.com2 || {};
		},
		c2wh() {
			return this.dragC2WH || this.param.c2wh;
		},
	},
}
</script>

<style scoped>
.splitter {
	background-color: #121929;
}
.splitter:hover {
	background-color: #444;
}
.splitter.v {
	width: 5px;
}
.splitter.v:hover {
	cursor: ew-resize;
}
.splitter.h {
	height: 5px;
}
.splitter.h:hover {
	cursor: ns-resize;
}
</style>