<template>
    <div class="m4c-bank-transfer hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			/** 銀行 ID -> Name 對應表 */
			mapBankIDtoName: {},
			/** 可出金金額資料 */
			withdrawData: [],
			/** 可互轉金額資料 */
			transData: [],
		}
	},
	beforeMount() {
		M4C.BankTransfer = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.bank.get', 'callback': this.onBankGet.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.bank.balance', 'callback': this.onBankBalance.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.fundtransfer.add', 'callback': this.onFundTransferAdd.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.fundtransfer.get', 'callback': this.onFundTransferReport.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.fundtransfer.cancel', 'callback': this.onFundTransferCancel.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.fundtransfer.withdraw.query', 'callback': this.onWithdrawData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.fundtransfer.trans.query', 'callback': this.onTransData.bind(this)});
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 查詢銀行列表
		queryBankList(param) {
			let cmd = {
				"s": "TRADE",
				"c": "account.bank.get",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
				},
				"r" : "".random(),
			};
			if(param && param.TYPE)
				cmd.d.TYPE = param.TYPE;

			M4C.send(cmd);
			return this.baseQuery('DataBankList');
		},
		// 查詢銀行帳號餘額
		queryBankBalance(param) {
			M4C.send({
				"s": "TRADE",
				"c": "account.bank.balance",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
					"ACCOUNT_PWD": param.acctPwd, 
					"BANK_ACCOUNT": param.bankObj.BANK_ACCOUNT,
					"BANK_PWD": param.bankPwd,
				},
				"r" : "".random(),
			});
			return this.baseQuery('DataBankBalance');
		},
		// 可出金金額查詢
		queryWithdraw() {
			let cmd = {
				"s": "TRADE",
				"c": "account.fundtransfer.withdraw.query",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
				},
				"r" : "".random(),
			}
			// 清空資料。
			this.withdrawData.splice(0);
			M4C.send(cmd);
			return this.baseQuery('FundtransferWithdrawQuery');
		},
		// 可互轉金額查詢
		queryTrans() {
			let cmd = {
				"s": "TRADE",
				"c": "account.fundtransfer.trans.query",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
				},
				"r" : "".random(),
			}
			// 清空資料。
			this.transData.splice(0);
			M4C.send(cmd);
			return this.baseQuery('FundtransferTransQuery');
		},
		// 查詢銀期轉帳回報
		queryFundTransferReport(param) {
			let cmd = {
				"s": "TRADE",
				"c": "account.fundtransfer.get",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
				},
				"r" : "".random(),
			};
			if(param) {
				if(param.start)
					cmd.d.BEGIN_DATE = param.start;
				if(param.end)
					cmd.d.END_DATE = param.end;
			}
			M4C.send(cmd);
			return this.baseQuery('DataFundTransferReport');
		},
		/** 出入金 */
		fundTransfer(param) {
			let cmd = {
				"s": "TRADE",
				"c": "account.fundtransfer.add",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
					"ACCOUNT_PWD": param.acctPwd,
					"ENCRYPT_PWD": param.encryptPwd,
					"TYPE": param.type,
					"BANK_PWD": param.bankPwd,
					"AMOUNT": param.amount,
				},
				"r" : "".random(),
			};
			if(param.bankObj) {
				cmd.d.BANK_ID = param.bankObj.BANK_ID;
				cmd.d.BANK_ACCOUNT = param.bankObj.BANK_ACCOUNT;
				cmd.d.TARGET = param.bankObj.TARGET;
				cmd.d.BANK_ACCOUNT_NAME = param.bankObj.BANK_ACCOUNT_NAME;
			}
			if(param.exchangeObj){
				cmd.d.EXCHANGE_TYPE = param.exchangeObj.EXCHANGE_TYPE;
				cmd.d.EXCHANGE_CURRENCY = param.exchangeObj.EXCHANGE_CURRENCY;
				cmd.d.TARGET = param.exchangeObj.TARGET;
			}
			// A轉B帳號
			if(param.transAccountID)
				cmd.d.TRANS_ACCOUNT_ID = param.transAccountID;

			// 富邦出金要帶幣別
			if(param.currency)
				cmd.d.CURRENCY = param.currency;
			// 是否存在本帳號的簽章
			if (this.$store.state.cert[cmd.d.ACCOUNT_ID])
				this.sigSend(cmd);
			else
				M4C.send(cmd);
			return this.baseQuery('DataFundTransfer');
		},
		/** 出入金取消 */
		fundTransferCancel(param) {
			let cmd = {
				"s": "TRADE",
				"c": "account.fundtransfer.cancel",
				"d": {
					"BROKER_ID": param.BROKER_ID,
					"ACCOUNT_ID": param.ACCOUNT_ID,
					"ACCOUNT_PWD": param.acctPwd,
					"ENCRYPT_PWD": param.encryptPwd,
					"ID": param.ID,
					"TARGET": param.TARGET,
					"TYPE": param.TYPE,
					"CURRENCY": param.CURRENCY,
					"AMOUNT": param.AMOUNT,
				},
				"r" : "".random(),
			};
			M4C.send(cmd);
			return this.baseQuery('DataFundTransferCancel');
		},
		// 簽章後送出(各核心的內容不同，所以不能與其他核心共用)
		sigSend(cmd) {
			let accountID = cmd.d.ACCOUNT_ID;
			let $cert = this.$store.state.cert[accountID];
			let certContent = `${accountID}|${cmd.d.BANK_ID}|${cmd.d.TYPE}|${cmd.d.AMOUNT}|${cmd.d.CURRENCY}|${new Date().dayTime18()}`;
			// 將明文簽出密文
			M4C.Cert.getSign(certContent).then((certSig)=>{
				cmd.d.CERT_NO = $cert.CERT_NO;			// 簽章序號
				cmd.d.CERT_SUBJECT = 'BANKTRANSFER';			// 簽章主旨
				cmd.d.CERT_CONTENT = certContent;		// 簽章明文
				cmd.d.CERT_SIG = certSig;				// 簽章密文
				M4C.send(cmd);
			}).catch(err=>{
				// 委託失敗提示
				this.$store.state.notify({icon: `error`, head: `簽章失敗`, body: `(${err.CODE || '-99600'}) ${err.MSG || this.$ln('簽章異常')}`});
			});
		},
		/** 用銀行ID 取得銀行名稱 */
		getBankName(bankID) {
			return this.mapBankIDtoName[bankID] || "未知银行名称";
		},

		// ========================= 收到資料 =========================
		// 收到銀行列表
		onBankGet(data) {
			let result = this.baseOnTradeData('DataBankList', data);
			if (data.d && data.d.BANK) {
				data.d.BANK.forEach((obj)=>{
					this.mapBankIDtoName[obj.BANK_ID] = obj.BANK_NAME;
					result.push(obj);
				});
			}
		},
		// 收到銀行餘額
		onBankBalance(data) {
			let result = this.baseOnTradeData('DataBankBalance', data);
			if (data.d && data.d.BALANCE) {
				this.$set(result, "BANK_ACCOUNT", data.d.BANK_ACCOUNT);
				this.$set(result, "BALANCE", data.d.BALANCE);
			}
		},
		// 收到出入金回報
		onFundTransferReport(data) {
			let result = this.baseOnTradeData('DataFundTransferReport', data);
			if (data.d && data.d.FUNDTRANSFER) {
				result.unshift(data.d.FUNDTRANSFER);
			}
		},
		// 收到銀期轉帳命令回覆
		onFundTransferAdd(data) {
			let result = this.baseOnTradeData('DataFundTransfer', data);
			// if (data.d && data.d.CODE !== "") {
			// 	this.$set(result, "CODE", data.$CD);
			// 	this.$set(result, "MSG", data.$MSG);
			// }
		},
		onFundTransferCancel(data) {
			let result = this.baseOnTradeData('DataFundTransferCancel', data);
		},
		// 收到可出金金額命令回覆
		onWithdrawData(data) {
			let result = this.baseOnTradeData('FundtransferWithdrawQuery', data);
			if(data.d && data.d.DATA)
				this.withdrawData = data.d.DATA;
		},
		// 收到可互轉金額命令回覆
		onTransData(data) {
			let result = this.baseOnTradeData('FundtransferTransQuery', data);
			if(data.d && data.d.DATA)
				this.transData = data.d.DATA;
		},
	},
	watch: {},
    computed: {
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		accountID() {
			return this.$store.state.login.accountID;
		},
	},
}
</script>

<style scoped>
</style>