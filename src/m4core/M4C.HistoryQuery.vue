<template>
    <div class="m4c-history-query hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			mapRKeyToType: {},
		}
	},
	beforeMount() {
		M4C.HistoryQuery = this;
		M4C.regDispatch({'s': 'TRADE', 'c': 'history.query', 'callback': this.onData.bind(this)});
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 回補
		query(type = 'BILL', begin = '20210101', end = new Date().day8()) {
			let rkey = ''.random();
			this.mapRKeyToType[rkey] = type;
			M4C.send({
				"s": "TRADE",
				"c": "history.query",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": this.$store.state.login.accountID,
					"TYPE": type,
					"QUERY_DATE": {
						"BEGIN": begin,
						"END": end,
					}
				},
				"r": rkey,
			});
			return this.baseQuery(`Data${type}`);
		},
		// ========================= 收到資料 =========================
		// 收到所有履約價
		onData(data) {
			let rkey = data.r;
			let type = this.mapRKeyToType[rkey];
			let result = this.baseOnTradeData(`Data${type}`, data);
			// if (data.d && data.d.COLUMN && data.d.DATA) {
			// 	this.$set(result, 'COLUMN', data.d.COLUMN);
			// 	this.$set(result, 'DATA = data.d.DATA;
			// }
		},
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>