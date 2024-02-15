<template>
    <div class="FULL member-login-ctn flex-center flex-col">
		<div class="flex-col mglr5 pd3 flex-center">
			<!-- 圖片 -->
			<LoginImage class="login-image" @load="removeLoadingScreen" />
			<div class="flex-col flex-center posr">
				<!-- 生物辨識解鎖 -->
				<FingerprintUnlock v-show="false" :active="showFingerprintUnlock" :title="fingerprintTitle" @fingerprint-unlock="fingerprintUnlock" @close-unlock="closeSecurityUnlock" />
				<!-- 手勢解鎖 -->
				<PatternUnlock v-show="showPatternUnlock" class="mgt5" @pattern-unlock="patternUnlock" :bgWhite="true"/>
				<div class="flex-col flex-center" v-show="!showPatternUnlock">
					<input class="standard mgt5 font-size-little" @click="onTradeIDClick" @blur="onTradeIDBlur" type="text" v-model="inputTraderID"
						:placeholder="$ln(`請輸入您的帳號`)" @input="formatAccount" maxlength="15" />
					<input class="standard mgt5 font-size-little" type="password" v-model="inputPswd" :placeholder="$ln(`請輸入您的密碼`)" 
						@input="formatPassword" />
					<!-- 記憶密碼 -->
					<div class="flex-row mgtb2 w100p font-size-micro">
						<div class="flex-1 flex-start pdl1">{{$ln('記住密碼')}}</div>
						<div class="flex-end pdr1"><Toggle v-model="$store.state.status.keepPassword" mode="mini" /></div>
					</div>
					<!-- 登入按鈕 -->
					<Button class="mgtb5 btn-confirm iceben" @click="onBtnLogin">{{$ln(`登入`)}}</Button>
					<!-- 略過憑證直接登入 -->
					<SkipCertLogin v-if="enableLoginTestBtn" class="mgt5" @click="onSkipCertLogin" />
					<!-- 刪除本地憑證 -->
					<RemoveLocalCert v-if="enableLoginTestBtn" class="mgt2" />
				</div>
			</div>
			<!-- 使用帳號密碼登入 -->
			<div v-show="showIDLoginCheck" class="mgb5 pdb5 zindex-1" @click="closeSecurityUnlock">帳號密碼登入</div>
			<!-- 改用帳號密碼登入後的再啟用快速登入 -->
			<div v-show="showsecurityLockCheck" class="mgtb5" @click="showSecurityAgain">使用快速登入</div>
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
		<div class="broker-info flex-row">
			<div class="flex-1 flex-center tcef" @click="onWebSite"><i class="material-icons mgr2">language</i><span>富邦期貨官網</span></div>
			<div class="flex-1 flex-center"><i class="material-icons mgr2">phone</i><span>(02)2388-2626</span></div>
		</div>
		<!-- 憑證申請 -->
		<CertApply class="FULL" v-if="displayCertApply" :needTitle="true" :brokerID="brokerID" :traderID="traderID" :propPswd="inputPswd" :brokerInfo="brokerInfo" @close="displayCertApply = false" />
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
import CertApply from "@/projects/fubon.x4/CertApply.vue";
import LoginTradeMessage from "@/components/LoginTradeMessage.vue";
import LoginQuoteMessage from "@/components/LoginQuoteMessage.vue";
import SkipCertLogin from "@/components/Login/SkipCertLogin.vue";
import RemoveLocalCert from "@/components/Login/RemoveLocalCert.vue";
import ScreenShotBlock from "@/components/ScreenShotBlock.vue";
import CrackCheck from "@/components/Framework/CrackCheck.vue";
import FingerprintUnlock from "@/components/FingerprintUnlock.vue";
import PatternUnlock from "@/components/PatternUnlock.vue";

export default {
	props: [],
	data() {
		return {
			// 輸入框綁定的 traderID
			inputTraderID: "",
			// 實際用來登入的 traderID
			traderID: "",
			// 輸入密碼
			inputPswd: "",
			// 顯示憑證申請畫面
			displayCertApply: false,
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
			// 指紋解鎖對話框標題
			fingerprintTitle: '犀力環球 2.0',
			// 開啟開發者選項後的警示對話框中，是否按下確認
			crackConfirm: false,
		}
	},
	beforeMount() {},
    mounted() {
		if (this.loginedBTO) {
			this.traderID = this.loginedBTO.traderID;
			this.inputPswd = this.loginKeepPassword && this.loginedBTO.encryptPwd ? '************' : '';
			this.inputTraderID = this.traderIDMask;
		}
		// 判斷啟用快速登入
		this.showSecurityLock();
		// 關閉快速登入介面狀態，改帳密登入(除非重新選擇快速登入)
		if(this.$store.state.status.closeSecurityLock) this.closeSecurityUnlock();
	},
	beforeDestroy() {},
	components: {LoginImage, CertApply, LoginTradeMessage, LoginQuoteMessage, SkipCertLogin, RemoveLocalCert, ScreenShotBlock, CrackCheck, FingerprintUnlock, PatternUnlock},
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
			if (!this.traderID) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("請輸入您的帳號"));
				return;
			}
			if (!this.inputPswd) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("請輸入您的密碼"));
				return;
			}
			// 檢查憑證後簽章登入
			this.checkCertThenSignLogin();
		},
		// 檢查憑證後簽章登入
		checkCertThenSignLogin() {
			// 支持公開設定指定特定帳號略過憑證直接登入(for Apple 審核用測試帳號)
			if (!vuex.device.isAPP || this.isSkipCertLogin()) {
				this.onSkipCertLogin();
				return;
			}
			// 已存在憑證
			if (this.certReady) {
				M4C.Cert.certQuery({brokerInfo: this.brokerInfo, brokerID: this.brokerID, traderID: this.traderID, certNO: this.$cert.CERT_NO}).then(data=>{
					let statusCode = data.d.STATUS;
					// 0:有效憑證 || 31:憑證即將過期
					if (statusCode == 0 || statusCode == 31) {
						this.signLogin();
					}
					// 其它代號都需要重新申請憑證
					else {
						this.notifyCert({headText: M4C.Cert.getCertStatusText(statusCode)});
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
			// 使用記憶密碼登入
			if (this.inputPswd === '************') {
				loginBTO.encryptPwd = this.loginedBTO.encryptPwd;
			}
			// update loginedBTOList
			this.$store.state.loginedBTOList = [loginBTO];
			M4C.LoginTrade.doLogin(loginBTO);
        },
		// 點擊官網連結
		onWebSite() {
			window.openLink('https://www.fubon.com/futures/home/index.htm');
		},
		// 簽章並登入
		signLogin() {
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
			// 使用記憶密碼登入
			if (this.inputPswd === '************') {
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
				confirm: function(){
					this.isPopupCertApply = true;
					this.displayCertApply = true;
				}.bind(this),
			});
		},
		// 限制帳號格式
		formatAccount() {
			// 帳號限制英數字
			this.inputTraderID = this.inputTraderID.replace(/[^\a-\z\A-\Z0-9]/g, '');
			// 帳號第一碼固定轉大寫
			this.inputTraderID = this.inputTraderID.substr(0,1).toUpperCase() + this.inputTraderID.substr(1);
			// 限制長度 12 碼
			this.inputTraderID = this.inputTraderID.length > 12 ? this.inputTraderID.substr(0,12) : this.inputTraderID;
		},
		// 限制密碼格式
		formatPassword() {
			// 限制長度 20 碼
			this.inputPswd = this.inputPswd.length > 20 ? this.inputPswd.substr(0,20) : this.inputPswd;
		},
		onTradeIDClick() {
			this.inputTraderID = this.traderID;
		},
		onTradeIDBlur() {
			this.inputTraderID = this.traderIDMask;
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
		// 生物辨識解鎖成功
		fingerprintUnlock() {
			this.checkCertThenSignLogin();
			this.showFingerprintUnlock = false;
			this.crackConfirm = true;
		},
		// 手勢解鎖成功
		patternUnlock() {
			this.checkCertThenSignLogin();
			this.showPatternUnlock = false;
		},
		// 由安全(手勢/指紋/臉部)登入介面改為帳號密碼登入
		closeSecurityUnlock() {
			this.showPatternUnlock = false;
			this.showFingerprintUnlock = false;
			this.inputPswd = '';
			this.$store.state.status.keepPassword = false;
		},
		// 判斷啟用快速登入
		showSecurityLock() {
			// 有記憶密碼、有啟用生物辨識、沒有關閉快速登入介面
			if(this.inputPswd === '************' && this.enableFingerprintLock && !this.$store.state.status.closeSecurityLock) {
				this.showFingerprintUnlock = true;
			}
			// 有記憶密碼、有設定手勢登入
			if(this.inputPswd === '************' && this.enablePatternLock) {
				this.showPatternUnlock = true;
			}
			// 畫面上的記憶密碼
			this.$store.state.status.keepPassword = this.loginKeepPassword || this.showPatternUnlock || this.showFingerprintUnlock;
		},
		// 改用帳號密碼登入後的再啟用快速登入
		showSecurityAgain() {
			// 取消關閉快速登入介面
			this.$store.state.status.closeSecurityLock = false;
			this.inputPswd = '************';
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
			}
		},
		// 輸入的 traderID 改變
		traderID(nv, ov) {
			// 當前是記憶的密碼時，應予以清空，否則會使用記憶的 BTO 登入
			if (ov && nv && this.inputPswd === '************')
				this.inputPswd = '';
		},
		// 憑證與簽章密文已完成
		certReady(nv) {
			// 在申請憑證之後才出現憑證的情境才觸發自動登入
			if (this.isPopupCertApply && nv) {
				this.signLogin();
				this.isPopupCertApply = false;
			}
		},
		// inputTraderID 在無 *** 時，一律同步回 traderID
		inputTraderID(nv) {
			if (nv.indexOf('***') === -1)
				this.traderID = nv;
		},
		// 切換記住密碼
		loginKeepPassword(nv) {
			// 切至不記住密碼
			if (!nv) {
				// 若為 12* 時要清空
				if (this.inputPswd === '************')
					this.inputPswd = '';
				// 清掉已經記憶的 encryptPwd
				this.loginedBTO.encryptPwd = '';
			}
		},
	},
    computed: {
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
		// 畫面的記憶密碼
		keepPassword() {
			return this.$store.state.status.keepPassword;
		},
		// 核心的記憶密碼
		loginKeepPassword() {
			return this.$store.state.login.keepPassword;
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
		// 處理交易帳號第6到10碼轉換成*
		traderIDMask() {
			if(this.traderID){
				let txt = '';
				this.traderID.split('').forEach((w, idx)=> {
					// 非6到10碼，正常顯示
					if(idx < 5 || idx > 9)
						txt += w;
					else
						txt += '*';
				});
				return txt;
			}
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
			return !this.showPatternUnlock && this.securityLockCheck && this.$store.state.login.keepPassword;
		},
		// 顯示帳號密碼登入選項
		showIDLoginCheck() {
			return this.showPatternUnlock;
		}
	},
}
</script>

<style scoped>
.member-login-ctn {
	color: #626262;
	background-color: #FFF;
}
.login-image {
	width: 156px;
	height: 156px;
    margin-right: auto;
    margin-left: auto;
}
input.standard {
	width: 200px;
	height: 32px;
	border-radius: 4px;
	border: 1px solid #C5C5C5;
}
.btn-confirm {
	width: 230px !important;
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