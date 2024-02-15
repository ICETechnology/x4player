<template>
	<div class="FULL login-trade-ctn">
		<div class="flex-col pdb5">
			<!-- 手動登入情境 (無已登入成功的帳密) -->
			<div class="flex-1 flex-col mglr10 pd3">
				<div class="flex-row mgt5 flex-start">
					<div class="clr-gray txt-label" @click="onClickBroker">{{$ln(`经纪商`)}}</div>
					<div class="flex-1"><SingleSelect class="ss-broker-list" :options="brokerList" v-model="brokerInfo" :isFit="true" /></div>
				</div>
				<div class="flex-row mgt5 flex-start">
					<div class="clr-gray txt-label">{{$ln(`帐号`)}}</div>
					<div class="flex-1"><input class="w100p iceben-dark" type="text" v-model="traderID" :placeholder="$ln(`请输入您的帐号`)" /></div>
				</div>
				<div class="flex-row mgtb5 flex-start">
					<div class="clr-gray txt-label">{{$ln(`密码`)}}</div>
					<div class="flex-1"><input class="w100p iceben-dark" type="password" v-model="inputPswd" :placeholder="$ln(`请输入您的密码`)" /></div>
				</div>
				<div v-if="enablePIN" class="flex-row mgt5 flex-start">
					<div class="clr-gray txt-label">{{$ln(`PIN`)}}</div>
					<div class="flex-1 flex-col">
						<input v-if="!pinAsPswd" class="w100p iceben-dark" type="password" v-model="inputPIN" :placeholder="$ln(`请输入PIN码`)" :disabled="pinAsPswd" />
						<input v-if="pinAsPswd" class="w100p iceben-dark" type="text" :placeholder="$ln(`已同步密码`)" :disabled="true" />
						<CheckBox v-model="pinAsPswd" class="mgt1">{{$ln('PIN码同密码')}}</CheckBox>
					</div>
				</div>
				<div class="flex-row mgtb5 flex-start" v-if="displayHostList">
					<div class="clr-gray">{{$ln(`指定主机`)}}</div>
					<div class="flex-1"><SingleSelect class="ss-broker-list" :options="hostList" v-model="$store.state.config.forceTradeHost" /></div>
				</div>
				<!-- 下方按鈕區 -->
				<div class="flex-center mgtb5">
					<Button class="w100p btn-confirm-iceben iceben flex-center" @click="onBtnLogin">{{$ln('登入')}}</Button>
				</div>
				<!-- 開戶雲 -->
				<ApplyOnline v-if="!isDesktop && applyonline" />
				<!-- 中央訊息提示區 -->
				<div class="flex-1 flex-center">
					<LoginTradeMessage :wsConn="wsConn" v-show="displayMessage" />
				</div>
			</div>
		</div>
		<!-- 交易登入數限制元件 -->
		<LoginTradeLimitation ref="ltl" :brokerID="brokerID" @removed="onBtnLogin" />
    </div>
</template>

<script>
import LoginTradeMessage from "@/components/LoginTradeMessage.vue";
import ApplyOnline from "@/components/ApplyOnline.vue";
import LoginTradeLimitation from "@/components/LoginTradeLimitation.vue";

export default {
	props: ["param"],
	data() {
		return {
			brokerInfo: {},
			brokerKey: "",
			brokerID: "",
			traderID: "",
			inputPswd: "",
			inputPIN: "",
			pinAsPswd: false,

			/** 開發測試用密技 */
			displayHostList: false,
			hostList: [
				{label: 'by Broker (預設)', value: ''},
				{label: 'test.icetech.com.tw', value: 'test.icetech.com.tw'},
				{label: 'ss2-dev-replay.icetech.com.tw', value: 'ss2-dev-replay.icetech.com.tw'},
				{label: 'ss2-dev.icetech.com.tw', value: 'ss2-dev.icetech.com.tw'},
				{label: 'ss2-uat.icetech.com.cn', value: 'ss2-uat.icetech.com.cn'},
				{label: 'ss2.icetech.com.cn', value: 'ss2.icetech.com.cn'},
				{label: 'ss2.mofutures.com', value: 'ss2.mofutures.com'},
			],
			/** 登入其它帳號 */
			loginMore: false,
			/** 顯示連線登入結果 (可避免顯示出對應到的 btID 的訊息) */
			displayMessage: false,
			brokerList: [],
		}
	},
	beforeMount() {
		// 使用從報價 AC 登入回覆的  [pd.setting].brokers 組合出經記商選單
		this.brokerList = this.$store.state.wsConnMap.quote.acPdSetting.trade.brokers.filter(brokerInfo=>{
				return brokerInfo.broker_id !== 'IceTech';	// 過濾出貼牌的交易商
			}).map(brokerInfo=>{
				return {value: brokerInfo, label: brokerInfo.label};
			});
	},
    mounted() {
		this.$emit("title", `登录会员/资金帐号`);
	},
	components: {
		LoginTradeMessage,
		ApplyOnline,
		LoginTradeLimitation,
	},
    methods: {
		onBtnLogin() {
			if (!this.traderID) {
				this.$store.state.notify(`error`, `请填入帐号`);
				return;
			}
			if (!this.inputPswd) {
				this.$store.state.notify(`error`, `请填入密码`);
				return;
			}
			// 支持檢查 證券/期貨/期權/全部 限制帳號數
			if (!this.$refs.ltl.checkLimitation())
				return;

			// 開始顯示連線登入訊息
			this.displayMessage = true;
			// 設定此帳號登入成功需自動切換為選中狀態
			M4C.BTO.setSelectedIfLoginReady(this.btID);
			M4C.LoginTrade.doLogin({
				brokerKey: this.brokerKey,
				brokerID: this.brokerID,
				traderID: this.traderID,
				traderPwd: this.inputPswd,
				inputPIN: this.pinAsPswd ? this.inputPswd : this.inputPIN,
			});
		},
		// 點擊經記商文字 10 次開啟密技指定主機
		onClickBroker() {
			this.clickBrokerCount = this.clickBrokerCount ? this.clickBrokerCount+1 : 1;
			this.displayHostList = this.clickBrokerCount >= 10;
		},
	},
	watch: {
		brokerInfo(nv) {
			this.brokerKey = nv.broker_key;
			this.brokerID = nv.broker_id;
		},
		/** 切換 BrokerID */
		brokerID(nv, ov) {
			// 切換 Broker 時清除帳密 (ov 無值時=首次不清)
			if (ov && nv) {
				this.traderID = '';
				this.inputPswd = '';
			}
			localStorage.setItem(`${this.pid}_BROKER_ID`, nv);
		},
		loginReady(nv) {
			if (nv) {
				eventBus.$emit("CLOSE-DIALOG");
			}
		},
		traderID() {
			this.displayMessage = false;
		},
		inputPswd() {
			this.displayMessage = false;
		},
	},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		pid() {
			return this.$store.state.config.projectID;
		},
		btID() {
			return `${this.brokerID}|${this.traderID}`;
		},
		/** 此 Broker|Trader 所對應的連線物件 */
		wsConn() {
			return this.$store.state.wsConnMap[this.btID] || {};
		},
		/** 已有登入記憶的交易帳號列表 */
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
		/** 用來自動登入的 BTO */
		selectedBTO() {
			return this.$store.state.selectedBTO;
		},
		connecting() {
			return this.wsConn.connecting;
		},
		loginReady() {
			return this.wsConn.loginReady;
		},
		/** 是否允許登入/切換其它交易帳號 */
		loginMoreTrader() {
			return this.$store.state.config.CONFIG.LOGIN_MORE_TRADER;
		},
		/** 開戶雲設定 */
		applyonline() {
			return this.$store.state.config.quotePdSetting.function.applyonline;
		},
		// 啟用國密
		enablePIN() {
			return this.brokerInfo.needCert;
		},

		/** 暫不使用computed出來的交易商清單。因首次開啟登入新帳號時，trade.brokers會因不明原因變動。
		 	導致v-model的broker變動，之後產生一連串非預期的UI變動。*/
		// // 使用從報價 AC 登入回覆的  [pd.setting].brokers 組合出經記商選單
		// brokerList() {
		// 	let result = this.$store.state.wsConnMap.quote.acPdSetting.trade.brokers.filter(brokerInfo=>{
		// 		return brokerInfo.broker_id !== 'IceTech';
		// 	}).map(brokerInfo=>{
		// 		return {value: brokerInfo.broker_id, label: brokerInfo.label};
		// 	});
		// 	return result;
		// },
	},
}
</script>

<style scoped>
.btn-confirm {
	width: 38vw;
	height: 10vw;
	border-radius: 2vw;
}
.txt-label {
	width: 70px;
}
.login-mask {
	opacity: 0.5;
	background-color: black;
}
.login-ctn {
	position: absolute;
	top: 35vw;
	left: 25vw;
	width: 50vw;
	height: 30vw;
	border-radius: 1vw;
	color: white;
	background-color: #363C42;
}

/** 桌機版 */
.desktop .ss-broker-list {
	width: 12em;
}
.desktop input {
	width: 12em;
	box-sizing: border-box;
}
</style>