<template>
	<div class="logined-bto-selector flex-col">
		<!-- 一般模式 (交易帳號管理模式) -->
		<div v-if="!orderMode" class="selector-ctn broker-name-ctn rd1 mgt5 flex-row flex-center pdtb3 tcef" @click="onClick">
			<div class="flex-1 flex-col flex-center pdlr3">
				<div class="clr-orange font-size-big">{{$ln(displayBrokerName)}}</div>
				<div class="mgt2">{{displayTraderID}}</div>
			</div>
			<i v-if="!readonly" class="material-icons md-36">arrow_drop_down</i>
		</div>
		<!-- 下單盒模式 -->
		<div v-if="orderMode" class="h100p selector-ctn flex-row tcef">
			<div class="ht2 rd1 flex-1 order-mode-ctn flex-row ellipsis" @click="onClick">
				<div v-if="isSim" class="flex-start pdl3">{{displayTraderID}}</div>
				<div v-if="!isSim" class="flex-col pdl3">
					<span class="flex-start font-size-micro mgl-1 mgt-1 clr-gray2 ellipsis block-32vw" >{{displayBrokerName}}</span>
					<span class="flex-start font-size-small mgl-1 mgt-2 ellipsis block-32vw">{{displayTraderID}}</span>
				</div>
				<div class="flex-1" />
				<div class="flex-center"><i v-if="!readonly" class="material-icons md-24 clr-gray">arrow_drop_down</i></div>
			</div>
		</div>

		<!-- 子帳號列表 -->
		<div class="flex-col pd2 pdt5" v-if="displayAccounts && !orderMode">
			<div class="flex-row flex-vertical-center mgtb2" v-for="(obj, idx) in accountIdList" :key="`lbs-${idx}`" @click="onClickAccount(obj.ACCOUNT_ID)">
				<div class="flex-1">{{displayAccountID(obj)}}</div>
				<div class="flex-1 flex-start mgr1 font-size-small" v-if="isShowACC(obj)">{{obj.ACCOUNT_ID}}</div>
				<div class="radio-circle"><span :class="{selected: obj.ACCOUNT_ID === accountID}"/></div>
			</div>
		</div>
	</div>
</template>

<script>
import TradingAccountManager from "@/components/TradingAccountManager.vue";
export default {
	props: ["logined", "propBTO", "readonly", "orderMode"],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {TradingAccountManager},
    methods: {
		onClick() {
			if (this.readonly) return;
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 台灣版彈出交易帳號管理組件以用來顯示子帳選擇，cn則是顯示原本的主帳清單選擇
			eventBus.$emit('POPUP-DIALOG', this.twMode? TradingAccountManager: 'LoginedBTOManager', {}, {transName: 'float'});
		},
		/** 點擊子帳 -> 切換子帳 */
		onClickAccount(accountID) {
			// 沒變則不處理
			if (accountID === this.$store.state.login.accountID)
				return;
			// 切換子帳
			this.$store.state.login.accountID = this.selectedBTO.selectedAccountID = accountID;

			this.$store.state.notify({
				keep: this,
				icon: `person`,
				head: `帐号切换`,
				body: `${this.$ln('帐号已切换至')} ${accountID}`,
			});
		},
		// 顯示的子帳
		displayAccountID(obj) {
			let traderID = obj.CUST_NAME || obj.ACCOUNT_ID;
			return M4C.Trader.getDisplayTraderID(traderID);
		},
		isShowACC(obj) {
			const ACCOUNT_ID = obj.ACCOUNT_ID;
			// 沒有子帳ID或子帳名稱跟ID一樣==>不顯示
			if (!ACCOUNT_ID || obj.CUST_NAME === ACCOUNT_ID) return;
			// 不是遊客帳號才顯示子帳ID
			if (ACCOUNT_ID.indexOf('#w#') == -1 && ACCOUNT_ID.indexOf('#p#') == -1 && ACCOUNT_ID.indexOf('#g#') == -1)
				return true;
		}
	},
	watch: {},
    computed: {
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
		selectedBTO() {
			return this.$store.state.selectedBTO;
		},
		/** 要顯示的 BTO */
		displayBTO() {
			return this.propBTO || this.selectedBTO || {};
		},
		displayBrokerName() {
			return this.$store.state.brokerNameMap[this.displayBTO.brokerKey || this.displayBTO.brokerID];
		},
		/** 是否顯示子帳 (當前 [顯示主帳] 不是 [登入中主帳] 時就不顯示) */
		displayAccounts() {
			return this.displayBTO.traderID === this.$store.state.login.traderID;
		},
		accountIdList() {
			return this.$store.state.login.accounts;
		},
		accountID() {
			return this.$store.state.login.accountID;
		},
		displayTraderID() {
			return M4C.Trader.getDisplayTraderID(this.displayBTO.selectedAccountID || this.displayBTO.traderID);
		},
		isSim() {
			return this.$store.state.login.isSIM;
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
	},
}
</script>

<style scoped>
.radio-circle {
	width: 16px;
	height: 16px;
	border-radius: 8px;
	border: 1px solid white;
	/* flex-center */
	display: flex;
	align-items: center;
	justify-content: center;
}
.radio-circle span.selected {
	width: 12px;
	height: 12px;
	border-radius: 6px;
	background-color: rgba(255, 152, 0, 0.932);
}
/** BROKER 名稱顯示容器 */
.order-mode-ctn {
	border: 1px solid #393939;
	box-sizing: border-box;
}
/* 對齊微調 */
.mgl-1 {
	margin-left: 1px;
}
.device-ios .mgt-1 {
	margin-top: -1px;
}
.device-ios .mgt-2 {
	margin-top: -4px;
}
.block-32vw {
	display: block;
	width: 32vw;
}
/** 桌機版 */
.desktop .selector-ctn:hover {
	color: aqua;
	cursor: pointer;
}
</style>