<template>
    <Button class="pdlr3 nowrap" @click="onBtnAskPrice" v-if="isCommodityOptions">{{$ln(`询价`)}}</Button>
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			inquiryResult: {},
		}
	},
	beforeMount() {
		// 註冊資料分派
		M4C.regDispatch({'s': 'TRADE', 'c': 'quote.inquiry', 'callback': this.onData.bind(this)});
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 詢價 */
		onBtnAskPrice() {
			M4C.send({
				"s": "TRADE",
				"c": "quote.inquiry",
				"d": { 
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
					"SYMBOL": this.sid,
				},
				"r": "".random(),
			});
			this.inquiryResult = this.baseQuery('DataInquiry');
		},
		onData(data) {
			let result = this.baseOnTradeData('DataInquiry', data);
		},
	},
	watch: {
		'inquiryResult.$STATUS': function(nv) {
			if (nv === "DONE") {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `询价`,
					content: `询价已送出`,
					confirmOnly: true,
				});
			}
			else if (nv === "FAIL") {
				this.$store.state.notify(`error`, `询价异常`);
			}
		}
	},
    computed: {
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
		isCommodityOptions() {
			return M4C.Symbol.isCommodityOptions(this.sid);
		},
	},
}
</script>

<style scoped>
</style>