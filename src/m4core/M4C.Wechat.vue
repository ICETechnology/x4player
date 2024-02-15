<template>
	<div class="hidden"></div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
	mounted() {
		M4C.Wechat = this.$store.state.m4c.wechat = this;
	},
	beforeDestroy() {},
	components: {},
	methods: {
		getUnionId() {
			let self = this;
			// step1
			Wechat.isInstalled(function(result) {
				if (!result) {
					console.log(`[wechat] isInstalled result fail !`);
					self.$store.state.notify('error', self.$ln('未安装微信'));
					return;
				}
				console.log(`[wechat] isInstalled ready !`);
				// step2
				Wechat.auth("snsapi_userinfo", "wechat", function(response) {
					console.log(`[wechat] auth ready !`);
					// step3
					let authUrl = "https://api.weixin.qq.com/sns/oauth2/access_token?" + new URLSearchParams({
						appid: self.appid,
						secret: self.secret,
						code: response.code,
						grant_type: "authorization_code"
					});
					fetch(authUrl).then(response => response.json()).then(obj => {
						console.log(`[wechat] fetch access_token unionObj : `, JSON.stringify(obj));
						// 有 unionid 視為成功
						if (obj.unionid) {
							// 系統要求一律轉小寫
							self.$store.state.wechat.unionid = obj.unionid.toLowerCase();
						}
						else {
							console.log(`[wechat] access_token error : ${obj.errmsg}`);
							self.$store.state.notify('error', obj.errmsg);
						}
					});
				}, function(error) {
					console.log(`[wechat] auth error : ${error}`);
					self.$store.state.notify('error', error);
				});
			}, function(error) {
				console.log(`[wechat] isInstalled error : ${error}`);
				self.$store.state.notify('error', self.$ln('未安装微信'));
			});
		},
	},
	watch: {},
	computed: {
		appid() {
			try{return this.$store.state.config.quotePdSetting.third_party_auth.wechat.appid;}catch(e){
				this.$store.state.notify('error', '未设定 wechat appid');
			}
		},
		secret() {
			try{return this.$store.state.config.quotePdSetting.third_party_auth.wechat.secret;}catch(e){
				this.$store.state.notify('error', '未设定 wechat secret');
			}
		},
	},
}
</script>

<style scoped>
</style>