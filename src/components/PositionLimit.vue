<template>
	<div class="position-limit-ctn flex-col">
        <!-- 搜尋 -->
        <div class="search-input-ctn flex-center pd5">
            <input ref="searchInput" :class="{'search-pdl': searchText===''}" class="font-size-big search-input clr-white pdtb3 pdlr2 rd1" v-model="searchText" type="text" :placeholder="$ln(`请输入关键字`)">
            <i class="material-icons search-icon" v-if="searchText===''">search</i>
            <i class="material-icons clear-icon" v-if="searchText!==''" @click="searchText=''">clear</i>
        </div>
		<!-- 特定持倉清單資料 -->
        <div class="table-ctn flex-1 posr">
            <QuoteTableX :param="{column: showList, dataList: filterDataList, noFixedLeft: true, stampStatus:stampStatus}" @refresh="onRefresh" />
        </div>
	</div>
</template>
<script>
import QuoteTableX from "@/components/QuoteTableX.vue";
export default {
	data() {
		return {
            searchText: '',
			 showList: [
                {key: 'serial', label:'序號', show: 1, noSort: true, contentClass: "text-align-center cell1"},
                {key: 'EXCHANGE_NAME', label:'交易所', show: 1, noSort: true, contentClass: "text-align-center cell2"},
                {key: 'COMMODITY_ID', label:'标的代号', show: 1, noSort: true, contentClass: "text-align-center cell2"},
                // 因設計稿沒有加入標的名稱因此註解
                // {key: 'COMMODITY_NAME', label:'标的名称', show: 1, noSort: true, contentClass: "text-align-center cell2"},
                {key: 'AVAILABLE_CALL_LIMIT', label:'可用开CALL仓限额', show: 1, noSort: true, contentClass: "text-align-right cell3", tdClass: "pdr2"},
                {key: 'AVAILABLE_OPEN_LIMIT', label:'可用开仓限额', show: 1, noSort: true, contentClass: "text-align-right cell3", tdClass: "pdr2"},
                {key: 'AVAILABLE_TOTAL_LIMIT', label:'可用总持仓限额', show: 1, noSort: true, contentClass: "text-align-right cell3", tdClass: "pdr2"},
                {key: 'CALL_LIMIT', label:'开CALL仓限额', show: 1, noSort: true, contentClass: "text-align-right cell3", tdClass: "pdr2"},
                {key: 'OPEN_LIMIT', label:'开仓限额', show: 1, noSort: true, contentClass: "text-align-right cell3", tdClass: "pdr2"},
                {key: 'TOTAL_LIMIT', label:'总持仓限额', show: 1, noSort: true, contentClass: "text-align-right cell3", tdClass: "pdr2"},
            ],
            param: {},
            dataList: [],
		}
	},
    components: {
        QuoteTableX,
    },
	beforeMount() {
        // 查詢持倉限額資料
		M4C.Position.queryPositionLimit();
	},
    mounted() {},
    methods: {
        // 重查持倉限額資料
        onRefresh() {M4C.Position.queryPositionLimit();},
    },
    watch: {},
	computed: {
        // 查詢狀態
        stampStatus() {
            return this.$store.state.result.queryPositionLimitResult.$STATUS;
        },
        // 持倉限額資料
		positionLimitData() {
			return this.$store.state.data.positionLimitList;
		},
        // 根據關鍵字過濾後的清單。
        filterDataList() {
            let list = [];
            this.processedData.forEach((data) => {
                if(this.searchText && data.$searchText.indexOf(this.searchText) != -1){
                    list.push(data);
                }
                else if(this.searchText === ''){
                    list.push(data);
                }
            });
            return list;
        },
        // 將持倉限額資料建立關鍵字、序號
		processedData() {
            let list = [];
            this.positionLimitData.forEach((data, id) => {
                // 製作序號
                data['serial'] = id;
                // 製作搜尋內容關鍵字
                data['$searchText'] = Object.values(data).toString();
                list.push(data);
            });
            return list;
		},
	}
}
</script>
<style scoped>
.search-icon {
	position: absolute;
	left: 1.2em;
	color: gray;
}
.clear-icon {
	position: absolute;
	right: 1.2em;
}
.search-input {
	border: 1px solid #2F3133;
	width: 100%;
	background-color: rgba(0,0,0,0);
}
.search-pdl {
	padding-left: 2em;
}
.table-ctn /deep/ .quote-table-X-list-ctn .cell1 { 
    min-width: 4em !important;
    width: 4em;
}
.table-ctn /deep/ .quote-table-X-list-ctn .cell2 { 
    min-width: 7em !important;
    width: 7em;
}
.table-ctn /deep/ .quote-table-X-list-ctn .cell3 { 
    min-width: 9em !important;
    width: 9em;
}
.table-ctn /deep/ .th {
    padding: 0 2vw;
    white-space: initial;    
}
</style>