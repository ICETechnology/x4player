<template>
	<!-- 對所有主機建立 websocket 連線，將最先成功的主機往下讓 QuoteLoginer 繼續登入 -->
    <div class="quote-connector hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			// developer 模式時，報價連線到哪一台主機 (可以隨改隨測)
			// dvmHost: 'ss2-uat.icetech.com.cn',
			dvmHost: 'ss2-stage.icetech.com.tw',
			// dvmHost: 'ss2.icetech.com.cn',
			// dvmHost: 'ss2-stage.icetech.com.cn',
		}
	},
	beforeMount() {
		if (window.showInitialMessage) window.showInitialMessage(this.$ln('正在准备报价主机'));
		// 採用標準 DCore 競速機制
		M4C.RaceDCore.race({connKey: 'quote', company: this.company, product: window.prod, hostList: this.hostList}).then(obj=>{
			vue.$store.state.status.quoteHost = obj.host;
		}).catch(err=>{
			if (window.showInitialMessage) window.showInitialMessage(this.$ln('无法取得报价主机，请检查网路连线'));
		});
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {
		company() {
			// 支持設定報價連線用的 company 不要加入 _q (不用建立 _q 以方便維護設定)
			return vuex.config.publicPdSetting.CONFIG.QuoteCompanyWithout_q ? window.comp : `${window.comp}_q`;
		},
		hostList() {
			// [報價主機]支持優先取用[公開設定]，未設定時使用 [主程式來源主機]
			if (this.hostListByPublicPdSetting && this.hostListByPublicPdSetting.length > 0)
				return this.hostListByPublicPdSetting;
			return this.hostListByCloudPath;
		},
		// 報價主機列表 from [公開設定]
		hostListByPublicPdSetting() {
			try{return this.$store.state.config.publicPdSetting.quote.hostList;}catch(e){}
		},
		// 報價主機列表 from [主程式來源主機]
		hostListByCloudPath() {
			// 本行可用來臨時測試指定的報價主機
			// return ['ss2-t.icetech.com.cn'];
			// return ['ss2-uat.icetech.com.cn'];
			return window.$path.CLOUD_PATH.map(path => {
				// browser 情境
				if (path.indexOf('./') === 0) {
					return !this.$store.state.device.isDVM && window.location.host ? window.location.host : this.dvmHost;
				}
				// app or desktop 情境
				else {
					let host = path;
					// "https://ss2.icetech.com.cn/guofu.ycgo2/dist" -> "ss2.icetech.com.cn"
					try{host = path.split('//')[1].split('/')[0];}catch(e){}
					let isDeveloper = host.indexOf("172.28") !== -1 || host.indexOf("192.168") !== -1;
					return isDeveloper ? this.dvmHost : host;
				}
			});
		},
	},
}
</script>

<style scoped>
</style>