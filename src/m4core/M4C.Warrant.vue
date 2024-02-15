<template>
    <div class="m4c-warrant hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			/** 可鎖定 / 已鎖定 */
			queryLockCountResult: {},
			count: {
				QTY: 0,
				LOCKED_QTY: 0,
				UNLOCK_QTY: 0,
			},
			/** 可備兌商品列表 */
			querySymbolListResult: {},
			positionLockSymbolList: [],
			/** 備兌回報資料列表 */
			queryReportListResult: {},
			positionLockReportList: [],
			/** 備兌回報 KeyIndex 表 (用以快速找到新回報在回報列表的位置) */
			positionLockReportKeyList: [],
		}
	},
	beforeMount() {
		M4C.Warrant = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.lock.order', 'callback': this.onPositionLockOrder.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.lock.get', 'callback': this.onPositionLockRcvReport.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.lock.count', 'callback': this.onPositionLockCount.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.lock.report', 'callback': this.onPositionLockRealReport.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.lock.symbol', 'callback': this.onPositionLockSymbol.bind(this)});
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 查詢指定商品備兌可鎖定/已鎖定資料
		getPositionLockCount(symbol) {
			this.queryLockCountResult = this.baseQuery(`${this.baID}|position.lock.count`);
			symbol = symbol || this.lastQuerySymbol;
			this.lastQuerySymbol = symbol;
			this.count.QTY = -999;
			this.count.LOCKED_QTY = -999;
			this.count.UNLOCK_QTY = -999;
			let cmd = {
				"s": "TRADE",
				"c": "position.lock.count",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
					"SYMBOL": symbol,
				},
				"r" : "".random(),
			};
			M4C.send(cmd);
			return this.queryLockCountResult;
		},
		// 取得備兌紀錄
		getPositionLockReportList() {
			this.queryReportListResult = this.baseQuery(`${this.baID}|position.lock.get`);
			// 資料清空
			this.positionLockReportList.splice(0);
			this.positionLockReportKeyList.splice(0);
			this.$set(this.positionLockReportList, "querying", true);
			let cmd = {
				"s": "TRADE",
				"c": "position.lock.get",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
				},
				"r" : "".random(),
			};
			M4C.send(cmd);
			return this.queryReportListResult;
		},
		// 取得可備兌商品列表
		getPositionLockSymbolList() {
			this.querySymbolListResult = this.baseQuery(`${this.baID}|position.lock.symbol`);
			// 清空
			this.positionLockSymbolList.splice(0);
			let cmd = {
				"s": "TRADE",
				"c": "position.lock.symbol",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
				},
				"r" : "".random(),
			};
			M4C.send(cmd);
			return this.querySymbolListResult;
		},
		/** 鎖定 / 解鎖 */
		lock(symbol, type, qty) {
			let result = this.baseQuery(`${this.baID}|position.lock.order`);
			let cmd = {
				"s": "TRADE",
				"c": "position.lock.order",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": M4C.Trader.getAccountID(),
					"SYMBOL": symbol,
					"TYPE": type,
					"QTY": qty,
				},
				"r" : "".random(),
			};
			M4C.send(cmd);
		},
		/** 清空重查 */
		refresh() {
			// 資料清空
			this.positionLockReportList.splice(0);
			this.positionLockReportKeyList.splice(0);
			// 重查
			this.getPositionLockReportList();
		},
		// ========================= 收到資料 =========================

		// 收到備兌鎖倉/解鎖申請回覆
		onPositionLockOrder(data) {

		},
		// 收到回補備兌回報資料
		onPositionLockRcvReport(data) {
			this.onPositionLockReport(data, true);
		},
		// 收到即時備兌回報資料
		onPositionLockRealReport(data) {
			// 鎖定/解鎖執行成功才重查(避免每一次即時回報都發命令查數量)
			if(data.d.REPORT.STATUS == 'New'){
				// 重新查詢數量
				this.count.QTY = -999;
				this.count.LOCKED_QTY = -999;
				this.count.UNLOCK_QTY = -999;

				if (this.queryCountTimeout)
					clearTimeout(this.queryCountTimeout);
				this.queryCountTimeout = setTimeout(()=>{
					this.getPositionLockCount();
				}, 500);
			}
			this.onPositionLockReport(data);
		},
		// 收到回補或即時的備兌回報資料
		onPositionLockReport(data, rcv) {
			let self = this;
			this.queryReportListResult = self.baseOnTradeData(`${this.baID}|position.lock.get`, data);
			if (data.d && data.d && data.d.KEY && data.d.REPORT) {
				this.$set(this.positionLockReportList, "querying", false);
				let rpt = data.d.REPORT;
				rpt.$phase = data.d.KEY.phase;
				let key = rpt.$key = data.d.KEY.id;
				// 利用 keyList 快速找到已存在的備兌回報
				let idx = this.positionLockReportKeyList.indexOf(key);
				// 新備兌回報
				if (idx === -1) {
					this.positionLockReportList.unshift(rpt);
					this.positionLockReportKeyList.unshift(key);
				}
				// 該備兌回報已經存在
				else {
					let orgRpt = this.positionLockReportList[idx] || {};
					// phase較大時 -> 欄位覆蓋
					if (rpt.$phase >= orgRpt.$phase) {
						Object.assign(orgRpt, rpt);
					}
				}
				if (rcv)
					this.sort();
			}
			if (data.cd === 2) {
				this.$set(this.positionLockReportList, "querying", false);
			}
		},
		// 依時間排序 (延遲 100ms 以降低排序次數)
		sort() {
			let self = this;
			if (this.sortTimeout)
				clearTimeout(this.sortTimeout);
			this.sortTimeout = setTimeout(function(){
				self.positionLockReportList.sort((a, b)=>{
					return new Date(b.UPDATE_TIME) - new Date(a.UPDATE_TIME);
				});
				// 排序後重新建立出 keyList
				self.positionLockReportKeyList = self.positionLockReportList.map(o=>o.$key);
			}, 100);
		},
		// 收到備兌可鎖定/已鎖定數量資料
		onPositionLockCount(data) {
			this.queryLockCountResult = this.baseOnTradeData(`${this.baID}|position.lock.count`, data);
			if (data.d && data.d.QTY != null) {
				this.count.QTY = data.d.QTY;
				this.count.LOCKED_QTY = data.d.LOCKED_QTY;
				this.count.UNLOCK_QTY = data.d.UNLOCK_QTY;
			}
		},
		// 可備兌商品列表
		onPositionLockSymbol(data) {
			this.querySymbolListResult = this.baseOnTradeData(`${this.baID}|position.lock.symbol`, data);
			if (data.d && data.d.SYMBOL) {
				data.d.SYMBOL.forEach((sid)=>{
					this.positionLockSymbolList.push(sid);
				});
			}
		},
	},
	watch: {},
    computed: {
		baID() {
			return this.$store.state.login.baID;
		},
	},
}
</script>

<style scoped>
</style>