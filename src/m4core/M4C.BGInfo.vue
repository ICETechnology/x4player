<template>
    <div class="m4c-bginfo hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			confirmHead: `推播通知要求权限`,
			confirmBody: `
					<div class="flex-col flex-start font-size-mini pdlr3">
						<div class="w100p flex-start font-bold"><i class="material-icons md-18 mgr2">phone</i>${this.$ln('电话权限')}</div>
						<div class="w100p flex-start">${this.$ln('推播通知需要电话权限')}</div>
						<div class="w100p flex-start font-bold mgt5"><i class="material-icons md-18 mgr2">folder_open</i>${this.$ln('储存空间')}</div>
						<div class="w100p flex-start">${this.$ln('推播通知需要储存空间权限')}</div>
						<div class="w100p flex-start font-bold mgt5"><i class="material-icons md-18 mgr2">location_on</i>${this.$ln('位置资讯')}</div>
						<div class="w100p flex-start">${this.$ln('推播通知需要位置资讯权限')}</div>
					</div>
				`
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.BGInfo = this.$store.state.m4c.bginfo = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'BGInfo', 'callback': this.onData.bind(this)});
	},
	mounted() {
		if (!this.isCordova) return;
		if (!cordova.plugins || !cordova.plugins.cloud || !cordova.plugins.cloud.messaging) return;
		let self = this;
		// 取得 cloud.messaging token
		cordova.plugins.cloud.messaging.getToken().then(function(token) {
			console.log(`[BGInfo] token:`, token);
			self.$store.state.device.deviceToken = token;
		});
		// 前景時收到 cloud.messaging 推播
		cordova.plugins.cloud.messaging.onMessage(function(payload) {
			console.log(`[BGInfo] onMessage:`, payload);
			// self.$store.state.notify({body: `cloud.messaging.onMessage.payload : ${JSON.stringify(payload)}`});
		});
		// 背景時收到 cloud.messaging 推播
		cordova.plugins.cloud.messaging.onBackgroundMessage(function(payload) {
			console.log(`[BGInfo] onBackgroundMessage:`, payload);
			// self.$store.state.notify({body: `cloud.messaging.onBackgroundMessage.payload : ${JSON.stringify(payload)}`});
			try{
				let param = JSON.parse(payload.data.param);
				// 文章通知 -> 預設要彈出該文章 (利用 popupArticleAuthKey)
				if (param.auth_key) {
					self.$store.state.status.popupArticleAuthKey = param.auth_key;
				}
			}catch(e){}
		});

		// 未讀過 且 有設定要彈出要求權限的說明
		let storageKey = `${this.$store.state.config.projectID}_REQUEST_PERMISSION_HELPER`;
		let haveRead = localStorage.getItem(storageKey);
		if (!haveRead && this.$store.state.config.CONFIG.REQUEST_PERMISSION_HELPER) {
			let confirmHead = this.confirmHead;
			let confirmBody = this.confirmBody;
			// 支持從公開設定取得要顯示的標題與內容
			try{confirmHead = this.$store.state.config.publicPdSetting.function.bginfo.confirmHead || confirmHead;}catch(e){}
			try{confirmBody = this.$store.state.config.publicPdSetting.function.bginfo.confirmBody || confirmBody;}catch(e){}
			eventBus.$emit("CONFIRM-DIALOG", {
				title: confirmHead,
				confirmOnly: true,
				htmlContent: confirmBody,
				confirm: ()=>{
					localStorage.setItem(storageKey, true);
					self.requestPermission();
				}
			});
		}
		else {
			self.requestPermission();			
		}
	},
    methods: {
		onData(data) {
		},
		send(action, wsConn, connectType) {
			// if (!this.isCordova) return;
			let cmd = {
				"s": "BGInfo",
				"c": action,
				"d": {
					"appID": this.$store.state.config.projectID,
					"devToken": this.$store.state.device.deviceToken || "BROWSER_TEST",
					"isApple": this.$store.state.device.isDeviceIOS,
				},
				"r": "".random(),
			};
			// 僅交易連線要填入 svcName
			if (connectType === 'trade')
				cmd.d.svcName = 'TRADE_FILL';

			M4C.send(cmd, {'wsConn': wsConn});
		},
		logout(wsConn, connectType) {
			this.send("unsub", wsConn, connectType);
		},
		// 要求使用者同意權限
		requestPermission() {
			cordova.plugins.cloud.messaging.requestPermission({forceShow: true}).then(function() {
				console.log(`[BGInfo] requestPermission`);
			});
		},
	},
	watch: {
		// 報價登入完成
		'$store.state.wsConnMap.quote.loginReady'(nv) {
			if (nv) this.send('sub', this.$store.state.wsConnMap.quote);
		},
	},
    computed: {
		isCordova() {
			return this.$store.state.device.isAPP && window.cordova;
		},
	},
}
</script>
