<template>
    <div class="FULL member-login-ctn flex-center flex-col">
		<div class="flex-col mglr5 pd3 flex-center">
			<!-- 圖片 -->
			<LoginImage class="login-image" @load="removeLoadingScreen" />
			<input class="standard mgt5 font-size-little" type="text" v-model="inputTraderID"
				:placeholder="$ln(`請輸入您的帳號`)" @input="formatAccount" maxlength="15" />
			<input class="standard mgt5 font-size-little" type="password" v-model="inputPswd" :placeholder="$ln(`請輸入您的密碼`)" 
				@input="formatPassword" />
			<!-- 記憶密碼 -->
			<div class="flex-row mgtb2 w100p font-size-micro">
				<div class="flex-1 flex-start pdl1">{{$ln('記住密碼')}}</div>
				<div class="flex-end pdr1"><Toggle v-model="$store.state.login.keepPassword" mode="mini" /></div>
			</div>
			<!-- 登入按鈕 -->
			<Button class="mgtb5 btn-confirm iceben" @click="onBtnLogin">{{$ln(`登入`)}}</Button>
			<!-- 交易登入提示 -->
			<LoginTradeMessage class="font-size-small" :wsConn="wsConn" />
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
			<div class="flex-1 flex-center tcef" @click="onWebSite"><i class="material-icons mgr2">language</i><span>艾揚科技官網</span></div>
			<div class="flex-1 flex-center"><i class="material-icons mgr2">phone</i><span>(02)2558-6101</span></div>
		</div>
		<!-- 提示訊息 -->
		<BlockMessage v-if="bmParam.display" :param="bmParam"></BlockMessage>
		<!-- 截圖權限設定與提示 -->
		<ScreenShotBlock v-if="showScreenShot" v-model="showScreenShot"/>
		<!-- 破解、越獄、開發者檢查 -->
		<CrackCheck v-if="showCrackCheck" v-model="showCrackCheck" />
    </div>
</template>

<script>
import LoginImage from "@/components/Login/LoginImage.vue";
import LoginTradeMessage from "@/components/LoginTradeMessage.vue";
import LoginQuoteMessage from "@/components/LoginQuoteMessage.vue";
import SkipCertLogin from "@/components/Login/SkipCertLogin.vue";
import RemoveLocalCert from "@/components/Login/RemoveLocalCert.vue";
import ScreenShotBlock from "@/components/ScreenShotBlock.vue";
import CrackCheck from "@/components/Framework/CrackCheck.vue"

export default {
	props: [],
	data() {
		return {
			// 輸入框綁定的 traderID
			inputTraderID: "",
			// 輸入密碼
			inputPswd: "",
			// BlockMessage參數
			bmParam: {},
			// 截圖檢查
			showScreenShot: true,
			// 破解檢查
			showCrackCheck: true,
		}
	},
	beforeMount() {},
    mounted() {
		if (this.loginedBTO) {
			this.inputTraderID = this.loginedBTO.traderID;
			this.inputPswd = this.loginedBTO.encryptPwd ? '************' : '';
		}
	},
	beforeDestroy() {},
	components: {LoginImage, LoginTradeMessage, LoginQuoteMessage, ScreenShotBlock, CrackCheck},
    methods: {
		// 移除載入主程式畫面
		removeLoadingScreen() {
			window.removeScreenLoadingBuild();
		},
		// 點擊登入按鈕
		onBtnLogin() {
			let loginBTO = {
				brokerID: this.brokerID,
				traderID: this.inputTraderID,
				traderPwd: this.inputPswd,
				brokerInfo: this.brokerInfo,
				selected: true,
			};
			// 使用記憶密碼登入
			if (this.inputPswd === '************') {
				loginBTO.encryptPwd = this.loginedBTO.encryptPwd;
			}
			// 支持 guest 開頭的帳號，以 THIRD_PARTY_ID: 'GUEST' 登入
			if (this.inputTraderID.indexOf('guest')===0)
				loginBTO.THIRD_PARTY_ID = 'GUEST';
			// update loginedBTOList
			this.$store.state.loginedBTOList = [loginBTO];
			M4C.LoginTrade.doLogin(loginBTO);
        },
		// 點擊官網連結
		onWebSite() {
			window.openLink('https://www.icetech.com.tw');
		},
		// 限制帳號格式
		formatAccount() {
		},
		// 限制密碼格式
		formatPassword() {
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
		// 交易連線 - 登入完成
		loginReady() {
			return this.wsConn.loginReady;
		},
		publicPdSetting() {
			return this.$store.state.config.publicPdSetting;
		},
		// 從公開設定取得經濟商選單
		brokerInfoList() {
			return this.publicPdSetting.trade.brokers;
		},
		// 不顯示經濟商選單，直接使用第一組即可
		brokerInfo() {
			return this.brokerInfoList[0];
		},
		versionNumber() {
			return window._version.v;
		},
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