<template>
	<div class="mix-setting-ctn mgt2 flex-col" v-touching="`.touching-effect`">
		<div class="setting-list-ctn flex-col overflow-auto flex-1">
			<div class="flex-row setting-line touching-effect hover-line" @click="onGrpLineClick('SettingAccount', `账户管理`)">
				<div class="flex-1 flex-start">{{$ln(`账户管理`)}}</div>
				<div class="flex-center"><i class="material-icons md-24">keyboard_arrow_right</i></div>
			</div>
			<div class="flex-row setting-line touching-effect hover-line" @click="onGrpLineClick('SettingSystem', `系统设定`)">
				<div class="flex-1 flex-start">{{$ln(`系统设定`)}}</div>
				<div class="flex-center"><i class="material-icons md-24">keyboard_arrow_right</i></div>
			</div>
			<div class="flex-row setting-line touching-effect hover-line" @click="onGrpLineClick('SettingOrder', `交易设定`)">
				<div class="flex-1 flex-start">{{$ln(`交易设定`)}}</div>
				<div class="flex-center"><i class="material-icons md-24">keyboard_arrow_right</i></div>
			</div>
			<div class="flex-row setting-line touching-effect hover-line" @click="onGrpLineClick('SettingDeviceInfo', `设备信息`)">
				<div class="flex-1 flex-start">{{$ln(`设备信息`)}}</div>
				<div class="flex-center"><i class="material-icons md-24">keyboard_arrow_right</i></div>
			</div>
			<div class="flex-row setting-line touching-effect hover-line" v-if="!hiddenSMO && !enableBrokerAgreement" @click="onGrpLineClick('SmoAgreement', `云端条件单`)">
				<div class="flex-1 flex-start flex-row posr">{{$ln(`云端条件单`)}}</div>
				<div class="flex-center">
					<div class="font-size-little">{{isAgreeSMO ? $ln('已签署') : $ln('未签署')}}</div>
					<i class="material-icons md-24">keyboard_arrow_right</i>
				</div>
			</div>
			<div class="flex-row setting-line touching-effect hover-line" v-if="showCertManagment" @click="onGrpLineClick('SettingCert', `憑證管理`)">
				<div class="flex-1 flex-start">{{$ln(`憑證管理`)}}</div>
				<div class="flex-center"><i class="material-icons md-24">keyboard_arrow_right</i></div>
			</div>
			<div class="flex-row setting-line touching-effect hover-line" v-if="enableSecurityLogin" @click="onGrpLineClick('SettingSecurityLock', `快速登入`)">
				<div class="flex-1 flex-start">{{$ln(`快速登入`)}}</div>
				<div class="flex-center"><i class="material-icons md-24">keyboard_arrow_right</i></div>
			</div>
			<div class="flex-row setting-line touching-effect hover-line" @click="onGrpLineClick('ExitApp')">
				<div class="flex-1 flex-start">{{$ln(`關閉程式`)}}</div>
				<div class="flex-center"><i class="material-icons md-24">logout</i></div>
			</div>
			<div class="flex-row setting-line touching-effect hover-line mgt5" @click="onGrpLineClick('SettingConsole', `Console Log`)" v-if="$store.state.device.isDVM">
				<div class="flex-1 flex-start">{{$ln(`Console Log (DVM only)`)}}</div>
				<div class="flex-center"><i class="material-icons md-24">keyboard_arrow_right</i></div>
			</div>
		</div>
	</div>
</template>

<script>
import TradingAccountManager from "@/components/TradingAccountManager.vue";
import SettingSystem from "@/components/Setting/SettingSystem.vue";
import SettingOrder from "@/components/Setting/SettingOrder.vue";
import SettingDeviceInfo from "@/components/Setting/SettingDeviceInfo.vue";
import SettingConsole from "@/components/Setting/SettingConsole.vue";
import SmoAgreement from "@/components/SmoAgreement.vue";
import SmoAgreementConfig from "@/components/SmoAgreementConfig.vue";
import SettingSecurityLock from "@/components/Setting/SettingSecurityLock.vue";

export default {
	data() {
		return {
		};
	},
	beforeMount() {},
	mounted() {this.$emit('title', this.$ln('设定'))},
	beforeDestroy() {},
	components: {},
	methods: {
		onResumeSyncDevice() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
					content: self.$ln("确认解除同步 ?"),
					confirm: ()=>{
						self.$store.state.device.bundleDevice = {};
						self.$store.state.device.deviceID = self.$store.state.device.orginDeviceID;
						self.$store.state.device.orginDeviceID = "";
					}
				});
			
		},
		onGrpLineClick(com, title) {
			switch(com) {
				case "SettingAccount":
					// 未登入交易帳號 -> 彈出登入交易帳號視窗
					if (!M4C.Trader.checkLoginTrade()) return;
					eventBus.$emit("POPUP-DIALOG", TradingAccountManager, {showOpt: true}, {transName: 'float'});
					break;
				case "SettingSystem":
					eventBus.$emit("POPUP-DIALOG", SettingSystem, "", {'$HEAD': {'title': title}, transName: 'float'});
					break;
				case "SettingOrder":
					eventBus.$emit("POPUP-DIALOG", SettingOrder, "", {'$HEAD': {'title': title}, transName: 'float'});
					break;
				case "SettingDeviceInfo":
					eventBus.$emit("POPUP-DIALOG", SettingDeviceInfo, "", {'$HEAD': {'title': title}, transName: 'float'});
					break;
				case "SettingConsole":
					eventBus.$emit("POPUP-DIALOG", SettingConsole, "", {'$HEAD': {'title': title}, transName: 'float'});
					break;
				case "SmoAgreement":
					if (this.isAgreeSMO)
						eventBus.$emit("POPUP-DIALOG", SmoAgreementConfig, "", {transName: 'float'});
					else
						eventBus.$emit("POPUP-DIALOG", SmoAgreement, "", {transName: 'float'});
					break;
				case "SettingCert":
						eventBus.$emit("POPUP-DIALOG", 'CertManager', "", {transName: 'float'});
					break;
				case "SettingSecurityLock":
					eventBus.$emit("POPUP-DIALOG", SettingSecurityLock, "", {'$HEAD': {'title': title}, transName: 'float'});
					break;
				case "ExitApp":
					eventBus.$emit("CONFIRM-DIALOG", {
						title: this.$ln("關閉程式"),
						content: this.$ln("確認是否關閉並離開本應用程式？"),
						confirm: () => {
							if (navigator && navigator.app && navigator.app.exitApp)
								navigator.app.exitApp();
							else
								eventBus.$emit("FLASHMESSAGE", "執行APP離開程式", {"bgClr": "black"});
						},
					});
					break;
			}
		},
	},
	watch: {},
	computed: {
		orginDeviceID() {
			return this.$store.state.device.orginDeviceID
		},
		// 台灣操作模式
		twMode(){
			return this.$store.state.config.twMode;
		},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		unReadMsg() {return M4C.Issue.unReadMsg;},
		hasUnreadMsg() {
			return this.unReadMsg && this.enableFeedBack;
		},
		enableFeedBack() {
			if(this.$store.state.wsConnMap.quote.acPdSetting.function.feedback)
				return this.$store.state.wsConnMap.quote.acPdSetting.function.feedback.enable;
		},
		// pdsetting 是否開啟 QRCode 設備同步功能
		enableSync() {
			try{return this.$store.state.config.quotePdSetting.function.sync;}catch(e){}
		},
		/** 是否有簽署雲端條件單同意書 */
		isAgreeSMO() {
			return M4C.SmoAgreement.checkAgreeSMO();
		},
		/** 是否隱藏SMO相關功能(By pdsetting) */
		hiddenSMO() {return this.$store.state.config.quotePdSetting.function.hiddenSMO;},
		/** 是否顯示憑證管理功能(目前只有台灣版需要憑證管理，所以以台灣模式判斷) */
		showCertManagment() {return this.twMode},
		// 可以看到快速登入
		enableSecurityLogin() {
			try {
				return this.$store.state.login.keepPassword && 
					(this.$store.state.config.publicPdSetting.function.fingerprintLock ||
					this.$store.state.config.publicPdSetting.function.patternLock);
			}catch(e){}
		},
		// 是否啟用貼牌同意書機制
		enableBrokerAgreement() {
			try{return vuex.config.publicPdSetting.CONFIG.BrokerAgreement.enable;}catch(e){}
		},
	}
};
</script>

<style scoped>
</style>