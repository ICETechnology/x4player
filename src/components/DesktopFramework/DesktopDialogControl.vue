<template>
    <div class="hidden" />
</template>

<script>
import OrderModeSwitch from "@/components/Order/OrderModeSwitch.vue"
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		// this.$store.state.desktop.popupDialog = this.popupDialog;
	},
    mounted() {
		let self = this;
		// 呼叫彈出式下單盒 (利用這邊來統一/簡化所有彈出下單盒的參數)
		eventBus.$on("ORDER", (comParam)=>{
			// 未登入交易帳號 -> 彈出登入交易帳號視窗
			if (!M4C.Trader.checkLoginTrade()) return;
			eventBus.$emit("POPUP-DIALOG", 'FloatOrder', comParam, {moreBtns: [OrderModeSwitch]});
		});
		// 支持全域彈窗事件
		eventBus.$on("POPUP-DIALOG", (comClass, comParam, config)=>{
			self.popupDialog({'comClass': comClass, 'comParam': comParam, 'UCID': "".random(16), 'selected': true, 'config': config, 'position': {}});
			history.pushState({isPortrait: true}, '');
		});
		// 支持全域關閉彈窗事件
		eventBus.$on("CLOSE-DIALOG", (dialog)=>{
			if (dialog && dialog.onClose)
				dialog.onClose();
			else
				this.dskDlgList.pop();
		});
	},
	beforeDestroy() {},
	components: {},
    methods: {
		popupDialog(dskDlgObj) {
			// 已存在此元件彈窗時，僅更新元件參數
			let existObj = this.dskDlgList.find(o=>o.comClass === dskDlgObj.comClass);
			if (existObj) {
				existObj.comParam = dskDlgObj.comParam;
				return;
			}
			this.dskDlgList.forEach(o=>o.selected = false);
			this.$set(dskDlgObj, 'selected', true);
			this.dskDlgList.push(dskDlgObj);
		},
	},
	watch: {},
    computed: {
		layout() {
			return this.$store.state.desktop.layout;
		},
		selectedLayout(){
			return this.layout.find(obj=>obj.selected);
		},
		dskDlgList() {
			// if (!this.selectedLayout.dskDlgList)
			// 	this.$set(this.selectedLayout, 'dskDlgList', []);
			// return this.selectedLayout.dskDlgList;
			return this.$store.state.desktop.dskDlgList;
		},
	},
}
</script>

<style scoped>
</style>