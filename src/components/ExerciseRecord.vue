<template>
	<div class="Exercise-Record-ctn flex-col flex-1">
		<!-- <MyHead class="head" :backType="1" :acc-btn=true show-text="行权记录" :margin="false"></MyHead> -->
		<div class="body flex-col flex-1" :class="{pdt3:!$store.state.device.isDesktop}">
			<div class="flex-row font-size-small col-head pdb1" v-if="$store.state.device.isDesktop">
				<span class="flex-1"/>
				<span class="desktop-btn mg1" @click="onRefresh"><i class="material-icons">refresh</i><span>{{$ln('重查')}}</span></span>
			</div>
			<div class="flex-row row-ctn font-size-small col-head">
				<div class="cell-ctn flex-center option-ctn flex-1">{{$ln('取消')}}</div>
				<div class="cell-ctn flex-center option-ctn flex-1">{{$ln('时间')}}</div>
				<div class="cell-ctn flex-center option-ctn flex-1d5">{{$ln('品种')}}</div>
				<div class="cell-ctn flex-center option-ctn flex-1">{{$ln('手数')}}</div>
				<div class="cell-ctn flex-center option-ctn flex-2">{{$ln('行权状态')}}</div>
				<!-- <div class="flex-col flex-1 flex-center">
					{{$ln('行权记录')}}
				</div> -->
			</div>
			<div class="flex-1 posr overflow-y-auto" v-stop-propagation-y>
				<ScrollBounce class="FULL" :refresh="true" @refresh="onRefresh">
					<div class="record-card-ctn flex-row row-ctn font-size-little" v-for="(record, key) in recordList" :key="key">
						<div class="flex-row flex-1 tcend" @click="onRecordCard(record)">
							<div class="cell-ctn flex-center option-ctn flex-1 cancel-btn" @click.stop="onCancel(record)" :class="[isDisabled(record)? 'canceled': 'clr-warn tcend']"
								><i class="material-icons">{{isDisabled(record)? 'block':'remove_circle'}}</i>
							</div>
							<div class="cell-ctn flex-center option-ctn flex-1">
								<span class="cell-ctn">{{new Date(record.UPDATE_TIME).time8()}}</span>
							</div>
							<div class="cell-ctn flex-center option-ctn flex-1d5">
								<div class="symbol-ctn">{{showSymbol(record)}}</div>
							</div>
							<div class="cell-ctn flex-center option-ctn flex-1">
								<span class="cell-ctn">{{record.QTY}}</span>
							</div>
							<div class="cell-ctn flex-center option-ctn flex-2">
								<span class="cell-ctn">{{`${parseType(record.TYPE)} ${parseStatus(record.STATUS)}`}}</span>
							</div>
						</div> 
					</div>
					<Stamp v-if="recordList.length===0" :stampStatus="stampStatus" />
				</ScrollBounce>
			</div>
			<!-- <div class="foot-ctn flex-row flex-center"><Button class="btn flex-item flex-center bgc-S" @click="onCancelAll" >{{$ln('全部取消')}}</Button></div> -->
		</div>
	</div>
</template>
<script>
import ExerciseDetail from "@/components/ExerciseDetail.vue";
export default {
	data() {
		return {}
	},
	beforeMount(){this.$emit('title', this.$ln(`行权记录`))},
	beforeDestroy(){},
	methods: {
		showSymbol(record){
			let sid1Name = M4C.Symbol.getCIDM4(record.SYMBOL) || record.SYMBOL;
			if(record.SYMBOL2){
				let sid2Name = M4C.Symbol.getCIDM4(record.SYMBOL2) || record.SYMBOL2;
				return `${sid1Name} & ${sid2Name}`;
			}
			else return sid1Name;
		},
		onRefresh(){
			M4C.Exercise.queryExerciseList();
		},
		parseStatus(status){
			let str = "";
			switch (status) {
				case "PendingNew":
					str = this.$ln('申報中');
					break;
				case "New":
					str = this.$ln('申請成功');
					break;
				case "PendingCancel":
					str = this.$ln('取消中');
					break;
				case "Cancelled":
					str = this.$ln('取消成功');
					break;
				case "Rejected":
					str = this.$ln('申請失敗');
					break;	
				default:
					break;
			}
			return str;
		},
		parseType(type){
			let str = "";
			switch (type) {
				case "EXECUTE":
					str = this.$ln('行权');
					break;
				case "DISABLE":
				case "ABORT":
					str = this.$ln('放弃行权');
					break;
			
				default:
					break;
			}
			return str;
		},
		// 删单
		onCancel(record){
			record.ACTION = "CANCEL";
			M4C.Exercise.sendOrder(record);
		},
		// 全部删单
		onCancelAll(){
			for(let key = 0; key < this.recordList.length; key++){
				let record = this.recordList[key];
				// 只做可執行取消的記錄。已執行過的不處理。
				if((record.STATUS == 'New' || record.STATUS == 'Rejected') && (record.CODE >= 0)){
					record.ACTION = "CANCEL";
					M4C.Exercise.sendOrder(record);
				}
			}
		},
		onRecordCard(record){
			eventBus.$emit("POPUP-DIALOG", ExerciseDetail, {"id": record.$key});
		},
		isDisabled(record) {
			return (record.STATUS !== 'New' && record.STATUS !== 'Rejected') || (record.CODE < 0);
		}
	},
	computed: {
		exerciseReportList(){return M4C.Exercise.exerciseReportList;},
		recordList(){
			return this.exerciseReportList;
			// return this.exerciseReportList.sort((a,b)=>{
			// 	let atime = Date.parse(a.UPDATE_TIME);
			// 	let btime = Date.parse(b.UPDATE_TIME);
			// 	return btime - atime;
			// });
		},
		/** 狀態章 */
		stampStatus() {
			return this.$store.state.result.queryExerciseRecordResult.$STATUS;
		}
	}
}
</script>
<style scoped>
.canceled{
	color: #9C9C9C;
	pointer-events: none;
}
.col-head {
	border-bottom: 1px solid #666;
}
.row-ctn{
	padding: 5px 0;
}
.option-ctn{
	width: 2em;
}
.cell-ctn{
	padding: 0 2px;
}
.symbol-ctn{
	padding-left: 5px;
	word-break: break-all;
}
</style>