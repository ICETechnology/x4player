<template>
	<div class="symbol-greeks-parameter flex-col pdtb5 flex-1 mg5">
		<div class="flex-col pd2 symbol-ctn flex-start">
			<!-- 合約名稱 -->
			<PositionCardSDName :sid="sid" class="w100p posCardSDName" />
			<!-- 實虛/剩餘天數 -->
			<PositionCardExtraInfo :sid="sid" class="w100p" />
		</div>
		<div class="list-block flex-col flex-1">
			<table class="w100p">
				<tr class="title-row flex-start clr-gray2 ht1">
					<th class="col-title flex-1 flex-start">{{$ln('项目')}}</th>
					<th class="col-content flex-center pdlr1">{{$ln('内容')}}</th>
				</tr>
			</table>
			<div class="flex-1 w100p posr tbody-ctn">
				<ScrollBounce class="FULL" v-stop-propagation-y>
					<table class="flex-col">
						<tr class="flex-start content-row font-size-small ht1" v-for="(obj, idx) in showList" :key="idx">
							<td class="col-title flex-1 flex-start pdl4">{{$ln(obj.label)}}</td>
							<td class="col-content flex-center pdlr1">{{getContent(obj.key)}}</td>
						</tr>
					</table>
				</ScrollBounce>
			</div>
		</div>
		<div class="flex-bottom pdlr4">
			<Button class="close-btn w100p ht2 rd1 clr-white"  @click="onCloseClick">{{$ln("确认")}}</Button>
		</div>
	</div>
</template>
<script>
import PositionCardSDName from '@/components/PositionCardSDName';
import PositionCardExtraInfo from '@/components/PositionCardExtraInfo';

export default {
	data() {
		return {
			showList: [
                {key: 'tmp', label:'标的中间价'},
                {key: 'mp', label:'期权中间价'},
                {key: 'miv', label:'隐含波动率'},
                {key: 'tx', label:'距离下市时间占每年比率(自然日)'},
                {key: 'tdtx', label:'距离下市时间占每年比率(交易日)'},
                {key: '$AOD', label:'美式期权天数'},
                {key: '$AO', label:'计算美式用Greeks偏移值'},
                {key: '$delta', label:'Delta'},
                {key: 've', label:'Vega'},
                {key: 'ga', label:'Gamma'},
                {key: 'th', label:'Theta'},
                {key: 'rh', label:'Rho'},
            ],
			qo: {},
		}
	},
	props:["param"],
	components: {PositionCardSDName, PositionCardExtraInfo},
	beforeMount() {
		this.qo = Object.assign({}, M4C.Quote.getQuoteObject(this.sid));
	},
	methods: {
		// 關閉視窗
		onCloseClick() {eventBus.$emit("CLOSE-FLOAT-DIALOG");},
		// 取資料內容
		getContent(key) {
			// 組件計算的資料 > 行情欄位資料 > 無資料
			return this[key] || this.qo[key] || "--";
		}
	},
	computed: {
		sid() {
			// 取外層代入的sid，預設已選取的商品。
			try {
				return this.param.sid;
			} catch(e) {
				return this.$store.state.selectedSymbol.ID;
			}
		},
		$delta() {
			// 因quote給的delta需要另外除100，因此另外處理。
			return this.$safeFloat(this.qo.de * 0.01);
		},
		$AOD() {
			// 取行情pdsetting的greeks資料中的american_option_days，預設300天。
			try {
				return this.$store.state.config.quotePdSetting.greeks.american_option_days;
			} catch(e) {
				return 300;
			}
		},
		$AO() {
			// 取行情pdsetting的greeks資料中的american_offset，預設0.01。
			try {
				return this.$store.state.config.quotePdSetting.greeks.american_offset;
			} catch(e) {
				return 0.01;
			}
		},
	},
}
</script>
<style scoped>
.symbol-greeks-parameter {
	width: 93vw;
	min-height: 75vh;
	/* max-height: 80vh; */
	background-color: #17202A;
    border-radius: 0.5em;
}
.title-row {
	background-color: #2A2A2A;
}
.title-row .col-title {
	padding-left: 2em;
}
.content-row:nth-child(odd){
	background: #111820;
}
.close-btn {
	background-color: #0065A4;
}
.col-content {
	min-width: 30%;
}
</style>