<template>
    <div class="FULL member-login-ctn flex-center flex-col">
		<div class="flex-col mglr5 flex-center">
			<!-- 圖片 -->
			<LoginImage class="login-image" @load="removeLoadingScreen" />
			<div class="input-ctn flex-col flex-center posr">
				<!-- 生物辨識解鎖 -->
				<FingerprintUnlock v-show="false" :active="showFingerprintUnlock" :title="fingerprintTitle" @fingerprint-unlock="fingerprintUnlock" @close-unlock="closeSecurityUnlock"/>
				<!-- 手勢解鎖 -->
				<PatternUnlock v-show="showPatternUnlock" class="mgt5" @pattern-unlock="patternUnlock" :bgWhite="true"/>
				<div class="flex-col flex-center" v-show="!showPatternUnlock">
					<!-- 輸入帳號 -->
					<SecurityInput class="security-input mgt5" v-model="traderID" @input="formatAccount" :placeholder="$ln(`請輸入您的帳號`)" />
					<!-- 輸入密碼 -->
					<SecurityInput class="security-input mgt5" v-model="inputPswd" @input="formatPassword" :placeholder="$ln(`請輸入您的密碼`)" />
					<!-- 記住身分證號 -->
					<div class="flex-row mgtb5 w100p">
						<div class="flex-1 flex-start pdl1">{{$ln('記住身分證號')}}</div>
						<div class="flex-end pdr1"><Toggle v-model="$store.state.status.keepAccount" mode="mini" /></div>
					</div>
					<div class="flex-row space-between w100p" >
						<!-- 登入按鈕 -->
						<Button class="mgt2 btn-confirm iceben" @click="onBtnLogin">{{$ln(`登入`)}}</Button>
						<!-- 清除按鈕 -->
						<Button class="mgt2 btn-confirm iceben" @click="onBtnClear">{{$ln(`清除`)}}</Button>
					</div>
					<div v-if="enableLoginTestBtn" class="flex-row space-between w100p mgt2" >
						<!-- 略過憑證直接登入 -->
						<SkipCertLogin class="btn-confirm" @click="onSkipCertLogin" />
						<!-- 刪除本地憑證 -->
						<RemoveLocalCert class="btn-confirm" />
					</div>
				</div>
			</div>
			<!-- 使用帳號密碼登入 -->
			<div v-show="showIDLoginCheck" class="mgb5 pdb5 zindex-1" @click="closeSecurityUnlock">帳號密碼登入</div>
			<!-- 改用帳號密碼登入後的再啟用快速登入 -->
			<div v-show="showsecurityLockCheck" class="mgtb5 zindex-1" @click="showSecurityAgain">使用快速登入</div>
			<!-- 交易登入提示 -->
			<LoginTradeMessage class="font-size-small" :wsConn="wsConn" @onExtendPwd="onExtendPwd" />
			<!-- 報價連線提示 -->
			<LoginQuoteMessage class="font-size-small" :killMe="wsConn" />
		</div>
		<!-- 版本號 -->
		<div class="ver-box flex-row flex-center posa">
			<div class="flex-row flex-center mglr1"><span class="ver-title mglr1 text-align-center">M</span>{{ versionNumber }}</div>
			<div class="flex-row flex-center mglr1"><span class="ver-title mglr1 text-align-center">A</span>{{ $store.state.device.appVersion }}</div>
		</div>
		<!-- 底部列 -->
		<div class="broker-info flex-row font-size-small">
			<div class="flex-1 flex-center tcef" @click="onWebSite"><i class="material-icons mgr">language</i><span>華南期貨官網</span></div>
			<div class="flex-1 flex-center tcef" @click="onOpenAccount"><span>期貨線上開戶</span></div>
			<div class="flex-1 flex-center" @click="openTel('0255708000')"><i class="material-icons mgr1">phone</i><span>02-5570-8000</span></div>
		</div>
		<!-- 提示訊息 -->
		<BlockMessage v-if="bmParam.display" :param="bmParam"></BlockMessage>
		<!-- 截圖權限設定與提示 -->
		<ScreenShotBlock v-if="showScreenShot" v-model="showScreenShot"/>
		<!-- 破解、越獄、開發者檢查 -->
		<CrackCheck v-if="showCrackCheck" v-model="showCrackCheck" :clickConfirm="crackConfirm"/>
    </div>
</template>

<script>
import Password from "@/components/Password.vue"
import LoginImage from "@/components/Login/LoginImage.vue";
import CertApply from "@/projects/huanan.x4/CertApply.vue";
import LoginTradeMessage from "@/components/LoginTradeMessage.vue";
import LoginQuoteMessage from "@/components/LoginQuoteMessage.vue";
import SkipCertLogin from "@/components/Login/SkipCertLogin.vue";
import RemoveLocalCert from "@/components/Login/RemoveLocalCert.vue";
import ScreenShotBlock from "@/components/ScreenShotBlock.vue";
import CrackCheck from "@/components/Framework/CrackCheck.vue";
import FingerprintUnlock from "@/components/FingerprintUnlock.vue";
import PatternUnlock from "@/components/PatternUnlock.vue";
import SecurityInput from "@/components/Framework/SecurityInput.vue";

export default {
	props: [],
	data() {
		return {
			traderID: "",
			// 輸入密碼
			inputPswd: "",
			// 有進入申請憑證情境
			isPopupCertApply: false,
			// BlockMessage參數
			bmParam: {},
			// 截圖檢查
			showScreenShot: true,
			// 破解檢查
			showCrackCheck: true,
			// 顯示生物辨識解鎖
			showFingerprintUnlock: false,
			// 顯示手勢解鎖
			showPatternUnlock: false,
			// 開啟開發者選項後的警示對話框中，是否按下確認
			crackConfirm: false,
			// 顯示密碼
			showPassword: false,
			// 顯示使用登入
			loginFail: false
		}
	},
	beforeMount() {},
    mounted() {
		this.$store.state.status.keepAccount = this.loginKeepAccount;
		// 有勾選記住帳號才顯示帳號
		if(this.keepAccount){
			this.traderID = this.loginedBTO.traderID;
		};

		// 判斷啟用快速登入
		this.showSecurityLock();
		// 關閉快速登入介面狀態，改帳密登入(除非重新選擇快速登入)
		if(this.$store.state.status.closeSecurityLock) this.closeSecurityUnlock();
	},
	beforeDestroy() {},
	components: {LoginImage, CertApply, LoginTradeMessage, LoginQuoteMessage, SkipCertLogin, RemoveLocalCert, ScreenShotBlock, CrackCheck, FingerprintUnlock, PatternUnlock, SecurityInput},
    methods: {
		// 移除載入主程式畫面
		removeLoadingScreen() {
			window.removeScreenLoadingBuild();
		},
		doLogin() {
			this.enableLoginTestBtn ? this.onSkipCertLogin() : this.onBtnLogin();
		},
		// 點擊登入按鈕
		onBtnLogin() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 3000);
			if (!this.traderID) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("請輸入您的帳號"));
				return;
			}
			if (!this.inputPswd) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("請輸入您的密碼"));
				return;
			}
			// 支持公開設定指定特定帳號略過憑證直接登入(for Apple 審核用測試帳號)
			if (this.isSkipCertLogin()) {
				this.onSkipCertLogin();
				return;
			}
			// 檢查憑證後簽章登入
			this.checkCertThenSignLogin();
		},
		// 檢查憑證後簽章登入
		checkCertThenSignLogin() {
			// 已存在憑證
			if (this.certReady) {
				M4C.Cert.certQuery({brokerInfo: this.brokerInfo, brokerID: this.brokerID, traderID: this.traderID, certNO: this.$cert.CERT_NO}).then(data=>{
					let statusCode = data.d.STATUS;
					// 0:有效憑證 || 31:憑證即將過期
					if (statusCode === '0' || statusCode === '31') {
						this.signLogin();
					}
					// 其它代號都需要重新申請憑證
					else {
						// this.notifyCert({headText: M4C.Cert.getCertStatusText(statusCode)});
						eventBus.$emit("CONFIRM-DIALOG", {
							title: this.$ln('憑證異常'),
							content: this.$ln('本機憑證異常或已過期，按下確認後將清除本地憑證，請重新登入並申請憑證'),
							confirm: ()=>{
								// 清除此身份的憑證，讓再次登入時可開始申請新憑證
								this.$store.state.cert[this.traderID] = {};
								// 清除密碼欄位，因為全景需要先 trader.query 查詢基本資料時需要帶入密碼明碼
								this.inputPswd = '';
								// 若存在編碼後密碼，則直接前往申請憑證提示(免再次輸入密碼)
								if (this.loginedBTO.encryptPwd) {
									setTimeout(()=>{
										this.notifyCert({headText: this.$ln('重新申請憑證')});
									}, 300);
								}
							},
						});
					}
				}).catch(err=>{
					// 顯示提示
					this.bmParam = {display: true, head: this.$ln('憑證查詢失敗'), body: `(${err.CODE}) ${err.MSG}`, showConfirmBtn: true};
				});
			}
			// 未存在憑證
			else {
				this.notifyCert({headText: this.$ln('系統未檢測到憑證')});
			}
		},
		// 清除帳號密碼
		onBtnClear(){
			this.traderID = '';
			this.inputPswd = '';
		},
		// 點擊忘記密碼
		onBtnForgetPass(){
			window.openLink('https://ecounter2.tssco.com.tw/#/password/forgot/info');
		},
		// 點及密碼解鎖
		onBtnPasswordUnlock(){
			window.openLink('https://ecounter2.tssco.com.tw/#/password/unlock/info');
		},
		// 期貨線上開戶
		onOpenAccount(){
			window.openLink('https://www.tsfutures.com.tw/dsolreg/#/');

		},
		// 略過憑證直接登入
        onSkipCertLogin() {
			this.justSkipCertLogin = true;
			let loginBTO = {
				brokerID: this.brokerID,
				traderID: this.traderID,
				traderPwd: this.inputPswd,
				brokerInfo: this.brokerInfo,
				selected: true,
				// 前次登入記憶的子帳
				selectedAccountID: this.lastSelectedAccountID,
			};
			// 使用快速登入
			if (this.inputPswd==="" && this.securityLockCheck) {
				loginBTO.encryptPwd = this.loginedBTO.encryptPwd;
			}
			// update loginedBTOList
			this.$store.state.loginedBTOList = [loginBTO];
			M4C.LoginTrade.doLogin(loginBTO);
        },
		// 點擊官網連結
		onWebSite() {
			window.openLink('https://www.huanan.com.tw/');
		},
		// 點擊電話號碼 -> 快捷至撥號功能
		openTel(num) {
			window.openLink(`tel:${num}`);
		},
		// 簽章並登入
		signLogin() {
			// 若有設定 SSLPinning 檢查 且 檢查不通過時 -> 不允許登入
			if (M4C.SSLPinning.testFail) return;
			let certContent = `${this.brokerID}|${this.traderID}|${new Date().dayTime18()}`;
			// 將明文簽出密文
			M4C.Cert.getSign(certContent).then((certSig)=>{
				// 交易登入
				this.loginTrade({certContent, certSig});
			}).catch(err=>{
				this.$store.state.notify(`error`, `(${err.CODE}) ${err.MSG}`);
			});
		},
		// 交易登入
		loginTrade({certContent, certSig}) {
			let loginBTO = {
				brokerID: this.brokerID,
				traderID: this.traderID,
				traderPwd: this.inputPswd,
				brokerInfo: this.brokerInfo,
				selected: true,
				// 前次登入記憶的子帳
				selectedAccountID: this.lastSelectedAccountID,
			};
			// 使用快速登入
			if (this.inputPswd==="" && this.securityLockCheck) {
				loginBTO.encryptPwd = this.loginedBTO.encryptPwd;
			}
			// 簽章內容
			loginBTO.CERT_NO = this.$cert.CERT_NO;		// 簽章序號
			loginBTO.CERT_SUBJECT = 'LOGIN';			// 簽章主旨
			loginBTO.CERT_CONTENT = certContent;		// 簽章明文
			loginBTO.CERT_SIG = certSig;				// 簽章密文
			// update loginedBTOList
			this.$store.state.loginedBTOList = [loginBTO];
			M4C.LoginTrade.doLogin(loginBTO);
		},
		// 提示無有效憑證->準備進入申請憑證畫面
		notifyCert({headText}) {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: headText,
				content: this.$ln('爲了保障您的交易安全，您必須完成憑證申請。'),
				cancelText: "回到登入畫面",
				confirmText: "繼續申請憑證",
				confirm: ()=>{
					this.isPopupCertApply = true;
					// 查詢交易帳號資訊
					this.traderQuery().then(data=>{
						vuex.data.traderQueryResult = data;
						// 關閉提示
						this.bmParam = {display: false};
						// 彈出憑證申請視窗
						this.popupApplyDialog(data.d.ACCOUNTS);
					}).catch(err=>{
						let str = err.CODE==null ? '' : `(${err.CODE}) ` + (err.MSG || '無法取得帳號資訊');
						this.bmParam = {display: true, head: '查詢失敗', body: str, showLoadingIcon: false, showConfirmBtn: true};
					});
				},
			});
		},
		// 查詢使用者資訊
		traderQuery() {
			// 查詢 OTP 選單
			this.bmParam = {display: true, head: '查詢帳號資訊', body: '正在查詢帳號 OTP 資訊', showLoadingIcon: true};
			return new Promise((resolve, reject)=>{
				let cmd = {
					"s": "TRADE",
					"c": "trader.query",
					"d": {
						"BROKER_ID": this.brokerID,
						"TRADER_ID": this.traderID,
						"TRADER_PWD": this.inputPswd,
					},
					"r": ''.random(),
				};
				// 支持已登入情境(無密碼明碼)也可以查詢
				if (!this.inputPswd && this.loginedBTO.encryptPwd) {
					delete cmd.d.TRADER_PWD;
					cmd.d.ENCRYPT_PWD = this.loginedBTO.encryptPwd;
					cmd.d.MAC_ADDRESS = vuex.device.macAddress;
				}
				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), 9988, '[OTP/憑證]').then(data => {
					// data: {"s":"TRADE","c":"trader.query","d":{"BROKER_ID":"TAISHIN","TRADER_ID":"I225589312","TRADER_NAME":"ET0401089","ACCOUNTS":[{"ACCOUNT_ID":"F040000-0401089","ACCOUNT_TYPE":["I","O","F"],"CUST_NAME":"廠＊測試二","MOBILE":"0935570827","EMAIL":"Xavierpan@tssco.com.tw"}]},"cd":0,"r":"NNDT0KNG"}
					console.log('[OTP/憑證] traderQuery 完成');
					resolve(data);
				}).catch(err=>reject(err));
			});
		},
		// 彈出憑證申請視窗
		popupApplyDialog(accounts) {
			eventBus.$emit('POPUP-DIALOG', CertApply, {
				mode: 'apply',
				brokerID: this.brokerID,
				traderID: this.traderID,
				brokerInfo: this.brokerInfo,
				propPswd: this.inputPswd,
				accounts,
			}, {transName: 'float'});
		},
		// 限制帳號格式
		formatAccount() {
			// 帳號限制英數字
			this.traderID = this.traderID.replace(/[^\a-\z\A-\Z0-9]/g, '');
			// 帳號第一碼固定轉大寫
			this.traderID = this.traderID.substr(0,1).toUpperCase() + this.traderID.substr(1);
			// 限制長度 12 碼
			this.traderID = this.traderID.length > 12 ? this.traderID.substr(0,12) : this.traderID;
		},
		// 限制密碼格式
		formatPassword() {
			// 限制長度 20 碼
			this.inputPswd = this.inputPswd.length > 20 ? this.inputPswd.substr(0,20) : this.inputPswd;
		},
		// 當前帳號是否要略過憑證直接登入
		isSkipCertLogin() {
			if (this.justSkipCertLogin)
				return true;
			let skipCertLoginAccountList = [];
			try{skipCertLoginAccountList = this.publicPdSetting.function.skipCertLogin.accountList;}catch(e){}
			if (skipCertLoginAccountList.indexOf(this.traderID) !== -1) {
				let skipCertLoginHost;
				try{skipCertLoginHost = this.publicPdSetting.function.skipCertLogin.host;}catch(e){}
				this.brokerInfo.host = skipCertLoginHost || this.brokerInfo.host;
				return true;
			}
		},
		// 生物辨識解鎖成功後判斷是否略過憑證登入
		fingerprintUnlock() {
			// 若有設定 SSLPinning 檢查 且 檢查不通過時 -> 不允許登入
			if (M4C.SSLPinning.testFail) return;
			vuex.device.isAPP ? this.checkCertThenSignLogin() : this.onSkipCertLogin();
			this.showFingerprintUnlock = false;
			this.crackConfirm = true;
		},
		// 手勢解鎖成功後判斷是否略過憑證登入
		patternUnlock() {
			vuex.device.isAPP ? this.checkCertThenSignLogin() : this.onSkipCertLogin();
			this.showPatternUnlock = false;
		},
		// 由安全(手勢/指紋/臉部)登入介面改為帳號密碼登入
		closeSecurityUnlock() {
			this.showPatternUnlock = false;
			this.showFingerprintUnlock = false;
			this.inputPswd = '';
			// 勾選儲存帳號
			if(this.keepAccount){
				this.traderID = this.loginedBTO.traderID;
			};
		},
		// 判斷啟用快速登入
		showSecurityLock() {
			// 有啟用生物辨識、沒有關閉快速登入介面
			if(this.enableFingerprintLock && !this.$store.state.status.closeSecurityLock) {
				this.showFingerprintUnlock = true;						
				this.traderID = this.loginedBTO.traderID;
			}
			// 有設定手勢登入
			if(this.enablePatternLock) {
				this.showPatternUnlock = true;
				this.traderID = this.loginedBTO.traderID;
			}
		},
		// 改用帳號密碼登入後的再啟用快速登入
		showSecurityAgain() {
			// 取消關閉快速登入介面
			this.$store.state.status.closeSecurityLock = false;
			this.showSecurityLock();
		},
		// 90天密碼展延
		onExtendPwd(str) {
			eventBus.$emit("CONFIRM-DIALOG", {
				content: str,
				cancelText: "修改密碼",
				confirmText: "暫不變更",
				cancel: function(){
					console.log('90天密碼展延->修改密碼');
					eventBus.$emit('POPUP-DIALOG', Password, '', {transName: 'float'});
				}.bind(this),
				confirm: function(){
					console.log('90天密碼展延->暫不變更');
					this.$store.state.status.extendPwd = true;
					setTimeout(this.doLogin, 200);
				}.bind(this),
			});

		},
	},
	watch: {
		// 交易登入成功
		loginReady(nv) {
			if (nv) {
				// 開始建立報價連線
				this.$set(this.$store.state.config.CONFIG, 'LOGIN_QUOTE', true);
			}else{
				this.loginFail = true;
			}
		},
		// 憑證與簽章密文已完成
		certReady(nv) {
			// 在申請憑證之後才出現憑證的情境才觸發自動登入
			if (this.isPopupCertApply && nv) {
				this.signLogin();
				this.isPopupCertApply = false;
			}
		},
	},
    computed: {
		keepAccount(){
			return this.$store.state.status.keepAccount;
		},
		// 核心的記憶帳號
		loginKeepAccount() {
			return this.$store.state.login.keepAccount;
		},
		ss2api() {
			return `${this.brokerInfo.apiProtocol}://${this.brokerInfo.host}/ss2/api`;
		},
		brokerID() {
			return this.brokerInfo.broker_id;
		},
		loginedBTO() {
			return this.$store.state.loginedBTOList[0];
		},
		// 當前交易連線
		wsConn() {
			return this.$store.state.selectedWSConn;
		},
		// 交易連線 - 登入完成
		loginReady() {
			return this.wsConn.loginReady;
		},
		// 憑證已完成
		certReady() {
			return this.$cert.CERT && this.$cert.CERT_NO;
		},
		// 此帳號的憑證Obj
		$cert() {
			return this.$store.state.cert[this.traderID] || {};
		},
		publicPdSetting() {
			return this.$store.state.config.publicPdSetting;
		},
		// 從公開設定取得經濟商選單
		brokerInfoList() {
			return this.publicPdSetting.trade.brokers;
		},
		// 富邦不顯示經濟商選單，直接使用第一組即可
		brokerInfo() {
			return this.brokerInfoList[0];
		},
		// 啟用登入測試按鈕
		enableLoginTestBtn() {
			try{return this.publicPdSetting.function.enableLoginTestBtn;}catch(e){}
		},
		versionNumber() {
			return window._version.v;
		},
		// 前次登入選擇的資金帳號
		lastSelectedAccountID() {
			if (this.loginedBTO && this.loginedBTO.traderID === this.traderID)
				return this.loginedBTO.selectedAccountID;
		},
		projectID() {
			return this.$store.state.config.projectID;
		},
		// 是否勾選手勢登入
		enablePatternLock() {
			return this.$store.state.securityLogin.type == 'pattern';
		},
		// 是否勾選生物辨識登入
		enableFingerprintLock() {
			return this.$store.state.securityLogin.type == 'finger';
		},
		// 確實正在使用快速登入
		securityLockCheck() {
			return (this.enableFingerprintLock && vuex.status.fingerPrintAvailable) || this.enablePatternLock;
		},
		// 顯示快速登入選項
		showsecurityLockCheck() {
			return !this.showPatternUnlock && this.securityLockCheck && !this.loginFail;
		},
		// 顯示帳號密碼登入選項
		showIDLoginCheck() {
			return this.showPatternUnlock;
		},
		// 生物辨識標題文字
		fingerprintTitle() {
			try{return this.publicPdSetting.CONFIG.Login.fingerprintTitle}catch(e){return '台新X4';}
		},
	},
}
</script>

<style scoped>
.member-login-ctn {
	color: white;
}
.login-image {
	position: absolute;
}
.login-image /deep/ .logo {
	height: auto; /* 使图像的高度等于视口的高度 */
	object-fit: contain; /* 保持图像的比例，但可能不会覆盖整个容器宽度 */
	width: 100vw; /* 宽度会根据高度自动调整 */
	overflow: hidden; /* 隐藏超出容器的部分 */  
}
.input-ctn {
	margin-top: 30vh;
}
input.standard {
	width: 200px;
	height: 32px;
	border-radius: 4px;
	border: 1px solid #C5C5C5;
}
.security-input /deep/ input {
	width: 184px;
	height: 32px;
	border-radius: 4px;
	border: 1px solid #C5C5C5;
}
.btn-confirm {
	width: 105px !important;
	height: 34px !important;
	border-radius: 4px !important;
}
.message-ctn {
	color: #333;
}
.broker-info {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 47px;
	color: white;
	background-color: #0094BC;
}
.member-login-ctn /deep/ .loading-ctn {
	top: 40%;
	background-color: #34485E;
}
.ver-box {
	bottom: 50px;
	color: #d4d4d4;
	font-size: 0.5em;
}
.ver-title {
	line-height: 2vh;
	border: 1px solid #d4d4d4;
	border-radius: 1vw;
	width: 2vh;
	height: 2vh;
}
</style>