<template>
    <div class="FULL login-trade-sim-by-account-password">
		<div class="flex-col mglr10">
			<div class="flex-row mgt5 flex-start">
				<div class="clr-gray txt-label">{{$ln(`经纪商`)}}</div>
				<div class="flex-1"><SingleSelect class="ss-broker-list" :options="brokerList" v-model="brokerKey" :isFit="true" /></div>
			</div>
			<div class="flex-row mgt5 flex-start">
				<div class="clr-gray txt-label">{{$ln(`帐号`)}}</div>
				<div class="flex-1"><input class="w100p iceben-dark" type="text" v-model="traderID" :placeholder="$ln(`请输入您的帐号`)" /></div>
			</div>
			<div class="flex-row mgtb5 flex-start">
				<div class="clr-gray txt-label">{{$ln(`密码`)}}</div>
				<div class="flex-1"><input class="w100p iceben-dark" type="password" v-model="inputPswd" :placeholder="$ln(`请输入您的密码`)" /></div>
			</div>
			<div class="flex-center mgtb5">
				<Button class="w100p btn-confirm-iceben iceben flex-center" @click="onBtnLogin">{{$ln('登入')}}</Button>
			</div>
			<!-- 中央訊息提示區 -->
			<div class="flex-1 flex-center">
				<LoginTradeMessage :wsConn="wsConn" v-show="displayMessage" />
			</div>
		</div>
    </div>
</template>

<script>
import LoginTradeMessage from "@/components/LoginTradeMessage.vue";
export default {
	props: [],
	data() {
		return {
			brokerKey: "",
			traderID: "",
			inputPswd: "",
			/** 顯示連線登入結果 (可避免顯示出對應到的 btID 的訊息) */
			displayMessage: false,
		}
	},
	beforeMount() {
		this.$emit('title', this.$ln('登入模拟交易账号'));
	},
    mounted() {},
	beforeDestroy() {},
	components: {
		LoginTradeMessage,
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
			// 開始顯示連線登入訊息
			this.displayMessage = true;
			// 設定此帳號登入成功需自動切換為選中狀態
			M4C.BTO.setSelectedIfLoginReady(this.btID);
			M4C.LoginTrade.doLogin({
				brokerKey: this.brokerKey,
				brokerID: this.brokerID,
				traderID: this.traderID,
				traderPwd: this.inputPswd,
			});
		},
	},
	watch: {
		traderID() {
			this.displayMessage = false;
		},
		inputPswd() {
			this.displayMessage = false;
		},
		loginReady(nv) {
			if (nv) {
				eventBus.$emit("CLOSE-DIALOG");
			}
		},
	},
    computed: {
		// brokerKey to brokerID 對應表
		brokerKeyToID() {
			return this.$store.state.config.brokerKeyToID;
		},
		// 1.83 後 brokerID 需由 brokerKey 對出來
		brokerID() {
			return this.brokerKeyToID[this.brokerKey];
		},
		btID() {
			return `${this.brokerID}|${this.traderID}`;
		},
		// 使用從報價 AC 登入回覆的  [pd.setting].brokers 組合出經記商選單
		brokerList() {
			let result = this.$store.state.wsConnMap.quote.acPdSetting.trade.brokers.filter(brokerInfo=>{
				return brokerInfo.broker_id === 'IceTech';
			}).map(brokerInfo=>{
				return {value: brokerInfo.broker_key, label: brokerInfo.label};
			});
			return result;
		},
		// 此 Broker|Trader 所對應的連線物件
		wsConn() {
			return this.$store.state.wsConnMap[this.btID] || {};
		},
		connecting() {
			return this.wsConn.connecting;
		},
		loginReady() {
			return this.wsConn.loginReady;
		},
	},
}
</script>

<style scoped>
.txt-label {
	width: 70px;
}

</style>