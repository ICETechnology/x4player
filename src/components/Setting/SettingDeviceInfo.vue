<template>
	<div class="setting-device-info-ctn flex-col">
		<div class="device-info-ctn flex-1 posr">
			<ScrollBounce class="FULL font-size-small" v-stop-propagation-y>
				<div class="flex-col pdt2 font-size-small">
					<div class="setting-line flex-row">
						<div class="flex-1 flex-start clr-gray">{{$ln(`IP位址`)}}</div>
						<div class="flex-center">{{clientIP}}</div>
					</div>
					<div class="setting-line flex-row">
						<div class="flex-1 flex-start clr-gray">{{$ln(`MAC位址`)}}</div>
						<div class="flex-center">{{$store.state.device.macAddress}}</div>
					</div>
					<div class="setting-line flex-row">
						<div class="flex-1 flex-start clr-gray">{{$ln(`APP版本`)}}</div>
						<div class="flex-center">{{$store.state.device.appVersion}}
							<span class="clr-gray2 mgl2" v-if="appLimitVersion">({{appLimitVersion}})</span>
						</div>
					</div>
					<div class="setting-line flex-row" @click="onClickMainVersion">
						<div class="flex-1 flex-start clr-gray">{{$ln(`主程式版本`)}}</div>
						<div class="flex-center">{{versionNumber}}</div>
					</div>
					<div class="setting-line flex-row">
						<div class="flex-1 flex-start clr-gray">{{$ln(`期权云版本`)}}</div>
						<div class="flex-center">{{$store.state.device.optionCloudVersion}}</div>
					</div>
					<div class="setting-line flex-row">
						<div class="flex-1 flex-start clr-gray">{{$ln(`策略星资源版本`)}}</div>
						<div class="flex-center">{{$store.state.device.resourcePluginVersion}}</div>
					</div>
					<div class="setting-line flex-row">
						<div class="flex-1 flex-start clr-gray">{{$ln(`DeviceID`)}}</div>
						<div class="flex-end font-size-micro">{{$store.state.device.deviceID}}</div>
					</div>
					<div class="setting-line flex-row flex-center">
						<div class="flex-1 flex-start clr-gray">{{$ln(`DeviceToken`)}}</div>
						<Button class="ht1 rd6 pdlr5 font-size-little" @click="onBtnDeviceToken">{{$ln('查看')}}</Button>
					</div>
					<!-- 同意書 -->
					<div class="setting-line flex-row flex-center" v-for="obj in $store.state.config.publicPdSetting.agreement">
						<div class="flex-1 flex-start clr-gray" v-html="obj.head" />
						<Button class="ht1 rd6 pdlr5 font-size-little" @click="onBtnAgreement(obj.key)">{{$ln('检视')}}</Button>
					</div>
					<div class="setting-line flex-row flex-center">
						<div class="flex-1 flex-start clr-gray">{{$ln(`系统重启`)}}</div>
						<Button class="ht1 rd6 pdlr5 font-size-little" @click="onBtnReload">{{$ln('重启')}}</Button>
					</div>
				</div>
			</ScrollBounce>
		</div>
		<LocalOperatorLog  class="divider-top mgtb2 pdtb2 h60vw" v-if="isActiveLOL" />
	</div>
</template>

<script>
import LocalOperatorLog from "@/components/LocalOperatorLog.vue"
import AgreementList from "@/components/AgreementList.vue"

export default {
	props: [],
	data() {
		return {
			/** Client IP */
			clientIP: M4C.Dispatcher.getClientIP(),
		}
	},
	components: {LocalOperatorLog},
	beforeMount() {},
    mounted() {this.$emit('title', this.$ln('设备信息'))},
	beforeDestroy() {},
    methods: {
		/** 登出 */
		onBtnLogout() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: "登出",
				content: this.$ln("点击确认登出"),
				confirm: () => {
					localStorage.removeItem(this.$store.state.config.projectID + '_AUTO_LOGIN');
					window.location.reload();
				}
			});
		},
		/** 重启 */
		onBtnReload() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: "重启",
				content: this.$ln("点击确认重启"),
				confirm: () => {
					eventBus.$emit("CLOSE-CONFIRM");
					this.isLoading = true;
					setTimeout(()=>{
						window.location.reload();
					}, 200);
				}
			});
		},
		/** 查看装置的 deviceToken */
		onBtnDeviceToken() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `DeviceToken`,
				content: this.$store.state.device.deviceToken || '--',
				confirmOnly: true,
			});
		},
		/** 點擊主程式版本文字 */
		onClickMainVersion() {
			this.clickMainVersionCount = this.clickMainVersionCount || 0;
			this.clickMainVersionCount++;
			if (this.clickMainVersionCount >= 5) {
				let txt = this.$store.state.device.isDVM ? '關閉' : '開啟';
				if (this.clickMainVersionCount >= 10) {
					this.clickMainVersionCount = 0;
					this.$store.state.jstest.display = this.$store.state.device.isDVM = !this.$store.state.device.isDVM;
					eventBus.$emit("FLASHMESSAGE", `已${txt}開發者模式`, {"bgClr": "black"});
				}
				else {
					eventBus.$emit("FLASHMESSAGE", `再按 ${10 - this.clickMainVersionCount} 次${txt}测试者模式`, {"bgClr": "black"});
				}
			}
		},
		onBtnAgreement(key) {
			eventBus.$emit("POPUP-DIALOG", AgreementList, {'key': key}, {transName: 'float'});
		},
	},
	watch: {},
    computed: {
		versionNumber() {
			return window._version.v;
		},
		// 這裡僅判斷是否顯示系統運行日誌UI(不影響本地LOG記錄處理)
		hideLocalLog() {
			try {return this.$store.state.config.publicPdSetting.function.hideLocalLog} catch(e) {}
		},
		// 是否啟用本地日誌功能
		isActiveLOL() {
			// 有壓縮plugin、有日誌記錄功能且不是隱藏UI
			return window.Zeep && window.FileLogger && !this.hideLocalLog;
		},
		/** 最低要求的版本號 */
		appLimitVersion() {
			try{return this.$store.state.config.publicPdSetting.app.app_limit_version;}catch(e){};
		},
	},
}
</script>

<style scoped>
</style>