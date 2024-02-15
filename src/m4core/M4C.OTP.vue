<template>
	<div class="m4c-otp hidden">
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			brokerInfo: {},
			brokerID: '',
			traderID: '',
			OTP_ID: '',
		}
	},
	beforeMount() {
		M4C.OTP = this;
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		// 發送驗證碼
		sendCode({brokerInfo, brokerID, traderID, accountID, otpMode, inputMobile, inputEmail}) {
			this.brokerInfo = brokerInfo || this.brokerInfo;
			this.brokerID = brokerID || this.brokerID;
			this.traderID = traderID || this.traderID;
			let cmd = {
				"s": "TRADE",
				"c": "otp.request",
				"d": {
					BROKER_ID: brokerID,
					TRADER_ID: traderID,
					MOBILE: inputMobile,
					EMAIL: inputEmail,
					AP_ID: "X4",
					TYPE: otpMode,
				},
				"r" : "".random(),
			};
			// 帳號(僅全景需要，要先查基本資料後才能取得)
			if (accountID)
				cmd.d.ACCOUNT_ID = accountID;

			return new Promise((resolve, reject)=>{
				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), 9988, '[OTP/憑證]').then(data => {
					this.OTP_ID = data.d.OTP_ID;
					resolve(data);
				}).catch(err=>reject(err));
			});
		},
		// 檢查驗證碼
		verifyCode({brokerInfo, verifyCode}) {
			this.brokerInfo = brokerInfo || this.brokerInfo;
			let cmd = {
				"s": "TRADE",
				"c": "otp.verify",
				"d": {
					BROKER_ID: this.brokerID,
					TRADER_ID: this.traderID,							// 交易帳號
					OTP_ID: this.OTP_ID,								// OTP代碼
					OTP_CODE: verifyCode,								// OTP驗證碼
					AP_ID: 'X4',										// AP代碼
				},
				"r" : "".random(),
			};
			return new Promise((resolve, reject)=>{
				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), 9988, '[OTP/憑證]').then(data => {
					resolve(data);
				}).catch(err=>reject(err));
			});
		},
		query({brokerInfo}) {
			return new Promise((resolve, reject)=>{
				setTimeout(()=>{
					resolve({'code': 0, 'list': [{'type':'phone', 'value': '0916986411'}, {'type':'email', 'value': 'chin@icetech.com.tw'}]});
				}, 1000);
			});
		},
	},
	watch: {},
	computed: {
		ss2api() {
			return `${this.brokerInfo.apiProtocol}://${this.brokerInfo.host}/ss2/api`;
		},
	},
}
</script>

<style scoped>
</style>