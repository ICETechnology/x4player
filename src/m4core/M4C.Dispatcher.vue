<template>
    <div class="m4c-dispatcher hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			// Client Info
			clientInfo: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.Dispatcher = this.$store.state.m4c.dispatcher = this;
		// 註冊資料分派
		M4C.regDispatch({
			's': 'dispatcher',
			'callback': this.onData.bind(this)
		});
	},
    methods: {
		// 收到資料
		onData(data, wsConn) {
			switch(data.c) {
				case 'init':
					wsConn.initCode = data.d;
					M4C.AC.login(data, wsConn);
					break;
				// Client Info 資料
				case 'client_info':
					this.clientInfo = data.d;
					break;
			}
		},
		// 取得 Client IP
		getClientIP() {
			return this.clientInfo.ip;
		},
	},
	watch: {},
    computed: {},
}
</script>
