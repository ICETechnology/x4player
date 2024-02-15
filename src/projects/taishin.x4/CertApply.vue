<template>
	<transition name="show">
		<div class="cert-apply-taishin sys-bgc flex-col pdlr5">
			<div class="content flex-col flex-1 posr">
				
					<div class="flex-col clr-gray" v-if="!ignoreOTP">
						<div class="mgt5">{{$ln('請選擇帳號')}}</div>
						<div class="mgt5"><SingleSelect :options="accountsOption" v-model="selectedOption" :notLn="true" /></div>
						<div class="mgt2" v-if="displayMobile">{{$ln('行動電話：')}}{{displayMobile}}</div>
						<div class="mgt2" v-if="displayEmail">{{$ln('電子信箱：')}}{{displayEmail}}</div>
						<div class="mgtb5"><Button class="btn-confirm-iceben iceben" :class="{disabled: !enableOtpBtn}" @click="sendCode">{{sendOtpBtnText}}</Button></div>

						<div class="mgt5 clr-gray">{{$ln('輸入驗證碼')}}</div>
						<div class="mgt2"><input type="text" v-model="inputVerifyCode" class="w100p iceben" :placeholder="$ln('驗證碼')" maxlength="10" @input="formatVerifyCode"></div>
					</div>
					<div v-if="ignoreOTP" class="mgtb5 ignore-opt-text">{{$ln('本帳號免OTP驗證')}}</div>

					<div class="mgt5"><Button class="btn-confirm-iceben iceben" :class="{disabled: !enableApplyBtn}" @click="onBtnApply">{{$ln(this.applyMode ? '申請憑證' : '憑證展延')}}</Button></div>
					<!-- 警示內容 -->
					<div v-if="warning" class="flex-1 mgtb10 posr">
						<ScrollBounce v-stop-propagation-y>
							<div v-html="warning" />
						</ScrollBounce>
					</div>
					<!-- 提示訊息 -->
					<BlockMessage v-if="bmParam.display" :param="bmParam"></BlockMessage>
				
			</div>
		</div>
	</transition>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
			otpOptionList: [],
			// 當前選擇的OTP方式
			selectedOption: {},
			// 驗證碼
			inputVerifyCode: '',
			// 出生日期
			inputBirthday: '',
			// 倒數秒數 (必須 false 有要判斷)
			countdownSec: false,
			// BlockMessage參數
			bmParam: {},
		}
	},
	beforeMount() {
		this.$store.state.components.certApply = this;
	},
	mounted() {
		this.$emit('title', this.applyMode ? '申請憑證-OTP驗證' : '憑證展延-OTP驗證');
	},
	beforeDestroy() {},
	components: {},
	methods: {
		// 發送驗證碼
		sendCode() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 3000);
			// 1. 手機, 2. Email, 0.不指定驗證方式
			let otpMode = '0';
			let inputMobile = this.selectedOption.MOBILE;
			let inputEmail = this.selectedOption.EMAIL;
			// 顯示提示
			this.bmParam = {display: true, head: '驗證碼機制', body: '正在送出驗證碼', showLoadingIcon: true};
			// 開始倒數
			this.countdownSec = this.countdownSecLimit;
			// 送出驗證碼
			M4C.OTP.sendCode({brokerInfo: this.brokerInfo, brokerID: this.brokerID, traderID: this.traderID, accountID: this.selectedOption.ACCOUNT_ID, otpMode, inputMobile, inputEmail}).then(data=>{
				this.bmParam = {display: true, head: '驗證碼機制', body: '已送出驗證碼', showConfirmBtn: true};
			}).catch(err=>{
				this.bmParam = {display: true, head: '驗證碼發送失敗', body: `(${err.CODE}) ${err.MSG}`, showConfirmBtn: true};
			});
		},
		// 申請憑證
		onBtnApply() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 3000);
			// 本帳號跳過 OTP 驗證
			if (this.ignoreOTP) {
				this.applyCert();
				return;
			}
			// 未輸入驗證碼
			if (!this.inputVerifyCode) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("請輸入驗證碼"));
				return;
			}
			// 瀏覽器無法申請憑證
			if (!this.$store.state.device.isAPP) {
				this.bmParam = {display: true, head: '瀏覽器功能限制', body: '瀏覽器情境無法申請憑證', showConfirmBtn: true};
				return;
			}
			// 顯示提示
			this.bmParam = {display: true, head: '憑證申請中', body: '請勿關閉或中斷APP', showLoadingIcon: true};
			M4C.Cert[this.applyMode ? 'applyCert' : 'renewCert']({
				brokerInfo: this.brokerInfo,
				brokerID: this.brokerID,
				traderID: this.traderID,
				accountID: this.selectedOption.ACCOUNT_ID,
				inputMobile: this.selectedOption.MOBILE,
				inputEmail: this.selectedOption.EMAIL,
				inputVerifyCode: this.inputVerifyCode,
			}).then(()=>{
				console.log('[OTP/憑證]', 'applyCert/renewCert reslove');
				this.bmParam = {display: false};
				// 關閉自己
				eventBus.$emit("CLOSE-DIALOG");
			}).catch(err=>{
				let head = this.applyMode ? '憑證申請失敗' : '憑證展延失敗';
				let errmsg = err.MEMO || (err.CODE || err.MSG ? `(${err.CODE}) ${err.MSG}` : '');
				console.log('[OTP/憑證]', head, errmsg || err);
				this.bmParam = {display: true, head, body: errmsg || '代碼或訊息異常', showConfirmBtn: true};
			});
		},
		// 驗證碼輸入限制
		formatVerifyCode() {
			// 限制英數字
			this.inputVerifyCode = this.inputVerifyCode.replace(/[^\a-\z\A-\Z0-9]/g, '');
		},
	},
	watch: {
		// 倒數機制
		countdownSec() {
			if (this.countdownSec > 0)
				setTimeout(()=>{this.countdownSec--;}, 1000);
		},
	},
	computed: {
		brokerID() {
			return this.param.brokerID;
		},
		traderID() {
			return this.param.traderID;
		},
		brokerInfo() {
			return this.param.brokerInfo;
		},
		traderAccounts() {
			return this.param.accounts;
		},
		// 送出驗證碼按鈕可用
		enableOtpBtn() {
			return !this.countdownSec;
		},
		// 申請憑證按鈕可用
		enableApplyBtn() {
			// 未輸入驗證碼 (非略過OTP帳號時)
			if (!this.ignoreOTP && !this.inputVerifyCode) return;
			return true;
		},
		// 送出驗證碼的按鈕文字
		sendOtpBtnText() {
			if (this.countdownSec)
				return this.$ln('重新發送') + `(${this.countdownSec})`;
			else
				return this.$ln('發送驗證碼');
		},
		// 送驗證碼倒數秒數
		countdownSecLimit() {
			try{return this.$store.state.config.publicPdSetting.function.otp.countdown_sec || 60;}catch(e){return 60;}
		},
		// 此帳號要略過OTP
		ignoreOTP() {
			let list;
			try{list = this.$store.state.config.publicPdSetting.function.otp.ignoreOtpAccount;}catch(e){}
			list = list || [];
			return list.indexOf(this.traderID) !== -1;
		},
		// 帳號選單
		accountsOption() {
			let list = this.traderAccounts;
			// 支持物件格式
			if (!Array.isArray(this.traderAccounts)) {
				list = [];
				for (let key in this.traderAccounts)
					list.push(this.traderAccounts[key]);
			}
				
			return list.map(obj=>{
				return {label: `${obj.CUST_NAME || ''} ${obj.ACCOUNT_ID}`, value: obj};
			});
		},
		displayMobile() {
			if (this.selectedOption.MOBILE)
				return this.selectedOption.MOBILE.substr(0,3) + '**' + this.selectedOption.MOBILE.substr(5);
		},
		displayEmail() {
			if (this.selectedOption.EMAIL) {
				let p = this.selectedOption.EMAIL.indexOf('@');
				if (p !== -1)
					return this.selectedOption.EMAIL.substr(0, p>3 ? p-3 : 1) + '***' + this.selectedOption.EMAIL.substr(p);
			}
		},
		// 申請模式
		applyMode() {
			return this.param.mode === 'apply';
		},
		// 警示文字
		warning() {
			try{return vuex.config.publicPdSetting.function.otp.warning;}catch(e){}
		},
	},
}
</script>

<style scoped>
.icon-close {
	position: absolute;
	top: 5vw;
	right: 4vw;
}
.loading-mask {
	z-index: 999;
	opacity: 0.7;
	background-color: black;
}
.loading-ctn {
	z-index: 999;
	position: absolute;
	top: 30%;
	left: 20vw;
	width: 60vw;
	border-radius: 1vw;
	color: white;
	background-color: #34485E;
}
.ignore-opt-text {
	border: 1px dashed #999;
	padding: 2vw;
	border-radius: 1vw;
}
</style>