<template>
	<div class="security-lock-remind hidden">
	</div>
</template>

<script>
import SettingSecurityLock from "@/components/Setting/SettingSecurityLock.vue";
import SecurityLockRemindCheck from "@/components/SecurityLockRemindCheck.vue";

export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
	},
	mounted() {
		// 還沒有啟用快速登入、有記憶密碼、沒勾選不再提醒
		if(!this.securityLockCheck && this.$store.state.login.keepPassword && !vuex.status.isNotRemindSecurityLock) {
			// 跳出 "啓用快速登入" 提醒
			eventBus.$emit("CONFIRM-DIALOG", {
				title: this.$ln(this.$store.state.config.CONFIG.SecurityLock.remind.title),
				contentComponent: SecurityLockRemindCheck,
				confirm: () => {
					// 引導至快速登入設定頁面
					this.settingSecurity();
				},
			});
		}
	},
	beforeDestroy() {
	},
	components: {
	},
	methods: {
		// 跳出設定快速登入
		settingSecurity() {
			eventBus.$emit("POPUP-DIALOG", SettingSecurityLock, "", {'$HEAD': {'title': `快速登入`}, transName: 'float'});
		},
	},
	watch: {
	},
	computed: {
		// 是否勾選手勢登入
		enablePatternLock() {
			return this.$store.state.securityLogin.type == 'pattern';
		},
		// 是否勾選生物辨識登入
		enableFingerprintLock() {
			return this.$store.state.securityLogin.type == 'finger';
		},
		// 確實正在使用快速登入
		securityLockCheck() {
			return (this.enableFingerprintLock && vuex.status.fingerPrintAvailable) || this.enablePatternLock;
		},
	}
}
</script>

<style scoped>
</style>