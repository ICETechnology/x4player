<template>
	<div class="Exercise-ctn flex-1 flex-col pdlr5">
		<div class="symbolRow-bdb1 flex-row pdb5">
			<span  class="flex-1 flex-center">
				<SymbolCNM4 :sid="sid" nameFontSize="font-size-xl" />
			</span>
			<span  class="flex-1 flex-start pdl3">
				<SymbolMiniQ :symbol="sid" />
			</span>
		</div>
		<!-- 123-->
		<div class="content-ctn flex-col pdl3">
			<div class="flex-row flex-center row-ctn" v-if="enableCombineExercise">
				<Radio v-model="type" class="flex-row flex-1 switch-btn">
					<span value="Exercise" class="flex-1">{{$ln('行权')}}</span>
					<!-- 顯示組合行權必須是純選擇權帳號) -->
					<span value="collection" class="flex-1">{{$ln('组合行权')}}</span>
				</Radio>
			</div>
			<div class="flex-1 flex-col">
				<div class="flex-row row-ctn flex-center" v-if="type==='Exercise'">
					<span class="label font-size-small">{{$ln('合约')}}</span>
					<div class="flex-1 flex-row block-ctn pdl4 nowrap">
						{{`${getContractText(sid)}(${remainDays} ${$ln('天')})`}}
					</div>
				</div>
				<div class="flex-col" v-if="type==='collection'">
					<div class="flex-row row-ctn flex-vertical-center">
						<span class="label font-size-small">{{$ln('合约')}}</span>
						<SingleSelect :options="opt1List" v-model="sid" componentClass="SymbolCNM4" classKey="sid" classVal="value" class="flex-1 ss-btn pdl4 opt1List nowrap" :class="{'no-opt1Contracts flex-center': !opt1List.length}"/>
					</div>
					<!-- 須從第一隻腳商品過濾出同商品的call或put(1call、1put且call<put才成立)  -->
					<div class="flex-row row-ctn flex-vertical-center">
						<span class="label font-size-small">{{$ln('合约')}}</span>
						<span v-if="!opt2List.length" class="flex-center flex-1 no-contracts mgl4">{{$ln('无可配对合约')}}</span>
						<SingleSelect v-if="opt2List.length" :options="opt2List" v-model="symbol2" componentClass="SymbolCNM4" classKey="sid" classVal="value" class="flex-1 ss-btn pdl4 nowrap" />
					</div>
				</div>
				<div class="flex-row row-ctn" v-if="false">
					<div class="flex-1 flex-col" v-if="(qo && (qo.$cd > 0)) && (type == 'Exercise')">
						<!-- 最新價 -->
						<div class="flex-1 flex-start font-size-big font-bold" :class="[qo.$clr]">{{$symbolPrice(sid, qo.p)}}</div>
						<!-- 漲跌 (漲跌幅%) -->
						<div class="flex-1 flex-start nowrap" :class="[qo.$clr]">{{$symbolChgTxt(qo)}}</div>
					</div>
					<span class="label flex-end flex-1" v-if="remainDays !=0 ">{{`${$ln('行权日剩馀')} ${remainDays} ${$ln('天')}`}}</span>
					<span class="label clr-warn flex-end flex-1" v-if="remainDays ==0 ">{{`${$ln('今日行权日')}`}}</span>
				</div>
				<div class="flex-col" v-if="type==='Exercise'">
					<div class="row-ctn flex-row flex-1 flex-vertical-center">
						<span class="label font-size-small">{{$ln('总手数')}}</span><span class="flex-1 block-ctn pdl4">{{positionData.$BQTY}}</span>
					</div>
					<div class="row-ctn flex-row flex-1d5 flex-vertical-center">
						<span class="label font-size-small">{{$ln('已申请行权手数')}}</span><span class="flex-1 block-ctn pdl4">{{exerciseQty}}</span>
					</div>
				</div>
				<div class="flex-row row-ctn flex-center">
					<span class="label font-size-small">{{$ln('行权数量')}}</span>
					<InputQty v-model="inputQty" :min="0" :max="offsetTableBuyQty" class="flex-1 mgr3" :disable="!offsetTableBuyQty" />
					<span>/ {{offsetTableBuyQty}}</span>
				</div>
			</div>
		</div>
		<!-- 上期所、INE商品增加今、昨倉的平倉選項-->
		<div class="ShfeOrIne-radio-ctn flex-row" v-if="isShfeOrIne">
			<Radio v-model="shfeOrInePositionEffect" class="ShfeOrIne-radio">
				<span value="CTD">
					<i class="material-icons">{{shfeOrInePositionEffect=="CTD"? "radio_button_checked": "radio_button_unchecked"}}</i>
					<span class="mgl3">{{ $ln('今仓') }}</span>
				</span>
				<span value="CYD">
					<i class="material-icons">{{shfeOrInePositionEffect=="CYD"? "radio_button_checked": "radio_button_unchecked"}}</i>
					<span class="mgl3">{{ $ln('昨仓') }}</span>
				</span>
			</Radio>
		</div>
		<div class="flex-1 flex-col">
			<div class="row-ctn flex-center" v-if="type == 'Exercise' && inputQty">{{getComment}}</div>
			<div class="PL-msg-ctn row-ctn flex-center clr-warn" v-if="checkPL && (type == 'Exercise') && inputQty">{{$ln('委托後可能产生亏损!')}}</div>
		</div>
		<div class="flex-col flex-center">
			<div class="description-by-exg-ctn flex-1 mgtb5" >{{getWordding()}}</div>
			<div class="mgb10 flex-row flex-center" >
				<Button class="font-size-big btn-cancel mgr2" v-if="!isNoCancel" :class="{disabled: disableCancel}" @click="onCancel" >{{$ln('放弃')}}</Button>
				<Button class="font-size-big btn-confirm mgl3" :class="{disabled: disableExec}" @click="onExec" >{{$ln('执行行权')}}</Button>
			</div>
		</div>
	</div>
</template>
<script>
import QuoteAgent from '@/components/QuoteAgent';
export default {
	mixins: [QuoteAgent],
	data() {
		return{
			type: "Exercise",
			inputQty: 1,
			sid: "",
			symbol1: "",
			opt1List: [],
			symbol2: "",
			opt2List: [],
			ContractsMap: [],
			shfeOrInePositionEffect: "",
		}
	},
	props: ["param",],
	beforeMount(){
		let posList = this.$store.state.data.normalPositionSumList.map(pos=>pos.SYMBOL);
		M4C.Exercise.queryMkt(posList);
		this.sid = this.param.sid;
		// 取消提示訊息(因有案例，會收到非下市期權商品，但沒有設定總表資料的情境。ex浙商仿真環境->浙商生產環境)
		// if(isNaN(this.remainDays))
		// 	this.$store.state.notify(`error`, `非可行权商品`);
			
		this.inputQty = this.offsetTableBuyQty? 1: 0;
	},
	beforeDestroy(){},
	computed: {
		// 支持從 vuex 的 pdsetting.broker.combine_execution 取得啟用、禁用組合行權參數
		enableCombineExercise() {
			if(this.combineExerciseExgList)
				return this.combineExerciseExgList.indexOf(M4C.Symbol.getExchangeName(this.sid)) >= 0;
		},
		// 有支援組合行權命令的交易所(由SERVER的pdsetting設定。)
		combineExerciseExgList(){
			return this.$store.state.config.tradePdSetting.broker.combine_execution_exchange;
		},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		$symbolChgTxt() {return this.$store.state.fn.$symbolChgTxt;},
		// 個股除權息商品判斷
		setPRIADJ() {
			let minfo = M4C.Symbol.getMainformInfo(this.sid);
			return minfo ? (minfo.SetPRIADJ || '') : '';
		},
		// 計算行權到期後預計可得數量
		getAllQty() {
			// 商品期權
			if(M4C.Symbol.isCommodityOptions(this.sid)) return this.inputQty;
			// 個股除權息10145股
			else if(this.setPRIADJ) {return this.$safeFloat(this.inputQty * 10145);}
			// 一般個股10000股
			else return this.$safeFloat(this.inputQty * 10000);
		},
		// 回傳行權內容說明
		getComment() {
			// 依第一隻腳sid取總表資料
			let minfo = M4C.Symbol.getMainformInfo(this.sid);
			// 取期權的underliying資料。
			let underlying = minfo.Underlying;
			// 如果沒有資料就不顯示。(防錯)
			if(!underlying) return;
			// 依是否為商品期權取期貨sid或個股sid。
			let symbolName = M4C.Symbol.isCommodityOptions(this.sid)? M4C.Symbol.getContractName(underlying.F): M4C.Symbol.getContractName(underlying.S);
			// 多方持仓才可行权，行权後
			// 看跌期权(put)行权后应该 是空头，看涨期权(call)行权后应该是多头
			let bsText = M4C.Option.getCallPut(this.sid) === 'C'? "多头": "空头";
			let str = `${this.$ln('当日结算后, 将可获得')}, ${symbolName}${this.$ln(bsText)}${this.getAllQty}${this.$ln(M4C.Symbol.isCommodityOptions(this.sid)?'手': '股')}, 
						${this.$ln('成本价为')}${M4C.Option.getStrike(this.sid)}`;
			return str;
		},
		// 確認損益
		checkPL(){
			let price1 = Number(M4C.Option.getStrike(this.sid));
			return M4C.Option.getCallPut(this.sid)=="C"? this.qo.p > price1: this.qo.p < price1;
		},
		// 第二隻腳清單(同商品且CP不同，call價位必須小於put價位)
		secOpts(){
			let self = this;
			return this.opt1List.filter(opt => {
				let secFootSid = this.getSecFootSid(self.sid).split('.').slice(0,6).join('.');
				let price1 = Number(M4C.Option.getStrike(self.sid));
				let price2 = Number(M4C.Option.getStrike(opt.value));
				let price1CP = M4C.Option.getCallPut(self.sid);
				let price2Weight = M4C.Symbol.getMainformInfo(opt.value).Weight;
				let priceCheck = false;
				// call價位必須小於put價位
				if(price1CP == "C" && price1 < price2 || price1CP == "P" && price1 > price2)
					priceCheck = true;
				let sameWeight = price2Weight == this.symbol1Weight;
				let qty = M4C.Exercise.availableQtyMap[self.sid];
				let qty1 = M4C.Exercise.availableQtyMap[opt.value];
				// 同商品且CP不同、call小於put、可行權數量>0 && 同權重
				return (opt.value.indexOf(secFootSid) != -1) && priceCheck && sameWeight;// && (qty > 0) && (qty1 > 0);
			});
		},
		positionData: function(){
			return this.$store.state.data.normalPositionSumList.find(pos => pos.SYMBOL == this.sid);
		},
		// 可平口數
		offsetTableBuyQty() {
			if(this.type == "Exercise" && this.positionData)
				return Number(this.positionData.OFFSETABLE_BUY_QTY);
			// 組合行權時取兩份合約的最小可平口數。
			if(this.type == "collection" && this.symbol2PosData)
				return Math.min(Number(this.positionData.OFFSETABLE_BUY_QTY), Number(this.symbol2PosData.OFFSETABLE_BUY_QTY))
			else
				return 0;
		},
		availableQty(){
			return M4C.Exercise.availableQtyMap[this.sid];
		},
		exerciseQty(){
			return M4C.Exercise.ExerciseQtyMap[this.sid] || 0;
		},
		symbol1Weight(){
			return M4C.Symbol.getMainformInfo(this.sid).Weight;
		},
		symbol2PosData() {
			return this.$store.state.data.normalPositionSumList.find(pos => pos.SYMBOL == this.symbol2);
		},
		symbol2availableQty(){
			return M4C.Exercise.availableQtyMap[this.symbol2];
		},
		//  無放棄行權功能
		isNoCancel(){
			// 放棄行權 => 大商所 or 上交所 or 深交所「不」支援放棄行權
			let noCancelExgList = ['DCE', 'SSE', 'SZSE'];
			let exgId = M4C.Symbol.getExchangeName(this.sid);
			// 目前所支援的組合行權沒有放棄申請功能，所以直接disable
			let isCombine = this.type == "collection";
			// 「不」支援放棄行權交易所 || 組合行權
			return noCancelExgList.indexOf(exgId) >= 0 || isCombine;
		},
		// disable 行權申請
		isNoExec() {
			// 深交所&上交所&中金所只能在行權日行權
			let noExerciseExgList = ['SZSE', 'SSE', 'CFFEX'];
			let exgId = M4C.Symbol.getExchangeName(this.sid);
			let noneExercise = noExerciseExgList.indexOf(exgId) >= 0 &&  this.remainDays> 0;
			// 大商所可在到期日通過行權申請0手實現取消自動行權(行權日可送0手行權申請)
			let isZeroQty = exgId != 'DCE'? this.inputQty == 0: this.remainDays> 0 && this.inputQty == 0;
			return noneExercise || isZeroQty;
		},
		// 經由computed symbol2驅動isNoCollection變數改變。
		combineSymbol2(){return this.symbol2;},
		// 不可組合情境
		isNoCollection() {
			// 無第二隻腳或申請數量是0;
			return this.combineSymbol2 == "" || this.inputQty === 0;
		},
		// 放棄行權無效UI
		disableCancel() {
			// 多方可平持倉為0 || 非行權日 || 手數0 || 上期所、INE沒選今、昨倉
			return this.offsetTableBuyQty == 0 || this.remainDays > 0 || this.inputQty == 0 || !this.shfeOrIneOrderEnabled;
		},
		// 執行行權無效UI
		disableExec(){
			// 沒有數量及第二隻腳或是在非可行權日時就不啟用申請組合功能 || 上期所、INE沒選今、昨倉
			if(this.type == "collection") return this.isNoCollection || this.isNoExec || !this.shfeOrIneOrderEnabled;
			else
				return this.offsetTableBuyQty == 0 ||  this.isNoExec || !this.shfeOrIneOrderEnabled;
		},
		isDce() {
			let exgId = M4C.Symbol.getExchangeName(this.sid);
			return exgId == 'DCE';
		},
		// 大商所商品取消行權判斷
		isDCEAbort() {
			let exgId = M4C.Symbol.getExchangeName(this.sid);
			// 大商所可在到期日通過行權申請0手實現取消自動行權(行權日可送0手行權申請)
			return  this.isDce && this.inputQty == 0 && this.remainDays == 0;
		},
		/** 剩餘有效天數 */
		remainDays() {
			return M4C.Symbol.getRemainDays(this.sid);
		},
		// 判斷上期所、INE商品是否有選擇positionEffect，其他為ture
		shfeOrIneOrderEnabled() {
			if(this.isShfeOrIne) return  this.shfeOrInePositionEffect !== "";
			else return true;
		},
		// 是否為上期所、INE商品
		isShfeOrIne() {
			let exg = M4C.Symbol.getExchangeName(this.sid);
			let isShfeOrIne = exg === "SHFE" || exg === "INE";
			return isShfeOrIne;
		},
		// 委託內容的PositionEffect
		oiPositionEffect() {
			// 非上期所INE商品直接回傳CLOSE
			if(!this.isShfeOrIne) return "CLOSE";
			else {
				return this.shfeOrInePositionEffect;
			}
		},
	},
	watch: {
		sid(nv, ov){
			// 第一隻腳切換時連動第二隻腳選項。
			if(nv != ov){
				this.symbol2 = "";
				// 重新指派第二隻腳的清單($set或Object.assign會連動原資料)。JSON方式雖然可行，但會影響資料內容ex:日期
				this.opt2List = JSON.parse(JSON.stringify(this.secOpts));
				// 查詢已行權數量
				M4C.Exercise.queryExerciseQty(this.sid);
				M4C.Exercise.queryAvailableQty(this.sid);
			}
		},
		// 第二隻腳清單變動 -> 刷新回 this.opt2List 下拉選單 (https://trello.com/c/O5QPxfux)
		secOpts(nv) {
			this.opt2List = JSON.parse(JSON.stringify(nv));
		},
		symbol2(nv, ov){
			if(!nv) return;
			// 查询第二只脚的数量
			M4C.Exercise.queryExerciseQty(nv);
			M4C.Exercise.queryAvailableQty(nv);
		},
		availableQty(nv, ov){
			this.inputQty = nv;
		},
		// 切換組合行權時過濾可行權清單資料
		type(nv, ov){
			this.symbol2 = "";
			if(nv == "collection"){
				this.opt1List = this.$store.state.data.normalPositionSumList.filter(pos => {
				let symbol = this.sid.split('.').slice(0, 5).join('.');
				let isSame = pos.SYMBOL.indexOf(symbol) === 0;
				// 同標的且多方可行權數大於0
				return (M4C.Exercise.hasMktMap[pos.SYMBOL] && isSame && pos.$OBQTY)}).map(pos => {
					return {
							"value": pos.SYMBOL,
							"label": pos.SYMBOL,
							"selected": pos.SYMBOL == this.sid
							}
				});
			}
			else 
				this.sid = this.param.sid;
		},
		offsetTableBuyQty(nv, ov){
			if(nv === 0 && ov)
				this.inputQty = 0;
			else this.inputQty = 1;
		}
	},
	methods: {
		// 取得合約名稱及月份、履約價、CP
		getContractText(sid) {
			let text = `${M4C.Symbol.getCNM4(sid, "")}`;
			return text;
		},
		checkCPPrice(s1, s2){
			let price1 = Number(M4C.Option.getStrike(s1));
			let price2 = Number(M4C.Option.getStrike(s2));
			let price1CP = M4C.Option.getCallPut(s1);
			// call價位必須小於put價位
			if(price1CP == "C" && price1 > price2 || price1CP == "P" && price1 < price2) {
				for(let idx in this.opt2List){
					this.opt2List[idx].selected = false;
				}
			}
		},
		// 取第二隻腳sid(不含價位);
		getSecFootSid(fistFootSid){
			let symbol_ary = fistFootSid.split('.');
			symbol_ary[5] = symbol_ary[5] == 'C'? 'P': 'C';
			return symbol_ary.join('.');
		},
		onExec(){
			let orderinfo = {
				"SYMBOL": this.sid,
				"SIDE": "BUY",
				"ACTION": "NEW",
				"TYPE": this.isDCEAbort? "DISABLE": "EXECUTE",		// 如果是大商所在到期日行權0手，改為放棄行權(放棄全部自動行權)。
				"QTY": this.inputQty,
				"POSITION_EFFECT": this.oiPositionEffect,
			}
			if(this.type==='collection' && this.symbol2)
				orderinfo.SYMBOL2 = this.symbol2;

			M4C.Exercise.sendOrder(orderinfo);
		},
		onCancel(){
				let orderinfo = {
				"SYMBOL": this.sid,
				"SIDE": "BUY",
				"ACTION": "NEW",
				"TYPE": "ABORT",
				"QTY": this.inputQty,
				"POSITION_EFFECT": this.oiPositionEffect,
			}
			if(this.type==='collection' && this.symbol2)
				orderinfo.SYMBOL2 = this.symbol2;
			M4C.Exercise.sendOrder(orderinfo);
		},
		getWordding(){
			let exgId = M4C.Symbol.getExchangeName(this.sid);
			let wordding = "到期日可放弃行权 (非到期日无效)";
			switch(exgId){
				// 深交所
				case 'SZSE':
				// 上证所
				case 'SSE':
					// 行权日不显示。
					if(this.remainDays== 0)
						wordding = "";
					else
						wordding = "*该期权为到期日行权 (欧式) ，今日非行权日";
					break;
				// 大商所
				case 'DCE':
					wordding = "*到期日可通过提交0手的行权申请来实现取消自动申请行权 (非到期日无效)";
					break;
				// 上期所
				case 'SHFE':
					// 非沪铜期权
					if(M4C.Symbol.getContractInfo(this.sid).TradeSymbol !== 'cu')
						wordding = "*欧式。到期日可提出行权申请、放弃申请";
					break;
				default:
					break;
			}
			return wordding;
		},
	}
}
</script>
<style scoped>
.switch-btn {
	border: 1px solid rgba(255, 152,0);
}
.label{
	width: 35%;
	color: gray;
}
.row-ctn{
	height: 2.5em;
	padding: 5px 0;
}
.btn{
	padding: 5px;
	margin: 5px;
	border-radius: 1em;
}
.no-contracts{
	border: 1px solid #393939;
	border-radius: 5px;
	height: 11vw;
	padding: 2px 10px;
}
.ss-btn /deep/ .button-ctn{
	padding: 2px 0px;
	height: 11.7vw;
}
.opt1List /deep/ .no-list {
	border: 1px solid #393939;
    border-radius: 5px;
    height: 11vw;
    padding: 2px 10px;
}
.ShfeOrIne-radio .focus {
	background: none;
}
.desktop .no-contracts{
	height: 2em;
}
.desktop .ss-btn /deep/ .button-ctn{
	height: 2.5em;
}
</style>