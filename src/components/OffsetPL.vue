<template>
	<div class="OffsetPL-ctn flex-col">
		<div class="flex-col clr-gray">
            <div class="flex-row setting-line flex-start">
                <DatePick v-model="dateObj" class="flex-row flex-1 sys-bgc divider btn-default-ht-rd iceben mgr4"/>
                <Button class="mgtb5 pdlr5 clr-gray btn-default-ht-rd iceben query-btn nowrap" @click="onQuery">{{$ln(`查询`)}}</Button>
            </div>
            <div class="flex-row setting-line flex-start flex-wrap">
				<div class="filter-select-ctn w20vw mgr2">
					<SingleSelect :options="filterOptionList" v-model="filterKey" :isFit="true" v-if="filterOptionList.length"
						class="btn-default-ht-rd iceben currency-btn" />
				</div>
				<div class="currency-select-ctn w30vw">
					<SingleSelect :options="currencyOptionList" v-model="currency" :isFit="true" v-if="currencyOptionList.length"
						class="btn-default-ht-rd iceben currency-btn" />
				</div>
                <div class="flex-end flex-1 font-size-small">
                    <span class="pdr1 nowrap">{{`${$ln('試算')} :`}}</span>
                    <span :class="$clr0($OffsetPLTrial)" class="nowrap">
						{{`${$OffsetPLTrial < 0? '-': '+'}`}}
						<span class="underline">{{Math.abs($OffsetPLTrial)}}</span>
					</span>
                </div>
            </div>
		</div>
        <div class="flex-row title pd2 bgc-2A clr-gray2">
            <div class="cell2 bs-totale-qty flex-center flex-1">{{$ln('买/卖')}}</div>
            <div class="cell3 fee-sum flex-center flex-1">{{$ln('手续费')}}</div>
            <div class="cell4 tax-sum flex-center flex-1">{{$ln('交易税')}}</div>
            <div class="cell5 npl-sum flex-end flex-1">{{$ln('净损益')}}</div>
        </div>
		<div class="flex-1 posr">
			<ScrollBounce class="FULL" v-stop-propagation-y>
                <OffsetPLCard v-for="(offset, idx) in dataList" :key="idx" :record="offset" :exchange="exchange" @cardClick="onCardClick" />
				<Stamp v-if="offsetRecordDataList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
	</div>
</template>
<script>
import OffsetPLCard from '@/components/OffsetPLCard';
import OffsetPLTableList from "@/components/OffsetPLTableList.vue";
export default {
	data() {
		return {
			// 查詢區間
			dateObj: {start: "20210520", end: "20210525"},
			// 預設查詢30天資料
			rangeDay: 30,
			dataList: {},
			/** 查詢已平倉記錄狀態 */
			queryOffsetRecordResult: {},
			// 目前只有台灣版有平倉損益，因此預期TWD幣別
			currency: 'TWD',
			// 國內、外過濾key
			filterKey: "ALL",
		}
	},
	components: {OffsetPLCard, OffsetPLTableList},
	created() {
		// 設定起訖時間
		this.dateObj.end = new Date().day8();
		this.dateObj.start = new Date(new Date().getTime() - this.rangeDay*24*60*60*1000).day8();
	},
	beforeMount() {
		// 取匯率表
		M4C.Symbol.sendSymbolGetCurreny();
		// 查詢已平倉記錄狀態
		this.onQuery();
	},
	mounted() {},
	methods: {
		// 查詢平倉明細資料
		onQuery() {
			let _dateObj = {}
			_dateObj['start'] = this.$formatDate(this.dateObj.start);
			_dateObj['end'] = this.$formatDate(this.dateObj.end);
			// 查詢已平倉記錄狀態
			this.queryOffsetRecordResult = M4C.Position.queryOffsetRecord(_dateObj);
		},
		onCardClick(record) {
			eventBus.$emit("POPUP-DIALOG", OffsetPLTableList, {record: record, dateObj: this.dateObj}, {transName: 'float'});
		},
		// 處理資料清單
		handleDataList() {
			this.dataList = {};
			this.offsetRecordDataList.forEach((obj,idx) => {
				// 依商品代碼分類
				if(!this.dataList[obj.SYMBOL])
					this.$set(this.dataList, obj.SYMBOL, []);
				this.dataList[obj.SYMBOL].push(obj);
			});
		}
	},
	watch: {
		suspend(nv) {
			if (!nv) {
				// 查詢已平倉記錄狀態
				this.onQuery();
			}
		},
		// 原始、過濾後資料有變動時，處理資料清單
		offsetRecordDataList(nv) {
			if(!nv.length)
				this.dataList = {};
			else {
				this.handleDataList();
			}
		}
	},
	computed: {
		// 格式化日期 將20220427轉成2022-04-27
		$formatDate() {return this.$store.state.fn.$formatDate;},
		$clr0() {return this.$store.state.fn.$clr0;},
        // 幣別選單(依匯率取得)
		currencyOptionList() {
			let list = [];
			this.offsetCurrentcyOptionList.forEach(obj=> {
				// 有mapping到匯率資料才整理
				if(this.$xRateDataList[obj.value]){
					list.push(JSON.parse(JSON.stringify(obj)));
				}
			});
			return list;
		},
		// 當前選取的幣別匯率
		exchange() {try{return this.$xRateDataList[this.currency];}catch(e){return '';}},
		// 匯率表資料清單
		$xRateDataList() {return this.$store.state.data.xRate;},
        // 已平倉損益試算
        $OffsetPLTrial() {
            let sum = 0;
            this.offsetRecordDataList.forEach(rec => {
				// 總費用
				let totalFee = Number(rec.OPEN_FEE) + Number(rec.OFFSET_FEE);
				// 總手續費
				let totalTax = Number(rec.OPEN_TAX) + Number(rec.OFFSET_TAX);
				// 依匯率轉換淨損益
				let _purePL = this.$exchageTrial(rec.CURRENCY, this.currency, this.$safeFloat(rec.REALIZED_DAILY_PL - totalFee - totalTax));
				this.$set(rec, '$_purePLbyCurrency', _purePL);
				// 是數字才做加總
				if(!isNaN(_purePL))
                	sum += _purePL;
            });
			// 取小數2位
			return parseFloat(sum).toFixed(2);
        },
		// 狀態章
		stampStatus() {
			return this.queryOffsetRecordResult.$STATUS;
		},
		// 平倉記錄資料清單
        offsetRecordDataList() { 
			let list = [];
			// 全部=>不做過濾，直接使用原始資料
			if(this.filterKey == "ALL") return M4C.Position.offsetRecordData;
			// 依國內、外過濾資料
            M4C.Position.offsetRecordData.forEach(obj=>{
				if(this.filterKey === 'IB' && obj.SYMBOL.indexOf("TWF") != -1) {
					list.push(obj);
				}
				else if((this.filterKey === 'OB' && obj.SYMBOL.indexOf("TWF") < 0)) {
					list.push(obj);
				}
			});
			return list;
        },
		offsetFilterOptionList(){
			try {return this.$store.state.config.CONFIG.offset_filterOptionList;} catch (e) {return [];}
		},
		// 國內、外過濾選單
		filterOptionList(){
			let list = this.offsetFilterOptionList;	
			// 不存在公開設定時，預設含有國內跟國外
			if(!list||list.length == 0) {
				return [{label: "全部", value: "ALL"},{label: "國內", value: "IB"},{label: "國外", value: "OB"}];
			}else if(list.length == 1) {return list;}
			// 有複數類別時 帶出全部類別
			else if(list.length > 1){
				return list.unshift({label: "全部", value: "ALL"});
			}
		},
		// 計算匯率
		$exchageTrial() {return this.$store.state.fn.$exchageTrial;},
		// 公開設定的匯率幣別選單
		publicCurrencyOptionList() {
			try{return this.$store.state.config.CONFIG.offset_CurrencyOptionList;} catch(e){return [];}
		},
		// 取匯率幣別選單
		offsetCurrentcyOptionList() {
			// 有公開設定的資料
			if(this.publicCurrencyOptionList && this.publicCurrencyOptionList.length)
				return this.publicCurrencyOptionList;
			else
				// 取資金幣別選單
				return this.$store.state.status.currencyOptionList;
		},
	},
}
</script>
<style scoped>
.setting-line {padding: 0 3vw;}
.iceben.query-btn {background-color: #333333;}
/deep/ .offsetdpl-card-ctn:nth-child(odd) {
    background-color: #17202A;
}
.OffsetPL-ctn /deep/ .single-select-ctn .select-btn {
	border-color: #045182;
}
</style>