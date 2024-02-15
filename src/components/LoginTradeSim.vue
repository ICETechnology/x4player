<template>
	<div class="FULL">
		<ScrollBounce class="FULL pd5 pdlr2" v-stop-propagation-y>
			<div class="flex-col flex-center mglr10 mgt5">
				<div class="w100p mgb3 mgl1 pdl5"><div class="flex-start txt-label font-size-small" @click="clickSimCount++">{{$ln('经纪商')}}</div></div>
				<div class="w100p"><SingleSelect class="ss-broker-list" :options="brokerList" v-model="brokerKey" :isFit="true" /></div>
			</div>
			<!-- 未登入情境 -->
			<div v-if="!loginReady" class="flex-row mglr10 mgt4 flex-center">
				<div v-if="enableWechat"  class="flex-1 mgr1 auth-btn flex-center pd3 tcef" @click="onBtnWechat">
					<div class="flex-col flex-center">
						<div class="wechat-icon" />
						<div class="mgt2 font-size-small nowrap">{{$ln('微信注册')}}</div>
					</div>
				</div>
				<div v-if="enablePhoneNumber" class="flex-1 mgl1 auth-btn flex-center pd3 tcef" @click="onBtnPhoneNumber">
					<div class="flex-col flex-center">
						<div class="icon-ctn flex-center"><i class="material-icons md-36">phone_android</i></div>						
						<div class="mgt2 font-size-small nowrap">{{$ln('手机注册')}}</div>
					</div>
				</div>
				<div v-if="enableGuest" class="flex-1 mgl1 auth-btn flex-center pd3 tcef" @click="onBtnGuest">
					<div class="flex-col flex-center">
						<div class="icon-ctn flex-center"><i class="material-icons md-36">person</i></div>					
						<div class="mgt2 font-size-small nowrap">{{$ln('游客模式')}}</div>
					</div>
				</div>
				<div v-if="enableAccountPassword" class="flex-1 mgl1 auth-btn flex-center pd3 tcef" @click="onBtnAccountPassword">
					<div class="flex-col flex-center">
						<div class="icon-ctn flex-center"><i class="material-icons md-36">view_stream</i></div>					
						<div class="mgt2 font-size-small nowrap">{{$ln('账号登入')}}</div>
					</div>
				</div>
			</div>
			<!-- 已登入情境 -->
			<div v-if="loginReady" class="flex-col">
				<div class="flex-row flex-center mglr10 mgt2">
					<div class="mgr3 txt-label">{{$ln('帐号')}}</div>
					<div class="flex-1"><input type="text" class="w100p iceben-dark clr-gray2" :value="displayTraderID" disabled /></div>
				</div>
				<div class="flex-row flex-center mglr10 mgt2">
					<div class="mgr3 txt-label">{{$ln('密码')}}</div>
					<div class="flex-1"><input type="text" class="w100p iceben-dark clr-gray2" value="************" disabled /></div>
				</div>
				<div class="flex-center mglr10 mgt5">
					<Button class="w100p btn-confirm-iceben flex-center" @click="onBtnLogout">{{$ln('登出模拟帐户')}}</Button>
				</div>
			</div>
			<!-- 文字說明 -->
			<div class="mglr4 pdlr5 mgt5" v-html="htmlContent" />
			<!-- 取 Wechat unionId 元件 -->
			<AuthWechat ref="authWechat" />
		</ScrollBounce>
		<LoginTradeMessage :wsConn="wsConn" />
	</div>
</template>

<script>
import AuthWechat from "@/components/AuthWechat.vue";
import AuthPhoneNumber from "@/components/AuthPhoneNumber.vue";
import LoginTradeSimByAccountPassword from "@/components/LoginTradeSimByAccountPassword.vue";
import LoginTradeMessage from "@/components/LoginTradeMessage.vue";
export default {
	props: [],
	data() {
		return {
			brokerKey: "",
			// 支持點 20 下開啟密技可模擬 wechat unionid 取得 sim 帳號
			clickSimCount: 0,
		}
	},
	beforeMount() {},
	mounted() {
		this.$store.state.components.loginTradeSim = this;
		console.log('LoginTradeSim.mounted');
	},
	beforeDestroy() {},
	components: {AuthWechat, LoginTradeMessage},
	methods: {
		// 微信註冊
		onBtnWechat() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			this.$refs.authWechat.auth();
		},
		// 手機註冊
		onBtnPhoneNumber() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 3000);
			eventBus.$emit("POPUP-DIALOG", AuthPhoneNumber, {brokerID: this.brokerID}, {transName: 'float'});
		},
		// 遊客模式
		onBtnGuest() {
			this.$store.state.sim.thirdPartyType = "GUEST";
			this.$store.state.sim.guestID = this.$store.state.device.deviceID.toLowerCase();
		},
		// 帳密模式
		onBtnAccountPassword() {
			eventBus.$emit("POPUP-DIALOG", LoginTradeSimByAccountPassword, {brokerID: this.brokerID}, {transName: 'float'});
		},
		// 登出
		onBtnLogout() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: "登出",
				content: this.$ln("点击确认登出"),
				confirm: ()=>{
					// 登出
					M4C.Trader.logout(this.brokerID, this.traderID);
					// 刪除記憶
					let idx = self.loginedBTOList.findIndex((bto)=>{return bto.brokerID === self.brokerID && bto.traderID === self.traderID;});
					self.loginedBTOList.splice(idx, 1);
					// 關閉自己
					// eventBus.$emit("CLOSE-DIALOG");
					// 自動切到首個帳號 (已登入帳號原本就會排在最前面)
					setTimeout(()=>{
						let bto = this.$store.state.sortedBTOList[0];
						if (bto) M4C.BTO.setSelectedBTO(bto);
					}, 200);
					// 呼叫 Sim 核心登出(清除相關資料)
					M4C.Sim.logout();
				},
			});			
		},
		loginSim() {
			// 設定此帳號登入成功需自動切換為選中狀態
			M4C.BTO.setSelectedIfLoginReady(this.btID);
			// 开始登入
			M4C.LoginTrade.doLogin({
				brokerKey: this.brokerKey,
				brokerID: this.brokerID,
				traderID: this.traderID,
				traderPwd: M4C.AC.encodePBKDF2(this.traderID),
				THIRD_PARTY_ID: this.$store.state.sim.thirdPartyType,
			});
		}
	},
	watch: {
		// brokerID/traderID 觸發 btID
		btID() {
			if (!this.loginReady && this.traderID)
				this.loginSim();
		},
		connecting(nv) {
			// 停止連線且沒有登入成功時
			if (!nv && this.traderID && !this.loginReady) {
				this.$store.state.notify(`error`, this.$ln(`模拟帐号建立/登入失败，请稍后再试`));
			}
		},
		loginReady(nv) {
			// if (nv) {
			// 	this.$store.state.notify(this.$ln(`模拟帐号建立/登入完成`));
			// }
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
		// traderID -> btID -> loginSim
		// traderID -> btID -> loginSim (調整分隔符號由$改為#，因為server用的mongoDB對$字符有特別用途，所以帳號名稱內有$字符會使server異常。)
		traderID() {
			if (this.loginReadyTraderID)
				return this.loginReadyTraderID;
			else if (this.phoneNumber)
				return `${window.comp}#p#${this.phoneNumber}`;
			else if (this.unionid)
				return `${window.comp}#w#${this.unionid}`;
			else if (this.guestID)
				return `${window.comp}#g#${this.guestID}`;
		},
		btID() {
			return this.brokerID && this.traderID ? `${this.brokerID}|${this.traderID}` : null;
		},
		unionid() {
			try{return this.$store.state.sim.wechatUnionid;}catch(e){}
		},
		/** 已有登入記憶的交易帳號列表 */
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
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
		htmlContent() {
			// 支持用語系檔填入此 html 內容
			let str = this.$ln('WECHAT-DESCRIBE');
			str = str === 'WECHAT-DESCRIBE' ? null : str;
			return str || `
				<div class="mgt5 font-bold">关于模拟交易</div>
				<div class="mgt3 font-size-small">模拟账号为咏春go2提供的模拟交易服务，您可以通过模拟交易服务体验的咏春go2完整功能。</div>
				<div class="mgt5 font-bold">特色</div>
				<div class="mgt3 font-size-small">
					<div>* 支持内外盘期货、期权与股票期权商品。</div>
					<div>* 完整的模拟账务与回报。</div>
					<div>* 帮助您学习与锻炼交易技巧。</div>
				</div>
				<div class="mgt5 font-bold clr-orange">注意事项</div>
				<div class="mgt3 font-size-small">
					<div>* 超过 15 天未登入模拟交易使用，您的模拟账号将被系统删除。</div>
					<div class="mgt3">* 模拟交易为免费提供的服务，您必须明白并且了解系统可能有异常或无法服务的状况。</div>
				</div>
			`;			
		},
		wsConn() {
			let btID = `${this.brokerID}|${this.traderID}`;
			return this.$store.state.wsConnMap[btID] || {};
		},
		// 登入完成
		loginReady() {
			return this.wsConn.loginReady;
		},
		// 連線登入中
		connecting() {
			return this.wsConn.connecting;
		},
		closed() {
			return this.wsConn.closed;
		},
		displayTraderID() {
			return M4C.Trader.getDisplayTraderID(this.traderID);
		},
		appid() {
			try{return this.$store.state.config.quotePdSetting.third_party_auth.wechat.appid;}catch(e){}
		},
		secret() {
			try{return this.$store.state.config.quotePdSetting.third_party_auth.wechat.secret;}catch(e){}
		},
		phoneNumber() {
			return this.$store.state.sim.phoneNumber;
		},
		guestID() {
			return this.$store.state.sim.guestID;
		},
		// 是否啟用微信註冊功能
		enableWechat() {
			if (!this.appid || !this.secret)
				return;
			return !this.isAPP || (this.isAPP && window.Wechat);
		},
		// 是否啟用手機號註冊功能
		enablePhoneNumber() {
			try{return this.$store.state.config.quotePdSetting.third_party_auth.phone_number.enable;}catch(e){}
		},
		// 是否啟用遊客模式
		enableGuest() {
			try{return this.$store.state.config.quotePdSetting.third_party_auth.guest.enable;}catch(e){}
		},
		// 是否啟用帳密模式
		enableAccountPassword() {
			try{return this.$store.state.config.quotePdSetting.third_party_auth.account_password.enable;}catch(e){}
		},
		// 當前已經登入成功的 SIM 帳號的 traderID
		loginReadyTraderID() {
			let bto = this.$store.state.loginedBTOList.filter(o=>o.brokerID==='IceTech')[0];
			if (bto) {
				let btID = `${bto.brokerID}|${bto.traderID}`;
				let wsConn = this.$store.state.wsConnMap[btID] || {};
				if (wsConn && wsConn.loginReady)
					return bto.traderID;
			}
		},
	},
}
</script>

<style scoped>
.auth-btn {
	/* border: 1px solid #333; */
	border-radius: 4px;
	max-width: 25vw;
}
.icon-ctn {
	width: 52px;
	height: 52px;
	border-radius: 26px;
	border: 1px solid #363C42;
}
.wechat-icon {
	width: 52px;
	height: 52px;
	background-size: cover;
	background-image: url('data:image/png;base64,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');
}
.txt-label {
	width: 70px;
}
</style>