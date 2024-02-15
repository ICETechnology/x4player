<template>
	<div class="cert-validator hidden">
	</div>
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
		// 憑證即將過期 -> 提示憑證即將過期 -> 轉跳憑證管理畫面
		if (this.$cert && this.$cert.STATUS == 31) {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: self.$ln("CERT_ABOUT_EXPIRE_TITLE"),
				content: self.$ln("CERT_ABOUT_EXPIRE_CONTENT"),
				confirmText: self.$ln("CERT_ABOUT_EXPIRE_CONFIRM_BUTTON"),
				confirm: () => {
					eventBus.$emit("POPUP-DIALOG", 'CertManager', "", {transName: 'float'});
				}
			});
		}
	},
	beforeDestroy() {},
	components: {},
	methods: {},
	watch: {},
	computed: {
		traderID() {
			return this.$store.state.login.traderID;
		},
		$cert() {
			return this.$store.state.cert[this.traderID];
		},
	},
}
</script>

<style scoped>
</style>