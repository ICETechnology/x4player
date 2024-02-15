<template>
    <div class="password-invalid-ctn hidden"/>
</template>

<script>
import Password from "@/components/Password.vue";
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		let self = this;
		// 密碼逾期 或 密碼失效 (ac or trader.login 都會往這邊送)
		eventBus.$on('PASSWORD-INVALID',(data, wsConn)=>{
			self.onPasswordInvalid(data, wsConn);
			self.isLoading = false;
		})
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 密碼逾期 或 密碼已失效 */
		onPasswordInvalid(data, wsConn){
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				// "AC服務強制修改密碼" or "密碼已逾期"
				content: `(${data.$CD}) ${data.$MSG}`,
				confirm: () => {
					// 顯示修改密碼視窗
					eventBus.$emit("POPUP-DIALOG", Password, {
						brokerKey: wsConn.info.brokerKey,
						brokerID: wsConn.info.brokerID,
						traderID: wsConn.info.traderID,
						onSuccessCB: ()=>{
							eventBus.$emit("CONFIRM-DIALOG", {
								confirmOnly: true,
								content: "更新成功，请使用新密码重新登入",
							});
						},
						// 取消
						onCancel: () => {
							self.onCancelChangePassword(data, wsConn);
							eventBus.$emit("CLOSE-DIALOG");
						}
					});
				},
				cancel: () => {
					self.onCancelChangePassword(data, wsConn);
				}
			});
		},
		/** 取消更新密碼 */
		onCancelChangePassword(data, wsConn) {
			let self = this;
			// 密碼過期情境 -> 允許取消，繼續沿用舊密碼
			if (data.cd === -204 || data.cd === -63) {
				// 延用舊密碼
				M4C.AC.useOldPwd();
				eventBus.$emit("CONFIRM-DIALOG", {
					confirmOnly: true,
					content: "沿用旧密码完成",
					// confirm: window.location.reload,
				});
			}
			// AC服務強制修改密碼 -> 取消登入，中斷連線
			else if (data.cd === -62) {
				M4C.disconnectWsConn(wsConn);
			}
		},		
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>