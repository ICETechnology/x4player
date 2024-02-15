<template>
	<div class="m4c-http hidden">
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
		M4C.Http = this;
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		fetchTrade(url, strCmd, timeoutMS, logPrefix='M4C.Http') {
			let key = ''.random();
			let logCmd = strCmd;
			// 防止 log 到密碼
			logCmd = logCmd.replace(/"USER_PWD":"[^"]*"/, '"USER_PWD":"[NOT-LOG-FOR-SECURITY]"');			
			logCmd = logCmd.replace(/"TRADER_PWD":"[^"]*"/, '"TRADER_PWD":"[NOT-LOG-FOR-SECURITY]"');			
			console.log(`${logPrefix} fetchTrade[${key}]`, url, logCmd);
			let formData = new FormData();
			formData.append('cmdLine', strCmd);
			return new Promise((resolve, reject)=>{
				fetch(url, {
					body: formData,
					cache: 'no-cache',
					method: 'POST',
				}).then(res=>res.text()).then(res => {
					clearTimeout(this.fetchTimeout);
					console.log(`${logPrefix} fetchTrade[${key}] response : `, res);
					let line = res.split('\n');
					for (let i=0; i<line.length; i++) {
						if (line[i]) {
							let data = JSON.parse(line[i]);
							// 外層錯誤
							if (data.cd < 0) {
								console.log(`${logPrefix} fetchTrade[${key}] reject : `, data);
								reject({'CODE': data.d.CODE || data.cd, 'MSG': data.d.MSG || data.d.msg, 'MEMO': data.d.MEMO || data.d.memo});
								return;
							}
							// 外層成功
							else if (data.cd === 0) {
								// 內層錯誤
								if (data.d.CODE < 0) {
									console.log(`${logPrefix} fetchTrade[${key}] reject : `, data);
									reject({'CODE': data.d.CODE, 'MSG': data.d.MSG || data.d.msg, 'MEMO': data.d.MEMO || data.d.memo});
									return;
								}
								// 內層成功
								else {
									resolve(data);
									return;
								}
							}
						}
					}
					resolve(data);
				}).catch(err=>{
					console.log(`${logPrefix} fetchTrade[${key}] catch error : `, err);
					clearTimeout(this.fetchTimeout);
					reject({'CODE': -99500, 'MSG': this.$ln('命令發送失敗，請稍後重試')});
				});

				// 逾時無回應 (預設 10 秒)
				this.fetchTimeout = setTimeout(reject=>{
					console.log(`${logPrefix} fetchTrade[${key}] timeout !`);
					reject({'CODE': -99510, 'MSG': this.$ln('等待回覆逾時，請稍後重試')});
				}, timeoutMS || 9988, reject);
			});
		},
	},
	watch: {},
	computed: {
	},
}
</script>

<style scoped>
</style>