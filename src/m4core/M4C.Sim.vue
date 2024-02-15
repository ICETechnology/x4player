<template>
    <div class="m4c-sim hidden">
		<span>{{loginTradeClass}}</span>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		M4C.Sim = this;
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 登出清除
		logout() {
			// 清除模擬帳號來源ID
			this.$store.state.wechat.unionid = null;
			this.$store.state.sim.thirdPartyType = null;
			this.$store.state.sim.wechatUnionid = null;
			this.$store.state.sim.phoneNumber = null;
			this.$store.state.sim.guestID = null;
		},
	},
	watch: {},
    computed: {
		isAPP() {
			return this.$store.state.device.isAPP;
		},
		appid() {
			try{return this.$store.state.config.quotePdSetting.third_party_auth.wechat.appid;}catch(e){}
		},
		secret() {
			try{return this.$store.state.config.quotePdSetting.third_party_auth.wechat.secret;}catch(e){}
		},
		// 是否啟用微信註冊功能
		enableWechat() {
			if (!this.appid || !this.secret) return;
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
		// 登入交易使用哪個 class
		loginTradeClass() {
			let enableLoginSim = this.enableWechat || this.enablePhoneNumber || this.enableGuest || this.enableAccountPassword;
			return this.$store.state.status.loginTradeClass = enableLoginSim ? "LoginTradeMix" : "LoginTradeNew";
		},
	},
}
</script>

<style scoped>
</style>