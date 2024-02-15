<template>
	<div class="m4c-postmessage hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		window.onmessage = (e)=>{
			console.log('M4C.PostMessage onmessage: ', e.data);
			let obj = {};
			try{obj = JSON.parse(e.data);}catch(e){}
			// 要求
			if (obj.action === 'request') {
				// 要求類別
				switch(obj.type) {
					// 登入資訊
					case 'login-info':
						this.send({'target': e.source, 'data': {'action': 'response', 'type': 'login-info', 'value': {
							traderID: vuex.login.traderID,
							traderName: vuex.login.traderName,
							accountID: vuex.login.accountID,
							accounts: vuex.login.accounts,
						}}});
						break;
					// 簽章
					case 'sign':
						// 將明文簽出密文
						M4C.Cert.getSign(obj.value).then((certSig)=>{
							this.send({'target': e.source, 'data': {'action': 'response', 'type': 'sign', 'value': certSig}});
						}).catch(err=>{
							this.send({'target': e.source, 'data': {'action': 'response', 'type': 'sign', 'error': '簽章失敗'}});
						});
						break;
					// 彈窗
					case 'popup':
						eventBus.$emit("POPUP-DIALOG", 'Iframe', obj.value);
						break;
				}
			}
		};
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		send({target, data}) {
			target.postMessage(JSON.stringify(data), '*');
		}
	},
	watch: {},
	computed: {},
}
</script>

<style scoped>
</style>