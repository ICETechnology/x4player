<template>
    <div class="m4c-ip hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.IP = this.$store.state.m4c.ip = this;
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 重新查詢 ipv4/ipv6 */
		requestIP() {
			let now = new Date();
			// 60 秒內不再查詢 (防止多交易連線斷線重查造成重複查詢)
			if (this.requestTime && (now - this.requestTime) < 60000)
				return;
			if (!this.ipv4UrlList || !this.ipv4UrlList)
				return;
			this.requestTime = now;
			// 查詢整個 list
			this.requestUrlList(this.ipv4UrlList, 'ipv4');
			this.requestUrlList(this.ipv6UrlList, 'ipv6');
		},
		requestUrlList(urlList, key) {
			if (!urlList) return;
			urlList.forEach((url)=>{
				console.log('M4C.IP request whoami url : ', url);
				this.$http.get(url, {timeout: 3000}).then(response => {
					this.$store.state.device[key] = this.getResponseIP(response);
				}).catch(error => {
					this.$store.state.device[key] = this.$store.state.device[key] || '';
				});
			});
		},
		/** 解析回覆內容取得 IP */
		getResponseIP(response) {
			let str = response.bodyText;
			let list = str.split('\r\n');
			let line = list.find(o=>o.indexOf('X-Real-Ip')!==-1);
			let p = line.indexOf(':');
			let ip = line.substr(p+1).trim();
			return ip;
		},
	},
	watch: {
		/** 收到報價連線的 pdsetting */
		'$store.state.config.quotePdSetting'(nv) {
			// 未設定 whatismyip 時，直接將 ipv4/6 設為空字串，讓自動登入可以啟動
			if (!nv.function || !nv.function.whatismyip) {
				this.$store.state.device.ipv4 = '';
				this.$store.state.device.ipv6 = '';
			}
			else {
				this.requestIP();
			}
		},
	},
    computed: {
		ipv4() {
			return this.$store.state.device.ipv4;
		},
		ipv6() {
			return this.$store.state.device.ipv6;
		},
		ipv4UrlList() {
			try {
				let list = this.$store.state.config.quotePdSetting.function.whatismyip.v4;
				return typeof(list) === 'string' ? [list] : list;
			}catch(e){}
		},
		ipv6UrlList() {
			try {
				let list = this.$store.state.config.quotePdSetting.function.whatismyip.v6;
				return typeof(list) === 'string' ? [list] : list;
			}catch(e){}
		},
		quoteConnect() {
			return this.$store.state.wsConnMap.quote || {};
		},
	},
}
</script>

<style scoped>
</style>