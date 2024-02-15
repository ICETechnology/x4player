<template>
    <div class="FULL desktop-tab-group flex-col font-size-mini">
		<div class="head flex-row" v-if="displayTab">
			<div class="flex-row">
				<!-- 頁簽 -->
				<span ref="tabs" class="tab-btn pd0d5 pdlr4 flex-center posr nowrap" v-for="(obj, idx) in coms" :class="{selected: obj.selected}" @click="onTabClick(obj)"
					:draggable="layoutEditable" @dragstart="onDragStart(obj)" @dragend="onDragEnd"
					@dragleave.prevent="dragIndex = -1" @dragover.prevent="onDragOver(idx)" @drop="onDrop(idx)">
						<!-- 插入箭頭圖示 -->
						<i class="material-icons insert-icon" v-if="displayInsertIcon(idx)" :class="{'icon-right': idx===coms.length-1 && dragIndex===idx+1}">forward</i>
						{{tabLabel(obj)}}
					</span>
			</div>
			<!-- 頁簽中央空白區域 -->
			<div class="flex-1" @drop="onDrop" @dragover.prevent="onDragOver(-1)" @dragleave.prevent="dragIndex = -1"></div>
			<!-- 頁簽右方功能按鈕 -->
			<div class="flex-row flex-center">
				<!-- 期權雲幫助圖示 -->
				<span v-if="selectedCom.comClass === 'OCContainer'" class="icon-btn" @click="onBtnHelp" :title="`${$ln('说明帮助')}`"><i class="material-icons">help</i></span>
				<!-- 隐藏页签 -->
				<span v-if="layoutEditable && !max" class="icon-btn" @click="onBtnHideTab" :title="`${$ln('隐藏页签')}`"><i class="material-icons">minimize</i></span>
				<!-- 移除元件 -->
				<span v-if="layoutEditable && !max" class="icon-btn" @click="onBtnRemove" :title="`${$ln('移除此元件')}`"><i class="material-icons">cancel</i></span>
				<!-- 放大 -->
				<span v-if="!max" class="icon-btn" @click="onBtnMax" :title="`${$ln('放大')}`"><i class="material-icons">call_made</i></span>
				<!-- 關閉 (放大模式時) -->
				<span v-if="max" class="icon-btn" @click="onBtnMin" :title="`${$ln('恢复')}`"><i class="material-icons">call_received</i></span>
			</div>
		</div>
		<div class="body flex-1 posr overflow-hidden" v-if="selectedCom">
			<component v-if="show" class="FULL" :is="selectedCom.comClass" :param="selectedCom.comParam" 
				:key="selectedCom.UCID" :ucid="selectedCom.UCID" theme="dark" />
			<i v-if="layoutEditable && !displayTab" class="material-icons icon-display-tab" @click="onBtnHideTab">reply</i>
			<!-- 可拖放區域 -->
			<DesktopContainerDropper v-if="dragCom" class="FULL" @onDrop="onDropDropper" />
		</div>
    </div>
</template>

<script>
export default {
	props: ['coms', 'max', 'hideTab'],
	data() {
		return {
			dragIndex: -1,
			show: false,
		}
	},
	beforeMount() {},
    mounted() {
		// 延遲載入元件以避免元件啟動過重影響切換版面效果
		setTimeout(()=>{this.show = true;}, 100);
		// 桌機版統計
		M4C.Analysis.desktopEnter(this.tabLabel(this.selectedCom));
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onDropDropper(flex, side) {
			this.$emit('onDrop', flex, side);
		},
		onDragStart(obj){
			// 需要延遲以正確觸發 draggable 功能
			setTimeout(()=>{
				this.$store.state.desktop.dragCom = obj;
				this.$store.state.desktop.dragCtn = this.$parent;
			}, 100);
		},
		onDragEnd() {
			this.$store.state.desktop.dragCom = null;
			this.$store.state.desktop.dragCtn = null;
		},
		onTabClick(obj) {
			this.coms.forEach(o=>o.selected = false);
			obj.selected = true;
		},
		onBtnHelp() {
			eventBus.$emit("POPUP-DIALOG", 'OptCloudHelper',
				{id: this.selectedCom.comParam.comClass, name: `${this.selectedCom.label}${this.$ln('说明')}`}, {transName: 'float'});
		},
		/** 移除元件 */
		onBtnRemove() {
			let self = this;
			let com = this.coms[this.selectedIdx];
			eventBus.$emit("CONFIRM-DIALOG", {
				content: `${self.$ln('确认删除页签')} ${self.tabLabel(com)}`,
				confirm: () => {
					self.coms.splice(this.selectedIdx, 1);
					if (self.coms.length)
						self.coms[0].selected = true;
				}
			});
		},
		/** 放大 */
		onBtnMax() {
			this.$store.state.desktop.maxTabComs = this.coms;
		},
		/** 縮回 */
		onBtnMin() {
			this.$store.state.desktop.maxTabComs = null;
		},
		onBtnHideTab() {
			this.$emit('hideTab');
		},
		/** 拖曳在頁簽上時，計算要插入的位置 */
		onDragOver(idx) {
			// 放在最後面(最右邊)
			if (idx === -1) {
				this.dragIndex = this.$refs.tabs.length;
				return;
			}
			let elm = this.$refs.tabs[idx];
			let width = elm.clientWidth;
			this.dragIndex = idx + (event.offsetX > width/2 ? 1 : 0);
		},
		/** 拖曳在頁簽上放開 */
		onDrop(idx) {
			let removeIdx = this.dragCtn.removeCom(this.dragCom);
			let insertIdx = this.dragCtn === this.$parent && removeIdx < this.dragIndex ? (this.dragIndex - 1) : this.dragIndex;
			this.coms.splice(insertIdx, 0, this.dragCom);
			this.onTabClick(this.dragCom);
		},
		displayInsertIcon(idx) {
			if (this.dragCom) {
				if (this.dragIndex===idx) return true;
				if (this.dragIndex===idx+1 && idx===this.coms.length-1) return true;
			}
		},
		tabLabel(obj) {
			if (obj.label)
				return this.$ln(obj.label);
			if (this.comMap && this.comMap[obj.key || obj.comClass])
				return this.$ln(this.comMap[obj.key || obj.comClass].label);
			return obj.comClass;
		},

		onMouseDown(e) {
			this.$emit('tabMouseDown', e);
		},
		onMouseMove(e) {
			this.$emit('tabMouseMove', e);
		},
		onMouseUp(e) {
			this.$emit('tabMouseUp', e);
		},
	},
	watch: {
		selectedCom(nv) {
			// 桌機版統計
			M4C.Analysis.desktopEnter(this.tabLabel(this.selectedCom));
		},
	},
    computed: {
		comMap() {
			return this.$store.state.desktop.comMap;
		},
		dragCtn() {
			return this.$store.state.desktop.dragCtn;
		},
		dragCom() {
			return this.$store.state.desktop.dragCom;
		},
		/** 當前選擇的元件 Obj */
		selectedCom() {
			return this.coms.find(o=>o.selected);
		},
		/** 當前選擇的元件 Idx */
		selectedIdx() {
			let idx = this.coms.findIndex(o=>o.selected);
			// 保持有元件被選中
			if (idx === -1) {
				this.coms[0].selected = true;
				idx = 0;
			}
			return idx;
		},
		selectedLayout() {
			return this.$store.state.desktop.selectedLayout;
		},
		layoutEditable() {
			return this.$store.state.desktop.layoutEditable;
		},
		layoutName() {
			return this.$store.state.desktop.selectedLayout.layoutName.trim();
		},
		displayTab() {
			return !(this.selectedLayout.hideTabGroup || this.hideTab);
		},
	},
}
</script>

<style scoped>
.desktop-tab-group {
	background-color: #1C2333;
}
.head {
	background-color: #121929;
	height: 1.65em;
}
.tab-btn {
	z-index: 2;
	background-color: #161c28;
}
.tab-btn.selected {
	color: white !important;
	background-color: #242c3e;
}
.tab-btn:hover {
	color: aqua;
	cursor: pointer;
}

.desktop .desktop-tab-group .material-icons {
	font-size: 1.5em;
}
/** 桌機圖示按鈕樣式 */
.desktop .desktop-tab-group .icon-btn {
	width: auto;
	height: auto;
	color: #555;
	/* flex-center */
	display: flex;
	align-items: center;
	justify-content: center;
}
.desktop .desktop-tab-group .icon-btn:hover {
	color: aqua;
	background-color: #555;
	cursor: pointer;
}
/** 恢復隱藏的頁簽 */
.desktop .icon-display-tab {
	position: absolute;
	top: 0;
	right: 0;
	cursor: pointer;
	font-size: 10px !important;
}
.desktop .icon-display-tab:hover {
	color: aqua;
}
</style>