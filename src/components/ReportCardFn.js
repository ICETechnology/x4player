export default {
	data: function () {
		return {
			visibility: false,
		}
	},
	beforeMount() {
	},
	mounted() {
	},
	methods: {
		/** 點擊展開/收合圖示 */
		onBtnExpand() {
			// 總表沒有這檔商品不支援委託中的其他操作功能。
			if(!this.showExpand) return;
			this.expand = !this.expand;
			// 展開時通報上層
			if (this.expand) {
				this.$emit("onExpand", this.rpt.key, this.$refs.ctn);
				// 展開就視為關注此商品
				this.$store.commit("setSelectedSymbol", this.sid);
			}
		},
		// 改價
		onBtnModify(rpt, action){
			eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderModify', param: {rpt: rpt, action: action}});
		},
		//仓别文字
		getOCText(rpt){
			//OCO資料在rpt下沒有POSITION_EFFECT資料，所以改拿SMO裡的
			if(rpt.$IS_OCO)
				return this.$ln(rpt.OCO[0].POSITION_EFFECT + '(rp)');

			return this.$ln(rpt.POSITION_EFFECT + '(rp)');
		},
		// 買賣欄位文字
		getBSText(rpt) {
			return this.$ln(rpt.SIDE + '(rp)');
		},
		// 取得狀態欄位HTML
		getStatusClass(rpt) {
			let clr = "";
			switch(rpt.REPORT_KEY.status) {
				case "Rejected":
					clr = "clr-warn";
					break;
				case "Cancelled":
					clr = "clr-gray";
					break;
				case "PartiallyFilled":
				case "IOCFilled":
				case "Filled":
					clr = "clr-filled";
					break;                
				case "New":
				case "Repriced":
				case "Replaced":
					clr = rpt.$IS_CLOUD ? "clr-wash" : "clr-white";
					break;
				case "Reduced":
				case "PendingReplace":
				case "PendingCancel":
				case "PendingNew":
					clr = "clr-white";
					break;
			}
			// let html = `<span class="status-ctn ${clr}">${this.$ln(rpt.$STATUS)}</span>`;
			return clr;
		},
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			// console.log(`OrderReportCard.onWaypoint`, this.sid, going, direction);
			this.visibility = going === "in";
		},
		smoConditionValue(type) {
			if(type == "TRAILINGSTOP")
				return `${this.$ln('回撤')} ${this.rpt.$CONDITION_VALUE}`;
			else return this.rpt.$CONDITION_VALUE;
		},
		// tc order type轉換簡碼
		// (因原本洗價單是看SMO.CONDITION，但由於改tc order type之後，觸價單有時帶的不是iftouch代碼，因此改以tc order type判斷)
		tc_order_typeCodeMap(code){
			switch(code) {
				case "STOP":
				case "STPLMT":
					return this.$ln('停');
				case "MIT":
				case "LIT":
					return this.$ln('触');
				case "TSTOP":
				case "TSTPLMT":
					return this.$ln('移');
			}
		}
	},
	computed: {
		getOrderPriceText() {
			if (this.rpt.MARKET_WATCH) return this.$ln(`触A下B`);
			if (this.rpt.$IS_OCO) return this.$ln(`止损止盈OCO`);
			if (this.rpt.TC_ORDER_TYPE === 'UNKNOWN')
				return this.$ln(`未知单别`);
			else if((!this.rpt.$IS_OCO) && this.rpt.$IS_SMO && this.rpt.SMO) {
				let conditionCode = this.rpt.SMO.CONDITION;
				return `<div>${this.tc_order_typeCodeMap(this.rpt.TC_ORDER_TYPE)} ${this.smoConditionValue(conditionCode)}</div>
						<div>${this.$ln('委')} ${this.rpt.$ORDER_PRICE_TXT}</div>`
			}
			else return `<span class="order-price-text">${this.orderTypeText}</span><span class="order-price-value">${this.rpt.$ORDER_PRICE != 0? this.rpt.$ORDER_PRICE: ''}</span>`;
		},		
		// 委託單別文字
		orderTypeText() {
			if (this.rpt.MARKET_WATCH)
				return this.$ln(`触A下B`);
			if (this.rpt.IS_HOMOTO)
				return this.$ln("保本单");
			else if (this.rpt.$IS_OCO)
				return this.$ln(`止损止盈OCO`);
			else if (this.rpt.TC_ORDER_TYPE === 'UNKNOWN')
				return this.$ln(`未知单别`);
			// 以 TC_ORDER_TYPE 對應出來的委託別文字
			let result = this.$store.state.config.mapOrderTypeLabel[this.rpt.TC_ORDER_TYPE] || this.rpt.TC_ORDER_TYPE;
			result = this.$ln(result);
			if (result && (this.rpt.POSITION_EFFECT === "CWO" || this.rpt.POSITION_EFFECT === "CWC"))
				result += this.$ln("备兑");
			return result || "";
		},
		/** 效期別 ex. ROD/IOC/FOK */
		timeInForceText() {
			return this.rpt.TIME_IN_FORCE || this.rpt.OCO[0].TIME_IN_FORCE;
		},
		/** 本回報是否為要 hiLight 的回報 */
		hiLight() {
			return this.rpt.key === this.$store.state.sync.hiLightRptKey;
		},
		stampStatus() {
			return this.$store.state.result.queryReportResult.$STATUS;
		},
		/** 總表沒有這檔商品不支援。 */
		supportItem () {
			return M4C.Symbol.getMainformInfo(this.sid);
		},
		isWorking() {
			return this.rpt.$ISWORKING;
		},
		showExpand() {
			if(this.isWorking && !this.supportItem) return false;
			else return true;
		},
		// 觸A下B的監看設定資料
		marketWatchObj() {return this.rpt.MARKET_WATCH;},
		// 轉換觸A下B的觸發商品
		// (可能含有多組因server設計的market_watch是陣列。但因目前設計只有一組，因此先取第一組)
		triggerSymbol() {
			try {return this.marketWatchObj[0].SYMBOL;}
			catch(e) {return '';}
		},
		// 轉換觸A下B的觸發類型及觸發價
		// (可能含有多組因server設計的market_watch是陣列。但因目前設計只有一組，因此先取第一組)
		triggerValue(){
			try {
				return `${this.marketWatchObj[0].CONDITION} ${this.marketWatchObj[0].PRICE}`;
			} catch (e) {return '';}
		},
	}
}
