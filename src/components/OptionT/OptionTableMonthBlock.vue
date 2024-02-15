<template>
	<div class="option-table-month-block flex-col">
		<!-- 月份列看到的內容是從 OptionTStrikePriceMonthBlock 延伸出去的，因此這邊是空的僅佔高度用 -->
		<div class="tr flex-center bgc-opt-mth-line font-size-small" :class="{'expand': monthExpand, 'is-feature-option': $store.state.opt.isFeatureOption}"></div>
		<div class="flex-1" v-if="monthExpand">
			<table>
				<tbody>
					<OptionTableTr class="font-size-micro" v-for="(sid, idx) in closedContracts" :key="`OptionTableTr-${CP}-${idx}`"
						:sid="sid" :columns="columns" :class="{'bgc-opt-gray': compareSP(sid),'font-size-big font-bold':$store.state.config.largeSize}" @contextMenu="onContextMenu" />
				</tbody>
			</table>
		</div>
	</div>
</template>

<script>
import OptionTableTr from "@/components/OptionT/OptionTableTr.vue";

export default {
	props: ["month", "closedContracts", "columns", "CP", "closedSP"],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {
		OptionTableTr,
	},
    methods: {
		/** 比對履約價，搭配 C/P 來決定背景是否變色 */
		compareSP(sid) {
			let thisSP = Number(M4C.Option.getStrike(sid));
			if (this.CP==="C" && thisSP <= this.closedSP)
				return true;
			else if (this.CP==="P" && thisSP > this.closedSP)
				return true;
		},
		/** 右鍵選單 */
		onContextMenu(sid, obj, row) {
			let self = this;
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", sid);
			this.$store.state.desktop.contextmenu.pop({
				list: [
					// 加入移除自選
					this.contextmenu.optFav(sid),
					// --- 分隔線 ---
					{'line': true},
					// 下單盒
					this.contextmenu.optOrder(()=>{row.popupOrder(obj)}),
					// 策略下單盒
					{'icon': 'gps_fixed', 'label': '策略下单盒', onclick: ()=>{
						self.$parent.$parent.$refs.strikeCtn.find(vueCom=>vueCom.month === self.month).popupPlotOrder();
					}},
					// --- 分隔線 ---
					{'line': true},
					// 欄位設定
					this.contextmenu.optColumn(this.$parent.$parent.$refs.columnConfigIcon.onColumnConfig),
					// 展開數量
					{'icon': 'settings', 'label': '展开数量', onclick: this.$parent.$parent.$refs.expandCntSelect.popupSelectDialog},
				],
				param: this.sid,
			});;
		},
	},
	watch: {},
    computed: {
		contextmenu() {
			return this.$store.state.desktop.contextmenu;
		},
		/** 本 [商品+月份] 是否展開 */
		monthExpand() {
			let key = this.expandMapKey;
			return this.$store.state.opt.expandMap[key];
		},
		/** [商品+月份] 是否展開的 Key */
		expandMapKey() {
			if (!this.$store.state.opt.underlyingS)
				return "";
			let contractID = this.$store.state.opt.underlyingS;
			let symbolID = contractID.split('.').splice(0,4).join('.');
			return `${symbolID}.${this.month}`;
		},
	},
}
</script>