<template>
    <div class="login-trade-ctn flex-col pdb5">
		<!-- 自動登入情境 (已有登入成功的帳密) -->
		<div class="flex-1 flex-col mglr5 pd5 flex-center" :class="{'border-top': !isDesktop}">
			<!-- 交易帳號選擇器 -->
			<LoginedBTOSelector :propBTO="loginBTO" :readonly="true" />
			<!-- 中央訊息提示區 -->
			<div class="flex-1 flex-center">
				<LoginTradeMessage :wsConn="wsConn" @confirm="onConfirm" />
			</div>
			<!-- 下方按鈕區 -->
			<div class="flex-center flex-col w100p">
				<div v-if="!connecting" class="flex-center mgt5 w100p">
					<Button class="btn-confirm mgr5" @click="autoLogin">{{$ln(`重试`)}}</Button>
					<Button class="btn-confirm dark" @click="onBtnDelete">{{$ln(`删除`)}}</Button>
				</div>
			</div>
		</div>
    </div>
</template>

<script>
import LoginTradeMessage from "@/components/LoginTradeMessage.vue";
export default {
	props: ["param"],
	data() {
		return {
			/** 登入其它帳號 */
			loginMore: false,
		}
	},
	beforeMount() {
	},
    mounted() {
		this.$emit("title", `登录会员/资金帐号`);
		// 此帳號未在連線中 || 此連線已中斷 => 啟動自動連線
		if (!this.wsConn.connecting || this.wsConn.closed)
			this.autoLogin();
	},
	components: {
		LoginTradeMessage,
	},
    methods: {
		/** 自動登入 */
		autoLogin() {
			// 設定此帳號登入成功需自動切換為選中狀態
			M4C.BTO.setSelectedIfLoginReady(this.btID);
			M4C.LoginTrade.doLogin(this.loginBTO);
		},
		// 刪除此帳號
		onBtnDelete() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: self.$ln("清除帐号"),
				content: self.$ln("在帐号列表中移除此帐号"),
				confirm: () => {
					let idx = self.loginedBTOList.findIndex((bto)=>{
						return bto.brokerID === self.brokerID && bto.traderID === self.traderID;
					});
					self.loginedBTOList.splice(idx, 1); 
					// 關閉自己
					eventBus.$emit("CLOSE-DIALOG", self.$parent);
				}
			});
		},
		onConfirm() {
			// (-17) 交易員密碼解密失敗
			if (this.wsConn.$CD === -17) {
				let idx = this.loginedBTOList.findIndex((bto)=>{return bto.brokerID === this.brokerID && bto.traderID === this.traderID;});
				this.loginedBTOList.splice(idx, 1);
				// 關閉自己
				eventBus.$emit("CLOSE-DIALOG");
				eventBus.$emit("CLOSE-DIALOG");
			}
		},
	},
	watch: {
		loginReady(nv) {
			if (nv) {
				eventBus.$emit("CLOSE-DIALOG");
			}
		},
	},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		pid() {
			return this.$store.state.config.projectID;
		},
		brokerID() {
			return this.loginBTO.brokerID;
		},
		traderID() {
			return this.loginBTO.traderID;
		},
		btID() {
			return `${this.loginBTO.brokerID}|${this.loginBTO.traderID}`;
		},
		/** 使用從報價 AC 登入回覆的  [pd.setting].brokers 組合出經記商選單 */
		brokerList() {
			return this.$store.state.wsConnMap.quote.acPdSetting.trade.brokers.map((brokerInfo)=>{
				return {value: brokerInfo.broker_id, label: brokerInfo.label};
			});
		},
		/** 本次指定登入的交易連線設定物件 */
		loginBTO() {
			return this.param && this.param.loginBTO ? this.param.loginBTO : this.selectedBTO;
		},
		/** 當前的 wsConn 物件 */
		wsConn() {
			let bto = this.loginBTO;
			let btID = `${bto.brokerID}|${bto.traderID}`;
			return this.$store.state.wsConnMap[btID] || {};
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
	},
}
</script>

<style scoped>
.border-top {
	border-top: 2px solid #54575B;
}
.ss-broker-list {
	width: 210px;
}
input {
	width: 180px;
}
.btn-confirm {
	width: 38vw;
	height: 10vw;
	border-radius: 2vw;
}
</style>