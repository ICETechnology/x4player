<template>
    <div class="flex-col font-size-small pd3 posr">
		<div class="flex-center pdt2 pdb5">{{$ln(param.type==='deposit' ? '资金转入' : '资金转出')}}</div>
        <div class="flex-row pdb3 flex-center">
            <div class="mgr5">{{$ln('资金帐号')}} : </div>
            <div class="flex-1">{{selectedBTO.selectedAccountID}}</div>
        </div>
        <div class="flex-row pdb3 flex-center">
            <div class="mgr5">{{$ln('银行简称')}} : </div>
            <div class="flex-1">{{selectedBank.BANK_NAME}}</div>
        </div>
        <div class="flex-row pdb3 flex-center" v-if="bankBalanceAmount != '--'">
            <div class="mgr5">{{$ln('银行馀额')}} : </div>
            <div class="flex-1">{{bankBalanceAmount}}</div>
        </div>
        <div class="flex-row pdb3 flex-center">
            <div class="mgr5">{{$ln('币　　种')}} : </div>
            <div class="flex-1">{{$store.state.status.selectedCurrency}}</div>
        </div>
        <div class="flex-row pdb3 flex-center">
            <div class="mgr5">{{$ln('转入金额')}} : </div>
            <div class="flex-1">{{$displayMoney(param.amount)}}</div>
        </div>
        <div class="flex-row pdb3 flex-center mgt5">
            <div class="mgr5">{{$ln('资金密码')}} : </div>
            <input class="flex-1 iceben" type="password" v-model="acctPwd" :placeholder="$ln(`请填入资金帐号密码`)" />
        </div>
        <div class="flex-row pdb5 flex-center">
            <div class="mgr5">{{$ln('银行密码')}} : </div>
            <input class="flex-1 iceben" type="password" v-model="bankPwd" :placeholder="$ln(`请填入银行帐号密码`)" />
        </div>
        <ConfirmFoot class="mgt3" @confirm="onConfirm" />
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
			/** 出入金申請結果 */
			fundTransferResult: {},
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
            // 申請出入金
			this.fundTransferResult = M4C.BankTransfer.fundTransfer({
				type: this.param.type,
				amount: this.param.amount,
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
		},
		/** 出入金申請結果 */
		'fundTransferResult.$STATUS'(nv) {
			let result = this.fundTransferResult;
			if (nv === "DONE") {
				// 關閉自己
				eventBus.$emit("CLOSE-FLOAT-DIALOG");
				// 清除銀行餘額 (以免看到舊的)
				this.$store.state.status.bank.balanceAmount = null;
				// 重查資金
				M4C.Margin.queryMargin();
				// 延時彈出以免上一行關掉本提示
				setTimeout(()=>{
					eventBus.$emit("CONFIRM-DIALOG", {
						title: this.$ln('转帐申请'),
						content: `(${result.$CD}) ${this.$ln('申请已送出')}`,
						confirmOnly: true,
					});
				}, 100);
			}
			if (nv === "FAIL") {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `申请结果`,
					content: `(${result.$CD}) ${result.$MSG}`,
					confirmOnly: true,
				});
			}
		},
	},
    computed: {
		$displayMoney() {
			return this.$store.state.fn.$displayMoney;
		},
		selectedBTO() {
			return this.$store.state.selectedBTO || {};
		},
		selectedBank() {
			return this.param.selectedBank;
		},
		/** 銀行餘額 */
		bankBalanceAmount() {
			return this.$store.state.status.bank.balanceAmount;
		},
		/** 是否顯示 loading-icon */
		isLoading() {
			if (this.fundTransferResult.$STATUS === "QUERY")	return true;
			return false;
		},
	},
}
</script>

<style scoped>
</style>