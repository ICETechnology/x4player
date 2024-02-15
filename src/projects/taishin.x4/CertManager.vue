<template>
	<div class="cert-manager flex-col pdt5 pdlr5">
		<div class="flex-row pdb5">
			<div class="flex-1">{{$ln('憑證狀態')}}</div>
			<div class="clr-up">{{certStatus}}</div>
		</div>
		<div class="flex-row pdb5">
			<div class="flex-1">{{$ln('憑證序號')}}</div>
			<div class="">{{displayCertNO}}</div>
		</div>
		<div class="flex-row pdb5">
			<div class="flex-1">{{$ln('憑證起始日')}}</div>
			<div>{{certInitialDate}}</div>
		</div>
		<div class="flex-row pdb5">
			<div class="flex-1">{{$ln('憑證到期日')}}</div>
			<div>{{certExpireDate}}</div>
		</div>
		<Button class="mgt5 pdlr3 btn-confirm-iceben-gray" @click="queryCert">{{$ln('重新查詢')}}</Button>
		<Button v-if="enableRenewCert" class="mgt5 pdlr3 btn-confirm-iceben iceben" @click="confirmRenewCert">{{$ln('憑證展期')}}</Button>
		<BlockMessage v-if="bmParam.display" :param="bmParam"></BlockMessage>
	</div>
</template>

<script>
import CertApply from "@/projects/taishin.x4/CertApply.vue";
export default {
	props: [],
	data() {
		return {
			queryResult: {},
			bmParam: {},
		}
	},
	beforeMount() {
		this.$emit('title', '憑證管理');
	},
	mounted() {
		this.queryCert();
	},
	beforeDestroy() {},
	components: {},
	methods: {
		// 查詢憑證
		queryCert() {
			this.bmParam = {display: true, head: '憑證查詢', body: '憑證查詢中', showLoadingIcon: true};
			this.queryResult = {};
			M4C.Cert.certQuery({brokerInfo: this.brokerInfo, brokerID: this.brokerID, traderID: this.traderID, certNO: this.$cert.CERT_NO}).then(data=>{
				this.bmParam = {display: false};
				// 記錄查詢結果
				this.queryResult = data.d;
			}).catch(err=>{
				this.bmParam = {display: true, head: '憑證查詢', body: `(${err.CODE}) ${err.MSG}`, showLoadingIcon:false, showConfirmBtn: true};
			});
		},
		// 確認憑證展期
		confirmRenewCert() {
			eventBus.$emit('POPUP-DIALOG', CertApply, {
				mode: 'renew',
				brokerID: this.brokerID,
				traderID: this.traderID,
				brokerInfo: this.brokerInfo,
				accounts: this.accounts,
			}, {transName: 'float'});
		},
	},
	watch: {
		// 展延憑證完成後，憑證序號改變 -> 重查新的憑證狀態回來
		certNO() {
			this.queryCert();
		},
	},
	computed: {
		brokerInfo() {
			return this.$store.state.selectedBTO.brokerInfo;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		traderID() {
			return this.$store.state.login.traderID;
		},
		$cert() {
			return this.$store.state.cert[this.traderID] || {};
		},
		certNO() {
			return this.$cert.CERT_NO;
		},
		// 憑證序號
		displayCertNO() {
			let str = this.certNO || '';
			return str.length > 12 ? str.substr(0, 6) + '...' + str.substr(-6) : str;
		},
		// 憑證狀態
		certStatus() {
			return M4C.Cert.getCertStatusText(this.queryResult.STATUS);
		},
		// 憑證起始日
		certInitialDate() {
			let str = this.queryResult.INITIAL_DATE;
			return str ? `${str.substr(0,4)}/${str.substr(5,2)}/${str.substr(8,2)}` : '--/--/--';
		},
		// 憑證到期日
		certExpireDate() {
			let str = this.queryResult.EXPIRE_DATE;
			return str ? `${str.substr(0,4)}/${str.substr(5,2)}/${str.substr(8,2)}` : '--/--/--';
		},
		// 啟用憑證展期按鈕
		enableRenewCert() {
			return this.queryResult.STATUS == '31';
		},
		accounts() {
			return vuex.login.accounts;
		},
	},
}
</script>

<style scoped>
</style>