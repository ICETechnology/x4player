<template>
    <div class="m4c-history-data hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		M4C.HistoryData = this;
		// 回補所有履約價
		M4C.regDispatch({'s': 'HistoryData', 'c': 'eps', 'callback': this.onEpsGet.bind(this)});
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 回補所有履約價
		queryEps(sid, mth) {
			M4C.send({
				s: 'HistoryData',
				c: 'eps',
				d: {
					s: sid,
					m: mth,
				},
				r : ''.random(),
			});
			return this.baseQuery('DataEps');
		},

		// ========================= 收到資料 =========================
		// 收到所有履約價
		onEpsGet(data) {
			let result = this.baseOnTradeData('DataEps', data);
		},
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>