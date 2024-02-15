<template>
	<div class="m4c-contract-spec hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			holidayMap: null,
			queryMainformResolve: {},
			queryMainformReject: {},
			queryMainformTimeout: {},
			mapRKeyToSid: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.ContractSpec = this.$store.state.m4c.contractSpec = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'ContractSpec', 'c': 'holiday', 'callback': this.onHolidayData.bind(this)});
		M4C.regDispatch({'s': 'ContractSpec', 'c': 'exchangespec', 'callback': this.onMainformData.bind(this)});
		M4C.regDispatch({'s': 'ContractSpec', 'c': 'commodityspec', 'callback': this.onMainformData.bind(this)});
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		queryHoliday(timeoutMs = 5000) {
			let keyV = `${this.projectID}_ContractSpecHoliday.v`;
			let keyD = `${this.projectID}_ContractSpecHoliday.d`;
			let cache = localStorage.getItem(keyD);
			let v = parseInt(localStorage.getItem(keyV));
			let cmd = {
				"s": "ContractSpec",
				"c": "holiday",
				"r": "".random(),
				"d": {
					"v": cache && v ? v : 0,
				},
			};
			M4C.send(cmd, 'quote');
			// 逾時機制
			this.queryHolidayPromise = setTimeout(()=>{
				if (this.queryHolidayPromise)
					this.queryHolidayPromise.reject({code: -99107});
			}, timeoutMs);
			// 回Promise
			return new Promise((resolve, reject)=>{
				this.queryHolidayPromise = {resolve, reject};
			});
		},
		onHolidayData(data, wsConn) {
			// 儲存 key
			let keyV = `${this.projectID}_ContractSpecHoliday.v`;
			let keyD = `${this.projectID}_ContractSpecHoliday.d`;

			// 解壓縮後的內容放在 data.d.$data 中
			if (data.d.$data && data.d.$data.gzip)
				data.d.data = data.d.$data.gzip;
			// 空內容 -> 從 Cache 拿
			let dataD = data.d.data;
			if (!dataD) {
				// 從 localStorage 取回資料
				dataD = JSON.parse(localStorage.getItemWithDecompress(keyD));
			}

			this.holidayMap = dataD;
			// resolve promise
			if (this.queryHolidayPromise)
				this.queryHolidayPromise.resolve(dataD);

			// 本次查回有內容 -> 存入Cache
			if (data.d.data) {
				// 內容的字串格式
				let strData = data.d.data ? JSON.stringify(data.d.data) : '';
				// 內容
				localStorage.setItemWithCompress(keyD, strData);
				// 版號
				localStorage.setItem(keyV, data.d.v);
			}

		},
		// 查詢指定品種的總表
		queryMainform(sid, timeoutMs = 3000) {
			let self = this;
			// 將月份去掉
			sid = sid.split('.').slice(0, 4).join('.');
			let isExchange = sid.split('.').length === 3;
			// 建立 Promise
			let promise = new Promise(function(resolve, reject){
				self.queryMainformResolve[sid] = resolve;
				self.queryMainformReject[sid] = reject;
			});
			// 查詢命令
			let rkey = ''.random();
			let cmd = {
				"s": 'ContractSpec',
				"c": isExchange ? 'exchangespec' : 'commodityspec',
				"d": {"s":[sid]},
				"r": rkey,
			};
			this.mapRKeyToSid[rkey] = sid;
			M4C.send(cmd, 'quote');
			// timeout 處理
			this.queryMainformTimeout[sid] = setTimeout((sid)=>{
				if (self.queryMainformReject[sid]) {
					self.queryMainformReject[sid]({sid: sid, code: -99107});
				}
			}, timeoutMs, sid);

			return promise;
		},
		// 收到 ContractSpec/commodityspec 資料
		onMainformData(data, wsConn) {
			let sid = this.mapRKeyToSid[data.r];
			if (!sid) return;
			// 查詢失敗
			if (data.cd < 0) {
				this.queryMainformReject[sid]({sid: sid, code: data.cd});
			}
			// 查詢成功
			else {
				let obj = data.d[0];
				clearTimeout(this.queryMainformTimeout[sid]);
				M4C.Symbol.mainformInfos[sid] = obj;
				this.queryMainformResolve[sid]({sid: sid, info: obj});
			}
		},
	},
	watch: {},
	computed: {
		projectID() {
			return this.$store.state.config.projectID;
		},
	},
}
</script>

<style scoped>
</style>