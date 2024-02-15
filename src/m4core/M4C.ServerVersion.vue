<template>
	<div class="m4c-server-version hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.ServerVersion = this.$store.state.m4c.serverVersion = this;

		M4C.regDispatch({'s': 'appbo', 'c': 'svc.tag', 'callback': this.onSvcVersions.bind(this)});
	},
	methods: {
		// 取得 server 總版本號
		getSvcVersions() {
			this.result = new Promise((resolve, reject) => {
				this.resolve = resolve;
				this.reject = reject;
			});
			if (this.quoteLoginReady) {
				let cmd = {"s": "appbo", "c": "svc.tag", "r": "".random()};
				M4C.send(cmd, 'quote');
			}
			else {
				this.reject({'error': 'quote connection not ready'});
			}
			return this.result;
		},
		// 收到資料
		onSvcVersions(data) {
			this.svcVersions = window.svcVersions = data.d;
			this.resolve(this.svcVersions);
		},
	},
	watch: {
	},
	computed: {
		quoteLoginReady() {
			return this.$store.state.wsConnMap.quote.loginReady;
		}
	},
}
</script>
