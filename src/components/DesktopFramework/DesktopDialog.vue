<template>
	<div class="FULL desktop-dialog-ctn">
		<div class="FULL mask"/>
		<div ref="ctn" class="desktop-dialog float-dialog-bgc" :class="[{'selected': dskDlgObj.selected}, dialogSize, classByChild]"
			:style="computedStyle">
			<!-- resize 感應器 -->
			<DesktopDialogResizer :dskDlgObj="dskDlgObj" />
			<div class="FULL flex-col">
				<div class="head flex-center flex-row bgc-head pdl2" @mousedown="onMouseDown">
					<!-- 元件頁簽 -->
					<div class="flex-1">
						<span class="tab-btn">{{titleByChild}}</span>
					</div>
					<!-- 支持更多功能按鈕 -->
					<component v-if="moreBtns" v-for="objClass in moreBtns" :is="objClass" />
					<span class="font-size-small icon-btn" @click="onClose"><i class="material-icons">close</i></span>
				</div>
				<div class="body flex-1 posr">
					<component class="FULL" :is="dskDlgObj.comClass" :param="dskDlgObj.comParam" @title="txt => titleByChild = $ln(txt)" @dialogClass="(cls) => {classByChild = cls}" />
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['dskDlgObj'],
	data() {
		return {
			titleByChild: null,
			classByChild: "",
			mouseDownX: null,
			mouseDownY: null,
			ctnX: null,
			ctnY: null,
		}
	},
	beforeMount() {},
    mounted() {
		if(this.config && this.config.style){
			this.$refs.ctn.style = this.config.style;
		}
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onClose() {
			let idx = this.dskDlgList.findIndex(o=>o.UCID===this.dskDlgObj.UCID);
			this.dskDlgList.splice(idx, 1);
		},
		onMouseDown(e) {
			this.mouseDownX = e.pageX;
			this.mouseDownY = e.pageY;
			this.ctnX = this.$refs.ctn.offsetLeft;
			this.ctnY = this.$refs.ctn.offsetTop;
			// 將本 dialog 更新為 selected
			if (!this.dskDlgObj.selected) {
				this.dskDlgList.forEach(o=>o.selected = false);
				this.$set(this.dskDlgObj, 'selected', true);
			}
			// 由 document 監聽 mousemove (可解決滑鼠快速移出本視窗會導致停止移動的問題)
			document.addEventListener('mousemove', this.onMouseMove, false);
			document.addEventListener('mouseup', this.onMouseUp, false);
		},
		onMouseMove(e) {
			if (!this.mouseDownX || !this.mouseDownY)
				return;
			let moveX = e.pageX - this.mouseDownX;
			let moveY = e.pageY - this.mouseDownY;
			this.newX = this.ctnX + moveX;
			this.newY = this.ctnY + moveY;
			this.$refs.ctn.style.top = this.newY + 'px';
			this.$refs.ctn.style.left = this.newX + 'px';
		},
		onMouseUp(e) {
			this.mouseDownX = null;
			this.mouseDownY = null;
			this.$set(this.dskDlgObj.position, 'top', this.newY);
			this.$set(this.dskDlgObj.position, 'left', this.newX);
			document.removeEventListener('mousemove', this.onMouseMove, false);
			document.removeEventListener('mouseup', this.onMouseUp, false);
		},


	},
	watch: {},
    computed: {
		config () {
			return this.dskDlgObj.config;
		},
		moreBtns() {
			if (this.config && this.config.moreBtns)
				return this.config.moreBtns;
		},
		dialogSize() {
			if(this.config && this.config.size)
				return `dialog-size-${this.config.size.toLowerCase()}`;
		},
		layout() {
			return this.$store.state.desktop.layout;
		},
		selectedLayout(){
			return this.layout.find(obj=>obj.selected);
		},
		dskDlgList() {
			// return this.selectedLayout.dskDlgList;
			return this.$store.state.desktop.dskDlgList;
		},
		computedStyle() {
			let style = {};
			if (this.dskDlgObj.position.top)
				style.top = this.dskDlgObj.position.top+'px';
			if (this.dskDlgObj.position.left)
				style.left = this.dskDlgObj.position.left+'px';
			if (this.dskDlgObj.position.width)
				style.width = this.dskDlgObj.position.width+'px';
			if (this.dskDlgObj.position.height)
				style.height = this.dskDlgObj.position.height+'px';
			return style;
		},
	},
}
</script>

<style scoped>
.desktop-dialog-ctn {
	z-index: 3;
}
.desktop-dialog {
	/* 不使用 calc 的置中作法 */
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 23em;
	/* 因策略下單盒，增高至 38em */
	height: 38em;
	max-height: 90%;
	border: 1px solid #333;
	box-shadow: 0px 0px 5px 0px rgb(255, 255, 255, 0.2);
}
/* .desktop-dialog.selected {
	z-index: 11;
} */
.mask {
	opacity: 0.5;
	background-color: black;
}
</style>