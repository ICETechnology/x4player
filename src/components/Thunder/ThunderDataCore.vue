<template>
	
</template>
<script>
import QuoteAgent from '@/components/QuoteAgent';

export default {
	mixins: [QuoteAgent],
	data() {
		return {
			volumeKey: ['sv10','sv9','sv8','sv7','sv6','sv5','sv4','sv3','sv2','sv1','bv1','bv2','bv3','bv4','bv5','bv6','bv7','bv8','bv9','bv10'],
			priceKey: ['sp10','sp9','sp8','sp7','sp6','sp5','sp4','sp3','sp2','sp1','bp1','bp2','bp3','bp4','bp5','bp6','bp7','bp8','bp9','bp10'],
			orgList: {},
			sumSv:0,
			sumBv:0,
			sumV:0,
			allBuyQty:0,
			allSellQty:0,
		};
	},
	mounted() {
		this.$store.state.m4c.thunderDataCore = this;

		this.tsi = M4C.Symbol.getTickSize(this.sid, this.qo.p);

		eventBus.$on("AVAILABLE-REPORT-APPEND", rpt=>{
			this.updateReport(rpt,'APPEND');
        });

		eventBus.$on("AVAILABLE-REPORT-REMOVE", rpt=>{
			this.updateReport(rpt,'REMOVE');
        });

		eventBus.$on("AVAILABLE-REPORT-REPLACE", rpt=>{
			this.updateReport(rpt,'REPLACE');
        });
	},
	methods: {
		//重設所有買賣10檔的量
		resetVolumn(){
			this.tableshow = false;
			this.cleanAllVolumn().then(()=>{
				//清空後再更新所有買賣10檔的量
				this.updateAllVolumn();
			});
		},
		//消空所有買賣10檔及各前後5檔價位的量(多清各5檔是以防價位一次跳多個檔位)
		cleanAllVolumn(){
			// clean volumn
			let bp10 = this.qo.bp10;	//買價第10檔
			let tsi = M4C.Symbol.getTickSize(this.sid, this.qo.p);
			for(let key in this.orgList){
				this.orgList[key].bv = "";
				this.orgList[key].sv = "";
			}
			return new Promise((resolve, reject) => {resolve();});
		},
		//更新所有買賣10檔的量
		updateAllVolumn() {
			this.priceKey.forEach((priceKey, j) => {
				let price = this.qo[priceKey];
				this.createOrgListObj(price);
				let isBp = priceKey.includes('bp');
				this.orgList[price][isBp ? 'bv' : 'sv'] = this.qo[this.volumeKey[j]];
			});
		},
		rptOrderType(rpt) {
			// 如果已轉為一般單，改取ORDER_TYPE
			if(rpt.$IS_NormalOrder && rpt.ORDER_TYPE) return rpt.ORDER_TYPE;
			// OCO單
			if(rpt.$IS_OCO)	return "OCO";
			switch(rpt.TC_ORDER_TYPE) {
				case "STOP":
					return "STOPMARKET";
				case "STPLMT":
					return "STOPLIMIT";
				case "MIT":
				case "LIT":
					return "IFTOUCHED";
				case "TSTOP":
				case "TSTPLMT":
					return "TRAILINGSTOP";
				case "MARKET":
					return "MARKET";
				case "LIMIT":
					return "LIMIT";
			}
		},
		//更新回報
		updateReport(rpt, action){
			// 過濾要計算的回報
			// 過濾同商品回報(OCO跟一般單、智慧單SYMBOL欄位位置不同)
			let rptSymbol = rpt.$IS_OCO? rpt.OCO[0].SYMBOL :rpt.SYMBOL;
			if(rptSymbol !== this.sid) return;
			// 複式權委託
			if(rpt.SYMBOL2) return;
			// 觸A下B
			if(rpt.MARKET_WATCH) return ;

			// 收到成交的回報後會變成一般單，取造成金額的計算錯誤，所以不使用getPriceKey來取價格
			let priceArray = [Number(rpt.ORDER_PRICE)];
			if(rpt.$IS_OCO) priceArray = [rpt.$CONDITION_VALUE_NOR, rpt.$CONDITION_VALUE2_NOR];
			else if(rpt.$IS_SMO) priceArray = [rpt.$CONDITION_VALUE_NOR];
			else if(rpt.TC_ORDER_TYPE == 'MARKET') priceArray = [this.priceTick(rpt.AVG_PRICE)];

			let qty = rpt.$AVAILABLE_QTY || rpt.REDUCED_QTY || rpt.$ORDER_QTY;

			priceArray.forEach((price, idx) => {
				const _price = Number(price);
				let side = (!rpt.$IS_OCO) ? rpt.SIDE : rpt.OCO[idx].SIDE;
				if (!this.orgList[_price]) 
					this.createOrgListObj(_price);
				
				let sideList = this.orgList[_price].rpt[side];

				switch (action) {
					case 'REMOVE':   //刪除
						const idx = sideList.findIndex(obj => obj.ORDER_ID === rpt.ORDER_ID);
						sideList.splice(idx, 1);
						if (side === 'BUY') {
							this.allBuyQty -= qty;
						} else if (side === 'SELL') {
							this.allSellQty -= qty;
						}
						break;
					case 'APPEND':   //新增
						sideList.unshift(rpt);
						if (side === 'BUY') {
							this.allBuyQty += qty;
						} else if (side === 'SELL') {
							this.allSellQty += qty;
						}
						break;
					case 'REPLACE':   //修改
						let delPrice = rpt.$BEFORE_REPLACE_VALUE;
						let delSideList = this.orgList[delPrice].rpt[side];
						const delIdx = delSideList.findIndex(obj => obj.ORDER_ID === rpt.ORDER_ID);
						delSideList.splice(delIdx, 1);
						sideList.unshift(rpt);
						this.countRpt(delPrice, side, false);
						if (side === 'BUY') {
							this.allBuyQty -= ((rpt.$BEFORE_REPLACE_QTY || 0) - rpt.$AVAILABLE_QTY);
						} else if (side === 'SELL') {
							this.allSellQty -= ((rpt.$BEFORE_REPLACE_QTY || 0) - rpt.$AVAILABLE_QTY);
						}
						break;
				}
				this.countRpt(_price, side, false);
			});
		},
		//更新map表裡指定價位買方or賣方的量，並計算總量、買方or賣方的總量。
		updateVolumn(nv, ov, key, side){
			if(!ov) return;
			let price = this.qo[key];
			this.createOrgListObj(price);
			let dv = ov - nv;	//新舊的差異量(舊減新，正數則是減量，負數則是增量)
			this.sumV -= dv;		
			if(side == 'BUY'){
				this.sumBv -= dv;
				this.orgList[price].bv =nv;
			}
			else{
				this.sumSv -= dv;
				this.orgList[price].sv =nv;
			}
		},
		// 清空資料
		cleanAllData(){
			this.allBuyQty = 0;
			this.allSellQty = 0;
			this.orgList = {};
			this.sumSv = 0;
			this.sumBv = 0;
			this.sumV = 0;
			this.noMask = false;
			this.oldPosPrice = 0;
			// this.$store.state.thunder.scrollLock = false;
		},
		//處理qo的資料
		processQoData(){
			this.orgList = {};
			//買賣總量(初始資料)
			for (let j = 1; j < 11; j++) {
				this.sumSv += this.qo['sv' + j];
				this.sumBv += this.qo['bv' + j];
			}
			//總量(初始資料)
			this.sumV = Number(this.sumSv) + Number(this.sumBv);
			//各買賣前10檔(初始資料)
			for (let i = 0; i < 20; i++) {
				let price = this.qo[this.priceKey[i]];
				let voKey = this.volumeKey[i];
				let sv = voKey.substr(0,2) == "sv" ? this.qo[voKey] : '';
				let bv = voKey.substr(0,2) == "bv" ? this.qo[voKey] : '';
				let clr = price > this.qo.p ? 'clr-dn' : price == this.qo.p ? this.qo.$clr :'clr-up';
				this.$set(this.orgList,price,{ 'sv': sv, 'p': price , 'bv': bv, '$clr': clr, 'pos':{}, 'rpt': {'BUY': [], 'BM': 0, 'BL': 0, 'BT': 0, 'BSM': 0, 'BSL': 0, 'BOCO': 0, 'BTS': 0, 'SELL': [], 'SM': 0, 'SL': 0, 'ST': 0, 'SSM': 0, 'SSL': 0, 'SOCO': 0, 'STS': 0}});
			}

			// 紀錄一開始有回報的金額，讓後面可以一次計算總量
			let priceArr = [];

			// 有效委託單(初始資料)
			this.reportList.forEach(rpt => {
				let _priceArray = this.getPriceKey(rpt);

				_priceArray.forEach((_price, key) => {
					if (rpt.$TOUCHED_SIDE && rpt.$TOUCHED_SIDE !== key + 1 && _priceArray.length > 1) return; // Continue to the next iteration if conditions are met
					_price = Number(_price);

					if (!priceArr.includes(_price)) 
						priceArr.push(_price);

					let side = (!rpt.$IS_OCO) ? rpt.SIDE : rpt.OCO[key].SIDE;

					if (!this.orgList[_price]) 
						this.createOrgListObj(_price);

					this.orgList[_price].rpt[side].push(rpt);
				});
			});

			// 全部資料跑完再來計算總數
			priceArr.forEach(price=>{
				this.countRpt(price, 'BUY', true);
				this.countRpt(price, 'SELL', true);
			})
		},
		// 清空指定的side 重新計算
		cleanData(price, side){		
			if(!this.orgList[price])
				this.createOrgListObj(price);
			
			let emptyRpt = {};

			if(side=="BUY")
				emptyRpt = {'BM': 0, 'BL': 0, 'BT': 0, 'BSM': 0, 'BSL': 0, 'BOCO': 0, 'BTS': 0};
			else if(side=="SELL")
				emptyRpt = {'SM': 0, 'SL': 0, 'ST': 0, 'SSM': 0, 'SSL': 0,'SOCO': 0, 'STS': 0};

			// 保留 BUY 跟SELL的LIST
			this.orgList[price].rpt = Object.assign(this.orgList[price].rpt, emptyRpt);
		},
		countRpt(price, side, first){	
			// 參數first是第一次進來時的計算，為了避免總數重複計算
			// 即時回報的話 先清空再重新計算
			if(!first)
				this.cleanData(price, side);

			const rptList = this.orgList[price].rpt;

			rptList[side].forEach(rpt=>{
				let qty = rpt.$AVAILABLE_QTY || rpt.$ORDER_QTY;//(!rpt.$IS_OCO)? rpt.ORDER_QTY: rpt.OCO[0].ORDER_QTY;
				let orderType = this.rptOrderType(rpt);
				if(side == 'BUY') {	
					// 第一次計算是等所有資料跑完才逐行計算總量，若是即時回報的話若將總量歸0，需要再次forEach去計算總量
					// 所以即時回報的總量加減會在更新回報時計算
					if(first)
						this.allBuyQty += qty;

					switch(orderType){
						case 'OCO':	rptList.BOCO += qty;
							break;
						case 'LIMIT': rptList.BL += qty;
							break;
						case 'MARKET': rptList.BM += qty;
							break;
						case 'IFTOUCHED': rptList.BT += qty;
							break;
						case 'STOPMARKET': rptList.BSM += qty;
							break;
						case 'STOPLIMIT': rptList.BSL += qty;
							break;
						case 'TRAILINGSTOP': rptList.BTS += qty;
							break;						
					}
				}
				else {
					if(first)
						this.allSellQty += qty;

					switch(orderType){
						case 'OCO':	rptList.SOCO += qty;
							break;
						case 'LIMIT': rptList.SL += qty;
							break;
						case 'MARKET': rptList.SM += qty;
							break;
						case 'IFTOUCHED': rptList.ST += qty;
							break;
						case 'STOPMARKET': rptList.SSM += qty;
							break;
						case 'STOPLIMIT': rptList.SSL += qty;
							break;
						case 'TRAILINGSTOP': rptList.STS += qty;
							break;						
					}
				}
			})
		},
		//建立map的預設資料(如果map表沒該價位的key時)
		createOrgListObj(price){
			if(!this.orgList[price]){
				let clr = this.qo.p > price ? 'clr-up' : 'clr-dn';
				let emptyObj = { 'sv': '', 'p': price , 'bv': '', '$clr': clr, 'pos':{}, 'rpt': {'BUY': [], 'BM': 0, 'BL': 0, 'BT': 0, 'BSM': 0, 'BSL': 0, 'BOCO': 0, 'BTS': 0, 'SELL': [], 'SM': 0, 'SL': 0, 'ST': 0, 'SSM': 0, 'SSL': 0,'SOCO': 0, 'STS': 0}};
				this.$set(this.orgList, price, emptyObj);
			}
		},
		// 取委託價格
		getPriceKey(rpt){
			let orderPrice = Number(rpt.ORDER_PRICE);
			switch (true) {
				case rpt.$IS_NormalOrder:	// 一般單取委託價
					return [orderPrice];
				case rpt.$IS_OCO:			// OCO取兩委託的觸發價$CONDITION_VALUE_NOR，$CONDITION_VALUE2_NOR
					return [rpt.$CONDITION_VALUE_NOR, rpt.$CONDITION_VALUE2_NOR];
				case rpt.$IS_SMO:			// 正常情境拿ORDER_PRICE, 智慧單拿$CONDITION_VALUE_NOR
					return [rpt.$CONDITION_VALUE_NOR];
				case rpt.TC_ORDER_TYPE === 'MARKET':
					return [this.priceTick(rpt.AVG_PRICE)];
				default:
					return [orderPrice];
			}
		},
		// 取最近價位
		priceTick(p = 0) {
			let ts = M4C.Symbol.getTickSize(this.sid, Number(p));
			// 回傳最低符合的檔位資料
			return this.$safeFloat(p - (p % ts)).toString();
		}	
	},
	computed: {
		availableReportList() {return this.$store.state.data.availableReportList;},
		reportList() {
			return this.availableReportList.filter(rpt => {
				let rptSymbol = rpt.$IS_OCO ? rpt.OCO[0].SYMBOL : rpt.SYMBOL;
				let isMatch = rptSymbol === this.sid;			// 過濾同商品回報(OCO跟一般單、智慧單SYMBOL欄位位置不同)
				let isComposite = rpt.SYMBOL2; 				    // 複式權委託
				let isABorder = rpt.MARKET_WATCH;				// 觸A下B
				return isMatch && !isComposite && !isABorder;   // 過濾回報
			});
		},
		ssps() {return this.$store.state.selectedSymbol.positionSum;},
		sid() {return this.$store.state.selectedSymbol.ID;},
		// 過濾買方回報
		orderBuyList(){
			return this.reportList.filter((rpt) => rpt.$SIDE == "BUY");
		},
		// 過濾賣方回報
		orderSellList(){
			return this.reportList.filter((rpt) => rpt.$SIDE == "SELL");
		},
		qop(){return this.$qoPrice;},
		bp1(){return this.qo.bp1;}, bp10(){return this.qo.bp10;},
		sp1(){return this.qo.sp1;}, sp10(){return this.qo.sp10;},
		bv1(){return this.qo.bv1;}, bv2(){return this.qo.bv2;}, bv3(){return this.qo.bv3;}, bv4(){return this.qo.bv4;}, bv5(){return this.qo.bv5;},
		bv6(){return this.qo.bv6;}, bv7(){return this.qo.bv7;}, bv8(){return this.qo.bv8;}, bv9(){return this.qo.bv9;}, bv10(){return this.qo.bv10;},
		sv1(){return this.qo.sv1;}, sv2(){return this.qo.sv2;}, sv3(){return this.qo.sv3;}, sv4(){return this.qo.sv4;}, sv5(){return this.qo.sv5;},
		sv6(){return this.qo.sv6;}, sv7(){return this.qo.sv7;}, sv8(){return this.qo.sv8;}, sv9(){return this.qo.sv9;}, sv10(){return this.qo.sv10;},
		$disObserver(){return this.$store.state.fn.$disObserver;},
	},
	watch: {
		bp1(np, op){
			this.resetVolumn();	
		},
		bv1(nv, ov){
			this.updateVolumn(nv,ov,'bp1','BUY');
		},bv2(nv, ov){
			this.updateVolumn(nv,ov,'bp2','BUY');
		},bv3(nv, ov){
			this.updateVolumn(nv,ov,'bp3','BUY');
		},bv4(nv, ov){
			this.updateVolumn(nv,ov,'bp4','BUY');
		},bv5(nv, ov){
			this.updateVolumn(nv,ov,'bp5','BUY');
		},bv6(nv, ov){
			this.updateVolumn(nv,ov,'bp6','BUY');
		},bv7(nv, ov){
			this.updateVolumn(nv,ov,'bp7','BUY');
		},bv8(nv, ov){
			this.updateVolumn(nv,ov,'bp8','BUY');
		},bv9(nv, ov){
			this.updateVolumn(nv,ov,'bp9','BUY');
		},bv10(nv, ov){
			this.updateVolumn(nv,ov,'bp10','BUY');
		},
		sp1(np, op){
			this.resetVolumn();	
		},
		sv1(nv, ov){
			this.updateVolumn(nv,ov,'sp1','SELL');
		},sv2(nv, ov){
			this.updateVolumn(nv,ov,'sp2','SELL');
		},sv3(nv, ov){
			this.updateVolumn(nv,ov,'sp3','SELL');
		},sv4(nv, ov){
			this.updateVolumn(nv,ov,'sp4','SELL');
		},sv5(nv, ov){
			this.updateVolumn(nv,ov,'sp5','SELL');
		},sv6(nv, ov){
			this.updateVolumn(nv,ov,'sp6','SELL');
		},sv7(nv, ov){
			this.updateVolumn(nv,ov,'sp7','SELL');
		},sv8(nv, ov){
			this.updateVolumn(nv,ov,'sp8','SELL');
		},sv9(nv, ov){
			this.updateVolumn(nv,ov,'sp9','SELL');
		},sv10(nv, ov){
			this.updateVolumn(nv,ov,'sp10','SELL');
		},
		qop(nv, ov) {
			if(!ov && nv){
				this.processQoData();
			}
		},
		sid(nv, ov) {
			this.cleanAllData();
			this.processQoData();
		}
	},
}
</script>