<template>
	<!-- 報價連線登入/取得總表 -> 不做畫面，將訊息合併至 window.showLoadingMessage -->
    <div class="login-quote-ctn hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			isLoading: true,
			// message: "自动登入报价",
		}
	},
	beforeMount() {
		console.log(`啟動階段耗時 : ${new Date() - window.launchStartTime}ms`);
		// 關閉 App 啟動畫面 (SplashScreen)，延遲一點關，以免這邊比齒輪畫面先關掉，會看到一閃而逝的齒輪畫面
		setTimeout(()=>{try{navigator.splashscreen.hide();}catch(e){}}, 200);
	},
    mounted() {
		this.connectLogin();
	},
	beforeDestroy() {},
	components: {},
    methods: {
		msg(str) {
			console.log(`[quote] QuoteLoginer`, str);
			if (window.showInitialMessage) window.showInitialMessage(this.$ln(str));
		},
		connectLogin() {
			this.msg(`正在建立连线`);
			let user = this.$store.state.device.deviceID;
			let btID = `quote`;
			// 建立連線並登入
			M4C.connect({
				project: this.pid,
				type: 'quote',
				host: `wss://${this.host}/ss2`,
				comp: this.company,
				prod: window.prod,
				user: user,
				pswd: '123456',
				login3rd: true,
				apiPath: `https://${this.host}/ss2/api`,
				btID: btID,
			});
			// 動態建立監聽 [連線登入結果]
			this.$store.watch(state=>state.wsConnMap.quote.$STATUS, function(nv, ov) {
				// AC 登入完成 -> 取得報價 pdsetting -> 取得分類表 (僅首次登入需要)
				if (nv === 'AC-LOGIN-READY' && !this.$store.state.status.mainformReady) {
					this.msg(`报价连线登入完成 !`);
					let wsConn = this.wsConnMap.quote;
					// 報價連線的 quote.settings
					let quoteSettings = wsConn.acResponse.d['quote.settings'];
					// 提示沒有設定分類表
					if (!quoteSettings[0] || !quoteSettings[0].classifications || !quoteSettings[0].classifications[0]) {
						this.msg(`分類表沒有設定資料! acQuoteSetting classifications no data!`);
						return;
					}
					// 從 AC 回覆取得的分類表設定
					let classificationList = quoteSettings[0].classifications;
					// 使用第一組設定作為預設的期貨分類表
					this.$store.state.config.classification = classificationList[0];
					// 支持從 pdsetting 指定期貨報價使用的分類表
					let pdsetting = wsConn.acResponse.d['pd.setting'];
					if (pdsetting && pdsetting.classification && pdsetting.classification.futures_classification)
						this.$store.state.config.classification = pdsetting.classification.futures_classification;
					// 取得總表/分類表
					this.msg(`正在取得商品表`);
					let symbolPromiseList = classificationList.map(name=>M4C.Symbol.queryMainform(name));
					// 總表分類表取得完成
					Promise.all(symbolPromiseList).then(function(){
						this.$store.state.status.mainformArrive = true;
						this.msg(`正在进入系统...`);
					}.bind(this)).catch(function(err){
						this.msg(`取得總表/分類表失敗 !`);
						// M4C.disconnect('quote');
						this.isLoading = false;
					}.bind(this));
					// 取得 Client Info (client ip)
					M4C.send({"s": "dispatcher", "c": "client_info"}, "quote");

					// 支持斷線重連後，自動重新訂閱報價 (若訂閱表有內容就是斷線重連情境)
					let subList = Object.keys(M4C.Quote.curSubMap);
					if (subList.length > 0) {
						M4C.Quote.sendSubCmd(subList);
					}
					// 訂閱所有交易所清盤訊號
					M4C.send({
						"s": "Q",
						"c": "sub",
						"d": {"s": "Quote.Reset.*"},	// 訂閱所有交易所清盤訊號
						"r": "Sub.Quote.Reset"
					});
				}
				// AC 登入失敗
				else if (nv === 'AC-LOGIN-FAIL') {
					this.msg(`(${this.$store.state.wsConnMap.quote.$CD}) 报价主机连线失败 !`);
					// 顯示 reload 文字按鈕
					if (window.showBtnReload) window.showBtnReload();
					// 主動結束連線
					M4C.disconnect('quote');
				}
			}.bind(this));
		},
	},
	watch: {},
    computed: {
		pid() {
			return this.$store.state.config.projectID;
		},
		host() {
			return window.urlParam.quoteHost || this.$store.state.status.quoteHost;
		},
		wsConnMap() {
			return this.$store.state.wsConnMap;
		},
		company() {
			// 支持設定報價連線用的 company 不要加入 _q (不用建立 _q 以方便維護設定)
			return vuex.config.publicPdSetting.CONFIG.QuoteCompanyWithout_q ? window.comp : `${window.comp}_q`;
		},
	},
}
</script>

<style scoped>
</style>