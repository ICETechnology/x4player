<template>
	<div class="disconnect-notify-ctn" />
</template>

<script>
export default {
    methods: {
		onBtnReload() {
			window.location.reload();
		},
		checkConnection() {
			if (this.quoteLoginReady)
				return;
			this.notifyObj = vuex.notify({
				keep: this,
				head: `自动重连中`,
				body: `点此以立即重新启动`,
				icon: `sync`,
				delay: 10000,
				onclick: this.onBtnReload.bind(this),
			});
		},
	},
	watch: {
		quoteLoginReady(nv) {
			if (!nv) {
				// 斷線 3 秒後才檢查，降低提示發生率
				this.checkTimeout = setTimeout(this.checkConnection, 3000);
			}
			else {
				clearTimeout(this.checkTimeout);
				vuex.notifyClose(this.notifyObj);
			}
		}
	},
    computed: {
		// 報價登入完成
		quoteLoginReady() {
			return vuex.wsConnMap.quote.loginReady;
		}
    }
}
</script>

<style scoped>
</style>