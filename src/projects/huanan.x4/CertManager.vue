<template>
	<div class="cert-manager flex-col pdt5 pdlr5">
		<div class="flex-row pdb5">
			<div class="flex-1">{{$ln('憑證狀態')}}</div>
			<div class="clr-up">{{certStatus}}</div>
		</div>
		<div class="flex-row pdb5">
			<div class="flex-1">{{$ln('憑證序號')}}</div>
			<div class="">{{certNO}}</div>
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
			eventBus.$emit("CONFIRM-DIALOG", {
				title: this.$ln('憑證展期'),
				content: this.$ln('確認申請憑證展期 ?'),
				confirm: this.renewCert,
			});
		},
		// 憑證展期
		renewCert() {
			this.bmParam = {display: true, head: '憑證展期', body: '正在進行憑證展期', showLoadingIcon: true};
			M4C.Cert.renewCert({brokerInfo: this.brokerInfo, brokerID: this.brokerID, traderID: this.traderID}).then(data=>{
				this.bmParam = {display: false};
				// 展期完成後重新查詢憑證
				this.queryCert();
			}).catch(err=>{
				this.bmParam = {display: true, head: '憑證展期', body: `(${err.CODE}) ${err.MSG}<br>${err.MEMO || ''}`, showLoadingIcon:false, showConfirmBtn: true};
			});
		},
	},
	watch: {},
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
		// 憑證序號
		certNO() {
			return this.queryResult.CERT_NO || '';
		},
		// 憑證狀態
		certStatus() {
			return M4C.Cert.getCertStatusText(this.queryResult.STATUS);
		},
		// 憑證起始日
		certInitialDate() {
			let str = this.queryResult.INITIAL_DATE;
			return str ? `${str.substr(0,4)}/${str.substr(4,2)}/${str.substr(6,2)}` : '--/--/--';
		},
		// 憑證到期日
		certExpireDate() {
			let str = this.queryResult.EXPIRE_DATE;
			return str ? `${str.substr(0,4)}/${str.substr(4,2)}/${str.substr(6,2)}` : '--/--/--';
		},
		// 啟用憑證展期按鈕
		enableRenewCert() {
			return this.queryResult.STATUS == '31';
		},
	},
}
</script>

<style scoped>
</style>