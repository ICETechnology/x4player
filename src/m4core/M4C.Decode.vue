<template>
    <div class="m4c-decode hidden" />
</template>

<script>
const BSON = require('bson');
import MyWorker from './m4c.worker.js'
export default {
	props: [],
	data() {
		return {
			// 等待解壓縮的資料隊列
			blobDataQueue: {},
			blobDataIndex: 0,
			fileReaderList: [],
		}
	},
	beforeMount() {
		M4C.Decode = this;
		let self = this;
		// 建立多執行序
		self.worker = [];
		self.workerIdx = 0;
		for (let i=0; i<8; i++) {
			self.worker[i] = new MyWorker();
			self.worker[i].onmessage = self.onWorkerMessage.bind(self);
		}
		// 防堵塞機制 (防止非預期資料無法解壓縮導致阻塞問題)
		setInterval((self)=>{
			let key = Object.keys(self.blobDataQueue)[0];
			let queueObj = self.blobDataQueue[key];
			if (queueObj && (new Date() - queueObj.receiveTime > 9998)) {
				delete self.blobDataQueue[key];
				console.error(`解壓縮防堵塞機制 ! 移除了 ${key} 項目 !`);
			}
		}, 9998, self);
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onData(wsConn, str) {
			let self = this;
			let unicqueKey = `Q${self.blobDataIndex++}`;
			let queueObj = self.blobDataQueue[unicqueKey] = {
				'unicqueKey': unicqueKey,
				'data': str,
				'wsConn': wsConn,
				'receiveTime': new Date(),
			};

			// 字串型資料直接完成並分派
			if (typeof(str) === "string") {
				queueObj.data = self.jsonStringToObj(str);
				queueObj.decompressComplete = true;
				self.dispatchDataQueue();
			}
			// 壓縮型資料 -> 進入 Queue 開始解壓縮
			else {
				self.processDataQueue(queueObj);
			}
		},
		// 將 server 來的資料轉為 object
		jsonStringToObj(str) {
			let self = this;
			var data = {};
			if (typeof(str)==="string") {
				try {
					data = JSON.parse(str);
					// 防止 server 回傳了 Array 的 Bug
					if (data instanceof Array) {
						data = data[0];
					}
				} catch (e) {
					console.error('Cannot parse json string', str);
				}
			}
			return data;
		},
		// 取得一個可用的 FileReader 物件 (取代每次都 new 新的)
		getFileReader() {
			let fr = this.fileReaderList.find(fr=>fr.readyState !== 1);
			if (!fr) {
				fr = new FileReader();
				this.fileReaderList.push(fr);
			}
			return fr;
		},
		// 依序從 DataQueue 取出資料送至 worker 解壓縮
		processDataQueue(queueObj) {
			// 紀錄 > 50kB 的資料的處理狀況
			if (queueObj.data.byteLength > 50000) {
				let sizeKB = (queueObj.data.byteLength/1000).toFixed(1);
				queueObj.byteLength = sizeKB;
				console.log(`[big-data] receive byteLength : ${sizeKB}kB`);
			}
			let objData = {
				action: 'uncompressBinary', 
				dataType: 'blob',
				unicqueKey: queueObj.unicqueKey, 
				payload: queueObj.data,
			};
			// Using transferable objects from a Web Worker https://stackoverflow.com/questions/16071211/using-transferable-objects-from-a-web-worker
			this.worker[this.workerIdx++%8].postMessage(objData, [objData.payload]);
		},
		/** 從 worker 收到解壓好的資料 */
		onWorkerMessage(e) {
			let self = this;
			let {dataType, unicqueKey, decompressedData, dataTypeKey} = e.data;
			// unicqueKey -> queueObj
			let queueObj = self.blobDataQueue[unicqueKey];
			// 找不到時表示已經被防堵塞機制移除，所以跳過此內容
			if (!queueObj) return;
			let data = queueObj.data;
			// console.log(`onWorkerMessage`, unicqueKey, queueObj, data);

			// 內層內容解壓縮完成
			if (dataType === "uncompress-inside") {
				delete data.d[dataTypeKey];
				data.d.$data = data.d.$data || {};
				data.d.$data[dataTypeKey] = decompressedData.data || decompressedData;
				// 暫時向前相容用
				// if (dataTypeKey === "gzip") data.d.data = decompressedData.data || decompressedData;
			}
			else
				data = queueObj.data = decompressedData;

			// HistoryData 與 Symbol 要檢查內容是否需要再解壓縮
			if (data.s === "HistoryData" || data.s === "Symbol" || data.s === "ContractSpec") {
				let uncompressObj = null;
				if (data.d && data.d.gzip && data.d.gzip.buffer)
					uncompressObj = {key: "gzip", data: data.d.gzip};
				else if (data.d && data.d.opt && data.d.opt.buffer)
					uncompressObj = {key: "opt", data: data.d.opt};
				else if (data.d && data.d.statistic && data.d.statistic.buffer)
					uncompressObj = {key: "statistic", data: data.d.statistic};
				if (uncompressObj) {
					let objData = {
						action: 'uncompressBinary',
						dataType: 'uncompress-inside',
						unicqueKey: unicqueKey,
						payload: uncompressObj.data.buffer,
						dataTypeKey: uncompressObj.key,
					};
					// console.log(`onWorkerMessage.postMessage`, objData);
					self.worker[self.workerIdx++%8].postMessage(objData);
					return;
				}
			}
			// 已解壓完成 
			queueObj.decompressComplete = true;
			// 大資料處理分析
			if (queueObj.byteLength) {
				console.log(`[big-data] decompress ${queueObj.byteLength}kB usuage ${new Date() - queueObj.receiveTime}ms`);
			}
			// 分派資料
			self.dispatchDataQueue();
		},
		/** 開始分派已經處理好的資料 */
		dispatchDataQueue() {
			let self = this;
			for (let unicqueKey in self.blobDataQueue) {
				let queueObj = self.blobDataQueue[unicqueKey];
				if (queueObj.decompressComplete) {
					let wsConn = queueObj.wsConn;
					let data = queueObj.data;
					data._receiveTime = queueObj.receiveTime;
					// 深度清理 (在 dispatch 之前以避免 dispatch 後若發生 exception 可能導致沒清掉，導致重複發送)
					for (let key in queueObj) {delete queueObj[key];}
					delete self.blobDataQueue[unicqueKey];
					// 發送
					M4C.dispatch(wsConn, data);
				}
				else {
					break;
				}
			}
		},

	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>