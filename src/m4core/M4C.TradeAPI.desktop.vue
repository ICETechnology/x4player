<template>
    <div class="m4c-trade-api-app hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			/** 對採集服務的連線是否已經 ready */
			connectReady: false,
			digestResult: {},
			/** 連線未 ready 時送來的 digest 會先暫存在這裡 */
			digestQueue: [],
		}
	},
	beforeMount() {
		M4C.TradeAPI = this;
	},
    mounted() {
		this.connect();
	},
	beforeDestroy() {},
	components: {},
    methods: {
		connect() {
			let self = this;
			let url = 'ws://127.0.0.1:9527';
			console.log('DesktopTradeAPI.connect : ', url);
			let ws = this.ws = new WebSocket(url);
			ws.onopen = function(evt) {
				console.log('DesktopTradeAPI.onopen : ', evt);
			};
			ws.onmessage = function(evt) {
				console.log('DesktopTradeAPI.onmessage : ', evt.data);
				let data = JSON.parse(evt.data);
				self.onDigestData(data);
			};
			ws.onclose = function(evt) {
				console.log('DesktopTradeAPI.onclose : ', evt);
				// self.$store.state.notify(`error`, self.$ln(`穿透式采集服务连线失败`));
				eventBus.$emit("CONFIRM-DIALOG", {
					title: self.$ln("穿透式采集服务连线失败"),
					content: self.$ln("点击确认以重新连结"),
					confirm: self.connect,
				});
			};
			ws.onerror = function(evt) {
				console.log('DesktopTradeAPI.onerror : ', evt);
			};
		},
		// 採集
		digest(bto) {
			let self = this;
			let btID = `${bto.brokerID}|${bto.traderID}`;
			console.log(`[${btID}] M4C.TradeAPI.desktop.digest`, bto);
			// 採集 timeout -> 仍繼續登入
			setTimeout(()=>{
				if (!self.deviceDigestMap[btID])
					self.deviceDigestMap[btID] = {$ERROR: 'TIMEOUT'};
			}, 9988);
			// 設定要求穿透式 && 有存在穿透式API
			let brokerInfo = this.$store.state.brokerMap[bto.brokerKey];
			if (brokerInfo.system) {
				// 採集連線已完成 -> 送出採集
				if (this.connectReady) {
					this.requestDigest(btID, brokerInfo);
				}
				// 採集連線未完成 -> 先放在 digestQueue 裡
				else {
					this.digestQueue.push(bto);
				}
			}
			// 未設定要求穿透式 || 不存在穿透式API
			else {
				self.deviceDigestMap[btID] = {$ERROR: 'NO-BROKER-MODE'};
			}
		},
		/** 送出採集命令 */
		requestDigest(btID, brokerInfo) {
			let cmd = JSON.stringify({
				FunCode: 1,
				LibName: brokerInfo.system,
				LibType: brokerInfo.LibType || 2,
				RequestID: btID,
			});
			console.log('DesktopTradeAPI.send : ', cmd);
			this.ws.send(cmd);
		},
		/** 收到採集結果 */
		onDigestData(data) {
			let btID = data.RequestID;
			// Ready
			if (data.MsgCode === 1) {
				this.connectReady = true;
				this.digestQueue.forEach(bto=>this.digest(bto));
				this.digestQueue = [];
			}
			// 採集成功
			else if (data.MsgCode === 2) {
				this.deviceDigestMap[btID] = {
					COLLECT_TIME: new Date().dayTime18('-'),
					app_abnormal_type: `${data.ErrCode}`,
					app_sys_info: data.SystemInfo,
					app_sys_info_integrity: data.SystemInfoIntegrity,
				};
			}
		},
	},
	watch: {},
    computed: {
		deviceDigestMap() {
			return this.$store.state.device.deviceDigestMap;
		},
	},
}
</script>

<style scoped>
</style>