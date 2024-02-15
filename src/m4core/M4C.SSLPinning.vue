<template>
	<div class="m4c-ssl-pinning hidden">
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			sslPinningAvailable: false,
			testFail: false,
		}
	},
	beforeMount() {
		M4C.SSLPinning = this;
		// 存在 sslPinning Plugin
		try {
			cordova.plugin.http.setServerTrustMode('pinned', ()=>{
				console.log('[SSLPinning] plugin is available !');
				M4C.SSLPinning.testSSLPinning();
			}, ()=>{});
		}catch(e){}
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		testSSLPinning() {
			console.log('[SSLPinning] enable : ', this.enable);
			if (this.enableSSLPinning) {
				console.log('[SSLPinning] address : ', this.address);
				// 透過 plugin 去查指定的 URL 探查成功或失敗
				cordova.plugin.http.sendRequest(this.address, {}, function(res) {
					console.log('[SSLPinning] test done result : ', res);
				}, function(res) {
					M4C.SSLPinning.testFail = true;
					console.log('[SSLPinning] test fail result : ', res);
					// 只有 -2 (憑證異常) 印出指定警示，其它錯誤都印出錯誤內容
					let errmsg = '憑證檢查 (Certificate Pinning) 異常';
					errmsg = res.status === -2 ? errmsg : `(${res.status}) ${res.error}`;
					// 提示
					eventBus.$emit("CONFIRM-DIALOG", {
						title: `憑證檢查異常`,
						content: errmsg,
						confirmOnly: true,
						disableClickMaskClose: true,
						confirm: () => {
							setTimeout(()=>{window.location.reload();}, 100);
						}
					});
					
				});
			}
			// 無Plugin 或 未設定啟用 -> 直接 resolve (等同本機制不作動)
			else {
			}

		}
	},
	watch: {},
	computed: {
		enableSSLPinning() {
			return this.enable && this.address;
		},
		enable() {
			try{return this.$store.state.config.publicPdSetting.CONFIG.SSLPinning.enable;}catch(e){}
		},
		address() {
			try{return this.$store.state.config.publicPdSetting.CONFIG.SSLPinning.address;}catch(e){}
		},
	},
}
</script>
