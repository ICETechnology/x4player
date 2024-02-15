<template>
	<span ref="icon" class="icon-btn" @click="onIconClick"><i class="material-icons">local_hospital</i></span>
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 點擊圖示 */
		onIconClick() {
			this.$store.state.desktop.contextmenu.pop({
				list: [
					{'icon': 'add', 'label': '新增版面', onclick: this.createLayout},
					{'icon': 'delete', 'label': '删除版面', onclick: this.removeLayout},
					{'icon': 'tab_unselected', 'label': '隐藏页签', onclick: this.hideTabGroup},
					{'icon': 'import_export', 'label': '汇入/汇出/恢复预设', onclick: this.layoutImport},
					{'icon': 'apps', 'label': '可用元件列表', onclick: ()=>{this.$store.state.desktop.displayComponents = true;}},
				],
			});
		},
		/** 新增版面 */
		createLayout() {
			let newLayout = {
				layoutKey: "".random(),
				layoutName: `新版面${this.layout.length+1}`,
				selected: true,
			};
			this.layout.find(o=>o.selected).selected = false;
			this.layout.push(newLayout);
		},
		/** 刪除版面 */
		removeLayout() {
			let self = this;
			let layout = this.layout;
			let idx = layout.findIndex(o=>o.selected);
			let layoutName = layout[idx].layoutName;
			eventBus.$emit("CONFIRM-DIALOG", {
				content: `${self.$ln('确认删除版面')} ${layoutName} ?`,
				confirm: () => {
					layout.splice(idx, 1);
					layout[layout.length-1].selected = true;
				}
			});
		},
		/** 隱藏頁簽 */
		hideTabGroup() {
			this.$set(this.selectedLayout, 'hideTabGroup', !this.selectedLayout.hideTabGroup);
		},
		/** 彈出匯出匯入視窗 */
		layoutImport() {
			eventBus.$emit("POPUP-DIALOG", "DesktopLayoutImport");
		},
	},
	watch: {},
    computed: {
		layout() {
			return this.$store.state.desktop.layout;
		},
		selectedLayout() {
			return this.$store.state.desktop.selectedLayout;
		},
	},
}
</script>

<style scoped>
.layout-tools-ctn {
	position: fixed;
	width: 8em;
}
</style>