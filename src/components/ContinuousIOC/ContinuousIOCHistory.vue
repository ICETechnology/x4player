<template>
	<div class="contiioc-record-container flex-col">	
		<!-- 標題 -->
		<div class="contiioc-report flex-row clr-gray2 nowrap pdtb1d5 bgc-2A fit-content posr">
			<div class="cell0 mgl2">{{$ln('時間')}}</div>
			<div class="cell1">{{$ln('紀錄')}}</div>
		</div >           
		<div class="posr flex-1">		
			<ScrollBounce @refresh="queryHistory(0)" :refresh="true" :status="stampStatus" v-stop-propagation-y>  
				<!-- 內容 -->                            
				<div v-for="(history, index) in continuousIOCHistory" class="flex-row pdt3 contiioc-report" :class="[textColor(history.TYPE)]" >
					<div class="cell0 mgl2 flex-start"> {{new Date(history.CREATE_TIME).time11()}} </div>
					<div class="cell1">{{history.MESSAGE}}</div>
				</div>
				<Stamp v-if="historyData.length == 0" :stampStatus="stampStatus" />

				<!-- 查詢更多 -->
				<div v-if="existMore && historyData.length != 0" >
					<div class="flex-row pdt2" >
						<div class="flex-1"></div>
						<div class="divider"></div>
						<div class="flex-1"></div>
					</div>
					<div class="load-more-container posr">
						<LoadingIcon v-if="isLoading"></LoadingIcon>
						<div v-else-if="stampStatus != 'FAIL'" class="load-more-wording flex-center pdb5" >載入更多</div>
						<div v-else-if="stampStatus == 'FAIL'" class="load-more-wording flex-center pdb5" >載入失敗</div>
					</div>
					<div style="height: 3em;" v-waypoint="{active: true, callback: onWaypoint}"></div>					
				</div>				
			</ScrollBounce>
		</div>	
         
    </div>    
</template>

<script>

export default {
	data() {
		return {
			resultContinuousIOCHistory: {},
			historyData: [],
			// 查詢更多時的loading圖標
			isLoading: false,
			// 存在更多資料?
			existMore: true,
			// 每頁查詢幾筆
			limit: 50,
		}
	},
	props:['param'],
	beforeMount() {},
	mounted() {
		this.queryHistory(0);
	},
	methods: {
		queryHistory(pageIdx){
			// 首次查詢或下拉重新查詢
			if(pageIdx == 0){
				this.historyData = [];
				this.existMore = true;
			}
			this.isLoading = true;

			this.resultContinuousIOCHistory = M4C.ContinuousIOC.queryHistory(this.param, pageIdx,this.limit);
		},
		textColor(type){
			switch(type){
				case '1':
				case '2':
					return "clr-edit";
				case '3':
				case '7':
					return 'clr-start';
				case '4':
					return 'clr-pause';
				case '5':
				case '6':
					return 'clr-stop';
				default:
					return 'clr-white';
			}
		},
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			if (going==="in" && direction==="top") {				
				// 防止連續查詢
				if(!this.isLoading){
					this.queryHistory();
				}	
			}
		},
    },
	watch:{
		resultContinuousIOCHistory(nv){
			if(nv.data && nv.data.cd==0){
				if(nv.data.d.HISTORY)
					this.historyData = this.historyData.concat(nv.data.d.HISTORY);

				// 歷史紀錄的筆數小於每次查詢筆數，視為不存在下一頁
				if(nv.data.d.HISTORY.length < this.limit) 
					this.existMore = false;

				this.isLoading = false;
			}
		},
		stampStatus(nv){
			if(nv == 'FAIL'){
				this.isLoading = false;
			}
		}
	},
	computed: {
		continuousIOCHistory(){
			return this.historyData.sort((a, b)=> new Date(b.CREATE_TIME) - new Date(a.CREATE_TIME));
		},
		stampStatus(){
			try {return this.resultContinuousIOCHistory.$STATUS;} catch (error) {}
		},
	},
}
</script>

<style lang='scss' scoped>
.contiioc-report{
	line-height: 140%;
	align-items: flex-start;
}

.contiioc-report .cell0{
	width: 30vw;
}
.contiioc-report .cell1{
	width: 70vw;
}
.clr-stop{
	color: rgb(255, 142, 137)
}
.clr-pause{
	color:#e68e3e;
}
.clr-start{
	color: rgb(116, 197, 128);
}
.clr-edit{
	color:#518ff5;
}
.divider{
	height: 2px;
	padding: 0;
	margin: 0 16px;
	background-color:#222;
	border:0;
	width: 100%;
}
.load-more-container{
	display: flex;
	justify-content: center;
	height: 4em;
	padding-top: 1em;
}
.load-more-wording{
	color: #ECECEC;
	height: 3em;
	align-items: start;
}
</style>