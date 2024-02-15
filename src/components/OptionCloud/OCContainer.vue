<template>
    <div class="FULL">
		<component class="FULL" :is="componentID" :ucid="ucid"
			@clickCallback="onClickCallback"
			@infoClickCallback="onInfoClickCallback"
			:theme="'x4desktop'"
			:lang="langCode"
			:outerSelectedSymbol="param.noOuterSelectedSymbol ? null : $store.state.outerSelectedSymbol"
			:filterOptions="filterOptions"
			:hideHeader="param.noOuterSelectedSymbol ? false : true"
			:fontSize="$store.state.fontSizePX.mini"
			v-bind="propObj"
			/>
    </div>
</template>

<script>
import OCContainerBase from '@/components/OCContainer.base.js'
export default {
    mixins: [OCContainerBase],
	props: ['param', 'ucid'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 從期權雲發出的連動 -> 轉為品種代碼後連動回給所有期權雲元件 */
		onClickCallback(param) {
			if (param.symbol) {
				let symbolSID = param.symbol.split('.').slice(0,4).join('.');
				// 對應回以 [當前連動商品] 為 [標的] 的 [品種代碼]
				let sid = this.$store.state.outerSelectedSymbol = M4C.Symbol.reverseUnderlying(symbolSID);
				console.log('OCContainer onClickCallback :', symbolSID, '-> outerSelectedSymbol :', sid);
				// 先把品種代碼轉合約代碼 -> 再設定關注商品
				let contractID = M4C.Symbol.toContractID(param.symbol);
				this.$store.commit("setSelectedSymbol", contractID);
			}
		},
		/** 從期權雲發出來 -> 要彈出期權雲說明 */
		onInfoClickCallback(param) {
			eventBus.$emit("POPUP-DIALOG", 'OptCloudHelper',
				{id: param.id, name: `${param.name}${this.$ln('说明')}`}, {transName: 'float'});
		},
	},
	watch: {},
    computed: {
		/** 元件 class (OCContainerBase 也要用) */
		componentID() {
			return this.param.comClass;
		},
		/** 要帶給 vue-option-cloud 的語系代號 */
		langCode() {
			switch(this.$store.state.lang.language) {
				case "zh":		return "zh-CN";
				case "zh-TW":	return "zh-TW";
				case "en":		return "en";
			}
		},
		/** 動態 prop 內容 */
		propObj() {
			// 支持從 config 的 COMPONENT 直接設定
			let obj = Object.assign({}, this.param);
			delete obj.comClass;
			// 支持寫死特定元件套用特定參數 (比較不用又要更新預設版面)
			switch(this.param.comClass) {
				case 'IVVariety':		// 波動率
					obj.chartDisplayType = 'select';
					break;
				case 'ImpliedSurface':	// 隐波曲面
					obj.chartDisplayType = 'select';
					break;
				case 'PriceVolume':		// 价量叠图
					obj.optionDisplayType = 'dialog';
					obj.shrinkIndicatorLabel = true;
					break;
			}
			return obj;
		},
	},
}
</script>

<style scoped>
</style>