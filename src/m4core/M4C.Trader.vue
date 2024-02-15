<template>
    <div class="m4c-trader hidden" />
</template>

<script>
import AnnouncePopup from "@/components/AnnouncePopup.vue";
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			changePasswordResult: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.Trader = this.$store.state.m4c.trader = this;
		M4C.regDispatch({'s': 'TRADE', 'c': 'trader.login', 'callback': this.onTraderLoginData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'trader.changepwd', 'callback': this.onChangePwdData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'notify.login', 'callback': this.onNotifyLoginData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'notify.system', 'callback': this.onNotifySystemData.bind(this)});
	},
    methods: {
		// 交易帳號登入 https://sites.google.com/a/icetech.com.tw/singleserver2/home/jiao-yi-fu-wu/zhang-wu-fu-wu/deng-ru-ge-shi#2
		// 斷線自動重連情境時，不會帶入任何參數
		traderLogin(wsConn) {
			let self = this;
			let info = wsConn.info;
			let bto = wsConn.bto;
			let bid = bto.brokerID;
			let usr = bto.traderID;
			let pwd = bto.traderPwd || '';
			let encryptPwd = bto.encryptPwd;
			let btID = `${bto.brokerID}|${bto.traderID}`;
			let timeoutMS = this.getTraderLoginTimeoutMS(wsConn);
			// 登入命令
			let cmd = {
				"s": "TRADE",
				"c": "trader.login",
				"d": {
					"BROKER_ID": bid,
					"TRADER_ID": usr,
					"TRADER_PWD": pwd,
					"MAC_ADDRESS": this.$store.state.device.macAddress,
					"CLIENT_TIMEOUT": +Big(timeoutMS).div(1000),
					"IPV4_ADDRESS": this.$store.state.device.ipv4,
					"IPV6_ADDRESS": this.$store.state.device.ipv6,
				},
				"r": "".random()
			};
			// 支持簽章登入(相容)
			if (bto.CERT_NO)		cmd.d.CERT_NO = bto.CERT_NO;
			if (bto.CERT_SUBJECT)	cmd.d.CERT_SUBJECT = bto.CERT_SUBJECT;
			if (bto.CERT_CONTENT)	cmd.d.CERT_CONTENT = bto.CERT_CONTENT;
			if (bto.CERT_SIG)		cmd.d.CERT_SIG = bto.CERT_SIG;

			// 支持穿透式API取得的內容
			if (this.deviceDigestMap[btID] && !this.deviceDigestMap[btID].$ERROR) 
				cmd.d.DEVICE_DIGEST = this.deviceDigestMap[btID];
			
			// 模擬帳號情境
			if (bid === "IceTech") {
				// 有帶 THIRD_PARTY_ID 時要塞入 THIRD_PARTY_ID 且不做密碼處理替換 ex. wechat 情境
				if (info.THIRD_PARTY_ID) {
					cmd.d.THIRD_PARTY_ID = info.THIRD_PARTY_ID;
				}
				// 之前的 模擬帳號 登入情境 -> 使用登入 AC 所用的 PBKDF2 密碼
				else {
					cmd.d.TRADER_PWD = M4C.AC.encodeACLoginPassword(info, info.initCode, pwd);
				}
			}
			// 自動登入情境 -> 使用 ENCRYPT_PWD 取代 TRADER_PWD
			if (encryptPwd) {
				delete cmd.d.TRADER_PWD;
				cmd.d.ENCRYPT_PWD = encryptPwd;
			}
			// 支持國密
			if (bto.inputPIN)
				cmd.d.PIN = bto.inputPIN;
			if (this.certDL)
				cmd.d.CERT_DL = true;
			if (this.certExtend)
				cmd.d.CERT_EXTEND = true;
			if (this.pinReset)
				cmd.d.PIN_RESET = true;

			// TW模式 90天密碼展延
			if (this.twMode && this.$store.state.status.extendPwd)
				cmd.d.EXTEND_PWD = true;
				
			M4C.send(cmd, {wsConn: wsConn});
			// 狀態更新
			wsConn.$CD = '';
			wsConn.$STATUS = 'TRADER-LOGIN';
			// 清除 AC 回應 -> 避免畫面殘留 AC 登入結果
			this.$set(wsConn, "responseData", {});

			// 清除連線階段Timeout
			if (wsConn.timeout)
				clearTimeout(wsConn.timeout);
			// 建立交易登入Timeout
			wsConn.timeout = setTimeout(()=>{
				wsConn.$CD = -99107;
				wsConn.$STATUS = 'TIMEOUT';
			}, timeoutMS);
		},
		// 收到 trader.login 資料
		onTraderLoginData(data, wsConn) {
			let self = this;
			// 不處理 cd:1, cd:2 (命令已送出,命令已完成)
			if (data.cd !== 1 && data.cd !== 2) {
				clearTimeout(wsConn.timeout);
				// 交易登入的結果
				this.$set(wsConn, 'responseData', data);
			}
			// 交易登入成功
			if (this.checkLoginSuccess(data, wsConn)) {
				// 取消關閉快速登入介面
				this.$store.state.status.closeSecurityLock = false;
				// 暫存編碼後密碼
				wsConn.$encryptPwd = data.d.ENCRYPT_PWD;
				// 更新 BTO (含編碼後密碼)
				M4C.BTO.updateLoginedBTOList(wsConn, data.d.ENCRYPT_PWD, data.d.ACCOUNTS);
				// 交易登入完成
				wsConn.$CD = data.cd;
				wsConn.$STATUS = 'TRADER-LOGIN-READY';
				wsConn.loginReady = true;
				wsConn.connecting = false;
				wsConn.accounts = data.d.ACCOUNTS;
				wsConn.agreements = data.d.AGREEMENTS;
				// 若有設定登入成功後切換為選中帳號 (ex. 登新帳號 or 切換登尚未登入的帳號)
				if (wsConn.key === this.$store.state.sync.autoSelectedBTID) {
					M4C.BTO.setSelected(wsConn);
					this.$store.state.sync.autoSelectedBTID = '';
				}
				// 登入完成呼叫
				if (this.$store.state.login.loginReadyAction) {
					this.$store.state.login.loginReadyAction();
					this.$store.state.login.loginReadyAction = null;
				}
				// 交易帳號登入成功發 BGInfo
				if (M4C.BGInfo)
					M4C.BGInfo.send('sub', wsConn, 'trade');
				// 交易連線登入完成事件
				M4C.trigger("TRADER-LOGIN-READY", wsConn);
				// 交易帳號登入成功發持續性連線命令 (若有簽署同意書)
				if (M4C.GTC) M4C.GTC.requestOpen(wsConn);
				// 交易帳號登入成功發送同意書設定 (一律用 update)
				if (M4C.SmoAgreement)
					M4C.SmoAgreement.updateAgreement(wsConn);
				// 更新此 traderID 所對應的 accountID 的憑證 (下單需要)
				if (M4C.Cert)
					M4C.Cert.updateAccountsCert({traderID: data.d.TRADER_ID, accounts: data.d.ACCOUNTS});
				// 支持弱密碼提示
				if (data.d.CODE === 204) {
					this.$store.state.notify({
						icon: `person`,
						head: `${data.d.TRADER_ID} ${this.$ln('弱密码提示')}`,
						body: data.d.MEMO || this.$ln('TRADE_204'),
						delay: 9988,
					});
				}
			}
			// 交易登入失敗
			else if (data.cd < 0) {
				// 密碼過期或失效 (-62:AC服務強制修改密碼, -551:Gateway強制修改密碼, -63:AC服務密碼已失效, -559:後台強制修改密碼)
				if (data.cd === -62 || data.cd === -63 || data.cd === -551 || data.cd === -559){
					eventBus.$emit("PASSWORD-INVALID", data, wsConn);
				}
				// 支持國密錯誤代碼對應處理
				switch(data.cd) {
					case -560:	// 國密證書不存在是否下載
						eventBus.$emit("CONFIRM-DIALOG", {
							title: this.$ln(`证书不存在或异常`),
							content: this.$ln(`点击确认自动下载新证书并登入`),
							confirm: () => {
								self.certDL = true;
								M4C.LoginTrade.doLogin(wsConn.bto);
							},
						});
						break;
					case -561:	// 國密證書過期是否展延
						eventBus.$emit("CONFIRM-DIALOG", {
							title: this.$ln(`凭证过期`),
							content: this.$ln(`点击确认自动展延凭证并登入`),
							confirm: () => {
								self.certExtend = true;
								M4C.LoginTrade.doLogin(wsConn.bto);
							},
						});
						break;
					case -562:	// PIN 被鎖定是否重置
						eventBus.$emit("CONFIRM-DIALOG", {
							title: this.$ln(`PIN码被锁定`),
							content: this.$ln(`点击确认自动重设PIN码并登入`),
							confirm: () => {
								self.pinReset = true;
								M4C.LoginTrade.doLogin(wsConn.bto);
							},
						});
						break;
				}
				// 狀態更新
				wsConn.$CD = data.cd;
				wsConn.$STATUS = 'TRADER-LOGIN-FAIL';
				wsConn.loginReady = false;
				wsConn.connecting = false;
			}
		},
		/** 檢查是否登入成功 */
		checkLoginSuccess(data, wsConn) {
			let result = false;
			if (data.cd === 0 && data.d && data.d.TRADER_ID && data.d.ACCOUNTS && data.d.ACCOUNTS.length > 0) {
				// 向前相容，有這些資料就先視為登入成功
				result = true;
				// 支持檢查子帳，若所有子帳皆為失敗時，才視為登入失敗
				let list = data.d.ACCOUNTS.filter(obj=>obj.CODE < 0);
				if (list.length === data.d.ACCOUNTS.length) {
					result = false;
					// 狀態更新 : 所有子帳皆失敗 CODE<0 時，回覆無可用的子帳號 (不針對每個子帳提示錯誤原因)
					wsConn.$CD = -99109;
					wsConn.$STATUS = 'NO-AVIALABLE-ACCOUNT';
					wsConn.loginReady = false;
					wsConn.connecting = false;
				}
			}
			return result;
		},
		/** 從已登入交易列表中清除指定的交易帳號 */
		clearLoginedBTOList(brokerID, traderID) {
			console.log(`M4C.Trader.clearLoginedBTOList : `, brokerID, traderID);
			this.loginedBTOList.forEach((obj, idx)=>{
				if (obj.brokerID === brokerID && (traderID==null || obj.traderID === traderID))
					this.$store.state.loginedBTOList.splice(idx, 1);
			});
		},
		// 取得當前的資金帳號
		getAccountID() {
			return this.accountID || (this.accounts && this.accounts[0] ? this.accounts[0].ACCOUNT_ID : "");
		},
		// 修改密碼
		changePassword(brokerID, traderID, newPwd, oldPwd) {
			// 模擬 -> 需帶 PBKDF2 編碼後密碼
			if (brokerID === "IceTech") {
				newPwd = M4C.AC.encodePBKDF2(newPwd);
				oldPwd = M4C.AC.encodePBKDF2(oldPwd);
			}
			// 以brokerID、traderID取得指定的ws連線
			let btID = `${brokerID}|${traderID}`;
			let wsConn = this.$store.state.wsConnMap[btID] || {};
			// 改密碼命令
			let cmd = {
				s: "TRADE",
				c: "trader.changepwd",
				r: "".random(),
				d: {
					BROKER_ID: brokerID,
					TRADER_ID: traderID,
					OLD_PWD: oldPwd,
					NEW_PWD: newPwd,
					MAC_ADDRESS: this.$store.state.device.macAddress,
				}
			}
			M4C.send(cmd, {wsConn: wsConn});

			return this.baseQuery('DataChangePassword');
		},
		// 修改密碼回覆
		onChangePwdData(data, wsConn) {
			let result = this.baseOnTradeData('DataChangePassword', data, "TRADE_");
			result.data = data;
			// trader.changepwd 密碼修改成功 -> 更新記憶的密碼，供斷線重連使用
			if (data.d.cd === 0 && data.d.ENCRYPT_PWD) {
				M4C.BTO.updateLoginedBTOList(wsConn, data.d.ENCRYPT_PWD);
			}
		},
		// 清除所有交易資料
		clearAllData() {
			// vuex 持倉匯總資料
			this.$store.state.data.normalPositionSumList = []
			this.$store.state.selectedSymbol.positionSum = {};
			// vuex 有效回報資料
			this.$store.state.data.availableReportList = [];
			// vuex 全部回報資料
			this.$store.state.data.orderReportList = [];
			// vuex 成交回報資料
			this.$store.state.data.filledReportList = [];
			// vuex 雲端回報資料
			this.$store.state.data.cloudReportList = [];
			// vuex 資金資料
			this.$store.state.data.marginData = {};
			// 支持記憶最後選擇幣別，這邊不清空，需要觀察是否有副作用...
			// this.$store.state.status.selectedCurrency = "";
		},
		// 檢查是否已經登入交易帳號，未登入時同時彈出對應視窗
		checkLoginTrade() {
			if (!this.selectedLoginReady) {
				// 已存在登入帳號列表 -> 彈出 BTO 管理視窗 (desktop 時直接彈出 DeskTradingAccountManager)
				if (this.loginedBTOList.length)
					eventBus.$emit('POPUP-DIALOG', this.isDesktop ? 'DesktopTradingAccountManager' : 'LoginedBTOManager', {}, {transName: 'float'});
				// 沒有任何記憶中的帳號 -> 直接彈出登入其它帳號視窗
				else
					eventBus.$emit('POPUP-DIALOG', this.$store.state.status.loginTradeClass, {}, {transName: 'float'});
			}
			return this.selectedLoginReady;
		},
		// 登出指定的交易帳號
		logout(brokerID, traderID) {
			brokerID = brokerID || this.brokerID;
			traderID = traderID || this.traderID;
			let btID = `${brokerID}|${traderID}`;
			let wsConn = this.$store.state.wsConnMap[btID];
			// 登出帳號為當前選擇帳號時 -> 清除所有資料
			if (brokerID === this.brokerID && traderID === this.traderID)
				this.clearAllData();
			// BGInfo 登出
			if (M4C.BGInfo)
				M4C.BGInfo.logout(wsConn, 'trade');
			// 中斷連線
			M4C.disconnectWsConn(wsConn);
			console.log(M4C.getWsConnMark(wsConn), `logout !`);
		},
		// 支持從 ac response 的 pdsetting.broker.timeout 取得 timeout 秒數
		getTraderLoginTimeoutMS(wsConn) {
			let ms = 10000;
			// 設定僅存在交易連線上 (因為還沒登入完成，所以沒有寫進 vuex)
			try {ms = wsConn.acResponse.d['2stepLoginTimeout'];}catch(err){}
			return ms || 10000;
		},
		// 取得顯示用的 traderID
		getDisplayTraderID(traderID) {
			if (!traderID) return;
			if (traderID.indexOf('#w#') != -1)
				traderID = `${this.$ln('模拟帐号')} ${traderID.split('#w#')[1].substr(0,6).toLowerCase()}`;
			else if (traderID.indexOf('#p#') != -1)
				traderID = `${this.$ln('模拟帐号')} ****${traderID.split('#p#')[1].substr(-4)}`;
			else if (traderID.indexOf('#g#') != -1)
				traderID = `${this.$ln('模拟帐号')} ${traderID.split('#g#')[1].substr(-4).toUpperCase()}`;
			return traderID;
		},
		// 收到server轉送的櫃台公告
		onNotifyLoginData(data) {
			// 以NOTIFY_ID判別是否有公告內容
			if(data.cd === 0 && data.d.NOTIFY_ID) {
				// 有設定不彈出公告時不處理(by自動測試用)
				if(this.preventPopupAnnounce) return;
				// 彈出公告訊息
				eventBus.$emit("POPUP-FLOAT-DIALOG",  {comClass: AnnouncePopup, param: data.d});
			}
		},
		// 收到交易系統訊息
		onNotifySystemData(data) {
			console.log('onNotifySystemData : ', JSON.stringify(data));
			// 交易系統reset -> 清除所有交易資料，避免殘留
			if (data.d && data.d.TYPE === 'SystemReset') {
				this.clearAllData();
			}
			// 交易後台錯誤訊息通知機制 https://trello.com/c/Bx94NjBg
			else if (data.d && data.d.TYPE === 'SystemError') {
				let obj = data.d.DATA;
				let brokerName = this.$store.state.brokerNameMap[obj.BROKER_ID] || obj.BROKER_ID;
				this.$store.state.notify({
					icon: 'error',
					head: this.$ln('交易后台错误讯息'),
					htmlBody: `
						<div class="flex-col">
							<div class="clr-gray">${brokerName}</div>
							<div>${this.$ln('帐号')} : ${obj.TRADER_ID}</div>
							<div>${this.$ln('代码')} : ${obj.CODE}</div>
							<div class="word-break-all">${this.$ln('讯息')} : ${obj.MSG}</div>
						</div>
						`,
				});
			}
		},
	},
	watch: {
		/** 交易帳號切換 */
		btID(nv){
			this.clearAllData();
			// M4C.Position.initPositionSum();
			// M4C.Report.initReport();
			// M4C.Margin.initMargin();
		},
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		pid() {
			return this.$store.state.config.projectID;
		},
		brokerID() {
			return this.selectedBTO.brokerID;
		},
		traderID() {
			return this.selectedBTO.traderID;
		},
		accounts() {
			return this.selectedWSConn ? this.selectedWSConn.accounts : null;
		},
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
		/** 當前交易帳號 BTO 物件 */
		selectedBTO() {
			return this.$store.state.selectedBTO;
		},
		/** 當前選擇帳號的 wsConn 物件 */
		selectedWSConn() {
			let bto = this.selectedBTO;
			if (bto) {
				let btID = `${bto.brokerID}|${bto.traderID}`;
				return this.$store.state.wsConnMap[btID];
			}
		},
		/** 當前選擇帳號是否已經登入完成 */
		selectedLoginReady() {
			return this.$store.state.login.loginReady;
		},
		btID() {
			return this.$store.state.login.btID;
		},
		deviceDigestMap() {
			return this.$store.state.device.deviceDigestMap;
		},
		// 不彈出公告(by測試用，避免非預期彈出對話框影響自動測試)
		preventPopupAnnounce() {return window.$preventPopupAnnounce;},
		// 取得當前選取的資金(子)帳號
		accountID() {return this.$store.state.selectedBTO.selectedAccountID;},
	},
}
</script>
