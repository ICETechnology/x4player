<template>
	<div class="rights-info-ctn flex-col pd10">
		<div class="account-ctn pd3 font-size-big flex-row">
			<span class="flex-start clr-black">{{traderID}}({{displayBrokerName}})</span>
			<span class="flex-1"></span>
			<span class="status-text pdtb0d5 pdlr3 flex-center" :class="[{'login-ready': loginReady && !closed}, {'connecting': connecting}]">
				<span class="ellipsis">{{status}}</span>
			</span>
		</div>
		<div class="flex-1 posr">
			<Margin class="flex-1 clr-black" stampStyle="black-ui" :flexWrap="true" />
		</div>
	</div>
</template>
<script>
export default {
	data() {
		return {	}
	},
	computed:{
		btID() {
			return this.$store.state.login.btID;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		traderID() {
			return this.$store.state.login.traderID;
		},
		displayBrokerName() {
			return this.$store.state.login.brokerName;
		},
		wsConn() {
			return this.$store.state.wsConnMap[this.btID] || {};
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
		loginReady() {
			return this.wsConn.loginReady;
		},
		connecting() {
			return this.wsConn.connecting;
		},
		closed() {
			return this.wsConn.closed;
		},
	}
}
</script>
<style scoped>
.rights-info-ctn {
	background-color: #C8C8C8;
}
.account-ctn {
	border-bottom: 5px gray solid;
}
.status-text {
	color: gray;
	border-radius: 1vw;
	border: 1px solid gray;
}
.status-text.connecting {
	color: aqua;
	border: 1px solid aqua;
}
.status-text.login-ready {
	color: white;
	border: 1px solid gray;
	background-color: gray;
}
.desktop .status-text{min-width: 0;}
.ellipsis {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>