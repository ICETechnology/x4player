<template>
	
</template>
<script>
// import KChartDataCoreWorker from "@/components/KChart/KChartDataCore.worker.js";
export default {
	data() {
		return {
			workerIdx: 0,
			com_instance_map: {},
			workerList: [],
		}
	},
	beforeMount() {
		M4C.KChartDataCore = this.$store.state.m4c.kchartdatacore = this;
		let self = this;
		// 建立多執行序
		for (let i=0; i<8; i++) {
			self.workerList[i] = new KChartDataCoreWorker();
			self.workerList[i].onmessage = self.onWorkerMessage.bind(self);
		}		
	},
	mounted() {
	},
	beforeDestroy() {
		// 結束所有worker
		for (let i=0; i<8; i++) {
			if(self.workerList && self.workerList[i]){
				self.workerList[i].terminate();
			}
		}
		this.workerList = null;
	},
	methods: {
		// 清除instance
		clearComInstanceMap(uid) {
			let self = this;
			delete self.com_instance_map[uid];			
		},
		// 合併資料。
		onMergeData(dataObj){
			let {chartData, timeKeyList, range, realTime, mergeChartData, mergeTimekeyList, com_instance} = dataObj;
			this.com_instance_map[com_instance._uid] = com_instance;
			if(range == 1) {
				this.onWorkerMessage({
					action: "mergeData", 
					result: {chartData: chartData, timeKeyList: timeKeyList, isRealtime: realTime}, 
					param: {byRealTimeTick: realTime, range: range, com_instance_uid: com_instance._uid}});
			}
			else {
				this.workerList[this.workerIdx++%8].postMessage({
					action: 'mergeData',
					data: {"chartData": chartData, "timeKeyList": timeKeyList, "mergeChartData": mergeChartData, "mergeTimekeyList": mergeTimekeyList},
					param: {byRealTimeTick: realTime, range: range, com_instance_uid: com_instance._uid}
				});
			}
		},
		onWorkerMessage(e){
			let {action, result, p, param} = e.data || e;
			let com_uid = p? p.com_instance_uid: param.com_instance_uid;
			let com_instance = this.com_instance_map[com_uid];
			switch(action) {
				case 'mergeData':
					if(com_instance)
						com_instance.onMergeData(result);
					break;
			}
		},
	}
}
</script>