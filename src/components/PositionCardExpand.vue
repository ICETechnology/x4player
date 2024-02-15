<template>
	<div class="expand-ctn flex-row flex-center">
		<i v-if="!psd.$IS_COMPOSITE && isAvailable" class="material-icons tcef md-30 mgl3" @click.stop="onBtnChart">score</i>
		<div class="flex-1"></div>
		<div v-if="!psd.$IS_COMPOSITE && !twMode" class="rbtn w20vw mgl2 tcef" @click.stop="onBtnDetail">{{$ln(`明细`)}}</div>
		<!-- 非組合持倉且不是證券才提供反手功能(有已行權數量時顯示disable樣式，但可執行onClick) -->
		<div v-if="!psd.$IS_COMPOSITE && !isStockItem && isAvailable" class="rbtn w20vw mgl2 tcef" @click.stop="onBtnOpposite">{{$ln(`反手`)}}</div>
		<div class="rbtn w20vw mgl2 tcef" v-if="isAvailable" @click.stop="onBtnClose">{{$ln(`平仓`)}}</div>
		<div v-if="enableOneClickRollover" class="rbtn w20vw mgl2 tcef" @click.stop="onBtnOneClickRollover">{{$ln(`一鍵轉倉`)}}</div>
		<div v-if="!psd.$IS_COMPOSITE && enableExercise" class="rbtn w20vw mgl2 tcef" @click.stop="onExercise">{{$ln(`行权`)}}</div>
		<div v-if="!hiddenSMO && !psd.$IS_COMPOSITE && !isStockItem && isAvailable" class="rbtn w20vw mgl2 tcef" :class="{'disabled-ui': !isAgreeSMO}" @click.stop="onBtnStopLoss">{{$ln(`止盈止损`)}}</div>
	</div>
</template>

<script>
import Exercise from "@/components/Exercise.vue";
import PositionCardDetail from "@/components/PositionCardDetail.vue";
import CompositePositionCloseBox from "@/components/CompositePositionCloseBox.vue";
import OneClickRollover from "@/components/OneClickRollover.vue";
export default {
	props: ['sid', 'psd'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {Exercise},
    methods: {
		/** 反手 */
		onBtnOpposite() {
			this.$store.commit("setSelectedSymbol", this.sid);
			eventBus.$emit("POPUP-DIALOG", "OrderConfirmOpposite", this.psd, {transName: 'float'});
		},
		// 止盈止損
		onBtnStopLoss() {
			if(M4C.SmoAgreement.checkAgreeSMO(true))
				eventBus.$emit("POPUP-DIALOG", "StopLoss", this.psd, {transName: 'float'});
		},
		//** 點擊彈出行權設定頁 */
		onExercise() {
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", Exercise, {sid: this.sid}, {transName: 'float'});
		},
		/** 平倉按鈕 */
		onBtnClose() {
			this.$store.commit("setSelectedSymbol", this.sid);
			// 複式選擇權 -> 彈出複式選擇權平倉盒
			if (this.psd.$IS_COMPOSITE) {
				eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: CompositePositionCloseBox, param: {psd: this.psd}});
				return;
			}
			eventBus.$emit("ORDER", {
				// 台灣版本目前沒有對手價、排對價，因此平倉時帶限價委託別。
				orderPrice: this.psd.SETTLEMENT_PRICE,
				orderType: this.twMode? 'LIMIT': 'HIT',
				orderQty: Math.abs(this.psd.$NET_QTY || this.psd.$QTY),
				positionEffect: 'CLOSE',
				disableBuy: this.twMode? false: true,
				disableSell: this.twMode? false: true,
			});
		},
		// 一鍵轉倉
		onBtnOneClickRollover() {
			eventBus.$emit("POPUP-DIALOG", OneClickRollover, {psd: this.psd}, {transName: 'float'});
		},
		/** 線圖按鈕 */
		onBtnChart() {
			// 總表沒有這檔商品不支援其他操作功能。
			if(!this.supportItem) return;
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 期權商品多處理opt.selectedSymbol切換
			if(this.sid.split('.')[1] == 'O'){
				this.$store.state.opt.selectedSymbol = this.sid.split('.').slice(0, 4).join('.');
			}
			// 查看底層是否有 QuotePage 和 TvcKbar，決定關幾層
			let closeDialog = 0;
			this.$store.state.popup.dialogList.forEach( dialog => {
				if(dialog.cls == 'QuotePage') {
					closeDialog = 1;
				} else if(dialog.cls == 'TvcKbar') {
					closeDialog = 2;
				}
			});
			// 關一層、兩層或直接彈商品頁
			if(closeDialog == 1) {
				eventBus.$emit("CLOSE-DIALOG");
			} else if(closeDialog == 2) {
				eventBus.$emit("CLOSE-DIALOG");
				eventBus.$emit("CLOSE-DIALOG");
			} else {
				eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: this.sid});
			}
			// 以免沒切線圖
			this.$store.state.status.mixChartActivComclass = "TvcLine";
		},
		/** 明細按鈕 */
		onBtnDetail() {
			eventBus.$emit('POPUP-DIALOG', PositionCardDetail, {'psd': this.psd}, {transName: 'float'});
		}
	},
	watch: {},
    computed: {
		twMode(){
			return this.$store.state.config.CONFIG.OPERATING_MODE === 'tw';
		},
		isStockItem() {
			return this.sid.indexOf('I.S') == 0;
		},
		//** 是否顯示行權功能 */
		enableExercise() {
			// 多方期權持倉部位，且系統支援行權功能
			return this.supportExercise && (this.psd.$BQTY > 0) && (this.sid.indexOf("I.O.") === 0);
		},
		// 當前帳號支持行權功能 (SIM 不支持)
		supportExercise() {
			return this.$store.state.login.brokerID !== "IceTech" && this.$store.state.config.CONFIG.ENABLE_EXERCISE;
		},
		// 當前交易帳號的pdsetting
		acPdSetting() {
			return this.$store.state.config.tradePdSetting;
		},
		// 總表
		minfo() {
			return M4C.Symbol.getMainformInfo(this.sid);
		},
		/** 總表沒有這檔商品不支援。 */
		supportItem() {
			return !!this.minfo;
		},
		/** 是否有簽署雲端條件單同意書 */
		isAgreeSMO() {
			return M4C.SmoAgreement.checkAgreeSMO();
		},
		/** 是否隱藏SMO相關功能(By pdsetting) */
		hiddenSMO() {return this.$store.state.config.quotePdSetting.function.hiddenSMO;},
		// 顯示一鍵轉倉
		enableOneClickRollover() {
			// 僅限台灣期貨交易所TWF
			if (this.minfo.Exchange !== "TWF")
				return;
			// 期權不顯示
			if (this.sid.split('.')[1] == 'O')
				return;
			// 週期不顯示
			if (M4C.Symbol.isWeeklySymbol(this.sid))
				return;
			// 最遠月不顯示
			let mth = M4C.Symbol.getPureMonth(this.sid);
			let idx = this.monthList.indexOf(mth);
			return idx < this.monthList.length - 1;
		},
		// 品種代碼
		symbolId() {
			return M4C.Symbol.getPureSymbol(this.sid);
		},
		// 此品種所有合約列表
		contractList() {
			return M4C.Symbol.mapSymbolToContracts[this.symbolId] || [];
		},
		// 此品種所有月份列表
		monthList() {
			return this.contractList.map(sid=>M4C.Symbol.getPureMonth(sid));
		},
		// 有支援的商品
		isAvailable() {return this.$checkSupportedItem(this.sid);},
		// 判斷是否支援
		$checkSupportedItem() {return this.$store.state.fn.$checkSupportedItem;},
	},
}
</script>

<style scoped>
.rbtn {
	width: auto;
	padding: 0 2vw;
}
</style>