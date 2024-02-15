<template>
    <div class="app-version-checker hidden">{{version}}</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {
		let self = this;
		// 僅 App 要處理 (桌機版啟動階段就會經過 AppUpdater.exe 所以不做版本檢查)
		if (!this.$store.state.device.isAPP) return;
		console.log("AppVersionChecker.version : ", this.version);
		// 設定有指定最低 APP 版本號
		if (this.appLimitVersion) {
			console.log("AppVersionChecker.appLimitVersion : ", this.appLimitVersion);
			// 檢查是否需要強制更新
			let needUpdate = this.verionNeedUpdate(this.version, this.appLimitVersion);
			if (needUpdate) {
				console.log("AppVersionChecker.downloadPagePath : ", this.downloadPagePath);
				eventBus.$emit("CONFIRM-DIALOG", {
					htmlContent: this.$ln(this.$store.state.device.isAndroid ? '更新说明-Android' : '更新说明-iOS'),
					confirmText: this.$store.state.device.isAndroid ? '立即下载' : '前往更新',
					cancel: self.onBtnCancel,
					confirm: self.onBtnConfirm,
				});
			}
		}
	},
	beforeDestroy() {},
	components: {},
    methods: {
		verionNeedUpdate(currVer, limitVer) {
			var appIDs = currVer.split(".");
			var limitIDs = limitVer.split(".");
			for (var i = 0; i < limitIDs.length; i += 1) {
				if (parseInt(appIDs[i]) < parseInt(limitIDs[i])) {
					return true;
				} else if (parseInt(appIDs[i]) > parseInt(limitIDs[i])) {
					return false;
				}
			}
			return false;
		},
		onBtnCancel() {
			this.$store.state.notify('error', this.$ln('请注意 ! 使用旧版本可能使部分功能异常 !'));
		},
		onBtnConfirm() {
			console.log('AppVersionChecker.onBtnConfirm');
			// iOS
			if (this.$store.state.device.isDeviceIOS) {
				// 有設定ios應用商店網址 => 開啟 app store 位置
				if (this.appstoreIOSUrl) {
					console.log('AppVersionChecker.ios', this.appstoreIOSUrl);
					window.openLink(this.appstoreIOSUrl);
				}
				else {
					this.$store.state.notify('error', '未设定 appstore.ios 应用商店网址');
				}
			}
			// android
			else if (this.$store.state.device.isAndroid) {
				// 有設定android應用商店網址 => 開啟 google play 位置
				if (this.appstoreAndroidUrl) {
					console.log('AppVersionChecker.android', this.appstoreAndroidUrl);
					window.openLink(this.appstoreAndroidUrl);
				}
				// 未指定應用商店位置 (中國貼牌情境) => 直接開啟 apk url 觸發下載
				else {
					console.log('AppVersionChecker.downloadPagePath', this.downloadPagePath);
					window.openLink(this.downloadPagePath);
				}
			}
			// 例外情境
			else {
				this.$store.state.notify('更新发生异常 ! 请手动更新应用程式');
			}
		},
	},
	watch: {},
    computed: {
		version() {
			let v = '';
			// 桌機版
			if (window.ipcRenderer) {
				ipcRenderer.on('get-version', (event, arg) => {v = this.$store.state.device.appVersion = arg;});
				ipcRenderer.send('get-version');
			}
			// 手機版
			else if (window.navigator.appInfo) {
				v = this.$store.state.device.appVersion = window.navigator.appInfo.version;
			}
			// 測試用
			// v = '2.67.5';
			return v;
		},
		host() {
			return this.$store.state.config.$path.LOGIN_HOST;
		},
		/** 最低要求的版本號 */
		appLimitVersion() {
			try{return ''+this.$store.state.config.publicPdSetting.app.app_limit_version;}catch(e){};
		},
		/** APK下載頁 */
		downloadPagePath() {
			return `https://${this.host}/x4/app/?c=${window.comp}&pd=${window.prod}&p=${window.projectID}`;
		},
		// google play url
		appstoreAndroidUrl() {
			try{return this.$store.state.config.publicPdSetting.app.appstore.android;}catch(e){};
		},
		// app store url
		appstoreIOSUrl() {
			try{return this.$store.state.config.publicPdSetting.app.appstore.ios;}catch(e){};
		},
	},
}
</script>

<style scoped>
</style>