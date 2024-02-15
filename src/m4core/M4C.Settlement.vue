<template>
    <div class="m4c-settlement hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			/** 結算單查詢結果 */
			querySettlementResult: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.Settlement = this.$store.state.m4c.settlement = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.settlement', 'callback': this.onSettlementData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.settlement.confirm', 'callback': this.onConfirmSettlementData.bind(this)});
	},
    methods: {
		// 查詢結算單
		querySettlement(date) {
			M4C.send({
				"s": "TRADE",
				"c": "account.settlement",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
					"FORM_TYPE": "MTM",
					"QUERY_TYPE": "DAILY",
					"QUERY_DATE": {
						"DATE": date || '',
					},
					"OUTPUT_TYPE": "HTML"
				},
				"r": "".random()
			});
			this.querySettlementResult = this.baseQuery('QuerySettlementData');
		},
		// 確認結算單
		confirmSettlement() {
			M4C.send({
				"s": "TRADE",
				"c": "account.settlement.confirm",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
				},
				"r": "".random()
			});
			return this.baseQuery('ConfirmSettlementData');
		},
		// 收到結算單資料
		onSettlementData(data) {
			// 非當前關注帳號時，不往下處理，當作沒看到
			if (data.d.BROKER_ID !== this.$store.state.login.brokerID || 
				data.d.TRADER_ID !== this.$store.state.login.traderID || 
				data.d.ACCOUNT_ID !== this.$store.state.login.accountID)
				return;
			let result = this.baseOnTradeData('QuerySettlementData', data);
			// 主推回來的結算單資料 & 尚未確認結算
			if (!result && data.cd === 0 && !data.d.CONFIRM) {
				// 本帳號已設定自動結算 -> 送出確認結算
				if (this.isAutoConfirm) {
					this.confirmSettlement();
				}
				// 本帳號未設定自動結算 -> 彈出結算單 (SIM 不跳)
				else if (!this.$store.state.login.isSIM) {
					this.$set(this.querySettlementResult, "HTML", data.d.SETTLEMENT.HTML);
					this.$set(this.querySettlementResult, "CONFIRM", data.d.CONFIRM);
					this.$set(this.querySettlementResult, "$STATUS", "DONE");
					eventBus.$emit('POPUP-DIALOG', 'Settlement', {}, {transName: 'float'});					
				}
			}
			// 查詢回來的結算單資料
			if (this.querySettlementResult && data.cd === 0 && data.d.SETTLEMENT && data.d.SETTLEMENT.HTML) {
				this.$set(this.querySettlementResult, "HTML", data.d.SETTLEMENT.HTML);
				this.$set(this.querySettlementResult, "CONFIRM", data.d.CONFIRM);
				this.$set(this.querySettlementResult, "$STATUS", "DONE");
			}
		},
		/** 收到結算單確認回覆 */
		onConfirmSettlementData(data) {
			let result = this.baseOnTradeData('ConfirmSettlementData', data);
			// 主推結算單的確認完成 (沒有cd=0, 只有cd=2)
			if (!result && data.cd === 2) {
				this.$store.state.notify({
					head: `结算单`,
					body: `结算单自动确认完成`,
				});
			}
		},
	},
	watch: {
		// 切換帳號時清空結算單查詢結果
		btID(nv) {
			this.querySettlementResult = {};
		},
	},
    computed: {
		btID() {
			return this.$store.state.login.btID;
		},
		isAutoConfirm() {
			let key = `${this.$store.state.login.brokerID}/${this.$store.state.login.accountID}`;
			return this.$store.state.autoConfirmSettlement[key];
		},
	},
}
</script>
