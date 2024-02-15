<template>
    <div class="history-record-container flex-col">
		<div class="flex-center pdlr5 data-pick pdb1 posr">
			<DatePick ref="historyDate" v-model="dateObj" class="flex-row flex-1 sys-bgc divider btn-default-ht-rd mgr2"/>
			<Button class="mgtb2 pdlr5 clr-white btn-default-ht-rd query-btn" @click="onQuery">{{$ln(`查询`)}}</Button>
		</div>        
        <div class="flex-col flex-1 posr">
            <!-- 標題 -->   
            <div ref="reportHead" class="posr zindex-1 history-report history-row clr-gray2 flex-row nowrap bgc-2A w100p scrolling-x hidden-scroll touch-action-none">
                <div class="cell0 mgl3">{{$ln('編號')}}</div>
                <div class="cell1">{{$ln('委託書編號')}}</div>
                <div class="cell2">{{$ln('成交日期')}}</div>
                <div class="cell3">{{$ln('成交時間')}}</div>
                <div class="cell4">{{$ln('買/賣')}}</div>
                <div class="cell5">{{$ln('商品名稱')}}</div>
                <div class="cell6">{{$ln('成交口數')}}</div>
                <div class="cell7">{{$ln('成交價')}}</div> 
            </div>
            <div class="flex-col posr flex-1">
                <ScrollBounce :refresh="true" v-stop-propagation  @refresh="onQuery"> 
                    <div ref="reportBody" class="scrolling-x" @scroll="onScroll" @mousedown="onTouchStart" @touchstart="onTouchStart">                      
                        <div v-for="(obj, month) in reportObj" :key="month">                                                  
                            <!-- 展開列 -->
                            <div class="zindex-1 history-row w100p flex-row flex-start font-size-little bgc-black posa hidden-scroll touch-action-none" @click.stop="changeExpand(obj)">
                                <div class="flex-center" >
                                    <i class="material-icons"> {{ obj.monthExpand? "arrow_drop_down":"arrow_drop_up"}}</i>
                                </div>                 
                                <div class="mgl3">{{month}}</div>
                            </div>        
                            <!-- 稱高度 -->
                            <div class="history-row w100p flex-row flex-start font-size-little"></div>                                        
                            <!-- 內容 -->
                            <div @mousedown="onTouchStart" v-show="obj.monthExpand && obj.data" >
                                <div v-for="(report, index) in obj.data" :key="report.EXORD_ID+index" class="flex-row nowrap pdtb1d5 history-report">
                                    <div class="cell0 mgl3">{{Number(index)+1 < 10? '00'+ (Number(index)+1) : Number(index)+1 < 100? '0'+(Number(index)+1): Number(index)+1}}</div>
                                    <div class="cell1">{{ report.EXORD_ID }}</div>
                                    <div class="cell2">{{ report["REPORT_KEY.trans_date"] }}</div>
                                    <div class="cell3">{{ new Date(report.FILL_TIME).time8() }}</div>
                                    <div class="cell4" :class="[report.SIDE==='BUY'?'clr-up':'clr-dn']">{{ SIDE_TEXT(report) }}</div>
                                    <div class="cell5" :class="[report.SIDE==='BUY'?'clr-up':'clr-dn']">{{ symbolName(report) }}</div>
                                    <div class="cell6">{{ report.FILL_QTY }}</div>
                                    <div class="cell7">{{ report.FILL_PRICE }}</div>
                                </div> 
                            </div>                            
                        </div>                        
                        <Stamp v-if="dataList.length===0" :stampStatus="stampStatus" />  
                    </div>
                </ScrollBounce>  
            </div>                      
        </div>  
    </div>    
</template>

<script>

export default {
	props: [],
	data() {
		return {
			dateObj: {start: new Date(new Date().getTime() - 1*24*60*60*1000).day8(), end: new Date().day8()},
			// 查詢日數
			rangeDay: 90,
            result: {},
            // 欄位
            column: [],
            // 資料
            dataList: [],
            // 整理過後的成交資料
            filledReportList: [],
            // 成交資料按造月份分類
            reportObj:{},
            touchingEl: 0
        }
	},
	created() {},
	beforeMount() {
	},
    mounted() {
        this.$emit('title', '歷史成交');
        this.result = M4C.HistoryQuery.query('FILL', this.dateObj.start, this.dateObj.end);
    },
	beforeDestroy() {},
	components: {},
    methods: {
        // 展開收起月份
        changeExpand(obj){
            obj.monthExpand = !obj.monthExpand;
        },
        onQuery(){
            let end = this.$formatDate(this.dateObj.end);
            let start = this.$formatDate(this.dateObj.start);
            // 最長設定90天
            let startLimit = new Date(new Date(end).getTime() - this.rangeDay*24*60*60*1000).day8();
            // 天數大於90天的將開始時間設為90天前
            if(start < this.$formatDate(startLimit)) {
                this.dateObj.start = startLimit;
                this.$refs.historyDate.startDay = this.$formatDate(startLimit);
            }
            this.dataList = [];
            this.result = M4C.HistoryQuery.query('FILL', this.dateObj.start, this.dateObj.end);
        },
        SIDE_TEXT(obj){
			return this.$ln(obj.SIDE==='BUY' ? '买' : '卖');
        },
        symbolName(obj) {
			return M4C.Symbol.getContractName(obj.SYMBOL);
		},
        // 將dataList整理成JSON的格式
        getFilledList(){
            let filledList = [];
            this.dataList.forEach(list=>{
                let obj = {};
                for (let i = 0; i<list.length;i++){
                    obj[this.column[i]]= list[i];
                }
                filledList.push(obj);
            })
            this.filledReportList = filledList;
            this.getFilledReportObj();
        },
        // 讓資料依造月份分類，並排序
        getFilledReportObj(){
            let reportObj = {};
            let filledReportList = this.filledReportList;
            filledReportList.sort((a , b)=> a["FILL_TIME"] - b["FILL_TIME"]);
            filledReportList.forEach(obj => {
                let month = new Date(obj["FILL_TIME"]).day6();
                if(!reportObj[month]){
                    reportObj[month] = {monthExpand: true , data: []};                
                }
                reportObj[month].data.push(obj);
            });
            this.reportObj = reportObj;  
        },
        onScroll(e) {
			// 避免觸發回來
			if (e.currentTarget != this.touchingEl)
				return;
			this.$refs.reportHead.scrollLeft = this.$refs.reportBody.scrollLeft;
		},
        onTouchStart(e){
            this.touchingEl = e.currentTarget;
        },
    },
	watch: {
        'result.$STATUS': function(nv) {
			if (nv === "DONE") {
				let data = this.result.data;
				if (data && data.d && data.$CD == 0) {
					this.column = this.result.data.d.COLUMN;
					this.dataList = this.result.data.d.DATA;
                    this.getFilledList();
				}
			}
		},
    },
    computed: {
        $formatDate() {return this.$store.state.fn.$formatDate;},     
        stampStatus() {return this.result.$STATUS;},
    },
}
</script>

<style scoped>
.posf {
    position: fixed;
}
.query-btn {
    background-color: #333333;
}
.history-report .cell0{ min-width: 15vw;}
.history-report .cell1{ min-width: 24vw;}
.history-report .cell2{ min-width: 25vw;}
.history-report .cell3{ min-width: 24vw;}
.history-report .cell4{ min-width: 15vw;}
.history-report .cell5{ min-width: 26vw;}
.history-report .cell6{ min-width: 20vw;}
.history-report .cell7{ min-width: 25vw;}

.history-row {
	height: 34px;
	min-height: 34px;
    align-items: center;
}
.history-content{
    height: 100% ;
    background-color: #111820;
}
</style>