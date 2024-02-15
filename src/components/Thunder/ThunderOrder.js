export default {
	data: function () {
		return {
			/** 買賣價位 */
			oiPrice: 0,
			/** 點擊買賣方向 : "BUY" / "SELL" / "CLOSE" */
			btnSide: "",
			/** 備兌 */
			covered: false,
			/** 點擊價位 */
			clickPrice: 0,
			/** 台灣交易所 - 倉別 */
			tw_PositionEffect: "AUTO",
		}
	},
	mounted() {
		if(!this.enterSetting.positionEffect){
			this.$set(this.enterSetting,"positionEffect", "AUTO");
			console.log('[Thunder] 觸發 settings.enter 填入 AUTO 機制');
		}
		if(!this.$store.state.thunder.settings.outer.positionEffect){
			this.$set(this.$store.state.thunder.settings.outer,"positionEffect", "AUTO");
			console.log('[Thunder] 觸發 settings.outer 填入 AUTO 機制');
		}
	},
	methods: {
		// 取委託價格(增加是否顯示乘數、分數的參數，以回傳對應格式的資料)
		getPriceKey(rpt, isMul){
			// OCO取兩委託的觸發價$CONDITION_VALUE_NOR，$CONDITION_VALUE2_NOR
			if(rpt.$IS_OCO){
				return !isMul? [rpt.$CONDITION_VALUE_NOR, rpt.$CONDITION_VALUE2_NOR]: [rpt.$CONDITION_VALUE, rpt.$CONDITION_VALUE2];
			}
			// 正常情境拿ORDER_PRICE, 智慧單拿$CONDITION_VALUE_NOR
			else {
				if(rpt.$IS_SMO)
					return !isMul? [rpt.$CONDITION_VALUE_NOR]: [rpt.$CONDITION_VALUE];
				else
					return !isMul? [rpt.ORDER_PRICE]: [this.$symbolPriceX({sid: this.sid, val: rpt.ORDER_PRICE, fillDecimal: true})];
			}
		},
		// 取得效期別資料
		getTif(oiType) {
			switch(oiType) {
				case 'MARKET':
				case 'STOP':
				case 'TSTOP':
				case 'MIT':
				case 'MWP':
					return this.isSupportIoc? 'IOC': 'ROD';
				case 'LIMIT':
				case 'STPLMT':
				case 'TSTPLMT':
				case 'LIT':
					return 'ROD';
				default:
					break;
			}
		},
		//取消買方委託單。
		cancelBuyOrder(){
			// 未登入交易帳號 -> 彈出登入交易帳號視窗
			if (!M4C.Trader.checkLoginTrade()) return;

			let self = this;
			let list = this.reportList.filter(list => {
				let side = (!list.$IS_OCO)? list.SIDE: list.OCO[0].SIDE == "BUY" || list.OCO[1].SIDE == "BUY"? "BUY": "SELL";
				return side == 'BUY';
			});
			if(list.length){
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `撤买`,
					content: self.$ln(`确认要将全部委买单共 {0} 手删除？`).format(self.allBuyQty),
					confirm: () => {
						M4C.Order.cancelOrderByReport(list, self.selfComName);
					}
				});
			}
		},
		//取消賣方委託單。
		cancelSellOrder(){
			// 未登入交易帳號 -> 彈出登入交易帳號視窗
			if (!M4C.Trader.checkLoginTrade()) return;

			let self = this;
			let list = this.reportList.filter(list => {
				let side = (!list.$IS_OCO)? list.SIDE: list.OCO[0].SIDE == "SELL" || list.OCO[1].SIDE == "SELL"? "SELL": "BUY";
				return side == 'SELL';
			});
			if(list.length){
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `撤卖`,
					content: self.$ln(`确认要将全部委卖单共 {0} 手删除？`).format(self.allSellQty),
					confirm: () => {
						M4C.Order.cancelOrderByReport(list, self.selfComName);
					}
				});
			}
		},
		//取消全部委託單。	
		cancelAllOrder(){
			// 未登入交易帳號 -> 彈出登入交易帳號視窗
			if (!M4C.Trader.checkLoginTrade()) return;

			let self = this;
			let allQty = self.allBuyQty + self.allSellQty;
			if(allQty){
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `全撤`,
					content: self.$ln(`确认要将全部委托单共 {0} 手刪除？`).format(allQty),
					confirm: () => {
						M4C.Order.cancelOrderByReport(this.reportList, self.selfComName);
					}
				});
			}
		},
		//取消委託單
        cancelOrder(rptMap){
			let self = this;
			let cancelMap = rptMap;
			//是否跳出確認視窗
			if(this.$store.state.thunder.settings.other.orderConfirm){
				// 提示确认视窗
				let bsText = cancelMap[0].$SIDE=="BUY" ? this.$ln('撤买') : this.$ln('撤卖');
				let Qty = 0;
				cancelMap.forEach((el, key) => {
					let rptQty = el.$AVAILABLE_QTY;//el.$IS_OCO? el.OCO[0].ORDER_QTY: el.ORDER_QTY;
					Qty += rptQty;
				 });
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `${ M4C.Symbol.getCNM4(this.sid)}`,
					content: `${this.getPriceKey(cancelMap[0], true)}, ${bsText} ${Qty} ${this.$ln('手')}`,
					confirm: () => {
						M4C.Order.cancelOrderByReport(cancelMap, self.selfComName);
					}
				});
			}
			else{
				M4C.Order.cancelOrderByReport(cancelMap, self.selfComName);
			}
		},
		// 主要處理當啟用一定範圍市價時將MARKET改為RANGED
		getOrderType(type){
			if(this.$store.state.thunder.useRangeMarket && this.isMWP && type === "MARKET")
				return "MWP";
			else return type;
		},
		// 計算出場觸發價
		getOCOTrgPrice(price, side, tsQty) {
			let oiPrice = this.oiOrderPrice || this.oiPrice || price || this.qo.p;
			return this.$safeFloat(oiPrice + (tsQty * this.tsi * side));
		},
		// 計算出場委託價
		getProtectOrderPrice(trgPrice , side, tsQty, tif, tcOrderType) {
			let price = 0;
			// 市價類的委託別(目前閃電有處理的)
			let marketTypeList = ['MARKET', 'MIT', 'STOP', 'TSTOP'];
			// 限價委託但帶觸發價0
			if(marketTypeList.indexOf(tcOrderType ) < 0 && trgPrice == 0) {
				trgPrice = this.qo.p;
			}
			// 限價計算觸發價及加掛檔位
			if(tif != 'IOC')
				price = this.$safeFloat(trgPrice + (tsQty * this.tsi * side));
			return price;
		},
		// 出場委託資料
		getOiProtect(_side) {
			// 進場方向
			let side = typeof _side == 'string'? _side: _side.side;
			// 計算加減
			let NP = side == 'BUY'? 1: -1;
			// 基礎價格
			let price = typeof _side == 'string'? 0: _side.price;
			// 盈利檔位數量
			let plQty = 0;
			// 檔位數量
			let tsQty = 0;
			// 市價類的委託別(目前閃電有處理的)
			let marketTypeList = ['MARKET', 'MIT', 'STOP', 'TSTOP'];
			// 有設定出場
			if(this.protectType.length){
				// 出場委託資訊
				let oiProtectObj = {
					'ACTION': 'NEW'
				};
				// 出場方向
				let oppoSide = side == "BUY"? "SELL": "BUY";
				// 出場OCO設定
				if(this.protectType.length > 1){
					oiProtectObj.OCO = [];
					oiProtectObj.SMO_TYPE = 'SMO';
				}
				for(let i = 0; i < this.protectType.length; i++) {
					let protectType = this.protectType[i];
					let protectObj = {};
					let type = "";
					let tif = "";
					Object.assign(protectObj, this.protectBaseOi);
					// 因protectSP、SL、TS是響應式的，所以需要用複制的方式，而不是指派。
					switch(protectType) {
						// 止盈
						case "STOPPROFIT":
							// 盈利檔位需以買賣方向調整正負
							plQty = this.$store.state.thunder.settings.outer.protectSPTicksize * NP;
							// TOUCHED會需要client帶正負號
							tsQty = this.$store.state.thunder.settings.outer.spSmoTicksize * -NP;
							type = this.getOrderType(this.$store.state.thunder.settings.outer.protectSPType);
							tif = this.spTIF;
							protectObj.TRIGGER_LEVEL = plQty;
							break;
						// 止損
						case "STOPLOSS":
							plQty = this.$store.state.thunder.settings.outer.protectSLTicksize;
							tsQty = this.$store.state.thunder.settings.outer.slSmoTicksize;
							type = this.getOrderType(this.$store.state.thunder.settings.outer.protectSLType);
							tif = this.slTIF;
							protectObj.TRIGGER_LEVEL = plQty;
							break;
						// 移動停損
						case "TRAILINGSTOP":
							plQty = this.tsTrg_TS_LEVEL;
							tsQty = this.$store.state.thunder.settings.outer.tsSmoTicksize;
							type = this.getOrderType(this.$store.state.thunder.settings.outer.protectTSType);
							tif = this.tsTIF;
							protectObj.TRAILING_TYPE = "TICKSIZE";
							protectObj.TRAILING_VALUE = Number(this.tsTrg_TS_LEVEL);
							protectObj.ORDER_PRICE = 0;
							break;
					}
					protectObj.TC_ORDER_TYPE = this.getOrderType(type);
					protectObj.TIME_IN_FORCE = tif;
					// 出場市價單不另帶TS_LEVEL
					if(marketTypeList.indexOf(protectObj.TC_ORDER_TYPE) < 0)
						protectObj.TS_LEVEL = tsQty;
					else
						protectObj.ORDER_PRICE = 0;
					protectObj.ORDER_TYPE = this.addMwpOrdertype(protectObj.TC_ORDER_TYPE);
					protectObj.SIDE = oppoSide;
					protectObj.POSITION_EFFECT = this.$store.state.thunder.settings.outer.positionEffect;
					if(this.protectType.length > 1){
						oiProtectObj.OCO[i] = protectObj;
					}
					else {
						oiProtectObj = Object.assign(oiProtectObj, protectObj);
					}
				}
				return oiProtectObj;
			}
		},
		//發委託單
		sendOrder(config = {}){
			this.oiPrice = this.clickPrice = config.price;
			this.btnSide = config.side;
			let oi = this.orderInfo;
			// 市買、市賣帶參數過來時調整欄位資料。
			if(config.type){
				oi.TC_ORDER_TYPE = this.getOrderType(config.type);
				oi.TIME_IN_FORCE = this.getTif(oi.TC_ORDER_TYPE);
				oi.ORDER_PRICE = config.type == 'MARKET'? 0: oi.ORDER_PRICE;
			}
			console.log(`ThunderOrder.orderInfo: `, JSON.stringify(oi, null, 2));
			//是否跳出確認視窗
			if(this.$store.state.thunder.settings.other.orderConfirm){
				let options = {orderInfo: oi};
				if(typeof config.CB === 'function')
					options.onConfirmCallback = config.CB;
				// 彈出下單確認頁
				eventBus.$emit("POPUP-DIALOG", 'OrderConfirm', options, {transName: 'float'});
			}
			else{
				M4C.Order.sendOrder(oi);
				if(typeof config.CB === 'function') config.CB();
			}
		},
		isMarketOrder(type) {
			let typeAry = ['MARKET', 'STOP', 'TSTOP', 'MIT', 'MWP'];
			return typeAry.indexOf(type) != -1;
		},
		// 有設定一定範圍市價時，且該商品有支持這個類型，洗價市價單加帶ORDER_TYPE(告知SERVER需要轉一定範圍市價)
		addMwpOrdertype(type) {
			// 一定範圍市價不另外帶MWP
			if(type == "MWP") return;
			if(this.$store.state.thunder.useRangeMarket && this.isMWP && this.isMarketOrder(type)) {
				return 'RANGED';
			}
		},
	},
	computed: {

		// 停損下單區塊
		isStopOrderBlock() {
			return (this.oiSide == "BUY" && this.oiPrice > this.qo.p) || (this.oiSide == "SELL" && this.oiPrice < this.qo.p);
		},
		tsi() {return M4C.Symbol.getTickSize(this.sid, this.qo.p);},
		psd() {return this.$store.state.selectedSymbol.positionSum;},
		//跳價(Tick Size * 設定的跳數)
		// jumpPrice() {return Big(this.tsi).times(this.$store.state.thunder.settings.other.stopJump);},
		// 進場設定
		enterSetting() {return this.$store.state.thunder.settings.enter;},
		// 進場委託別
		enterType() {return this.$store.state.thunder.enterType;},
        // 台灣模式
        twMode(){
            return this.$store.state.config.CONFIG.OPERATING_MODE === 'tw';
		},
		orderTypeList() {return M4C.Symbol.getOrderType(this.sid).split(';');},
		// 是否可用一定範圍市價
		isMWP() {return this.orderTypeList.indexOf("MWP") != -1},
		// 進場委託別
		enterOrderType() {
			// 觸價單以進場設定取委託別
			if(this.enterType == "T")
				return this.$store.state.thunder.settings.enter.touchOrderType;
			// oco單以進場設定取委託別
			else if(this.enterType == "O")
				return this.$store.state.thunder.settings.enter.ocoOrderType;
			// 停損市價單
			if(this.enterType == "Sm")
				return "STOP";
			if(this.enterType == "Sl")
				return "STPLMT";
			else
				return "LIMIT";
		},
		/** 委託單 : 買賣別 */
		oiSide() {
			let result = this.btnSide;
			// 平淨倉
			if (this.btnSide === "CLOSE") {
				result = this.psd.$NET_QTY > 0 ? "SELL" : "BUY";
			}
			return result;
		},
		isStock() {return this.sid.split(".")[1] === "S"},
		// 台灣版且不是選擇權也不是價差期貨才顯示當沖
		dayTrade() {return this.twMode && !this.isOpt && !this.isDiffSymbol? this.$store.state.order.dayTrade: false;},
		/** 委託單 : 倉別 */
		oiPositionEffect() {
			// TW情境
			if (this.twMode) {
				return this.dayTrade ? "DAYTRADE" : this.tw_PositionEffect;
			}
			// 證券一律給AUTO
			if (this.isStock) {
				return "AUTO";
			}
			// 買賣按鈕一律帶 "OPEN" by https://trello.com/c/pYl8PPwm
			if (this.oiSide === "BUY" || this.oiSide === "SELL")
				return "OPEN";
			return "AUTO";
		},
		/** 委託單 : 委託別 */
		oiOrderType() {
			let type = "LIMIT";
			// 在停損下單區塊且是停損市單以市價委託。
			if(this.isStopOrderBlock && (this.enterType === "Sm"))
				type = "STOP";
			else if(this.isStopOrderBlock && (this.enterType === "Sl"))
				type = "STPLMT";
			// 不在停損區塊內的停損單及停損限價單階以限價委託。
			else if(((!this.isStopOrderBlock) && this.enterType === "Sm") || this.enterType === "Sl")
				type = "LIMIT";
			else {
				// 非停損單以設定取委託別，其他以現價做委託別。
				type = this.enterOrderType;
			}

			return this.getOrderType(type);
		},
		// 交易所層級的委託類型資料。
		exgOrdertypeObj() {
			// 以 UFX 為例，若 OrderTypes.UFX 不存在時，使用 OrderTypes.default
			return this.exgOrderTypes[this.brokerSystem] || this.exgOrderTypes.default;
		},
		/** 
		 * 委託單 : 校期别 (自動判斷)
		 * 進場效期別(以TimeInForceSelector判斷方式處理，取第一個效期別當進場的效期別設定，如果取不出預期資料，則以市價IOC、限價ROD回傳)
		 */
		oiTimeInForce() {
			let odObjList = this.exgOrdertypeObj;
			if (Array.isArray(odObjList)) {
				let odObj = odObjList.find(od => od.name===this.oiOrderType);
				if (odObj && odObj.types) {
					// 返回第一個效期別資料
					return odObj.types[0];
				}
				else {
					// 無該委託別設定資料時，返回市價IOC限價ROD的判斷結果
					return this.getTif(this.oiOrderType);
				}
			}
			else {
				// 無法從總表取得設定時，返回市價IOC限價ROD的判斷結果
				return this.getTif(this.oiOrderType);
			}
		},
		// 該商品市價是否有支援IOC
		isSupportIoc() {
			let odObjList = this.exgOrdertypeObj;
			if (Array.isArray(odObjList)) {
				let odObj = odObjList.find(od => od.name === "MARKET");
				if (odObj && odObj.types) {
					return odObj.types.find(tif => tif === "IOC");
				}
			}
		},
		// 出場方向
		protectSide() {
			if(this.enterType == "O")
				return this.$store.state.thunder.ocoOrder[0].side == "BUY"? "SELL": "BUY";
			if(this.oiSide == "BUY")
				return "SELL";
			else return "BUY";
		},
		// 出場position_effect
		protectPE() {
			// TW情境
			if (this.twMode) {
				return this.dayTrade ? "DAYTRADE" : this.tw_PositionEffect;
			}
			else return "CLOSE";
		},
		// 出場委託類型
		protectType() {return this.$store.state.thunder.protectType;},
		// 出場-止盈效期別
		spTIF(){
			return this.getTif(this.$store.state.thunder.settings.outer.protectSPType);
		},
		// 出場-止損效期別
		slTIF(){
			return this.getTif(this.$store.state.thunder.settings.outer.protectSLType);
		},
		// 出場-移動停損效期別
		tsTIF(){
			return this.getTif(this.$store.state.thunder.settings.outer.protectTSType);
		},
		//出場-移動停損目標價檔位
		tsTrg_TS_LEVEL() {
			return this.$store.state.thunder.settings.outer.protectTSTicksize;
		},
		// 保護單資料
		protectBaseOi() {
			let oiObj = {
				"SYMBOL": this.sid,
				"SIDE": this.protectSide,
				"POSITION_EFFECT": this.protectPE,
			}
			// 單邊時才加SMO_TYPE, OCO時不加
			if(this.protectType.length == 1)
				oiObj.SMO_TYPE = "SMO";
			return oiObj;
		},		
		// 進場oco委託類型
		ocoEnterType() {return this.enterSetting.ocoEnterType;},
		// 進場oco腳1
		ocoOrderType1() {
			return this.getOrderType(this.enterSetting.ocoOrderType);
		},
		// 進場oco腳2
		ocoOrderType2() {
			return this.getOrderType(this.enterSetting.ocoOrderType);
		},
		// 進場oco價1
		ocoOrderPrice1() {
			let jumpPrice = this.$safeFloat(this.tsi * this.enterSetting.ocoOrderTicksize);
			// 市價委託價0
			if(this.ocoOrderType1 === "MIT" || this.ocoOrderType1 === "MWP") return 0
			// OCO第一邊為買方
			else if(this.$store.state.thunder.ocoOrder[0] && this.$store.state.thunder.ocoOrder[0].side == "BUY")
				return this.$safeFloat(this.$store.state.thunder.ocoOrder[0].price + jumpPrice);
			// OCO第一邊為賣方時
			else if(this.$store.state.thunder.ocoOrder[0]) return this.$safeFloat(this.$store.state.thunder.ocoOrder[0].price - jumpPrice);
			// 進場策略代碼是3時(暫時用不到)
			return this.ocoEnterType === 3 ? this.$store.state.thunder.ocoOrder[0].price : 0;
		},
		// 進場oco價2
		ocoOrderPrice2() {
			let jumpPrice = this.$safeFloat(this.tsi * this.enterSetting.ocoOrderTicksize);
			if(this.ocoOrderType2 === "MIT" || this.ocoOrderType2 === "MWP") return 0
			else if(this.$store.state.thunder.ocoOrder[1] && this.$store.state.thunder.ocoOrder[1].side == "BUY")
				return this.$safeFloat(this.$store.state.thunder.ocoOrder[1].price + jumpPrice);
			else if(this.$store.state.thunder.ocoOrder[1]) return this.$safeFloat(this.$store.state.thunder.ocoOrder[1].price - jumpPrice);
			return this.ocoEnterType === 2 ? this.$store.state.thunder.ocoOrder[1].price : 0;
		},
		// 進場oco觸發類型1
		smoCondition1() {	// [1震盪策略] 與 [3區間做空] => IFTOUCHED
			return "IFTOUCHED";
		},
		// 進場oco觸發類型2
		smoCondition2() {	// [1震盪策略] 與 [2區間做多] => IFTOUCHED
			return "IFTOUCHED";
		},
		// 進場OCO委託資料
		oiOcoInfo() {
			if(this.$store.state.thunder.ocoOrder.length){
				let OCO = [{
					"SYMBOL": this.sid,
					"SIDE": this.$store.state.thunder.ocoOrder[0].side,
					"POSITION_EFFECT": this.enterSetting.positionEffect,
					"TC_ORDER_TYPE": this.ocoOrderType1,
					"TIME_IN_FORCE": this.getTif(this.ocoOrderType1),
					"ORDER_PRICE": Number(this.ocoOrderPrice1),
					"ORDER_QTY": this.$store.state.thunder.orderQty,
					"TOUCH_PRICE": Number(this.$store.state.thunder.ocoOrder[0].price),
					"ORDER_TYPE": this.addMwpOrdertype(this.ocoOrderType1),
				}, {
					"SYMBOL": this.sid,
					"SIDE": this.$store.state.thunder.ocoOrder[1].side,
					"POSITION_EFFECT": this.enterSetting.positionEffect,
					"TC_ORDER_TYPE": this.ocoOrderType2,
					"TIME_IN_FORCE": this.getTif(this.ocoOrderType2),
					"ORDER_PRICE": Number(this.ocoOrderPrice2),
					"ORDER_QTY": this.$store.state.thunder.orderQty,
					"TOUCH_PRICE": Number(this.$store.state.thunder.ocoOrder[1].price),
					"ORDER_TYPE": this.addMwpOrdertype(this.ocoOrderType2),
				}];
				// 出場
				for(let i = 0; i < this.$store.state.thunder.ocoOrder.length; i++){
					OCO[i].SUB_ORDER = this.getOiProtect(this.$store.state.thunder.ocoOrder[i]);
				}
				return OCO;
			}
		},
		oiConditionType(){
			return "NORMAL";
		},
		oiOrderPrice() {
			// 觸價單
			if(this.enterType == "T") {
				// 加掛 N 檔位
				let diff = this.$safeFloat(this.enterSetting.touchOrderTicksize * this.tsi);
				// 市價回傳0
				if(this.enterOrderType == "MIT")	return 0;
				// 限價依方向加減檔位。
				else if (this.oiSide === 'BUY'){
					return this.$safeFloat(this.clickPrice + diff);
				}
				else return this.$safeFloat(this.clickPrice - diff);
			}
			// 停損限價
			if(this.enterType == "Sl"){
				// 限價加掛 N 檔作為停損限價 PS. 尚未確認買賣加掛要加減的方向
				let diff = this.$safeFloat(this.enterSetting.stopOrderTicksize * this.tsi);
				// 依方向加減檔位。
				if (this.oiSide === 'BUY')
					return this.$safeFloat(this.clickPrice + diff);
				else
					return this.$safeFloat(this.clickPrice - diff);
			}
			// 停損市價
			if(this.enterType == "Sm"){
				// 非點擊停損委託區(買比現價高、賣比現價低)，改帶限價。
				if(this.oiOrderType == 'LIMIT')
					return this.clickPrice;
				return 0;
			}
			// OCO單
			if(this.enterType == "O"){
				// 加掛 N 檔位
				let diff = this.$safeFloat(this.enterSetting.ocoOrderTicksize * this.tsi);
				// 市價回傳0
				if(this.isMarketOrder(this.enterOrderType))	return 0;
				// 限價依方向加減檔位。
				else if (this.oiSide === 'BUY')
					return this.$safeFloat(this.clickPrice + diff);
				else
					return this.$safeFloat(this.clickPrice - diff);
			}
			// 其他情境
			return this.enterOrderType == "MARKET"? 0: this.oiPrice;
		},
		/** 停損價 */
		oiStopPrice() {
			if((!this.twMode) || (!this.isStopOrderBlock) || this.oiConditionType == "NORMAL") return;
			else return this.clickPrice;
		},
		/** 下單內容 */
		orderInfo() {
			let oiObj = {
				'ACTION': 'NEW',			// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.sid,
				'SIDE': this.oiSide,					// 買BUY/賣SELL
				'POSITION_EFFECT': this.oiPositionEffect,	// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': this.oiOrderType,		// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': this.oiTimeInForce,		// ROD/IOC/FOK
				'ORDER_PRICE': this.oiOrderPrice,
				'ORDER_QTY': Number(this.$store.state.thunder.orderQty),
				'AP_PLUGIN': this.useComName || this.selfComName,
				'SMO_TYPE': 'NONE',
				"ORDER_TYPE": this.addMwpOrdertype(this.oiOrderType),
			};
			// smo單(非一般單及oco單)
			if(this.oiOrderType != 'MARKET' && this.oiOrderType != "LIMIT" && this.enterType != "O") {
				if(this.enterType == 'Sm' || this.enterType == 'Sl') oiObj.STOP_PRICE = this.oiPrice;
				else if(this.enterType == 'T') oiObj.TOUCH_PRICE = this.oiPrice;
			}
			// OCO單
			if(this.enterType == "O") {
				oiObj = {
					'ACTION': 'NEW',
					'AP_PLUGIN': this.useComName || this.selfComName,
					'OCO': this.oiOcoInfo,
				};
			}
			if(this.enterType == "T" || this.enterType == "O") {
				oiObj.SMO_TYPE = 'SMO';					// 指定由誰洗價SMO: Dcore, NONE: 上手。(進場只有觸價、OCO需要Dcore洗)
			}
			// 出場
			if(this.protectType.length > 0 && this.enterType != "O"){
				oiObj.SUB_ORDER = this.getOiProtect(this.oiSide);
			}
			return oiObj;
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		brokerInfo() {
			return this.$store.state.brokerMap[this.brokerID] || {};
		},
		brokerSystem() {
			return this.brokerInfo.system || 'default';
		},
		// 交易所層級的總表
		exgOrderTypes() {
			try{return M4C.Symbol.getMainformInfo(this.sid.split('.').slice(0,3).join('.')).OrderTypes;}catch(e){return {};}
		},
		// 是否為期權商品
		isOpt() {return M4C.Option.isOpt(this.sid);},
		// 是否為價差商品
		isDiffSymbol() {return M4C.Symbol.isPriceDiff_FutSymbol(this.sid);},
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
}