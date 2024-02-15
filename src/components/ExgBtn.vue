<template>
    <div class="exg-btn flex-1 head-selector-btn posr flex-start" @click="onClickBtn">
		<div class="FULL bg-ctn"></div>
		<div class="flex-row pdlr2 zindex-0">
			<span class="flex-1 label flex-start">{{exgName}}</span>
			<i class="material-icons">arrow_drop_down</i>
		</div>
    </div>
</template>

<script>
import ExgSelector from "@/components/ExgSelector.vue";

export default {
	props: ["only", 'value'],
	data() {
		return {
			paramConfig: {},
		}
	},
	beforeMount() {
		// 同步市場選單與顯示內容
		this.onQuoteTabID();
		if(this.only)
			this.$set(this.paramConfig, 'only', this.only);
		if(this.value)
			this.$set(this.paramConfig, 'selectID', this.value);
	},
    mounted() {
		// 自動開啟選單
		if (this.autoOpenSubMenu)
			this.onClickBtn();
	},
	beforeDestroy() {},
	components: {
		ExgSelector,
	},
    methods: {
		onClickBtn() {
			eventBus.$emit("POPUP-DIALOG", ExgSelector, this.paramConfig, {$HEAD:{title: this.$ln(`交易所选择`)}, transName: "float"});
			this.$store.state.sync.autoOpenSubMenu = false;
		},
		// 
		onQuoteTabID() {
			this.$store.state.status.quoteTabType = this.quoteTabType;
			this.$store.state.status.quoteTabName = this.exgName;
			// 期貨報價 / 選擇權T字報價
			if (this.$store.state.config.CONFIG.LAYOUT) {
				let marketLayout = this.$store.state.config.CONFIG.LAYOUT['market'].layout;
				if (this.quoteTabID === "OptionT")
					marketLayout.body = "OptionT";
				else
					marketLayout.body = "MixMarket";
			}
		}
	},
	watch: {
		/** 交易所改變 */
		quoteTabID(nv) {
			this.onQuoteTabID();
		},
		/** 自動開啟選單 */
		autoOpenSubMenu(nv) {
			if (nv) {
				this.onClickBtn();
			}
		},
		"paramConfig.selectID" (nv, ov){
			this.$emit("input", nv);
		},
	},
    computed: {
		quoteTabName() {
			if(this.value) return this.value;
			else
				return this.$store.state.status.quoteTabName;
		},
		/** 交易所ID */
		quoteTabID() {
			if(this.value) return this.value;
			else
				return this.$store.state.status.quoteTabID;
		},
		/** 當前選擇模式： 庫存("pos") or 自選("sel") or 交易所("exg") */
		quoteTabType() {
			if (this.quoteTabID === "position")
				return "pos";
			else if (this.quoteTabID.indexOf("selfselect.idx.") != -1)
				return "sel";
			else if (this.quoteTabID.indexOf("Option") != -1)
				return "opt";
			else if (this.quoteTabID.indexOf("focus") != -1)
				return "focus";
			else
				return "exg";
		},
		/** 當前選擇下的 exgName */
		exgName() {
			// 庫存
			if (this.quoteTabType === "pos") {
				return this.$ln(`我的库存`);
			}
			// 自選
			else if (this.quoteTabType === "sel") {
				let idx = this.quoteTabID.split(".")[2];
				// 籂選對應群組
				let group = this.$store.state.data.ssgList.find((ssGrp)=>{
					return ssGrp.idx == idx;
				});
				
				if(group) return group.label;
				// 找不到對應群組以預設自選群組顯示
				else {
					this.$store.commit("setQuoteTabID", "selfselect.idx.0");
					return this.$store.state.data.ssgList[0].label;
				}
			}
			// 關注
			else if (this.quoteTabType === "focus") {
				return this.$ln("关注");
			}
			// 选择权T
			else if (this.quoteTabID === "OptionT") {
				return this.$ln(`选择权T字报价`);
			}
			// 选择权T
			else if (this.quoteTabID === "FUTHOTLIST") {
				return this.$ln(`期货主力合约`);
			}
			// 交易所
			else {
				return M4C.Symbol.getExgNameByExgId(this.quoteTabID);
			}
		},
		autoOpenSubMenu() {
			return this.$store.state.sync.autoOpenSubMenu;
		},
	},
}
</script>

<style scoped>
</style>