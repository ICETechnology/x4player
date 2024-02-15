<template>
	<transition name="show">
		<div class="cert-apply sys-bgc flex-col pdlr5">
			<div>
				<div v-if="needTitle" class="flex-center mgt5 font-size-big">{{$ln('申請憑證 / 展期')}}</div>
				<i class="icon-close material-icons tcef" @click="$emit('close')">close</i>
			</div>
			<div class="content flex-col flex-1 posr">
				<ScrollBounce>
					<div class="flex-col" v-if="!ignoreOTP">
						<div class="clr-gray mgt5">{{$ln('選擇 OTP 驗證方式')}}</div>
						<div class="mgt5"><SingleSelect :options="otpModeList" v-model="otpMode" /></div>
						<div class="mgt5" v-if="otpMode==1"><input type="tel" v-model="inputMobile" class="w100p iceben" :placeholder="$ln('請輸入手機號碼')" maxlength="16" @input="formatMobile"></div>
						<div class="mgt5 flex-col" v-if="otpMode==2">
							<input ref="emailInput" type="email" v-model="inputEmail" class="w100p iceben" :placeholder="$ln('請輸入Email信箱')">
							<span class="clr-warn" v-if="inputEmail && !isEmailValid">{{$ln('無效的Email格式')}}</span>
						</div>
						<div class="mgtb5"><Button class="btn-confirm-iceben iceben" :class="{disabled: !enableOtpBtn}" @click="sendCode">{{sendOtpBtnText}}</Button></div>
						<div class="mgt5 clr-gray">{{$ln('輸入驗證碼')}}</div>
						<div class="mgt2"><input type="text" v-model="inputVerifyCode" class="w100p iceben" :placeholder="$ln('驗證碼')" maxlength="10" @input="formatVerifyCode"></div>
					</div>
					<div v-if="ignoreOTP" class="mgtb5 ignore-opt-text">{{$ln('本帳號免OTP驗證')}}</div>

					<div class="mgt5 clr-gray">{{$ln('請輸入您的密碼')}}</div>
					<div class="mgt2"><input type="password" v-model="inputPswd" class="w100p iceben" :placeholder="$ln('請輸入您的密碼')" @input="formatPassword"></div>
					<div class="mgt5 clr-gray">{{$ln('輸入您的出生日期')}}</div>
					<div class="mgt2">
						<!-- <DatePickSingle v-model="inputBirthday" class="" /> -->
						<input type="text" v-model="inputBirthday" class="w100p iceben" :placeholder="$ln('西元年月日共8碼，例如 19780101')" maxlength="8" />
					</div>
					<div class="mgt5"><Button class="btn-confirm-iceben iceben" :class="{disabled: !enableApplyBtn}" @click="onBtnApply">{{$ln('申請憑證')}}</Button></div>
					<!-- 提示訊息 -->
					<BlockMessage v-if="bmParam.display" :param="bmParam"></BlockMessage>
				</ScrollBounce>
			</div>
		</div>
	</transition>
</template>

<script>
export default {
	props: ['needTitle', 'brokerID', 'traderID', 'propPswd', 'brokerInfo'],
	data() {
		return {
			// OTP方式 (手機/Email)
			otpMode: '',
			// 手機號碼
			inputMobile: '',
			// Email信箱
			inputEmail: '',
			// 登入密碼
			inputPswd: '',
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
		this.$emit('title', '申請憑證 / 展期');
		// 支持取用帶進來的密碼，但是不可使用記憶密碼
		this.inputPswd = this.propPswd === '************' ? '' : this.propPswd;
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		// 發送驗證碼
		sendCode() {
			if (this.otpMode==1 && !this.inputMobile) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("請輸入手機號碼"));
				return;
			}
			if (this.otpMode==2 && !this.inputEmail) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("請輸入Email信箱"));
				return;
			}
			if (this.otpMode==2 && !this.isEmailValid) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("無效的Email格式"));
				this.$refs.emailInput.focus();
				return;
			}
			// 顯示提示
			this.bmParam = {display: true, head: '驗證碼機制', body: '正在送出驗證碼', showLoadingIcon: true};
			// 開始倒數
			this.countdownSec = this.countdownSecLimit;
			// 送出驗證碼
			M4C.OTP.sendCode({brokerInfo: this.brokerInfo, brokerID: this.brokerID, traderID: this.traderID, otpMode: this.otpMode, inputMobile: this.inputMobile, inputEmail: this.inputEmail}).then(data=>{
				this.bmParam = {display: true, head: '驗證碼機制', body: '已送出驗證碼', showConfirmBtn: true};
			}).catch(err=>{
				this.bmParam = {display: true, head: '驗證碼機制', body: '驗證碼發送失敗', showConfirmBtn: true};
			});
		},
		// 申請憑證
		onBtnApply() {
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
			// 顯示提示
			this.bmParam = {display: true, head: '驗證碼機制', body: '正在檢查驗證碼', showLoadingIcon: true};
			// 開始檢查驗證碼
			console.log('[OTP/憑證]', '開始檢查驗證碼');
			M4C.OTP.verifyCode({brokerInfo: this.brokerInfo, verifyCode: this.inputVerifyCode}).then(data=>{
				console.log('[OTP/憑證]', '檢查驗證碼完成');
				this.applyCert();
			}).catch(err=>{
				let errmsg = err.MEMO || `(${err.CODE}) ${err.MSG}`;
				console.log('[OTP/憑證]', '驗證碼檢查失敗', errmsg);
				this.bmParam = {display: true, head: '驗證碼機制', body: errmsg, showConfirmBtn: true};
			});
		},
		// 申請憑證
		applyCert() {
			// 瀏覽器無法申請憑證
			if (!this.$store.state.device.isAPP) {
				this.bmParam = {display: true, head: '瀏覽器功能限制', body: '瀏覽器情境無法申請憑證', showConfirmBtn: true};
				return;
			}
			// 顯示提示
			this.bmParam = {display: true, head: '憑證下載中', body: '請勿關閉或中斷APP', showLoadingIcon: true};
			M4C.Cert.applyCert({brokerInfo: this.brokerInfo, brokerID: this.brokerID, traderID: this.traderID, inputPswd: this.inputPswd, inputBirthday: this.inputBirthday}).then(()=>{
				console.log('[OTP/憑證]', 'applyCert reslove');
				this.bmParam = {display: false};
				// 通知上層關閉自己
				this.$emit('close');
			}).catch(err=>{
				let errmsg = err.MEMO || `(${err.CODE}) ${err.MSG}`;
				console.log('[OTP/憑證]', '憑證申請失敗', errmsg);
				this.bmParam = {display: true, head: '憑證申請失敗', body: errmsg, showConfirmBtn: true};
			});
		},
		// 手機號碼輸入限制
		formatMobile() {
			// 僅限 0-9 / + / - / 空白
			this.inputMobile = this.inputMobile.replace(/[^0-9\+\-\ ]/g, '');
		},
		// 驗證碼輸入限制
		formatVerifyCode() {
			// 限制英數字
			this.inputVerifyCode = this.inputVerifyCode.replace(/[^\a-\z\A-\Z0-9]/g, '');
		},
		// 限制密碼格式
		formatPassword() {
			// 限制長度 20 碼
			this.inputPswd = this.inputPswd.length > 20 ? this.inputPswd.substr(0,20) : this.inputPswd;
		},
	},
	watch: {
		countdownSec() {
			if (this.countdownSec > 0)
				setTimeout(()=>{this.countdownSec--;}, 1000);
		},
	},
	computed: {
		otpModeList() {
			// server 驗證方式:  1. 手機, 2. Email
			return [{label: '手機號碼驗證', value: '1'}, {label: 'Email信箱驗證', value: '2'}];
		},
		// 送出驗證碼按鈕可用
		enableOtpBtn() {
			return !this.countdownSec;
		},
		// 申請憑證按鈕可用
		enableApplyBtn() {
			// 未輸入登入密碼
			if (!this.inputPswd) return;
			// 未輸入出生日期
			if (!this.inputBirthday) return;
			// 未輸入驗證碼 (非略過OTP帳號時)
			if (!this.ignoreOTP && !this.inputVerifyCode) return;
			return true;
		},
		// 驗證碼檢查完成
		verifyReady() {
			return this.verifyCodeResult.CODE === 0;
		},
		// 縮短變數
		$cert() {
			return this.$store.state.cert[this.traderID] || {};
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
		// Email 是否有效
		isEmailValid() {
			return this.inputEmail.match(
				/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
			);
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