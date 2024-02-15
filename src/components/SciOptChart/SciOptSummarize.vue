<template>
    <div class="summarize-ctn flex-col">
        <!-- 資料加總呈現區 -->
        <div class="summary-result-block-ctn flex-wrap flex-center posr">
			<SciOptChart ref="sciChart" class="flex-1" :colorList="storkeColorList"/>
            <Stamp v-if="!monthList.length" stampStatus="NO_DATA" :ignoreLogin="true" />
        </div>
        <!-- 清單資料 -->
        <div class="table-ctn flex-1 posr" :class="'no-fixed-label'">
            <QuoteTableX :param="param" @checkAll="onCheckAll" @itemCheck="onItemCheck" />
            <Stamp v-if="!monthList.length" stampStatus="NO_DATA" :ignoreLogin="true" />
        </div>
    </div>
</template>
<script>
import QuoteTableX from "@/components/QuoteTableX.vue";
import SciOptChart from "@/components/SciOptChart/SciOptChart.vue";

export default {
    data() {
        return {
            showList: [
                {key: 'MONTH', label:'月份', show: 1, noSort: true, contentClass: 'flex-start flex-1', headClass: 'flex-start flex-1'},
                {key: 'ExpireDAYS', label:'到期天数', show: 1, noSort: true, contentClass: 'flex-center flex-1', headClass: 'flex-center flex-1'},
                // {key: 'IV', label:'IV', show: 1, noSort: true, contentClass: 'flex-center flex-1', headClass: 'flex-center flex-1'},
            ],
            param: {
				fixedLabel: "",
			},
            checkList: [],
            // 預設顏色清單
            colorList:["#FF1111", "#11FF11", "#11BBFF", "#FFFF11", "#FF11FF", "#FFAABB", "#AAFFBB", "#4488BB", "#8844BB", "#BB8844", "#44BB88", "#636363"],
        }
    }, 
    props: [],
    components: {QuoteTableX, SciOptChart},
    beforeMount(){
        // 設定勾選清單
        this.monthList.forEach((m)=>{
            if(this.checkList.length < this.smileCurveDefaultQty)
                this.checkList.push({sid: m});
        });
        // 顯示表格清單資料
        this.param.expandList = this.monthList.map((m, idx)=>({sid: m, MONTH: m, ExpireDAYS: this.getExpireDays(m), color: this.colorList[idx]}));
        // 顯示表格欄位設定資料
        this.param.showList = this.showList;
        // 顯示表格設定非行情顯示
        this.param.noQuoteCol = true;
        // 顯示表格設定勾選UI顯示
        this.param.isCheckItem = true;
        this.param.noFixedText = true;
        // 顯示表格勾選清單(響應)
        this.$set(this.param, 'checkList', this.checkList);
    },
    methods: {
        /** 全選商品 */
        onCheckAll(T) {
            // 清空勾選清單
            this.checkList.splice(0);
            // 全選
            if(T) {
                this.monthList.forEach(pos => {
                    this.checkList.push({sid: pos});
                });
            }
        },
        /** 勾選商品 */
        onItemCheck(sid) {
            // 勾選目標索引
            let checkIdx = this.checkList.findIndex(itm=>(itm.sid == sid));
            // 更新勾選清單
            if(checkIdx < 0) {
                let obj = this.monthList.find(pos=>(pos == sid));
                this.checkList.push({sid: obj});
            }
            else
                this.checkList.splice(checkIdx, 1);
        },
		// 取期權call第一檔覆約價
		getSymbol(m) {
			let sid = this.contracts[m].C[0];
			return sid;
		},
		// 取距離到期日天數
		getExpireDays(m) {
			return M4C.Symbol.getRemainDays(this.getSymbol(m)) + this.$ln('天');
		},
    },
	watch: {
		checkList: {
			handler(nv, ov) {
				this.$store.state.data.scichartOptionList = nv.map(m=>(`${this.sid}.${m.sid}`));
                this.$store.state.data.sciChartSmileCurveDefaultQty = nv.length;
			},
			deep: true,
		}
	},
    computed: {
		sid() {return this.$store.state.opt.selectedSymbol;},
		contracts() {return this.$store.state.opt.contracts;},
		monthList() {
			let contracts = JSON.parse(JSON.stringify(this.contracts));
			// 移除熱門月
			delete contracts.HOT;
			let list = Object.keys(contracts);
            // 依日期排序
            list.sort((a,b)=>(Number(a.substr(0,6) - Number(b.substr(0, 6)))));
			return list;
		},
        // 線圖的顏色清單
        storkeColorList() {
            let list = [];
            // 依選取項目取顏色
            this.checkList.forEach(obj => {
                let checkedObj = this.param.expandList.find(li=>(li.sid === obj.sid));
                list.push(checkedObj.color);
            });
            return list;
        },
        // 波動率線圖預設取得月份數量
        smileCurveDefaultQty() {return this.$store.state.data.sciChartSmileCurveDefaultQty;},
    },
}
</script>
<style scoped>
.summary-result-block-ctn {
    min-height: 55%;
}
.item-ctn {
    min-width: 30vw;
}
.table-ctn /deep/ .checked i {
    background-color: white;
    border-color: white;
}
.table-ctn /deep/ .thead .thead-scroll-x-ctn .th, .table-ctn /deep/ .tbody .tbody-scroll-x-ctn .td {
    width: 50%;
    min-width: 50%;
    justify-content: center;
}
.table-ctn /deep/ .thead .thead-scroll-x-ctn .th:first-child, .table-ctn /deep/ .tbody .tbody-scroll-x-ctn .td:first-child {
    justify-content: start;
}
.table-ctn /deep/ .thead-fixed-x-ctn.th, .table-ctn /deep/ .tbody-fixed-x-ctn, .table-ctn /deep/ .tbody-fixed-x-ctn .td{
    min-width: 33vw;
}
.no-fixed-label /deep/ .thead-fixed-x-ctn.th, .no-fixed-lable /deep/ .tbody-fixed-x-ctn .td, 
.no-fixed-label /deep/ .tbody-fixed-x-ctn, .no-fixed-label /deep/ .tbody-fixed-x-ctn .td{
	width: 3em;
    min-width: 3em;
	border-width: 0;
}
.no-fixed-label /deep/ .thead-scroll-x-ctn .fit-content, .no-fixed-label /deep/ .tbody-scroll-x-ctn .fit-content{
	width: auto;
}
.no-fixed-label /deep/ .quote-table-tr>div{width: 100%;}
</style>