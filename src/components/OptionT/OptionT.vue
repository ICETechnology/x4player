<template>
    <div class="flex-col option-t-ctn">
		<div class="flex-1 flex-col">
			<div class="flex-row tcef zindex-1">
				<!-- 桌機版情境讓標的物元件置中用 -->
				<div v-if="isDesktop" class="mgl1 flex-center">
					<!-- 桌機版選擇權商品選擇器 -->
					<DesktopOptionSymbolSelector />
				</div>
				<!-- 手機版標的物 (期貨期權時不顯示，因為會顯示在個別月份之下) -->
				<div v-if="!$store.state.opt.isFeatureOption" class="posr mglr5 flex-col" :class="[{'mgtb2': !isDesktop}, {'hidden': isDesktop}]">
					<OptionUnderlying :selectedMonth="month" :suspend="suspend"/>
				</div>
				<!-- 桌機版標的物 -->
				<DesktopOptionUnderlyingTable v-if="isDesktop" class="mg2 underlying-table" />
			</div>
			<!-- T字報價表格 -->
			<div class="flex-1 posr">
				<OptionTable class="FULL" :contracts="contracts" :columns="columnsConfig" :key="reRanderKey"
					:suspend="suspend" @onBtnTrade="popupPlotOrder" @config="displayConfig = true" />
			</div>
		</div>
		<!-- 設定 -->
		<OptionTConfig v-if="displayConfig" @close="displayConfig = false" />
    </div>
</template>

<script>
import OptionSelector from "@/components/OptionT/OptionSelector.vue";
import OptionUnderlying from "@/components/OptionT/OptionUnderlying.vue";
import OptionTable from "@/components/OptionT/OptionTable.vue";
import DesktopOptionUnderlyingTable from "@/components/DesktopComponents/DesktopOptionUnderlyingTable.vue";
import OptionTConfig from "@/components/OptionT/OptionTConfig.vue";

export default {
	props: ["suspend"],
	data() {
		return {
			reRanderKey: 0,
			displayConfig: false,
			reverse: false,
			contracts: {},
		}
	},
	beforeMount() {
		this.updateContracts();
	},
    mounted() {
		// 新手教學
		eventBus.$emit("HEPLER", "option");
	},
	beforeDestroy() {},
	components: {
		OptionSelector,
		OptionUnderlying,
		OptionTable,
		DesktopOptionUnderlyingTable,
		OptionTConfig,
	},
    methods: {
		/** 點擊策略按鈕，彈出策略下單盒 */
		onBtnPlotOrder(event) {
			this.popupPlotOrder();
		},
		/** 點擊快速連動策略下單四顆按鈕 */
		popupPlotOrder(strategyName) {
			eventBus.$emit("POPUP-DIALOG", PlotOrder, {
				sid: this.sid,
				underlying: this.underlying,
				selectedMonth: this.month,
				contracts: this.contracts,
				strategyName: strategyName,
			});
		},
		// 建立/更新要展現的 contracts (由於內容會被變動，因此不能用 computed 的)
		updateContracts() {
			this.contracts = JSON.parse(JSON.stringify(this.$store.state.opt.contracts));
			// 移除熱門月
			delete this.contracts.HOT;
			// 不顯示除權息合約
			for (let key in this.contracts) {
				let obj = this.contracts[key];
				// 不顯示除權息時要過濾掉 (原始內容是包含除權息合約預設是有顯示)
				if (!this.displayPRIADJ) {
					obj.C = obj.C.filter(o=>!M4C.Symbol.getMainformInfo(o).SetPRIADJ);
					obj.P = obj.P.filter(o=>!M4C.Symbol.getMainformInfo(o).SetPRIADJ);
				}
				// 移除已經算出來的價平N檔 (重算)
				delete obj.closedContracts;
			}
		},
	},
	watch: {
		'$store.state.opt.contracts'(nv) {
			this.updateContracts();
		},
		displayPRIADJ(nv) {
			this.updateContracts();
		},
		// 商品切換時
		underlyingS() {
			// 強制刷新 OptionTable (避免捲軸殘留/異常)
			this.reRanderKey++;
			// reset 橫向捲軸顯示基準點
			this.$store.state.optionT.scollOnIndex = 0;
		},
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		optColumnsID() {
			return this.twMode ? 'columnsV3' : 'columnsCN';
		},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		sid() {
			return this.$store.state.opt.selectedSymbol;
		},
		minfo() {
			return this.$store.state.opt.selectedMainformInfo;
		},
		displayPRIADJ() {
			return this.$store.state.opt.displayPRIADJ;
		},
		/** 當前選擇月份 */
		month() {
			let sid = this.contracts.C ? this.contracts.C[0] : "";
			let tmp = sid.split('.');
			return tmp[4] || "";
		},
		// 標的物現價
		underlyingPrice() {
			return this.$store.state.opt.underlyingSQO.p;
		},
		underlyingS() {
			return this.$store.state.opt.underlyingS;
		},
		columnsConfig() {
			return this.$store.state.opt[this.optColumnsID].filter(col => {
				return !col.hide;
			});
		},
		fontSizeRatio() {
			return this.$store.state.desktop.selectedLayout.fontSizeRatio;
		},
		displayExchangeName() {
			try{return M4C.Symbol.getExgNameByExgId(this.minfo.Exchange);}catch(e){}
		},
	},
}
</script>

<style scoped>
.option-selector-ctn {
	max-width: 310px;
	overflow: auto;
}

@media screen and (max-height: 620px) {
	.option-t-ctn /deep/ .option-underlying-ctn {
		padding-top: 1vw;
		padding-bottom: 1vw;
	}
}
.underlying-table {
	border: 1px solid #333;
	border-radius: 0.3em;
	box-sizing: border-box;
}
</style>