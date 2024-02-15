<template>
    <div class="pause-resume-ctn">
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		M4C.regDispatch({'s': 'dispatcher', 'c': 'ping', 'callback': this.onPingData.bind(this)});
	},
    mounted() {
		let self = this;
		// app 情境
		if (this.$store.state.device.isAPP) {
			// 被放到背景
			document.addEventListener("pause", self.onPause, false);
			// 從背景中被恢復
			document.addEventListener("resume", self.onResume, false);
		}
		// browser
		else {
			document.addEventListener("visibilitychange", function (event) {
				if (document.visibilityState === 'visible') {
					self.onResume();
				} else if (document.visibilityState === 'hidden') {
					self.onPause();
				}
			});
		}
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onPause() {
			console.log(`PauseResume.onPause`);
			this.$store.state.status.pause = true;
			M4C.Analysis.onPause();
		},
		onResume() {
			console.log(`PauseResume.onResume`);
			this.$store.state.status.pause = false;
			M4C.Analysis.onResume();
			// 檢查所有連線
			setTimeout(this.checkConnection, 500);
		},
		// 檢查所有連線
		checkConnection() {
			// 對所有已登入連線進行一次性的 ping/pong 測試，無回應者進行斷線重連
			for (let key in this.wsConnMap) {
				let wsConn = this.wsConnMap[key];
				if (wsConn && wsConn.loginReady && !wsConn.connecting) {
					console.log("PauseResume.ping", M4C.getWsConnMark(wsConn), `(readyState = ${wsConn.socket.readyState})`);
					M4C.send({"s": "dispatcher", "c": "ping"}, {wsConn: wsConn});
					wsConn.waitPongTimeout = setTimeout(wsConn=>{
						console.log("PauseResume.reconnect by pongTimeout", M4C.getWsConnMark(wsConn));
						M4C.forceReconnect(wsConn);
					}, 1000, wsConn);
				}
			}
		},
		// 收到 ping 回覆資料
		onPingData(data, wsConn) {
			if (data.d==='pong' && wsConn) {
				console.log("PauseResume.pong", M4C.getWsConnMark(wsConn));
				clearTimeout(wsConn.waitPongTimeout);
			}
		},
	},
	watch: {},
    computed: {
		wsConnMap() {
			return this.$store.state.wsConnMap;
		},
	},
}
</script>

<style scoped>
</style>