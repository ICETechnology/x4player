export default {
	data: function () {
		return {
		}
	},
	beforeMount() {
	},
	mounted() {
	},
	methods: {
		// resolution -> nk
		resolutionToNK(resolution) {
			switch(resolution) {
				case '1':	return '1';
				case '3':	return '1';
				case '5':	return '5';
				case '15':	return '15';
				case '30':	return '30';
				case '45':	return '15';
				case '60':	return '60';
				case '120':	return '60';
				case '180':	return '60';
				case '240':	return '60';
				case '1D':	return 'd';
				case '1W':	return 'w';
				case '1M':	return 'm';
				default:	return resolution;
			}
		},		
		// 合併資料
		collectData({sid, chartData, timeKeyList, nk}) {
			const list = [];
			for (let i = 0; i < timeKeyList.length; i += 1) {
				const key = timeKeyList[i];
				const data = this.parseData(sid, nk, key, chartData[key]);
				list.push(data);
			}
			return {
				start: list[0].time,
				end: list[list.length - 1].time,
				data: list
			};
		},
		// '201906200601' -> Date
		timeKeyToDate(s) {
			let d = new Date();
			d.setFullYear(s.substr(0,4));
			// 設定日期時要先設日再設月，不然當日期物件是3/29時設定2月會自動跳下個月3月。
			d.setDate(s.substr(6,2));
			d.setMonth(parseInt(s.substr(4,2))-1);
			d.setHours(s.substr(8,2));
			d.setMinutes(s.substr(10,2));
			d.setSeconds(0);
			return d;
		},
		// 轉化資料
		parseData(sid, nk, timeKey, data) {
			const dateStr = data.d.toString();
			const timeStr = typeof data.t === "number" ? data.t.toString().padStart(9, "0") : "000000000";
			const date = new Date(
				parseInt(dateStr.slice(0, 4)),
				parseInt(dateStr.slice(4, 6)) - 1,
				parseInt(dateStr.slice(6, 8)),
				parseInt(timeStr.slice(0, 2)),
				parseInt(timeStr.slice(2, 4)),
				parseInt(timeStr.slice(4, 6)),
				parseInt(timeStr.slice(6, 9)));

			// const date = this.timeKeyToDate(timeKey);
			let timestamp = date.getTime();
			if (isNaN(timestamp)) {
				throw new Error(`Tick info error: ${JSON.stringify(data)}`);
			}
			let volume;
			if (typeof data.q === "number") {
				volume = data.q;
			} else if (typeof data.v === "number") {
				volume = data.v;
			} else {
				volume = 0;
			}
			// 經測試 日K 需要再加 8 小時日期才會正確
			if (nk === 'd')
				timestamp += 28800000;	// 8*60*60*1000

			return {
				time: timestamp,
				open: this.getDisplayPrice(sid, data.o),
				high: this.getDisplayPrice(sid, data.h),
				low: this.getDisplayPrice(sid, data.l),
				close: this.getDisplayPrice(sid, data.c),
				volume
			};
		},
		yyyyMMdd(date) {
			const year = date.getFullYear().toString();
			const month = (date.getMonth() + 1).toString().padStart(2, "0");
			const day = date.getDate().toString().padStart(2, "0");
			return `${year}${month}${day}`;
		},
		// 顯示價格
		getDisplayPrice(sid, price) {
			const symbolPlus = this.getSymbolPlus(sid);
			return price * symbolPlus;
		},
		// 品種的價格乘數
		getSymbolPlus(sid) {
			const exgSymbolCode = this.exgSymbolCode;
			const info = M4C.Symbol.getMainformInfo(sid);
			if (typeof info !== "object" || info === null) {
				return 1;
			} else if (typeof info.PriceExpression !== "object" || info.PriceExpression === null) {
				return 1;
			}
			if (typeof info.PriceExpression[exgSymbolCode] === "object" &&
				info.PriceExpression[exgSymbolCode] !== null) {
				return info.PriceExpression[exgSymbolCode].mult || 1;
			} else if (typeof info.PriceExpression.default === "object" &&
				info.PriceExpression.default !== null) {
				return info.PriceExpression.default.mult || 1;
			}
			return 1;
		},
		getDenominator(sid) {
			const exgSymbolCode = this.exgSymbolCode;
			const info = M4C.Symbol.getMainformInfo(sid);
			if (typeof info !== "object" || info === null) {
				return 1;
			} else if (typeof info.PriceExpression !== "object" || info.PriceExpression === null) {
				return 1;
			}
			if (typeof info.PriceExpression[exgSymbolCode] === "object" &&
				info.PriceExpression[exgSymbolCode] !== null) {
				return parseFloat(info.PriceExpression[exgSymbolCode].deno) || 1;
			} else if (typeof info.PriceExpression.default === "object" &&
				info.PriceExpression.default !== null) {
				return parseFloat(info.PriceExpression.default.deno) || 1;
			}
			return 1;
		},        
		findMinimumTicksize(ticksize) {
			if (typeof ticksize !== "string") {
				return ticksize;
			}
			const ticksizeArr = ticksize.split(";");
			if (ticksizeArr.length === 1) {
				const str = ticksizeArr[0];
				const index = str.indexOf(":");
				if (index !== -1) {
					return parseFloat(str.slice(index + 1));
				}
				return parseFloat(str);
			} else if (ticksizeArr.length > 1) {
				// find minimum ticksize
				const newTickSizeArr = [];
				for (let i = 0; i < ticksizeArr.length; i += 1) {
					const str = ticksizeArr[i];
					const index = str.indexOf(":");
					let size;
					if (index !== -1) {
						size = parseFloat(str.slice(index + 1));
					} else {
						size = parseFloat(str);
					}
					if (isNaN(size)) {
						continue;
					}
					newTickSizeArr.push(size);
				}
				return Math.min(...newTickSizeArr);
			}
			throw new Error(`Invalid ticksize`);
		},
		getDigits(num) {
			let numStr = num.toString();
			let digits = 0;
			const expSign = numStr.indexOf("e");
			if (expSign !== -1) {
				const expPow = parseInt(numStr.slice(expSign + 1));
				digits -= expPow;
				numStr = numStr.slice(0, expSign);
			}
			const dotIndex = numStr.indexOf(".");
			if (dotIndex !== -1) {
				digits += numStr.length - dotIndex - 1;
			}
			if (digits < 0) {
				return 0;
			}
			return digits;
		},
		getSafeFloat(num, precision) {
			if (typeof precision !== 'number' || isNaN(precision)) {
				precision = 8;
			}
			const len = Math.pow(10, precision);
			return Math.round(num * len) / len;
		},
		isValidJson(str) {
			let result;
			try {
				result = JSON.parse(str);
			} catch (e) {
				return false;
			}
			return !!result;
		},
	},
	computed: {
		exgSymbolCode() {
			try{return vuex.config.publicPdSetting.CONFIG.TVC.exgSymbolCode;}catch(e){}
		},
	}
}
