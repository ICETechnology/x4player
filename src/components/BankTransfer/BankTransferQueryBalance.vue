<template>
    <div class="flex-col font-size-small pd3 posr">
		<div class="flex-center pdt2 pdb5">{{$ln('查询银行馀额')}}</div>
        <div class="flex-row pdb3 flex-center">
            <div class="mgr5">{{$ln('资金密码')}} : </div>
            <input class="flex-1 iceben" type="password" v-model="acctPwd" :placeholder="$ln(`请填入资金帐号密码`)" />
        </div>
        <div class="flex-row pdb5 flex-center">
            <div class="mgr5">{{$ln('银行密码')}} : </div>
            <input class="flex-1 iceben" type="password" v-model="bankPwd" :placeholder="$ln(`请填入银行帐号密码`)" />
        </div>
		<div class="hidden">{{bankBalanceAmount}}</div>
        <ConfirmFoot @confirm="onConfirm" />
		<LoadingIcon v-if="isLoading"></LoadingIcon>
    </div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
			acctPwd: "",
			bankPwd: "",
			/** 查詢銀行餘額結果 */
			bankBalanceResult: {},
        }
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
        onConfirm() {
			if (!this.acctPwd) {
				this.$store.state.notify(`请填入资金帐号密码`);
				return;
			}
			if (!this.bankPwd) {
				this.$store.state.notify(`请填入银行帐号密码`);
				return;
			}
			this.bankBalanceResult = M4C.BankTransfer.queryBankBalance({
				bankObj: this.selectedBank,
				acctPwd: this.acctPwd,
				bankPwd: this.bankPwd,
			});
        }
    },
	watch: {
		/** 選擇銀行切換 */
		selectedBank(nv) {
			this.acctPwd = "";
			this.bankPwd = "";
			this.bankBalanceResult = {};
		},
		/** 銀行餘額查詢狀態改變 */
		'bankBalanceResult.$STATUS'(nv) {
			if (nv === "DONE") {
				eventBus.$emit("CLOSE-FLOAT-DIALOG");
			}
			if (nv === "FAIL") {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `银行馀额查询`,
					content: `(${this.bankBalanceResult.$CD}) ${this.bankBalanceResult.$MSG}`,
					confirmOnly: true,
				});
			}
		},
	},
    computed: {
		$displayMoney() {
			return this.$store.state.fn.$displayMoney;
		},
		selectedBank() {
			return this.param.selectedBank;
		},
		/** 銀行餘額 */
		bankBalanceAmount() {
			return this.$store.state.status.bank.balanceAmount = this.$displayMoney(this.bankBalanceResult.BALANCE);
		},
		/** 是否顯示 loading-icon */
		isLoading() {
			if (this.bankBalanceResult.$STATUS === "QUERY")		return true;
			return false;
		},
	},
}
</script>

<style scoped>
</style>