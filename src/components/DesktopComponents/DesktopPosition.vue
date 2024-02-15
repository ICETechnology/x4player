<template>
    <div class="FULL desktop-quote flex-col font-size-small">
		<!-- 工具列 -->
		<div class="flex-row">
			<div class="flex-1"></div>
			<div class="flex-row">
				<!-- 自選星星 -->
				<FavoriteIcon ref="favoriteIcon" class="icon-btn" :symbol="selectedObj.psd ? selectedObj.psd.SYMBOL : null" />
				<!-- 欄位設定 -->
				<ColumnConfigIcon ref="columnConfigIcon" :default="$store.state.desktop.positionDefaultColumns" :current="$store.state.desktop.positionColumns" class="icon-btn" />
				<!-- 重新查詢 -->
				<span class="icon-btn" @click="onRefresh" :title="`${$ln('重新查询')}`"><i class="material-icons">refresh</i></span>
			</div>
		</div>
		<div class="flex-1 posr scrolling-x scrolling-y">
			<!-- 狀態章 -->
			<Stamp v-if="positionList.length===0" :stampStatus="stampStatus" />
			<table class="desktop mw100p" cellspacing="0">
				<!-- 支持拖曳欄位，點擊排序 -->
				<DesktopTableHead :columns="$store.state.desktop.positionColumns" />
				<tbody>
					<DesktopPositionRow v-for="(psd, idx) in positionList" :psd="psd" :selectedObj="selectedObj" @contextMenu="onContextMenu" />
				</tbody>
			</table>
		</div>
    </div>
</template>

<script>
import Exercise from "@/components/Exercise.vue";
export default {
	props: [],
	data() {
		return {
			selectedObj: {psd: null},
		}
	},
	beforeMount() {
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onRefresh() {
			M4C.Position.queryPositionSum();
		},
		/** 反手 */
		onBtnOpposite() {
			this.$store.commit("setSelectedSymbol", this.sid);
			eventBus.$emit("POPUP-DIALOG", "OrderConfirmOpposite", this.psd);
		},
		/** 平倉按鈕 */
		onBtnClose() {
			this.$store.commit("setSelectedSymbol", this.sid);
			eventBus.$emit("ORDER", {
				// 台灣版本目前沒有對手價、排對價，因此平倉時帶限價委託別。
				orderType: this.twMode? 'LIMIT': 'HIT',
				orderQty: Math.abs(this.psd.$NET_QTY || this.psd.$QTY),
				positionEffect: 'CLOSE',
				disableBuy: this.twMode? false: true,
				disableSell: this.twMode? false: true,
			});
		},
		/** 行權 */
		onExercise() {
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", Exercise, {sid: this.sid}, {transName: 'float'});
		},
		/** 持倉加入風控 */
		onBtnAddRisk() {
			this.$set(this.psd, "SUM_DELTA_GAMMA", !this.psd.SUM_DELTA_GAMMA);
			M4C.Position.updateRisk();
		},
		// 止盈止損
		onBtnStopLoss() {
			// 有簽署雲端同意書才執行止盈止損功能
			if(M4C.SmoAgreement.checkAgreeSMO(true)){
				eventBus.$emit("POPUP-DIALOG", "StopLoss", this.psd);
			}
		},
		/** 右鍵選單 */
		onContextMenu(psd, obj, row) {
			let self = this;
			this.selectedObj.psd = psd;

			// 設定關注商品
			this.$store.commit("setSelectedSymbol", psd.SYMBOL);
			this.contextmenu.pop({
				list: [
					// 加減自選
					this.contextmenu.optFav(this.sid),
					// --- 分隔線 ---
					{'line': true},
					// 下單盒
					this.contextmenu.optOrder(()=>{eventBus.$emit("ORDER", {orderType: 'LIMIT'});}),
					// 反手
					this.psd ? {'icon': 'loop', 'label': '反手', onclick: self.onBtnOpposite} : null,
					// 平仓
					this.psd ? {'icon': 'playlist_add_check', 'label': '平仓', onclick: self.onBtnClose} : null,
					// 行權
					!this.psd.$IS_COMPOSITE && this.showExercise ? {'icon': 'run_circle', 'label': '行权', onclick: self.onExercise} : null,
					// 風控
					this.psd && this.enableRiskControl ? {'icon': 'https', 'label': '风控', onclick: self.onBtnAddRisk} : null,
					// 止盈止损
					this.psd && !this.hiddenSMO ? {'icon': 'call_missed_outgoing', 'label': '止盈止损', onclick: self.onBtnStopLoss} : null,
					// --- 分隔線 ---
					{'line': true},
					// 欄位設定
					this.contextmenu.optColumn(this.$refs.columnConfigIcon.onColumnConfig),
					// 重新查詢
					this.contextmenu.optRefresh(this.onRefresh),
				],
				param: this.sid,
			});
		},		
	},
	watch: {
	},
    computed: {
		contextmenu() {
			return this.$store.state.desktop.contextmenu;
		},
		/** 當前選擇的持倉 */
		psd() {
			return this.selectedObj.psd;
		},
		sid() {
			return this.psd.SYMBOL;
		},
		/** 所有委託回報 */
		positionList() {
			return this.$store.state.data.normalPositionSumList;
		},
		stampStatus() {
			return this.$store.state.result.queryPositionSumResult.$STATUS;
		},
		// 是否支援風控功能(https://trello.com/c/kHPjql5q/)
		enableRiskControl() {
			try{return this.$store.state.config.tradePdSetting.broker.enableRiskControl;}catch(e){}
		},
		// 當前帳號支持行權功能 (SIM 不支持)
		supportExercise() {
			return this.$store.state.login.brokerID !== "IceTech" && this.$store.state.config.CONFIG.ENABLE_EXERCISE;
		},
		//** 是否顯示行權功能 */
		showExercise() {
			// 多方期權持倉部位，且系統支援行權功能
			return this.supportExercise && (this.psd.$BQTY > 0) && (this.sid.indexOf("I.O.") === 0);
		},
		/** 是否隱藏SMO相關功能(By pdsetting) */
		hiddenSMO() {return this.$store.state.config.quotePdSetting.function.hiddenSMO;},
	},
}
</script>

<style scoped>
</style>