<template>
	<div class="menu-icon-ctn mgt1" @click="onClickMenu">
		<i class="material-icons tcef">menu</i>
	</div>
</template>
<script>
export default {
	methods: {
		onClickMenu() {
			// 未登入交易帳號 -> 彈出登入交易帳號視窗
			if (!M4C.Trader.checkLoginTrade()) return;
			// 顯示滑出式選單
			this.$store.state.status.showSideMenu = !this.$store.state.status.showSideMenu;
		},
		onLabelClick() {
			this.onClickMenu();
		}
	},
	watch: {
		"$store.state.status.showSideMenu"(nv){
			if(nv)
				eventBus.$emit("SLIDEINMENU");
			else 
				eventBus.$emit("SLIDEOUTMENU");
		}
	},
}
</script>
<style scoped>
</style>
