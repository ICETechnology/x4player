<template>
    <div class="m4c-gtc hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.GTC = this.$store.state.m4c.gtc = this;
		M4C.regDispatch({'s': 'TRADE', 'c': 'trader.keeplogin.update', 'callback': this.onData.bind(this)});
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		requestOpenAll() {
			if (!this.localSmoAgreementVersion)
				return;
			this.loginedBTOList.forEach(bto => {
				let wsConn = M4C.BTO.btoToWsConn(bto);
				if (wsConn && wsConn.loginReady) {
					this.requestOpen(wsConn);
				}
			});
			return this.baseQuery('request');
		},
		requestOpen(wsConn) {
			if (!this.localSmoAgreementVersion)
				return;
			let brokerID = wsConn.bto.brokerID;
			let traderID = wsConn.bto.traderID;
			let btID = `${brokerID}|${traderID}`;
			let cmd = {
				"s": "TRADE",
				"c": "trader.keeplogin.update",
				"d": {
						"BROKER_ID": brokerID,
						"TRADER_ID": traderID,
						"ENCRYPT_PWD": wsConn.bto.encryptPwd,
						"IPV4_ADDRESS": this.$store.state.device.ipv4,
						"IPV6_ADDRESS": this.$store.state.device.ipv6,
						"MAC_ADDRESS": this.$store.state.device.macAddress,
						"KEEP_LOGIN": true,
					},
				"r": ''.random(),
			};
			// 支持穿透式API取得的內容
			if (this.deviceDigestMap[btID] && !this.deviceDigestMap[btID].$ERROR) 
				cmd.d.DEVICE_DIGEST = this.deviceDigestMap[btID];
			M4C.send(cmd, {'wsConn': wsConn});
		},
		requestCloseAll() {
			// if (!this.localSmoAgreementVersion)
			// 	return;
			this.loginedBTOList.forEach(bto => {
				let wsConn = M4C.BTO.btoToWsConn(bto);
				if (wsConn && wsConn.loginReady) {
					this.requestClose(wsConn);
				}
			});
			return this.baseQuery('request');
		},
		requestClose(wsConn) {
			// if (!this.localSmoAgreementVersion)
			// 	return;
			let brokerID = wsConn.bto.brokerID;
			let traderID = wsConn.bto.traderID;
			M4C.send({
				"s": "TRADE",
				"c": "trader.keeplogin.update",
				"d": {
						"BROKER_ID": brokerID,
						"TRADER_ID": traderID,
						"KEEP_LOGIN": false,
					},
				"r": ''.random(),
			}, {'wsConn': wsConn});
		},
		onData(data, wsConn) {
			// 這個命令確定在模擬帳號不支持，可以略過失敗訊息。 https://trello.com/c/elp4dxfj/
			let ignoreFail = wsConn.bto.brokerID === 'IceTech';
			let result = this.baseOnTradeData('request', data, '', ignoreFail);
			if (data.cd !== 1 && data.cd !== 2) {
				// this.$store.state.notify(`(${result.$CD}) ${result.$MSG}`);
				// this.$store.state.notify(`請注意 ! 此訊息僅代表命令送出完成，無法得知送出內容是否正確或登入是否會成功 !`);
			}
		}
	},
	watch: {},
    computed: {
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		traderID() {
			return this.$store.state.login.traderID;
		},
		deviceDigestMap() {
			return this.$store.state.device.deviceDigestMap;
		},
		// 已簽署雲端條件單同意書版號
		localSmoAgreementVersion() {
			return this.$store.state.config.localSmoAgreementVersion;
		},
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
	},
}
</script>

<style scoped>
</style>