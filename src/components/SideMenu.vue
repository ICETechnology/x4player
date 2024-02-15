<template>
    <div class="FULL side-menu-ctn flex-col sys-bgc pdb5">
		<!-- 帳號 -->
		<div class="zindex-1 sys-bgc h10vw posr mgtb3 mglr5">
			<TradingAccountBtn class="FULL" />
		</div>
		<div class="flex-1 posr" v-stop-propagation-y>
			<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh">
				<!-- 資金 -->
				<div class="margin-ctn posr pdlr3 mglr5">
					<Margin ref="margin"/>
				</div>
				<!-- 其他功能 -->
				<div class="posr flex-1">
					<!-- 币别选单 -->
					<div class="flex-start pdtb1 flex-row clr-gray font-size-small pdlr5">
						<div class="flex-start">{{$ln(`显示币别`)}}</div>
						<div class="flex-1 flex-end">
							<SingleSelect :options="currencyOptionList" v-model="$store.state.status.selectedCurrency"/>
						</div>
					</div>
					<div class="flex-start flex-row clr-gray font-size-small mgtb2 pdlr5" v-if="!twMode">
						<div class="flex-1">{{$ln('常驻显示')}}</div>
						<div><Toggle v-model="$store.state.status.displayHeadMargin"/></div>
					</div>
					<!-- 歷史成交 -->
					<div v-if="enableHistoryFillQuery" class="flex-row tcef pdlr5" @click="onBtnHistoryRecord">
						<div class="flex-1 flex-start">{{$ln(`歷史成交`)}}</div>
						<div><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 歷史查詢 -->
					<div v-if="enableHistoryQuery" class="flex-row tcef pdlr5" @click="onBtnHistoryQuery">
						<div class="flex-1 flex-start">{{$ln(`历史查询`)}}</div>
						<div><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 结算单 -->
					<div class="flex-row tcef pdlr5" @click="onBtnSettlement" v-if="enableSettlement">
						<div class="flex-1 flex-start">{{$ln(`结算单`)}}</div>
						<div><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 银期转帐 (與 出金戶轉 互斥)-->
					<div v-if="!isSimAccount && !enableWithdrawalExchange" class="flex-row tcef pdlr5" @click="onBtnBankTransfer">
						<div class="flex-1 flex-start">{{$ln(displayTransferText)}}</div>
						<div><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 備兌鎖定與解鎖 (非模擬 & 支持個股的帳號) -->
					<div v-if="!isSimAccount && supportStock" class="flex-row tcef pdlr5">
						<div class="flex-1 flex-start" @click="onBtnWarrant">{{$ln(`备兑锁定与解锁`)}}</div>
						<div><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 行权记录 -->
					<div class="flex-row tcef pdlr5" v-if="supportExercise">
						<div class="flex-1 flex-start" @click="onBtnExerciseRecord">{{$ln(`行权记录`)}}</div>
						<div><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 提示讯息 -->
					<div class="flex-row tcef pdlr5" v-if="supportNotice">
						<div class="flex-1 flex-start" @click="onNotice">{{$ln(`讯息提醒`)}}</div>
						<div><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 市場監控中心 -->
					<div class="flex-row tcef pdlr5" v-if="enableInvestorservice">
						<div class="flex-1 flex-start" @click="onInvestorservice">{{$ln(`市场监控中心`)}}</div>
						<div><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 查詢限購限額(有資料且非台灣版) -->
					<div class="flex-row tcef pdlr5" v-if="isPurchaseLimit && !twMode" @click="onQueryPositionLimit">
						<div class="flex-1 flex-start">{{$ln(`限购限额`)}}</div>
						<div class="flex-end"><span>{{$ln('查询')}}</span><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 出金互轉 (台灣) -->
					<div class="flex-row tcef pdlr5" v-if="enableWithdrawalExchange" @click="onWithdrawal">
						<div class="flex-1 flex-start">{{$ln(`出金互转`)}}</div>
						<div class="flex-end"><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 平倉損益查詢 -->
					<div class="flex-row tcef pdlr5" v-if="enableOffsetPLQuery" @click="onQueryOffsetPL">
						<div class="flex-1 flex-start">{{$ln(`平仓损益`)}}</div>
						<div class="flex-end"><span>{{$ln('查询')}}</span><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 權益數 (有設定才顯示) -->
					<div class="flex-row tcef pdlr5" v-if="enableRights" @click="onRights">
						<div class="flex-1 flex-start">{{$ln(`權益數`)}}</div>
						<div class="flex-end"><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 選擇權組拆 (有設定才顯示) -->
					<div class="flex-row tcef pdlr5" v-if="enableOptionCS" @click="onOptionCS">
						<div class="flex-1 flex-start">{{$ln(`選擇權組拆`)}}</div>
						<div class="flex-end"><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
					<!-- 選擇權互抵 (有設定才顯示) -->
					<div class="flex-row tcef pdlr5" v-if="enableOptionNet" @click="onOptionNet">
						<div class="flex-1 flex-start">{{$ln(`選擇權互抵`)}}</div>
						<div class="flex-end"><i class="material-icons md-36 icon-right">keyboard_arrow_right</i></div>
					</div>
				</div>
				<!-- 資金-限購額度(有資料且非台灣版) -->
				<MarginPurchaseLimit v-if="isPurchaseLimit && !twMode"/>
			</ScrollBounce>
		</div>
    </div>
</template>

<script>
import TradingAccountBtn from "@/components/TradingAccountBtn.vue";
import HistoryQueryContainer from "@/components/HistoryQuery/HistoryQueryContainer.vue";
import Warrant from "@/components/Warrant.vue";
import ExerciseRecord from "@/components/ExerciseRecord.vue";
import BankTransferContainer from "@/components/BankTransfer/BankTransferContainer.vue";
import PositionLimit from "@/components/PositionLimit.vue";
import OffsetPL from "@/components/OffsetPL.vue";
import MixWithdrawalExchange from "@/components/Mix/mix.WithdrawalExchange.vue";
import MixRightsAfterhours from "@/components/Mix/mix.rights.afterhours.vue";
import OptionCS from "@/components/OptionCS/OptionCS.vue";
import OptionNet from "@/components/OptionNet.vue";
import HistoryRecordContainer from "./HistoryRecord/HistoryRecordContainer.vue";

export default {
	props: [],
	data() {
		return {
			showPurchase: false,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {
		TradingAccountBtn,
		PositionLimit,
		OffsetPL,
		MixWithdrawalExchange,
		MixRightsAfterhours,
		OptionCS,
		OptionNet
	},
    methods: {
		onRefresh () {if(this.$refs.margin) this.$refs.margin.onRefresh();},
		onNotice() {
			// 不在各組件初始化時查詢，只在開出三大提醒視窗時全部重新查詢一次。
			M4C.CommonQuery.queryAllNotice();
			eventBus.$emit('NOTICE-MESSAGE-DIALOG');
		},
		/** 歷史成交 */
		onBtnHistoryRecord(){
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', HistoryRecordContainer, null, {transName: 'float'});
		},
		/** 結算單 */
		onBtnSettlement() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', 'Settlement', null, {transName: 'float'});
		},
		/** 歷史查詢 */
		onBtnHistoryQuery() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', HistoryQueryContainer, null, {transName: 'float'});
		},
		/** 備兌鎖定與解鎖 */
		onBtnWarrant() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', Warrant, "", {'$HEAD': {'title': this.$ln(`备兑锁定与解锁`)}, transName: 'float'});
		},
		/** 行權記錄 */
		onBtnExerciseRecord() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', ExerciseRecord, "", {'$HEAD': {'title': this.$ln(`行权记录`)}});
		},
		/** 银期转帐 */
		onBtnBankTransfer() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', BankTransferContainer, "", {transName: 'float'});
		},
		/** 外跳監控中心連結 */
		onInvestorservice() {
			window.openLink("https://investorservice.cfmmc.com/");
		},
		onQueryPositionLimit() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', PositionLimit, "", {'$HEAD': {'title': this.$ln(`限仓限购查询`)}});
		},
		/** 平倉損益查詢 */
		onQueryOffsetPL() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', OffsetPL, "", {'$HEAD': {'title': this.$ln(`平仓损益查询`)}, transName: 'float'});
		},
		/** 出金互轉 */
		onWithdrawal() {
			eventBus.$emit('POPUP-DIALOG', MixWithdrawalExchange, "", {'$HEAD': {'title': this.$ln(`出金互转`)}, transName: 'float'});
		},
		/** 權益數 */
		onRights() {
			eventBus.$emit('POPUP-DIALOG', MixRightsAfterhours, "", {'$HEAD': {'title': this.$ln(`權益數`)}, transName: 'float'});
		},
		/** 選擇權組拆 */
		onOptionCS() {
			eventBus.$emit('POPUP-DIALOG', OptionCS, "", {lock: true});
		},
		/** 選擇權互抵 */
		onOptionNet() {
			eventBus.$emit('POPUP-DIALOG', OptionNet, "", {lock: true});
		},
	},
	watch: {},
    computed: {
		/** 是否有限購額度資料 */
		isPurchaseLimit() {
			try {
				let purchaseLimit = this.$store.state.data.marginData[this.$store.state.status.selectedCurrency].PURCHASE_LIMIT;
				return Object.keys(purchaseLimit).length;
			} catch(e) {return false;}
		},
		currencyOptionList() {
			return this.$store.state.status.currencyOptionList;
		},
		// 當前帳號支持股票 (ex.個股期權帳號)
		supportStock() {
			let pds = this.$store.state.config.tradePdSetting;
			let tp = pds && pds.broker && pds.broker.tp ? pds.broker.tp : [];
			let obj = tp.find((code)=>{
				return code % 100 === 5;
			});
			return !!obj;
		},
		// 當前帳號支持行權功能 (SIM、ntp30305 不支持 )
		supportExercise() {
			return !this.isSimAccount && this.$store.state.config.CONFIG.ENABLE_EXERCISE && this.isOption;
		},
		// 支援三大提醒功能(台灣、SIM、ntp30305不支援)
		supportNotice() {
			return !this.twMode && this.brokerID !== "IceTech" && this.isStockOption && this.threeAlert;
		},
		// 當前交易帳號的pdsetting
		acPdSetting() {
			return this.$store.state.config.tradePdSetting;
		},
		// pdsetting的三大提醒
		threeAlert() {
			if(this.acPdSetting && this.acPdSetting.broker)
				return this.acPdSetting.broker.three_alerts != false;
		},
		twMode() {return this.$store.state.config.twMode;},
		isSimAccount() {return this.$store.state.login.isSIM;},
		// 當前帳號是證券
		isStock() {return this.$store.state.login.isStock;},
		// 當前帳號是股票期權
		isStockOption() {return this.$store.state.login.isStockOption;},
		// 當前帳號是期權
		isOption() {return this.$store.state.login.isOption;},
		// 當前帳號期貨
		isFut() {return this.$store.state.login.isFut;},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		brokerKey() {
			return this.$store.state.login.brokerKey;
		},
		brokerInfo() {
			return this.$store.state.brokerMap[this.brokerKey] || {};
		},
		// 顯示市場監控中心 (when CTP期貨帳號)
		enableInvestorservice() {
			return this.brokerInfo.system === 'CTP' && this.isFut;
		},
		// 支持歷史查詢
		enableHistoryQuery() {
			// 牛勤：只有 UFX & FGS 的 [股票期權] 支持歷史查詢
			// 2021 8/9會議決定加入模擬環境的帳號。
			if (((this.brokerInfo.system === 'UFX' || this.brokerInfo.system === 'FGS') && this.isStockOption) || this.isSimAccount)
				return true;
		},
		// 資金轉帳依帳號類型顯示不同的文字
		displayTransferText() {
			// 股票期權
			if (this.isStockOption)	return '银衍转账';
			// 證券
			else if (this.isStock)	return '银证转账';
			// 期貨/期權
			else					return '银期转账';
		},
		// 要顯示權益數元件
		enableRights() {
			try{return this.acPdSetting.broker.enableRights;}catch(e){};
		},
		// 啟用 出金互轉(台灣)
		enableWithdrawalExchange() {
			// pdSetting有設定顯示
			let isSupported = this.acPdSetting && this.acPdSetting.broker? this.acPdSetting.broker.enableWithdrawalExchange: false;
			// 有出金互轉的功能設定。
			let hasConfig = this.$store.state.config.CONFIG.WithdrawalExchange_TAB_LIST;
			return !this.isSimAccount && isSupported && hasConfig;
		},
		// 啟用 平倉損益查詢(台灣)
		enableOffsetPLQuery() {
			// pdSetting有設定顯示
			let isSupported = this.acPdSetting && this.acPdSetting.broker? this.acPdSetting.broker.enableOffsetPLQuery: false;
			return isSupported;
		},
		// 啟用結算單
		enableSettlement() {
			let enable;
			try{enable = this.acPdSetting.broker.enableSettlement;}catch(e){};
			// 未設定預設為 true 向前相容
			enable = enable == null ? true : enable;
			return enable && (this.isFut || this.isOption);
		},
		// 啟用選擇權組拆
		enableOptionCS() {
			try{return this.acPdSetting.broker.enableOptionCS;}catch(e){};
		},
		// 啟用選擇權互抵
		enableOptionNet() {
			try{return this.acPdSetting.broker.enableOptionNet;}catch(e){};
		},
		// 啟用歷史成交查詢
		enableHistoryFillQuery(){
			try{return this.$store.state.config.CONFIG.SideMenu.enableHistoryQuery;} catch (e) {};
		}
	},
}
</script>

<style scoped>
/* 簡易持倉元件容器 */
.position-simple-ctn {
	overflow: auto;
}
.margin-ctn {
	min-height: 300px;
	/* overflow: hidden; */
}
.icon-right {
	margin-right: -10px;
}
</style>