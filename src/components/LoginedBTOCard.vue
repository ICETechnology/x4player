<template>
	<div class="logined-bto-card flex-row" :class="{'selected': selected, 'pdlr5': isDesktop}" @click="onClick">
		<div class="flex-1 flex-col pdtb3 overflow-hidden">
			<div class="clr-orange broker-name" :title="displayBrokerName">{{displayBrokerName}}</div>
			<div class="flex-row flex-start mgt1">
				<div class="font-size-mini status-text pdtb0d5 pdlr3"
					:class="{'login-ready': loginReady && !closed, 'background-animate': connecting}">{{status}}</div>
				<div class="mgl2 flex-start">{{displayTraderID}}</div>
			</div>			
		</div>
		<div class="flex-center pdlr1" v-if="!isDesktop">
			<!-- 登入Radio圖示 -->
			<span class="css-radio-btn flex-center" :class="{'selected': selected}"><span/></span>
		</div>
	</div>
</template>

<script>
export default {
	props: ['bto'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onClick() {
			// 已登入->直接切换
			if (this.loginReady) {
				M4C.BTO.setSelected(this.wsConn);
				if (!this.isDesktop)
					eventBus.$emit("CLOSE-DIALOG");
			}
			// 未登入->彈出 LoginTradeAuto 自動開始登入
			else {
				eventBus.$emit("POPUP-DIALOG", "LoginTradeAuto", {loginBTO: this.bto, fromLoginedBTOSelector: true}, {transName: 'float'});
			}
		}
	},
	watch: {},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		selectedBTO() {
			return this.$store.state.selectedBTO;
		},
		wsConn() {
			let btID = `${this.bto.brokerID}|${this.bto.traderID}`;
			return this.$store.state.wsConnMap[btID] || {};
		},
		status() {
			if (this.closed)
				return this.$ln('已断线');
			if (this.loginReady)
				return this.$ln('已登入');
			switch(this.wsConn.$STATUS) {
				case 'TRADER-LOGIN-FAIL':
				case 'TIMEOUT':
				case 'CLOSE':
				case '':	// 登出情境
					return this.$ln('未登入');
				case 'TRADER-LOGIN-READY':
					return this.$ln('已登入');
				default:
					return this.$ln('登入中');
			}
			return this.wsConn.$STATUS;
		},
		selected() {
			return this.wsConn.bto ? this.wsConn.bto.selected : false;
		},
		loginReady() {
			return this.wsConn.loginReady;
		},
		connecting() {
			return this.wsConn.connecting;
		},
		closed() {
			return this.wsConn.closed;
		},
		brokerID() {
			return this.bto ? this.bto.brokerID : '';
		},
		brokerKey() {
			return this.bto ? (this.bto.brokerKey || this.bto.brokerID) : '';
		},
		displayBrokerName() {
			return this.$store.state.brokerNameMap[this.brokerKey];
		},
		displayTraderID() {
			return M4C.Trader.getDisplayTraderID(this.bto.traderID);
		},
	},
}
</script>

<style scoped>
.logined-bto-card {
	border-bottom: 1px solid #999;
}
.status-text {
	color: gray;
	border-radius: 0.3em;
	border: 1px solid gray;
	box-sizing: border-box;
}
.status-text.background-animate {
	color: white;
	border: 1px solid white;
}
.status-text.login-ready {
	color: white;
	border: 1px solid #F5A623;
	background-color: #F5A623;
}
.broker-name {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/** 桌機版 */
.desktop .logined-bto-card.selected {
	background-color: #952828;
}
.desktop .logined-bto-card:hover {
	color: aqua;
	cursor: pointer;
}
</style>