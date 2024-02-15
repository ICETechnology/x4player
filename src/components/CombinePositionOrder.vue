<template>
    <div class="order-confirm-ctn flex-col pdlr5 mgt2">
		<div class="order-confirm-body flex-col flex-1">
			<div class="acc-data row-ctn flex-row flex-vertical-center pdlr1">
				<span class="label font-size-small">{{$ln('帐号')}}</span>
				<span class="flex-1 content font-size-little pdr5">
					{{traderID}}
				</span>
			</div>
			<!-- 組合 -->
			<div class="order-data1" v-if="type == 'combine'">
				<div class="row-ctn flex-row flex-vertical-center">
					<span class="label font-size-small">{{$ln('品种')}}</span>
					<span class="flex-1 content font-size-little pdr5">
						<SingleSelect :options="varietyList" v-model="variety" />
					</span>
				</div>
				<div class="row-ctn flex-row flex-vertical-center">
					<span class="label font-size-small">{{$ln('策略')}}</span>
					<span class="flex-1 content font-size-little pdr5">
						<SingleSelect :options="filterStrategyList" v-model="strategy" />
					</span>
				</div>
				<div class="row-ctn flex-col">
					<div class="flex-row flex-1 flex-vertical-center">
						<span class="label font-size-small">{{$ln('合约')}}</span>
						<span class="flex-1 content font-size-little pdr5">
							<SingleSelect :options="contract1List" v-model="contract1" />
						</span>
					</div>
					<div class="flex-row flex-1 mgb1 flex-vertical-center" v-if="contract1Pos" >
						<span class="label font-size-small"></span>
						<div class="flex-1 flex-top-left flex-row mgt1 font-size-mini" v-html="getPosDetail(contract1Pos, side1)" />
					</div>
				</div>
				<div class="row-ctn flex-col" v-if="isNotSingleStrategy">
					<div class="flex-row flex-1 flex-vertical-center">
						<span class="label font-size-small">{{$ln('合约')}}</span>
						<span class="flex-1 content font-size-little pdr5">
							<SingleSelect :options="contract2List" v-model="contract2" />						
						</span>
					</div>
					<div class="flex-row flex-1 mgb1 flex-vertical-center" v-if="contract2Pos" >
						<span class="label font-size-small"></span>
						<div class="flex-1 flex-top-left flex-row mgt1 font-size-mini" v-html="getPosDetail(contract2Pos, side2)" />
					</div>
				</div>				
			</div>
			<!-- 拆分 -->
			<div class="order-data2" v-if="type == 'split'">
				<div class="row-ctn flex-row flex-vertical-center">
					<span class="label font-size-small">{{$ln('策略')}}</span>
					<span class="flex-1 content font-size-little pdr5">
						{{cpd.SPREAD_TYPE}}
						{{$ln(splitStrategy || "未知策略")}}
					</span>
				</div>
				<div class="row-ctn flex-row flex-vertical-center">
					<span class="label font-size-small">{{$ln('合约')}}</span>
					<span class="flex-1 content font-size-little pdr5" v-html="getCombineContract()" />
				</div>
			</div>
			<div class="flex-row flex-vertical-center pdlr1">
				<span class="label font-size-small">{{$ln('数量')}}</span>
				<span class="flex-1 content font-size-little pdr5"><InputQty v-model="orderQty" :max="maxQty"/></span>
			</div>
			<div class="row-ctn flex-center clr-warn" v-if="!varietyList.length && type == 'combine'">{{$ln("无可组合商品品种")}}</div>
		</div>
        <div class="mgb10 flex-row flex-center">
            <Button class="font-size-big btn-cancel mgr2" @click="onBtnCancel">{{$ln("取消")}}</Button>
            <Button class="font-size-big btn-confirm mgl3" @click="onBtnOrder" :disabled="!sendAble?'disabled':''">{{$ln("送出委托")}}</Button>
        </div>
		<LoadingIcon v-if="isLoading"></LoadingIcon>
    </div>
</template>

<script>
/**
 * 20221114
 * 1.調整由公開設定的COMPOSITE_EXG_STRATEGYMAP(交易所策略對映表)來設定 新增可組合的交易所及調整現有有支援的策略代碼
 * 2.未來如有新增組合策略或組合策略內容有調整，需請PM開需求卡來重新修改。
 */
export default {
	props: ['param'],
	data() {
		return {
			isLoading: false,
			orderQty: 1,
			orderBuy: '',
			orderSell: '',
			variety: "",
			strategy: "",
			contract1: "",
			contract1List: [],
			contract2: "",
			contract2List: [],
			availableContractList: [],
			// 可用商品組合表
			MappingContract: {
				"I.F.DCE.a": ['I.F.DCE.m'],
				"I.F.DCE.y": ['I.F.DCE.p'],
				"I.F.DCE.l": ['I.F.DCE.v', 'I.F.DCE.pp'],
				"I.F.DCE.j": ['I.F.DCE.jm'],
				"I.F.DCE.bb": ['I.F.DCE.fb'],
				"I.F.DCE.v": ['I.F.DCE.pp'],
				"I.F.DCE.i": ['I.F.DCE.jm', 'I.F.DCE.j'],
				"I.F.DCE.c": ['I.F.DCE.cs'],
				"I.F.DCE.b": ['I.F.DCE.m']
			},
			orderInfo: {},
			sendOrderResult: [],
			CombinePositionData: {},
			varietyList: [],
		}
	},
	beforeMount() {
		this.$emit("title", this.type == 'combine'? `建构组合`: (this.type == 'split'? `拆分组合`: ''));
		// 初始化品種選擇清單
		if(this._varietyList.length) {
			this._varietyList.forEach(obj=>{
				this.varietyList.push(obj);
			})
		}
	},
	mounted() {
		/** 處理server給的期貨跨品種組合表，由於server無法以"I.F.DCE.a"當key(因為.)所以分層。
		 * client為了快速比對sid所以重組組合表。
		 */
		if(this.$store.state.compositeConfig && Object.keys(this.$store.state.compositeConfig).length) {
			let newConfig = {};
			// 第一層(期貨、期權)
			for(let i in this.$store.state.compositeConfig){
				// server的分層不包含I所以在組之前先設定I。
				let key = ["I"];
				let exg = this.$store.state.compositeConfig[i];
				// 第二層(交易所)
				for(let j in exg){
					let item = exg[j];
					// 第三層(商品種類)
					for(let k in item){
						let list = item[k];
						// 組出商品id當key
						let index = key.concat(i).concat(j).concat(k).join('.');
						newConfig[index] = list;
					}
				}
			}
			// 重設可用商品組合表
			this.MappingContract = newConfig;
		}	
		this.CombinePositionData = this.cpd;
	},
    methods: {
		getPureSymbol(sid) {
			let mInfo = M4C.Symbol.getMainformInfo(sid);
			let fullSid = mInfo["full-name"];
			// 有除權息標誌(A)移除A(避免有總表不支援的部位所以用||sid)
			return fullSid && mInfo.SetPRIADJ? fullSid.slice(0, fullSid.lastIndexOf(mInfo.SetPRIADJ)): fullSid || sid;
		},
		// 回傳組合持倉的合約名稱
		getCombineContract() {
			let el = `<span>${M4C.Symbol.getCNM4(this.symbol1)}</span>`;
			if(this.symbol2){
				el += ` &<br><span>${M4C.Symbol.getCNM4(this.symbol2)}</span>`
			}
			return el;
		},
		// 回傳持倉口數資料
		getPosDetail(pos, side) {
			let el = `<span class="pdr1">${this.$ln("单位")}：${M4C.Symbol.getMainformInfo(pos.SYMBOL).Weight}</span>`;
			let reSetList = false;
			// 不需要顯示備兌倉的策略
			if(this.strategy != 8) {
				if(pos.OFFSETABLE_BUY_QTY > 0 && side == "BUY"){
					el += `<span class='pdr1 clr-up'>${this.$ln("多仓")}${pos.OFFSETABLE_BUY_QTY}</span>`;
				}
				if(pos.OFFSETABLE_SELL_QTY > 0 && (side == "SELL" || !this.contract2)){
					el += `<span class='pdr1 clr-dn'>${this.$ln("空仓")}${pos.OFFSETABLE_SELL_QTY}</span>`;
				}
			}
			else {
				// 如果是特殊策略(認購期權備兌倉轉保證金)直接顯示備兌倉數量(其他ap也是顯示空倉)。
				el += `<span class='pdr1 clr-dn'>${this.$ln("空仓")}${this.coveredQty}</span>`;
			}
			if(M4C.Option.getCallPut(pos.SYMBOL) == "C")
				el += ` <span class="clr-up">${this.$ln('认购')}</span>`;
			else if(M4C.Option.getCallPut(pos.SYMBOL) == "P")
				el += ` <span class="clr-dn">${this.$ln('认沽')}</span>`;
			// 處理組合後商品沒有可組合數量就重新整理清單
			if(reSetList)
				this.filterContrat1List(this.strategy);
			return el;
		},
		// 取得合約名稱。
		getSymbolName(sid) {
			return M4C.Symbol.getCNM4(sid, " ");
		},
		// 取消按鈕
		onBtnCancel() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		// 發送組拆命令
		onBtnOrder() {
			// 調整策略如果是認購期權備兌轉保證金就帶拆分類型，其他依type判斷。 https://trello.com/c/TLfpItuO/
			let combineType = this.type == 'combine' && this.strategy != 8? 'COMBINE': this.type == 'split' || this.strategy == 8? 'SPLIT': '';
			let orderInfo = {
				"SYMBOL": this.symbol1,
				"SYMBOL2": this.symbol2,
				"SIDE": this.side1,
       			"SIDE2": this.side2,
				"TYPE": combineType,
				"QTY": this.orderQty,
				"STRATEGY": this.type == 'combine'?Number(this.strategy): Number(this.cpd.STRATEGY),
			};
			// 认购期权保证⾦开仓转备兑开仓、认购期权备兑开仓转保证⾦开仓(不需要第二隻腳)
			if(!this.isNotSingleStrategy){
				delete orderInfo["SIDE2"];
				delete orderInfo["SYMBOL2"];
			}
			
			this.orderInfo = orderInfo;
			this.isLoading = true;
			this.sendOrderResult = M4C.CombinePosition.execCombinePosition(orderInfo);
			// 應https://trello.com/c/2mdjC1EZ/卡片需求，如果是拆分時送出委託後自動關閉頁面
			if(this.type == "split")
				eventBus.$emit("CLOSE-DIALOG");
		},
		// 取得合约代码及合约名称
		getContractName(symbol) {
			return `${symbol.split('.')[3]} ${M4C.Symbol.getContractName(symbol)}`;
		},
		// 過濾出第一隻腳清單
		filterContrat1List(strategy){
			// 清空第一隻腳的資料欄位
			this.contract1List.splice(0);
			this.contract1 = "";
			let contractList = [];
			// 預設第一隻腳方向
			this.pos1Side = "BUY";
			switch(strategy){
				case "1":
					/** 认购⽜市价差策略：相同到期⽇、相同标的证券、相同合约单位的认购期权；腿1为⾏权价较低的 权利仓(多仓)& 腿2 为⾏权价较⾼的 义务仓(空仓) */
				case "4":
					/** 认购熊市价差策略：相同到期⽇、相同标的证券、相同合约单位的认购期权；腿1为⾏权价较⾼的 权利仓(多仓)& 腿2 为⾏权价较低的 义务仓(空仓) */
					contractList = this.availableContractList.filter(pos=>{
						let sid = this.getPureSymbol(pos.SYMBOL);
						// 同品種 && 多倉 && 認購期權
						return (sid.indexOf(this.variety) == 0) && (pos.OFFSETABLE_BUY_QTY > 0) && (M4C.Option.getCallPut(pos.SYMBOL) == "C");
					});
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "2":
					/** 认沽熊市价差策略：相同到期⽇、相同标的证券、相同合约单位的认沽期权；腿1为⾏权价较⾼的 权利仓(多仓)& 腿2 为⾏权价较低的 义务仓(空仓) */
				case "3":
					/** 认沽⽜市价差策略：相同到期⽇、相同标的证券、相同合约单位的认沽期权；腿1为⾏权价较低的 权利仓(多仓)& 腿2 为⾏权价较⾼的 义务仓(空仓) */
					contractList = this.availableContractList.filter(pos=>{
						let sid = this.getPureSymbol(pos.SYMBOL);
						// 同品種 && 多倉 && 認沽期權
						return (sid.indexOf(this.variety) == 0) && (pos.OFFSETABLE_BUY_QTY > 0) && (M4C.Option.getCallPut(pos.SYMBOL) == "P");
					});
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "5":
				case "6":
				case "7":
					this.pos1Side = "SELL";
					/** (6)期权宽跨式：卖出同⼀系列低执⾏价格的看跌期权和⾼执⾏价格的看涨期权。(⼤商所)
					■ 補充說明: 相同标的、相同⽉份的空头 看跌期权put (履约价较低) + 空头 看涨期权call（履约价较⾼）
					*/
					if(M4C.Symbol.getExchangeName(this.variety) == "DCE" && strategy == 6) {
						contractList = this.availableContractList.filter(pos=>{
							let sid = this.getPureSymbol(pos.SYMBOL);
							// 同品種 && 空倉 && 認購期權
							return (sid.indexOf(this.variety) == 0) && (pos.OFFSETABLE_SELL_QTY > 0) && (M4C.Option.getCallPut(pos.SYMBOL) == "P");
						});
					} else {
					/** (5)跨式空头策略：相同标的、相同到期⽇、相同⾏权价格；腿1 为 认购期权 义务仓(空仓)& 腿2 为 认沽期权 义务仓(空仓) 
					 *  (6)宽跨式空头策略：相同标的、相同到期⽇；腿1 为 ⾏权价较⾼的认购期权义务⽅(空仓) & 腿2为⾏权价较低的认沽期权义务⽅头⼨(空仓) 
					 *  (5)期权跨式：卖出同⼀系列的相同执⾏价格的看涨期权和看跌期权（第⼀腿合约为call+ 第⼆腿合约为put）。(⼤商所) 
					 *  (7)认购期权保证⾦开仓转备兑开仓：认购期权空仓，不记为 组合持仓。(單腳、空倉、認購權期) */
						contractList = this.availableContractList.filter(pos=>{
							let sid = this.getPureSymbol(pos.SYMBOL);
							// 同品種 && 空倉 && 認購期權
							return (sid.indexOf(this.variety) == 0) && (pos.OFFSETABLE_SELL_QTY > 0) && (M4C.Option.getCallPut(pos.SYMBOL) == "C");
						});					
					}
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "8":		
					/** 认购期权备兑开仓转保证⾦开仓（暂不实时）：认购期权备兑仓，不记为 组合持仓
					 * 20221110因PC端實作了，所以APP也要實作
					 */
					this.pos1Side = "SELL";
					contractList = this.availableContractList.filter(pos=>{
						let sid = this.getPureSymbol(pos.SYMBOL);
						// 認購期權
						return (sid.indexOf(this.variety) == 0) && (pos.$CSQTY > 0) && (M4C.Option.getCallPut(pos.SYMBOL) == "C");
					});
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "9":
					/** 期货同合约对锁：相同期货品种、相同到期⽉份、数量相等、⽅向相反；第⼀腿合约 多仓、第⼆腿合约 空仓。(⼤商所) */
					contractList = this.availableContractList.filter(pos=>{
						let sid = this.getPureSymbol(pos.SYMBOL);
						let futureSymbol = this.variety.split('.');
						futureSymbol[1] = "F";
						// 同品種 && 多倉
						return (sid === futureSymbol.slice(0, 4).join('.')) && (pos.OFFSETABLE_BUY_QTY > 0);
					});
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;

				case "10":
					/** 期货跨期套利：相同期货品种、不同到期⽉份（第⼀腿合约 近⽉+第⼆腿合约 远⽉）、数量相等、⽅向相反。(⼤商所) */
					contractList = this.availableContractList.filter(pos=>{
						let sid = this.getPureSymbol(pos.SYMBOL);
						let futureSymbol = this.variety.split('.');
						futureSymbol[1] = "F";
						// 同品種
						return (sid === futureSymbol.slice(0, 4).join('.'));
					});
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "11":
					/** 期货跨品种：不同期货品种（需为组合表中已有组合品种，顺序不可互换）、数量相等、⽅向相反。(⼤商所) */
					contractList = this.availableContractList.filter(pos=>{
						let sid = this.getPureSymbol(pos.SYMBOL);
						// 符合mapping商品 (多倉)
						return (sid.indexOf(this.variety) == 0);
					});
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "12":
					/** 卖出期货期权：卖出看涨期权，同时买入对应期货合约。或 卖出看跌期权，同时卖出对应期货合约。(⼤商所)
					■ 補充說明:
					◆ 空头 看涨期权（call）+ 多头 标的期货
					◆ 空头 看跌期权（put）+ 空头 标的期货
					*/
					this.pos1Side = "SELL";
					contractList = this.availableContractList.filter(pos=>{
						let sid = this.getPureSymbol(pos.SYMBOL);
						// 空头 期权
						return (sid.indexOf(this.variety) == 0) && (pos.OFFSETABLE_SELL_QTY > 0);
					});
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "13":
					/** 买入期货期权：买入看涨期权，同时卖出对应期货合约；买入看跌期权，同时买入对应期货合约。(⼤商所) */
					contractList = this.availableContractList.filter(pos=>{
						let sid = this.getPureSymbol(pos.SYMBOL);
						// 多头 期权
						return (sid.indexOf(this.variety) == 0) && (pos.OFFSETABLE_BUY_QTY > 0);
					});
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "14":
					/** 期权对锁：相同期权品种、相一⽉份、数量相等、⽅向相反。(⼤商所) */
					contractList = this.availableContractList.filter(pos=>{
						let sid = this.getPureSymbol(pos.SYMBOL);
						let futureSymbol = this.variety.split('.');
						futureSymbol[1] = "O";
						// 同品種
						return (sid === futureSymbol.slice(0, 4).join('.'));
					});
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "15":
					/** 日历价差组合：賣出call近月 + 買入call遠月 or 賣出put近月 + 買入put遠月。相同期权品种、相同履約價、数量相等、⽅向相反。(⼤商所、廣期所) */
					this.pos1Side = "SELL";
					contractList = this.availableContractList.filter(pos=>{
						let sid = this.getPureSymbol(pos.SYMBOL);
						let futureSymbol = this.variety.split('.');
						futureSymbol[1] = "O";	// 指定期權商品
						// 同品種(期權) && 空倉
						return (sid === futureSymbol.slice(0, 4).join('.')) && (pos.OFFSETABLE_SELL_QTY > 0);
					});
					this.contract1List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
			}
		},
		filterContrat2List () {
			// 清空第二隻腳的資料欄位
			this.contract2List = [];
			this.contract2 = "";
			let contractList = [];
			let contract1Symbol, contract1Price;
			let pos1Side = Number(this.contract1Pos.OFFSETABLE_BUY_QTY) && Number(this.contract1Pos.OFFSETABLE_SELL_QTY)? 0:
						this.contract1Pos.OFFSETABLE_BUY_QTY > 0? 1: -1;
			this.pos2Side = "SELL";
			switch(this.strategy){
				case "1":
					/** 认购⽜市价差策略：相同到期⽇、相同标的证券、相同合约单位的认购期权；腿1为⾏权价较低的 权利仓(多仓)& 腿2 为⾏权价较⾼的 义务仓(空仓) */
				case "3":
					/** 认沽⽜市价差策略：相同到期⽇、相同标的证券、相同合约单位的认沽期权；腿1为⾏权价较低的 权利仓(多仓)& 腿2 为⾏权价较⾼的 义务仓(空仓) */
					// contract1已過濾除價格、倉位(不用在意認沽、購，已於contract1過濾)
					contract1Symbol = this.contract1.split(".").slice(0, 6).join('.');
					contract1Price = Number(this.symbol1Price);
					contractList = this.availableContractList.filter(pos=> {
						let thisContractPrice = Number(M4C.Option.getStrike(pos.SYMBOL));
						// 同商品 && 空倉 && 行權價高於腳1。
						return (pos.SYMBOL != this.contract1) && (pos.SYMBOL.indexOf(contract1Symbol) == 0) && (pos.OFFSETABLE_SELL_QTY > 0) && (contract1Price < thisContractPrice) ;
					});
					this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "2":
					/** 认沽熊市价差策略：相同到期⽇、相同标的证券、相同合约单位的认沽期权；腿1为⾏权价较⾼的 权利仓(多仓)& 腿2 为⾏权价较低的 义务仓(空仓) */
				case "4":
					/** 认购熊市价差策略：相同到期⽇、相同标的证券、相同合约单位的认购期权；腿1为⾏权价较⾼的 权利仓(多仓)& 腿2 为⾏权价较低的 义务仓(空仓) */
					// contract1已過濾除價格、倉位(不用在意認沽、購，已於contract1過濾)
					contract1Symbol = this.contract1.split(".").slice(0, 6).join('.');
					contract1Price = Number(this.symbol1Price);
					contractList = this.availableContractList.filter(pos=> {
						let thisContractPrice = Number(M4C.Option.getStrike(pos.SYMBOL));
						// 同商品 && 空倉 && 行權價低於腳1。
						return (pos.SYMBOL != this.contract1) && (pos.SYMBOL.indexOf(contract1Symbol) == 0) && (pos.OFFSETABLE_SELL_QTY > 0) && (contract1Price > thisContractPrice);
					});
					this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "5":
					/** 跨式空头策略：相同标的、相同到期⽇、相同⾏权价格；腿1 为 认购期权 义务仓(空仓)& 腿2 为 认沽期权 义务仓(空仓) */
					/** 期权跨式：卖出同⼀系列的相同执⾏价格的看涨期权和看跌期权（第⼀腿合约为call+ 第⼆腿合约为put）。(⼤商所)  */
					contract1Symbol = this.contract1.split(".").slice(0, 5).join('.');
					contract1Price = Number(this.symbol1Price);
					contractList = this.availableContractList.filter(pos=> {
						let thisContractPrice = Number(M4C.Option.getStrike(pos.SYMBOL));
						// 同商品 && 認沽期權 && 空倉 && 行權價等於腳1。
						return (pos.SYMBOL != this.contract1) && (pos.SYMBOL.indexOf(contract1Symbol) == 0) && (M4C.Option.getCallPut(pos.SYMBOL) == "P") 
						&& (pos.OFFSETABLE_SELL_QTY > 0) && (contract1Price == thisContractPrice);
					});
					this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "6":
					/** 宽跨式空头策略：相同标的、相同到期⽇；腿1 为 ⾏权价较⾼的认购期权义务⽅(空仓) & 腿2为⾏权价较低的认沽期权义务⽅头⼨(空仓) */
					contract1Symbol = this.contract1.split(".").slice(0, 5).join('.');
					contract1Price = Number(this.symbol1Price);
					if(M4C.Symbol.getExchangeName(this.variety) != "DCE") {
						contractList = this.availableContractList.filter(pos=> {
							let thisContractPrice = Number(M4C.Option.getStrike(pos.SYMBOL));
							// 同商品 && 認沽期權 && 空倉 && 行權價低於腳1。
							return (pos.SYMBOL != this.contract1) && (pos.SYMBOL.indexOf(contract1Symbol) == 0) && (M4C.Option.getCallPut(pos.SYMBOL) == "P") 
							&& (pos.OFFSETABLE_SELL_QTY > 0) && (contract1Price > thisContractPrice);
						});
						
					} else {
					/** 期权宽跨式：卖出同⼀系列低执⾏价格的看跌期权和⾼执⾏价格的看涨期权。(⼤商所)
					■ 補充說明: 相同标的、相同⽉份的空头 看跌期权put (履约价较低) + 空头 看涨期权call（履约价较⾼）
					*/
						contractList = this.availableContractList.filter(pos=> {
							let thisContractPrice = Number(M4C.Option.getStrike(pos.SYMBOL));
							// 同商品 && 認沽期權 && 空倉 && 行權價高於腳1。
							return (pos.SYMBOL != this.contract1) && (pos.SYMBOL.indexOf(contract1Symbol) == 0) && (M4C.Option.getCallPut(pos.SYMBOL) == "C") 
							&& (pos.OFFSETABLE_SELL_QTY > 0) && (contract1Price < thisContractPrice);
						});
					}
					this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "7":
					/** 认购期权保证⾦开仓转备兑开仓：认购期权空仓，不记为 组合持仓。(單腳、多倉、認購權期) */
					break;

				case "8":
					/** 认购期权备兑开仓转保证⾦开仓（暂不实时）：认购期权备兑仓，不记为 组合持仓 */
					break;
				case "9":
					/** 期货同合约对锁：相同期货品种、相同到期⽉份、数量相等、⽅向相反；第⼀腿合约 多仓、第⼆腿合约 空仓。(⼤商所) */
					contractList = this.availableContractList.filter(pos=> {
						let hasQty = pos.OFFSETABLE_SELL_QTY > 0;
						// 同商品 && 反向倉位。
						return (pos.SYMBOL == this.contract1) && hasQty;
					});
					this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "10":
					/** 期货跨期套利：相同期货品种、不同到期⽉份（第⼀腿合约 近⽉+第⼆腿合约 远⽉）、数量相等、⽅向相反。(⼤商所) */
					let contract1Month = Number(this.contract1.split('.')[4]);					
					contract1Symbol = this.contract1.split('.').slice(0, 4).join('.'); // 不含月份的symbol
					contractList = this.availableContractList.filter(pos=> {
						let hasQty = pos1Side < 0? (pos.OFFSETABLE_BUY_QTY > 0): pos1Side > 0? (pos.OFFSETABLE_SELL_QTY > 0): true;
						let thisContractMonth = Number(pos.SYMBOL.split('.')[4]);
						// 同商品 && 反向倉位 && 月份大於腳1。
						return (pos.SYMBOL != this.contract1) && (pos.SYMBOL.indexOf(contract1Symbol) == 0) && hasQty && (contract1Month < thisContractMonth);
					});
					this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "11":
					/** 期货跨品种：不同期货品种（需为组合表中已有组合品种，顺序不可互换）、数量相等、⽅向相反。(⼤商所) */
					contract1Symbol = this.contract1.split(".").slice(0, 4).join('.');
					let mappingList = this.MappingContract[contract1Symbol];
					// 有可配對商品清單
					if(mappingList){						
						contractList = this.availableContractList.filter(pos=> {
							let hasQty = pos1Side < 0? (pos.OFFSETABLE_BUY_QTY > 0): pos1Side > 0? (pos.OFFSETABLE_SELL_QTY > 0): true;
							// mapping商品 && 反向持倉 。
							return (pos.SYMBOL != this.contract1) && (mappingList.indexOf(pos.SYMBOL.split('.').slice(0, 4).join('.')) >= 0) && hasQty;
						});
						this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					}
					break;
				case "12":
					/** 卖出期货期权：卖出看涨期权，同时买入对应期货合约。或 卖出看跌期权，同时卖出对应期货合约。(⼤商所)
					■ 補充說明:
					◆ 空头 看涨期权（call）+ 多头 标的期货
					◆ 空头 看跌期权（put）+ 空头 标的期货
					*/
					contractList = this.availableContractList.filter(pos=> {
						let futureSymbol = this.contract1.split(".").slice(0, 5);
						futureSymbol[1] = 'F';						
						let cp = this.contract1.split(".")[5];
						let isMapping = false;
						if(cp == "C") {
							this.pos2Side = "BUY";
							isMapping = pos.OFFSETABLE_BUY_QTY > 0;}
						else {
							isMapping = pos.OFFSETABLE_SELL_QTY > 0;}
						
						// 标的期货 && 多倉|空倉 。
						return (pos.SYMBOL != this.contract1) && (pos.SYMBOL == futureSymbol.join('.')) && isMapping;
					});
					this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});					
					break;
				case "13":
					/** 买入期货期权：买入看涨期权，同时卖出对应期货合约；买入看跌期权，同时买入对应期货合约。(⼤商所) */
					contractList = this.availableContractList.filter(pos=> {
						let futureSymbol = this.contract1.split(".").slice(0, 5);
						futureSymbol[1] = 'F';
						let cp = this.contract1.split(".")[5];
						let isMapping = false;
						if(cp == "C") {
							isMapping = pos.OFFSETABLE_SELL_QTY > 0;}
						else {
							this.pos2Side = "BUY";
							isMapping = pos.OFFSETABLE_BUY_QTY > 0;}
						
						// 标的期货 && 多倉|空倉 。
						return (pos.SYMBOL != this.contract1) && (pos.SYMBOL == futureSymbol.join('.')) && isMapping;
					});
					this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "14":
					/** 期权对锁：相同期权品种、相一⽉份、数量相等、⽅向相反。(⼤商所) */
					contractList = this.availableContractList.filter(pos=> {
						let futureSymbol = this.contract1.split(".").slice(0, 5);
						let hasQty = pos1Side < 0? (pos.OFFSETABLE_BUY_QTY > 0): pos1Side > 0? (pos.OFFSETABLE_SELL_QTY > 0): true;
						// 同品種、月份 && 反向倉位(從條件上看起來應該不需要比對cp、行權價)。
						return (pos.SYMBOL != this.contract1) && (pos.SYMBOL.split(".").slice(0, 5).join('.') == futureSymbol.join('.')) && hasQty;
					});
					this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
				case "15":
					/** 日历价差组合：賣出call近月 + 買入call遠月 or 賣出put近月 + 買入put遠月。相同期权品种、相同履約價、数量相等、⽅向相反。(⼤商所、廣期所) */
					this.pos1Side = "BUY";
					contract1Price = Number(this.symbol1Price);
					contractList = this.availableContractList.filter(pos=> {
						let posSymbolAry = pos.SYMBOL.split(".");
						let futureSymbol = this.contract1.split(".").slice(0, 4);
						futureSymbol[1] = "O";	// 指定期權商品
						let month = Number(futureSymbol[4]);
						let posMonth = Number(posSymbolAry[4]);
						let posStrike = M4C.Option.getStrike(pos.SYMBOL);
						let isSameType = posSymbolAry.slice(0,4).join('.') == futureSymbol.join('.');
						let isSameCp = this.contract1.split(".")[5] == posSymbolAry[5];
						let isSameStrike = contract1Price == posStrike;
						// 同品種(期權) && 多倉 && cp相同 && 遠月 && 相同履約價
						return isSameType && (pos.OFFSETABLE_BUY_QTY > 0) && isSameCp && month < posMonth && isSameStrike;
					});
					this.contract2List = contractList.map(c => {return {"label": this.getSymbolName(c.SYMBOL), "value": c.SYMBOL};});
					break;
			}
		},
		// 判斷兩陣列不相等
		arrayNoEquals(a, b){
			// 長度不一樣
			if (a.length != b.length) return false;
			// b陣列裡沒有a的某個資料
			let resultA = a.find((e)=>{
				return b.indexOf(e) === -1
			});
			// a陣列裡沒有b的某個資料
			let resultB = b.find((e)=>{
				return a.indexOf(e) === -1
			});
			return resultA || resultB;
		},
	},
    computed: {
		splitStrategy() {
			if(this.cpd){
				let strategyObj = this.strategyMap[this.cpd.STRATEGY];
				// -1
				if(this.cpd.STRATEGY < 0) return "未知策略";
				// 有支援的代码
				else if(strategyObj){
					// 不是股票期權交易所時優先顯示其他策略名稱
					if(this.stkOptionExgList.indexOf(M4C.Symbol.getExchangeName(this.symbol1)) == -1) {
						return strategyObj.futName || strategyObj.N;
					}
					else
						return strategyObj.N;
				}
				else return this.cpd.STRATEGY
			}
		},
		// 資金帳號
		traderID() {
			return M4C.Trader.traderID;
		},
		//第一隻腳的持倉商品代碼
		symbol1() {
			if(this.type == "combine")
				return this.contract1
			else if(this.type == "split")
				return this.contract1Pos.SYMBOL
		},
		// 第二隻腳的持倉商品代碼
		symbol2() {
			if(this.type == "combine")
				return this.contract2
			else if(this.type == "split")
				return this.contract2Pos.SYMBOL
		},
		// 腳1行權價
		symbol1Price() {
			return M4C.Option.getStrike(this.contract1);
		},
		// 腳2行權價
		symbol2Price() {
			return M4C.Option.getStrike(this.contract2);
		},
		isOppositeCombine() {
			// 方向相反的組合策略(沒有指明第一隻腳、第二隻腳買賣方向的策略)
			return (this.strategy > 9 && this.strategy < 12) || this.strategy == 14;
		},
		// 第一隻腳的持倉方向
		side1() {
			if(this.type == "combine"){
				//(this.pos1Side當選擇策略、合約後會自行變動。)
				if(this.isOppositeCombine && this.contract2Pos){
					this.pos1Side = !Number(this.contract1Pos.OFFSETABLE_BUY_QTY) || !Number(this.contract2Pos.OFFSETABLE_SELL_QTY)? "SELL": "BUY";
				}
				return this.pos1Side;
			}
			else if(this.type == "split")
				return this.contract1Pos.SIDE
		},
		// 第二隻腳的持倉方向
		side2() {
			if(this.contract2Pos){
				if(this.type == "combine"){
					if(this.isOppositeCombine){
						this.pos2Side = this.side1 == "BUY"? "SELL": "BUY";
					}
					return this.pos2Side;
				}
				else if(this.type == "split")
					return this.contract2Pos.SIDE
			}
		},
		// 取最大可組合數量
		maxQty() {
			if(this.type == "combine"){
				let _pos2Qty = this.pos2Qty;
				// 如果是單隻腳時，ex: 轉備兌。
				if(isNaN(_pos2Qty)) _pos2Qty = this.pos1Qty;
				// 最低1手
				return Math.min(this.pos1Qty, _pos2Qty) || 1;
			}
			else if(this.cpd.$COMPOSITE_QTY) {
				return Math.abs(this.cpd.$COMPOSITE_QTY);
			}
			else {
				this.orderQty = 0;
				return 0
			};
		},
		coveredQty() {return Number(this.contract1Pos.COVERED_SELL_QTY) + Number(this.contract1Pos.PREV_COVERED_SELL_QTY);},
		pos1Qty() {
			// 如果是特殊策略(認購期權備兌倉轉保證金)直接回傳備兌倉數量。
			if(this.strategy == 8) return this.contract1Pos? this.coveredQty: 0;
			return this.contract1Pos? this.side1 == "BUY"? this.contract1Pos.OFFSETABLE_BUY_QTY: this.contract1Pos.OFFSETABLE_SELL_QTY: 0;
		},
		pos2Qty() {
			return this.contract2Pos? this.side2 == "BUY"? this.contract2Pos.OFFSETABLE_BUY_QTY: this.contract2Pos.OFFSETABLE_SELL_QTY: undefined;
		},
		// 可使用送出委託按鈕
		sendAble() {
			if(this.type == "combine"){
				let contract2Available = !this.isNotSingleStrategy? true: this.contract2Pos;
				return this.variety && this.contract1Pos && contract2Available;
			}
			else return this.orderQty > 0;
		},
		/** 委托类型 */
		type() {
			return this.param.type;
		},
		// 第一隻腳的持倉
		contract1Pos() {
			if(this.type == "combine")
				return this.positionSumList.find(pos=> pos.SYMBOL == this.contract1);
			else if(this.type == "split" && this.cpd.COMPOSITE_LIST)
				return this.cpd.COMPOSITE_LIST[0];
			else return {};
		},
		// 第二隻腳的持倉
		contract2Pos() {
			if(this.type == "combine")
				return this.positionSumList.find(pos=> pos.SYMBOL == this.contract2);
			else if(this.type == "split" && this.cpd.COMPOSITE_LIST)
				return this.cpd.COMPOSITE_LIST[1];
			else return {};
		},
		/** 持倉匯總資料 */
		positionSumList() {
			return this.$store.state.data.normalPositionSumList;
		},
		// 可組合品種清單
		_varietyList() {
			// 過濾可使用品種部位
			this.availableContractList = this.positionSumList.filter(pos => {
				let exgId = M4C.Symbol.getExchangeName(pos.SYMBOL);
				return this.supportedExg.indexOf(exgId) != -1;
			});
			let varietyMap = {};
			let list = [];
			// 過濾相同商品。
			return this.availableContractList.reduce((list, pos)=> {
				let _variety = this.getPureSymbol(pos.SYMBOL);
				if(!varietyMap[_variety]){
					varietyMap[_variety] = true;
					list.push({"label": this.getContractName(_variety) ,"value": _variety, "selected": this.strategy == _variety });
				}
				return list;
			},list = []);
		},
		// 品種可用策略
		filterStrategyList() {
			let exgId = M4C.Symbol.getExchangeName(this.variety);
			let list = [];
			let key = "";
			let isFut = this.variety.indexOf("I.F.") == 0;
			for(key in this.strategyMap){
				let obj = this.strategyMap[key];
				// 商品在策略有支援的交易所內且(期權並沒有type或期貨有type或證券)
				if(obj.exg.indexOf(exgId) != -1 && ((isFut && obj.type) || (!isFut && !obj.type))){
					// 不是股票期權交易所時優先顯示其他策略名稱
					let name  = this.stkOptionExgList.indexOf(exgId) == -1? obj.futName || obj.N: obj.N;
					list.push({label: name, value: key});
				}
			}
			return list;
		},
		// 組合持倉資料
		cpd() {
			if(this.param.data) {
				return this.$store.state.data.compositePositionSumList.find(pos=>(pos.$SYMBOL == this.param.data.$SYMBOL)) || {};
			}
		},
		// 策略對映表
		strategyMap() {
			return M4C.CombinePosition.strategyMap;
		},
		// 交易所策略對映表
		COMPOSITE_EXG_STRATEGYMAP() {
			return M4C.CombinePosition.COMPOSITE_EXG_STRATEGYMAP;
		},
		// 有支持組、拆的交易所清單(由COMPOSITE_EXG_STRATEGYMAP的key取得)
		supportedExg() {return Object.keys(this.COMPOSITE_EXG_STRATEGYMAP);},
		// 股票期權交易所清單(用來判斷是否顯示不同策略名稱)
		stkOptionExgList() {return M4C.CombinePosition.stkOptionExgList;},
		isNotSingleStrategy() {
			return this.strategy != 7 && this.strategy != 8;
		}
	},
	watch: {
		// 品種
		variety(nv, ov) {
			// 切換品種時清空第一、二隻腳的資料欄位
			this.contract1List = [];
			this.contract2List = [];
			this.contract1 = "";
			this.contract2 = "";
			this.filterContrat1List(this.strategy);
		},
		// 當策略選擇後，過濾可用的第一隻腳。
		strategy(nv, ov) {
			// 拆分時不處理
			if(this.type == "split") return;
			// 切換策略時清空第一、二隻腳的資料欄位
			this.contract1List = [];
			this.contract2List = [];
			this.contract1 = "";
			this.contract2 = "";
			this.filterContrat1List(nv);
		},
		// 當第一隻腳選擇後，過濾第二隻腳。
		contract1(nv, ov) {
			// 第一隻腳沒資料時, 清空第二隻腳清單及選取商品
			if(!nv) {
				this.contract2List = [];
				this.contract2 = "";
			}
			else {
				this.filterContrat2List();
			}
		},
		// 組合持倉資料
		CombinePositionData(nv, ov) {
			if(nv){
				this.strategy = nv.STRATEGY
				// 設定第一、二隻腳的合約名稱。
				this.contract1 = this.SYMBOL1;
				this.contract2 = this.SYMBOL2 || "";				
			}
		},
		// 組拆命令結果
		"sendOrderResult.$STATUS": function(nv, ov){
			let self = this;
			if(nv !== "QUERY") this.isLoading = false;
			if (nv === "FAIL") {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `申请组拆失败`,
					content: `${self.sendOrderResult.$MSG} (${self.sendOrderResult.$CD})`,
					confirmOnly: true
				});
			}
		},
		maxQty(nv ,ov) {
			// 組合模式時兩合約最大可組數量是0時重建清單
			if(nv == 0 && this.type == "combine"){
				if(this.contract1Pos && !Number(this.pos1Qty)) {
					this.filterContrat1List();
				}
				else if(this.contract2Pos && !Number(this.pos2Qty)) {
					this.filterContrat2List();
				}
			}
			// 最大可組合數量小於當前的委託量時，以最大可組合數量重設委託量
			else if(nv < this.orderQty) {
				this.orderQty = nv;
			}
		},
		// 可組合品種清單變動時
		_varietyList: {
			handler(nv, ov) {
				// 無品種清單時，直接使用
				if(!this.varietyList.length) {
					this.varietyList.splice(0);
					nv.forEach(obj => {
						this.varietyList.push(obj);
					});
				}
				// 有品種清單時判斷是否相同(不同才取代)
				else {
					let orgList = this.varietyList.map(obj=>(obj.value));
					let newList = nv.map(obj=>(obj.value));
					if(this.arrayNoEquals(orgList, newList)) {
						this.varietyList.splice(0);
						nv.forEach(obj => {
							this.varietyList.push(obj);
						});
					}
				}
			}, deep: true,
		}
	},
}
</script>

<style lang='scss' scoped>
.order-data1, .order-data2 {	
	padding: 0 1vw 3vw 1vw;
	@extend .flex-col;
}
.acc-data {
	border-top: 1px solid rgb(155,155,155);
}
.row-ctn {
	max-height: 55px;
	height: 50px;
	@extend .pdtb2;
}
.label {
	min-width: 20vw;
	color: rgb(155,155,155);
}
.order-confirm-foot {
	padding: 5vw 3vw 17vw 3vw;
	justify-content: space-around;
}
.cancel-btn {
	width: 24.8vw;
	background-color: rgb(216, 216, 216);
}
.order-btn {
	width: 44vw;
	background-color: rgb(245, 166, 35);
}
.desktop .row-ctn {
	max-height: 3em;
	height: 3em;
}
.desktop .label {
	min-width: 20%;
}
.desktop .order-data1, .order-data2 {	
	padding: 0 0 1em 0;
}
</style>