<template>
    <div class="store-fn-ctn hidden" />
</template>
<script>
export default {
	beforeMount() {
		this.$store.state.fn = this;
	},
    methods: {
		// 此價格跟 0 比大小回傳 class : clr-up / clr-dn / clr-ref
		$clr0(num) {
			num = parseFloat(num);
			if (num > 0)		return 'clr-up';
			else if (num < 0)	return 'clr-dn';
			else				return 'clr-ref';
		},
		// v 與 p 比大小 -> 回傳 class : clr-up / clr-dn / clr-ref
		$clrUd(v, p) {
			return v == 0 ? 'clr-ref' : (v > p ? 'clr-up' : (v < p ? 'clr-dn' : 'clr-ref'));
		},
		// 將數字三位一撇
		$commas(val) {
			if (val == null || val === '') return '--';
			let str = val == null ? '' : (''+val);
			return str.commas();
		},
		// 數量加單位 (万/M/K)
		$volUnit(val) {
			let absVal = Math.abs(val);
			if (val == 0 || val == null)
				return "0";
			// 一万以下直接显示(三位一逗点)
			else if (absVal < 10000) {
				return this.$commas(val);
			}
			/** 以萬為量的顯示單位 (未設定時使用 K/M) */
			else if (this.$store.state.config.CONFIG.UNIT_TEN_THOUSAND && this.$store.state.lang.language !== "en") {
				if (absVal < 100000000)
					return (+Big(val).div(10000)).toFixed(1) + this.$ln('万');
				else
					return (+Big(val).div(100000000)).toFixed(1) + this.$ln('亿');
			}
			// 10000 - 99999
			else if (absVal < 100000) {
				return (+Big(val).div(1000)).toFixed(1) + 'K';
			}
			// 100000 - 999999
			else if (absVal < 1000000) {
				return (+Big(val).div(1000)).toFixed(0) + 'K';
			}
			// 1000000 - 9999999
			else if (absVal < 10000000) {
				return (+Big(val).div(1000000)).toFixed(2) + 'M';
			}
			// 10000000 - 99999999
			else if (absVal < 10000000) {
				return (+Big(val).div(1000000)).toFixed(1) + 'M';
			}
			else {
				return (+Big(val).div(1000000)).toFixed(0) + 'M';
			}
		},
		// 向前相容 (addLen=揭示到跳動點數後幾位)
		$symbolPrice(sid, val, addLen=0) {
			return this.$symbolPriceX({sid, val, fillDecimal: true, addLen});
		},
		// 顯示用[價格]
		// 支持小數補0至ticksize ex. 日圓 "0.0091690"
		// 支持分數表示法 ex. 2年債 "104 8/32"
		$symbolPriceX({sid, val, fillDecimal, addLen, noDeno}) {
			// 如果是期貨價差商品且價格為0直接回傳
			if(M4C.Symbol.isPriceDiff_FutSymbol(sid) && val == 0 && val !== '') return val;
			if (val==='' || val==null || isNaN(val)) return "--";
			// 支持顯示乘數
			if (this.supportMult) {
				let minfo = M4C.Symbol.getMainformInfo(sid);
				if (minfo && minfo.PriceExpression && minfo.PriceExpression[window.comp]) {
					let mult = minfo.PriceExpression[window.comp].mult;
					if (mult != 1) {
						let multVal = +Big(val).times(mult);
						return fillDecimal ? M4C.Symbol.fillDecimalLengthWithMulti({sid, orgVal: val, multVal, addLen}) : multVal;
					}
				}
			}
			// 支持分數表示法
			if (this.supportDeno) {
				// 取得分數表示法物件 (分母不為 1 時才會有值)
				let denoObj = M4C.Symbol.getDenoObject({sid, val});
				if (denoObj)
					return noDeno? `${denoObj.integer} ${denoObj.molecular}`: `${denoObj.integer} ${denoObj.molecular}/${denoObj.deno}`;
			}
			return fillDecimal ? M4C.Symbol.fillDecimalLength(sid, val, addLen) : val;
		},
		// 顯示用 漲跌 (漲跌幅%) ex. "-0.00155 (-0.14%)""
		$symbolChgTxt(qo) {
			return this.$symbolChgTxtX({qo});
		},
		// 顯示用 漲跌 (漲跌幅%) ex. "-0.00155 (-0.14%)""
		$symbolChgTxtX({qo, mode, noDeno}) {
			let val = qo.$cg;
			// 有量卻無漲跌
			if (val == 0 && qo.v > 0) {
				return "0.00 (0.00%)";
			}
			// 無漲跌
			if (!val) {
				return '--';
			}
			// 漲跌資料
			let chgTxt = "";
			// 支持顯示乘數
			if (this.supportMult) {
				let sid = qo.s;
				let minfo = M4C.Symbol.getMainformInfo(sid);
				if (minfo && minfo.PriceExpression && minfo.PriceExpression[window.comp]) {
					let mult = minfo.PriceExpression[window.comp].mult;
					if (mult != 1)
						val = +Big(val).times(mult);
				}
			}
			// 支持分數表示法
			if (this.supportDeno) {
				let sid = qo.s;
				// 取得分數表示法物件 (分母不為 1 時才會有值)
				let denoObj = M4C.Symbol.getDenoObject({sid, val});
				if (denoObj) {
					let p1 = val > 0 ? '+' : (val < 0 ? '-' : '');
					let p2 = val > 0 ? '+' : '';
					// 依參數是否顯示分數的分母
					chgTxt = noDeno? `${p1}${denoObj.integer} ${denoObj.molecular}}`: `${p1}${denoObj.integer} ${denoObj.molecular}/${denoObj.deno}`;
					// 依模式顯示漲跌幅資料 0: 不顯示，1: oo/xx%，不帶參數，預設顯示oo (xx%);
					if(mode == 0)
						return chgTxt;
					else if(mode == 1)
						return `${chgTxt}/${p2}${qo.$cgr}`;
					else
						return `${chgTxt} (${p2}${qo.$cgr})`;
				}
			}
			let p = val > 0 ? '+' : '';
			chgTxt = `${p}${val}`;
			// 依模式顯示漲跌幅資料 0: 不顯示，1: oo/xx%，不帶參數，預設顯示oo (xx%);
			if(mode == 0)
				return chgTxt;
			else if(mode == 1)
				return `${chgTxt}/${p}${qo.$cgr}`;
			else
				return `${chgTxt} (${p}${qo.$cgr})`;
		},
		// 顯示用 漲跌 (漲跌幅%) V2 ex. "-0.00155/-0.14%"
		$symbolChgTxt_v2(qo) {
			// 改帶參數讓symbolChgTxt處理
			return this.$symbolChgTxtX({qo: qo, mode:1});
		},
		// 帶小數的四捨五入
		$roundDecimal(val, precision) {
			return Math.round(Math.round(val * Math.pow(10, (precision || 0) + 1)) / 10) / Math.pow(10, (precision || 0));
		},
		// 顯示用 錢/盈虧 ex. "+2.9" , "-104.23"
		$displayPL(val) {
			if (val==null || isNaN(val) || val==='') return "--";
			// https://trello.com/c/3BhmFL5M
			if (this.twMode)
				val = this.$roundDecimal(Number(val), 2);
			else
				val = Number(val).toFixed(1);
			return `${val>0?'+':''}${this.$commas(val)}`;
		},
		// 顯示用 金額 ex. "123,500"
		$displayMoney(val) {
			if (val==null || isNaN(val) || val==='') return "--";
			val = parseFloat(val);
			return `${this.$commas(val)}`;
		},
		// 解除響應式物件
		$disObserver(obj) {
			if(!obj) return {};
			let cache = [];
			// 處理circular structure JSON資料(原JSON.stringify在遇到circular structure結構時，會報TypeError: Converting circular structure to JSON錯誤)
			//https://stackoverflow.com/questions/11616630/how-can-i-print-a-circular-structure-in-a-json-like-format
			let str = JSON.stringify(obj, (key, value) => {
			  if (typeof value === 'object' && value !== null) {
				// Duplicate reference found, discard key
				if (cache.includes(value)) return;			
				// Store value in our collection
				cache.push(value);
			  }
			  return value;
			});
			cache = null; // Enable garbage collection
			return JSON.parse(str);
		},
		$saveComponentConfig(com, data) {
			let ucid = com.ucid || com._ucid;
			let storeData = data || com._data;
			let storageKey = `${window.projectID}|${ucid}`;
			localStorage.setItem(storageKey, JSON.stringify(storeData));
		},
		$readComponentConfig(com) {
			let ucid = com.ucid;
			let storageKey = `${window.projectID}|${ucid}`;
			return JSON.parse(localStorage.getItem(storageKey));
		},
		$sortSymbolList(sidObjList, sortBy, sortKey) {
			if(sortBy === "" || sortKey === "") return sidObjList;
			// 清單無市況資料則從核心取得。
			if(!sidObjList[0]['$qo'] || !sidObjList[0]['$qo'].sn) {
				sidObjList.forEach(obj=> {
					obj["$qo"] = M4C.Quote.getQuoteObject(obj.sid);
				})
			}
			// clone資料
			let list = [...sidObjList];
			// 依市況及欄位排序
			list.sort((a, b) => {
				// 處理有%的資料
				let aValue = a.$qo[sortKey];
				let bValue = b.$qo[sortKey];
				if(sortBy == "desc") {
					if(aValue > bValue) return -1;
					else if(aValue < bValue) return 1;
					else return 0;
				}
				else {
					if(aValue > bValue) return 1;
					else if(aValue < bValue) return -1;
					else return 0;
				}
			});
			return list;
		},
		$updatePrice(sid, val) {
			if (val === "") return "--";
			if (val === 0) return val;
			return this.$symbolPrice(sid, Number(val));
		},
		// 格式化日期將日期10碼20220427轉換為2022-04-27(沒有特別防呆處理，請小心使用)
		$formatDate(val, splitStr = '-') {
			return `${val.substr(0,4)}${splitStr}${val.substr(4,2)}${splitStr}${val.substr(6,2)}`;
		},
		// 因富邦的歐元幣別是XEU所以需要轉成匯率表支援的代碼EUR
		replaceCurrency(currency) {
			return currency === "XEU"? "EUR": currency;
		},
		// 依匯率計算資料(當前資料的幣別，目標幣別，被計算的資料)
		$exchageTrial(current, target, value) {
			let xrateData = this.$store.state.data.xRate;
			// 沒有匯率資料直接回傳，並log警告訊息
			if(!Object.keys(xrateData).length) {
				console.warn('[StoreFn|exception] $exchageTrial not have exchange rate data, check data is correctly.');
				return value;
			}
			// 替換幣別
			let _current = this.replaceCurrency(current);
			let _target = this.replaceCurrency(target);

			// 以xx計算當前幣別的匯率(xx有可能是USD、CNY，要看匯率表是以哪個幣別當KEY，目前收到的是USD)
			let curRate = xrateData[_current];
			// 以xx計算目標幣別的匯率
			let targetRate = xrateData[_target];
			// 缺少計算的資料時回傳無法試算訊息
			if(!curRate || !targetRate || !value) 
				return this.$ln('無法試算');
			else
				// 以當前幣別的匯率換算成xx的金額再乘上要轉換的幣別匯率
				return this.$safeFloat(value / curRate * targetRate);
		},
		$checkSupportedItem(sid) {
			let symbol = M4C.Symbol.toMonthSymbol(sid);	// 因.HOT代碼會找不到合約表，所以需要先轉月份代碼
			// 有商品表資料(期貨、選擇權)
			let hasContractData = M4C.Symbol.getContractInfo(symbol);
			// 總表有支援的證券資料。
			let isSupportedStock = M4C.Symbol.getMainformInfo(sid) && M4C.Symbol.getMainformInfo(sid).Type === 'S';
			return hasContractData || isSupportedStock;
		}
	},
	computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 暫時直接判斷 TW 固定支持分數 (未來若要區分再拉至pdsetting)
		supportDeno() {
			return this.twMode;
		},
		// 暫時直接判斷 TW 固定支持乘數 (未來若要區分再拉至pdsetting)
		supportMult() {
			return this.twMode;
		},
	},
}
</script>
