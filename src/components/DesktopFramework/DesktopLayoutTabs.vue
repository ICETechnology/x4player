<template>
    <div class="flex-row desktop-layout-tabs">
		<span ref="layouts" class="layout-btn clr-gray posr" v-for="(obj, idx) in layout" :class="{selected: obj.selected}"
			@click="onLayoutBtnClick(obj, idx)" @blur="onLayoutBtnBlur(obj, idx)" @keydown.enter="onLayoutBtnEnter(obj, idx)"
			:draggable="layoutEditable" @dragstart="onDragStart(obj, idx)" @dragend="onDragEnd"
			@dragleave.prevent="dragTo = -1" @dragover.prevent="onDragOver(idx)" @drop="onDrop(idx)">
			<!-- 插入箭頭圖示 -->
			<i class="material-icons insert-icon" v-if="displayInsertIcon(idx)" :class="{'icon-right': idx===layout.length-1 && dragTo===idx+1}">forward</i>
			<!-- 版面名稱 -->
			{{$ln(obj.layoutName)}}
		</span>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			dragItem: null,
			dragTo: -1,
			dragFrom: -1,
		}
	},
	beforeMount() {},
    mounted() {
		// 桌機版統計
		M4C.Analysis.desktopEnter(`[版面]${this.selectedLayout.layoutName.trim()}`);
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onDragStart(obj, idx){
			this.dragFrom = idx;
			this.dragItem = obj;
		},
		onDragEnd() {
			this.dragItem = null;
		},
		/** 拖曳在頁簽上時，計算要插入的位置 */
		onDragOver(idx) {
			let elm = this.$refs.layouts[idx];
			let width = elm.clientWidth;
			this.dragTo = idx + (event.offsetX > width/2 ? 1 : 0);
		},
		/** 拖曳在頁簽上放開 */
		onDrop(idx) {
			this.layout.move(this.dragFrom, this.dragTo > this.dragFrom ? this.dragTo - 1 : this.dragTo);
		},
		displayInsertIcon(idx) {
			if (this.dragItem) {
				if (this.dragTo===idx) return true;
				if (this.dragTo===idx+1 && idx===this.layout.length-1) return true;
			}
		},

		/** 點擊版面按鈕 */
		onLayoutBtnClick(obj, idx) {
			if (obj.selected) {
				this.$refs.layouts[idx].setAttribute("contentEditable", true);
				this.$refs.layouts[idx].focus();
			}
			else {
				this.layout.forEach(obj=>this.$set(obj, 'selected', false));
				this.$set(obj, 'selected', true);
				if (!obj.layoutKey)
					obj.layoutKey = "".random();
				this.$store.state.desktop.dskDlgList = [];
			}
			// 桌機版統計
			M4C.Analysis.desktopEnter(`[版面]${obj.layoutName.trim()}`);

			// 設定為版面內連動時
			if (this.$store.state.config.syncMode === 'layout') {
				// 切換為本版面最後連動商品合約
				if (obj.selectedSymbolID)
					this.$store.commit("setSelectedSymbol", obj.selectedSymbolID);
				// 切換為本版面最後選擇的期權品種
				if (obj.optSelectedSymbol)
					this.$store.state.opt.selectedSymbol = obj.optSelectedSymbol;
			}
		},
		/** 版面按鈕離開focus */
		onLayoutBtnBlur(obj, idx) {
			let elm = this.$refs.layouts[idx];
			elm.setAttribute("contentEditable", false);
			obj.layoutName = elm.textContent.trim();
		},
		/** 在版面按鈕編輯狀態按下 Enter */
		onLayoutBtnEnter(obj, idx) {
			event.preventDefault();
			this.onLayoutBtnBlur(obj, idx);
			this.$refs.ctn.focus();
		},
	},
	watch: {
		// 記下本版面最後連動商品合約
		'$store.state.selectedSymbol.ID'(nv) {
			this.$set(this.$store.state.desktop.selectedLayout, 'selectedSymbolID', nv);
		},
		// 記下本版面最後選擇的期權品種
		'$store.state.opt.selectedSymbol'(nv) {
			this.$set(this.$store.state.desktop.selectedLayout, 'optSelectedSymbol', nv);
		},
	},
    computed: {
		layout() {
			return this.$store.state.desktop.layout;
		},
		layoutEditable() {
			return this.$store.state.desktop.layoutEditable;
		},
		selectedLayout() {
			return this.$store.state.desktop.selectedLayout;
		},
	},
}
</script>

<style scoped>
.desktop-layout-tabs {
	overflow-y: hidden;
	overflow-x: auto;
	white-space: nowrap;
}
.layout-btn {
	padding: 0 1em;
	/* margin-bottom: -0.2em; */
	/* flex-center */
	display: flex;
	align-items: center;
	justify-content: center;
}
.layout-btn:hover {
	color: aqua !important;
	cursor: pointer;
}
.layout-btn.selected {
	color: white !important;
	background-color: #242c3e;
}
</style>