<template>
    <div class="m4c-sample hidden" />
</template>

<script>
import SmoAgreement from "@/components/SmoAgreement.vue";
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		M4C.SmoAgreement = this;
	},
    mounted() {
		// 取得雲端條件單同意書版本號
		let qry = `{"isRelease":"Y", "company": "${window.comp}", "product": "${window.prod}"}`;
		let url = `https://${window.$path.LOGIN_HOST}/ss2/fsInfo/appbo?f=x4/SmoAgreement.txt&qry=${qry}&r=${new Date().getTime()}`;
		fetch(url).then(response => response.json()).then(data => {
			let v = '-';
			try{v = data.d[0].version;}catch(err){};
			this.$store.state.config.cloudSmoAgreementVersion = v;
			if (this.localSmoAgreementVersion && this.localSmoAgreementVersion !== v) {
				this.$store.state.config.localSmoAgreementVersion = null;
				this.$store.state.notify(`云端洗价同意书变动，请重新签署同意书`);
				eventBus.$emit("POPUP-DIALOG", SmoAgreement, "", {transName: 'float'});
			}
		});
	},
	beforeDestroy() {},
	components: {},
    methods: {
		// 確認是否有同意雲端條件單
		checkAgreeSMO(isPopup){
			// 有設定啟用貼牌同意書檢查機制
			if (this.enableBrokerAgreement) {
				// 該帳號的同意書未包含 GTC (雲端洗價同意書)
				if (Array.isArray(vuex.selectedWSConn.agreements) && !vuex.selectedWSConn.agreements.find(o=>o.AGREEMENT_ID==='GTC' && o.ACCOUNT_ID===vuex.login.accountID)) {
					if (isPopup) {
						eventBus.$emit("CONFIRM-DIALOG", {
							title: this.brokerAgreementAlertHead,
							htmlContent: this.brokerAgreementAlertBody,
							confirmOnly: true,
						});
					}
					return false;
				}
				else
					return true;
			}
			if(!this.isSmoAgree){
				// 有帶參數才跳出同意書
				if(isPopup)	{
					this.popupAgreeMsg();
				}
				return false;
			}
			else
				return true;
		},
		// 跳出同意書
		popupAgreeMsg() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: self.$ln("策略星云端条件单"),
				htmlContent: `<p class="text-align-left">${self.$ln("您尚未启用【云端条件单】服务，请先签署云端条件单同意书。")}</p><p class="text-align-left">${self.$ln("是否前往启用？")}</p>`,
				confirmText: self.$ln("前往启用"),
				confirm: () => {
					eventBus.$emit("POPUP-DIALOG", SmoAgreement, "", {transName: 'float'});
				}
			});
		},
		// 對所有連線送出更新/新增同意書
		updateAgreementAll() {
			if (!this.localSmoAgreementVersion)
				return;
			this.loginedBTOList.forEach(bto => {
				let wsConn = M4C.BTO.btoToWsConn(bto);
				if (wsConn && wsConn.loginReady) {
					this.updateAgreement(wsConn);
				}
			});
		},
		// 更新(不存在時新增)同意書設定
		updateAgreement(wsConn) {
			if (!this.localSmoAgreementVersion)
				return;
			let cmd = {
				"s": "TRADE",
				"c": "trader.agreement.update",
				"d": {
						"BROKER_ID": wsConn.bto.brokerID,
						"TRADER_ID": wsConn.bto.traderID,
						"AGREEMENTS": [{
							"AGREEMENT_ID": "GTC",
							"DATA": {
								"EMAIL": this.$store.state.config.smoAlertEmail,
							},
							"VERSION": this.localSmoAgreementVersion,
							"DEVICE_ID": this.$store.state.device.deviceID,
							"IP_ADDRESS": this.$store.state.device.ipv4 || this.$store.state.device.ipv6,
							"SIGNED_TIME": new Date(this.$store.state.config.smoSignedDate).toISOString(),
						}]
					},
				"r": ''.random(),
			};
			M4C.send(cmd, {'wsConn': wsConn});			
		},
		// 對所有連線送出移除同意書設定
		removeAgreementAll(wsConn) {
			this.loginedBTOList.forEach(bto => {
				let wsConn = M4C.BTO.btoToWsConn(bto);
				if (wsConn && wsConn.loginReady) {
					this.removeAgreement(wsConn);
				}
			});
		},
		// 移除同意書設定
		removeAgreement(wsConn) {
			let cmd = {
				"s": "TRADE",
				"c": "trader.agreement.remove",
				"d": {
						"BROKER_ID": wsConn.bto.brokerID,
						"TRADER_ID": wsConn.bto.traderID,
						"AGREEMENT_ID": "GTC",
					},
				"r": ''.random(),
			};
			M4C.send(cmd, {'wsConn': wsConn});			
		},		
	},
	watch: {},
    computed: {
		// 是否已簽署最新版的同意書(本地版號與新版版號相同)
		isSmoAgree() {return this.localSmoAgreementVersion == this.cloudSmoAgreementVersion;},
		// 新版雲端條件單同意書版號
		cloudSmoAgreementVersion() {return this.$store.state.config.cloudSmoAgreementVersion;},
		// 本地端雲端條件單同意書版號
		localSmoAgreementVersion() {
			return this.$store.state.config.localSmoAgreementVersion;
		},
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
		publicPdSetting() {
			return vuex.config.publicPdSetting;
		},
		// 是否啟用貼牌同意書機制
		enableBrokerAgreement() {
			try{return vuex.config.publicPdSetting.CONFIG.BrokerAgreement.enable;}catch(e){}
		},
		// 檢查貼牌同意書 且 未簽署同意書 提示訊息標題
		brokerAgreementAlertHead() {
			try{return vuex.config.publicPdSetting.CONFIG.BrokerAgreement.alertHead;}catch(e){}
		},
		// 檢查貼牌同意書 且 未簽署同意書 提示訊息內文
		brokerAgreementAlertBody() {
			try{return vuex.config.publicPdSetting.CONFIG.BrokerAgreement.alertBody;}catch(e){}
		},
	},
}
</script>

<style scoped>
</style>