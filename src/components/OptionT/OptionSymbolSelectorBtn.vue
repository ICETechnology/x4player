<template>
    <div class="option-selector-btn-ctn">
		<!-- 手機版 -->
		<div v-if="!isDesktop" class="head-selector-btn posr flex-start" @click="onClickBtn">
			<div class="FULL bg-ctn"></div>
			<div class="flex-row pdlr2 zindex-0 h10vw flex-start">
				<div class="label">{{selectedSymbolName}}</div>
				<i class="material-icons">arrow_drop_down</i>
			</div>
		</div>
		<!-- 桌機版 -->
		<div v-if="isDesktop" class="head-selector-btn flex-row flex-start" @click="onClickBtn">
			<div class="flex-1 pdlr2 nowrap">{{selectedSymbolName}}</div>
			<i class="material-icons">keyboard_arrow_down</i>
		</div>
    </div>
</template>

<script>
import OptionSymbolSelector from "@/components/OptionT/OptionSymbolSelector.vue";

export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		// 仍無選擇商品時，預設選取第一個交易所的第一檔商品
		if (!this.$store.state.opt.selectedSymbol) {
			M4C.Option.setFirstSymbol();	// 內含 M4C.Option.onSelectedSymbol
		}
		// 尚無選擇商品對應的合約內容時 (有儲存最後選的商品情境)
		else if (Object.keys(this.$store.state.opt.contracts).length === 0) {
			M4C.Option.onSelectedSymbol();
		}
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onClickBtn() {
			eventBus.$emit("POPUP-DIALOG", OptionSymbolSelector, {}, {$HEAD:{title:'商品选择'}, transName: 'float'});
		},
	},
	watch: {},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		/** 當前選擇商品代碼 */
		selectedSymbol() {
			return this.$store.state.opt.selectedSymbol;
		},
		/** 當前選擇商品的名稱 */
		selectedSymbolName() {
			return M4C.Symbol.getContractName(this.selectedSymbol);
		},
	},
}
</script>

<style scoped>
</style>