<template>
    <div class="option-selector-btn-ctn">
		<div class="head-selector-btn posr flex-start" @click="displaySelector=true">
			<div class="FULL bg-ctn"></div>
			<div class="flex-row pdlr2 zindex-0 h10vw flex-start">
				<div class="label">{{optionSelected.label}}</div>
				<i class="material-icons">arrow_drop_down</i>
			</div>
		</div>
		<!-- 棋盤選擇器 -->
		<ChessBoardSelector v-if="displaySelector" :options="optionList" v-model="optionSelected" @close="displaySelector=false"/>
    </div>
</template>

<script>
import Vue from 'vue';
export default {
	props: [],
	data() {
		return {
			/** 選單列表(響應式) */
			optionList: [],
			/** 當前選擇的選項 */
			optionSelected: null,
			/** 是否彈出選擇器 */
			displaySelector: false,
		}
	},
	beforeMount() {
		// 要求連動的商品 > 最後停留的商品
		let selectedSymbol = this.$store.state.opt.linkSymbol || this.$store.state.opt.selectedSymbol;
		let exgList = M4C.Symbol.getClassification("OPT");
		exgList.forEach((exgObj)=>{
			exgObj.Node.forEach((symbolObj)=>{
				let option = {
					'label': symbolObj[`${this.langCode}_M`] || symbolObj[this.langCode],
					'value': symbolObj,
				};
				this.optionList.push(option);
				// 支持預設切至指定的商品 (一次性)
				if (!this.optionSelected && selectedSymbol === M4C.Symbol.getOptPureSymbol(symbolObj)) {
					option.selected = true;
					this.optionSelected = option;
				}
			});
		});
		// 無指定時，預設選在第一個選項
		if (!this.optionSelected) {
			this.optionList[0].selected = true;
			this.optionSelected = this.optionList[0];
		}
		// 清空指定連動的商品
		this.$store.state.opt.linkSymbol = "";
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {
		// 商品切換
		optionSelectedValue(symbolObj) {
			// 此商品所對應的所有合約 ex. {"202004": {"C":[...], "P"::[...]}, "202005": {"C"::[...], "P"::[...]},...}
			let contracts = {}, firstSidList;
			symbolObj.Node.forEach((monthObj)=>{
				let obj = contracts[monthObj.ENG] = {};
				obj.C = monthObj.Node[0].Contracts;
				obj.P = monthObj.Node[1].Contracts;
				firstSidList = firstSidList || obj.C;
			});
			// 當前期權所有合約
			this.$store.state.opt.contracts = contracts;
			// 當前期權商品代碼
			let sid = this.$store.state.opt.selectedSymbol = M4C.Symbol.getOptPureSymbol(symbolObj);
			let minfo = M4C.Symbol.getMainformInfo(sid);
			// 當前期權商品總表
			this.$store.state.opt.selectedMainformInfo = minfo;
			// 當前期權標的物物件 (minfo.Underlying)
			this.$store.state.opt.underlying = minfo ? minfo.Underlying : {};
			// 當前期權履約價間隔 (策略下單盒要用)
			let strike0 = M4C.Symbol.getStrike(firstSidList[0]);
			let strike1 = M4C.Symbol.getStrike(firstSidList[1]);
			M4C.Symbol.setCurStrikePriceStep(+Big(strike1).minus(strike0));
		},
	},
    computed: {
		langCode() {
			return this.$store.state.lang.mainformLangKey;
		},
		optionSelectedValue() {
			return this.optionSelected ? this.optionSelected.value : [];
		},
	},
}
</script>

<style scoped>
</style>