<template>
	<NormalDist :mean="mean" :var="Variables" ref="normalDist"/>
</template>
<script>
import NormalDist from '@/lib/NormalDist'
export default {
	data() {
		return {
			mean: 0,
			Variables: 1,
			market_rate1: 0.015, // 年化市场无风险利率（年化） for 中國
        	market_rate2: 0.00388, // 年化市场无风险利率（年化） for 台灣
        	market_rate: this.market_rate1,
		}
	},
	props:['contracts', 'list_bep_price'],
	beforeMount() {
		// 設定市場風險利率
		this.market_rate = this.market_rate1;
		M4C.Quote.sub(this.underlyingF, this);
		M4C.Quote.sub(this.underlyingS, this);
	},
	beforeDestroy() {
		// 合成期貨解訂閱
		if(this.underlyingF.indexOf('_U') != -1)
			M4C.Quote.unsub(this.underlyingF, this);
		
		M4C.Quote.unsub(this.underlyingS, this);
	},
	methods: {
		// 計算各損益兩平點的累積分布函數
		CalcProb() {
			let list_prob = [];
			try {
                let list_CDP = [];
                for (let idx = 0; idx < this.list_bep_price.length; idx++){
					let bep_price = this.list_bep_price[idx];
                    let d2 = this.D2(bep_price, this.target_hv_w26, this.remainDays);
                    let CDP = this.$refs.normalDist.CDF(d2);
					// console.log(`CalcProb  bep_price:${bep_price} target_hv_w26:${this.target_hv_w26} left_day:${this.remainDays} D2:${d2} CDF:${CDP}`);
                    list_CDP.push(CDP);
                }
				for (let i = 0; i < list_CDP.length; i++){
                    let CDP = list_CDP[i];
                    if (i == 0)
                        list_prob.push(1 - CDP);
                    else
                        list_prob.push(list_CDP[i - 1] - CDP);
                }
                if (list_CDP.length > 0)
                    list_prob.push(list_CDP[list_CDP.length - 1]);
            } catch (Exception) {}
            return list_prob;
		},
		// 公式: d2(BP)=[ln(S0/BP)+(r-0.5*〖HV〗^2 )*t]/(HV*√t)
        D2(BP, m_sigma, left_day = -1) {
            let d2 = 0;
            try {
                let sigma = m_sigma / 100;
                let t = 0;
                t = this.CalcTime(left_day);
				// console.log(`D2 target_price:${this.target_price} BP:${BP} m_sigma:${m_sigma} output left_day、 CalcTime is`, left_day, t);
                // 最小分鐘為 60
                t = Math.max(t, 60 / (this.YearDays * 1440));
                let r = this.market_rate;
                // if (this.target_price <= 0)
                //     this.target_price = this.target_price_underlying;
                d2 = (Math.log(this.target_price / BP, Math.E) + (r - 0.5 * Math.pow(sigma, 2)) * t) / (sigma * Math.sqrt(t)); // Math.E == Math.Exp(1)

                if (Number.IsInfinity(d2) || isNaN(d2))
                    d2 = 0;
            } catch (Exception) {}
            return d2;
        },
		// 計算交易剩餘時間佔今年時間比率
		CalcTime(t) {
            try {
				let expirationDate = this.contractInfo.ExpirationDate;
				let expirYear = Number(expirationDate.substr(0, 4));	// 到期日-年
				let expirMonth = Number(expirationDate.substr(4,2));	// 到期日-月
				let expirDate = Number(expirationDate.substr(6,2));		// 到期日-日
				let closeHM = this.openCloseTime.close;
				let closeHour = Number(closeHM.substr(0,2));			// 收盤時間-時
				let closeMinute = Number(closeHM.substr(2,2));			// 收盤時間-分
                let total_minute = 0;
                if (t == 0) {	// 到期日當天
                    // settlement day
                    let time1 = Date.now() / 60000;
                    let time2 = Date.parse(this.closeDateTime) / 60000;	// 取分鐘
                    if (time2 > time1) {
                        let timeSpan1 = this.$safeFloat(time2 - time1);
                        total_minute += timeSpan1;
                    }
                    else
                        total_minute = 0;
                }
                else if (t == 1) {// 到期日前一天
                    // today
                    let dateTime1 = new Date().getTime();
                    let dateTime2 = new Date(dateTime1 + (24*60*60000)).resetTime("").getTime();	// 取當日24點
                    let timeSpan1 = this.$safeFloat(Math.floor((dateTime2 - dateTime1) / 60000));	// 今日剩餘分鐘
                    total_minute += timeSpan1;
                    // settlement day
                    let time1 = new Date(expirYear, expirMonth, expirDate, 0, 0, 0).getTime();
                    let time2 = new Date(expirYear, expirMonth, expirDate, closeHour, closeMinute, 0).getTime(); // 取到分
                    let timeSpan2 = this.$safeFloat((time2 - time1) / 60000);
					// console.log('time1, time2, timeSpan2', time1, time2, timeSpan2);
                    total_minute += timeSpan2;
                }
                else {
                    // today
                   	let dateTime1 = new Date().getTime();
                    let dateTime2 = new Date(dateTime1 + (24*60*60000)).resetTime("").getTime();	// 取當日24點
                    let timeSpan1 = this.$safeFloat(Math.floor((dateTime2 - dateTime1) / 60000));	// 今日剩餘分鐘
					// console.log('dateTime1, dateTime2, timeSpan1', dateTime1, dateTime2, timeSpan1);
                    total_minute += timeSpan1;
                    // settlement day
                    let time1 = new Date(expirYear, expirMonth, expirDate, 0, 0, 0).getTime();
                    let time2 = new Date(expirYear, expirMonth, expirDate, closeHour, closeMinute, 0).getTime(); // 取到分
                    let timeSpan2 = this.$safeFloat((time2 - time1) / 60000);
					// console.log('time1, time2, timeSpan2', time1, time2, timeSpan2);
                    total_minute += timeSpan2;
                    // other day
                    total_minute += 1440 * (t - 2);	// 扣掉今日及結算日
                }
                return this.$safeFloat(total_minute / (this.YearDays * 1440));
            }
            catch (Exception) {return 0;}
        },
		// 計算機率密度函數
		CalcPDF(strike) {
            let pdf = 0;
            try {
                if (this.target_price == 0)
                    return pdf;
                let hv = this.target_hv_w26 / 100;
                let t = this.CalcTime(this.remainDays);
                let r = this.market_rate;
                // 最小分鐘為 60
                t = Math.max(t, 60 / (this.YearDays * 1440));
                let z = ((Math.log( this.target_price / strike) + (r - 0.5 * Math.pow(hv, 2)) * t) / (hv * Math.sqrt(t)));
				// console.log(`CalcPDF with strike ${strike} z is`, z);
                pdf = this.$refs.normalDist.PDF(z);
            }
            catch (Exception) { }
			// console.log(`CalcPDF with strike ${s} is`, pdf);
            return pdf;
        },
		CalcPDFList(strikeList) {
			let list = [];
			for(let i = 0; i < strikeList.length; i++) {
				list.push(this.CalcPDF(strikeList[i]));
			}
			return list;
		},
		// '201906200601' -> Date
		timeKeyToDate(s, crossDay) {
			let d = new Date();
			d.setFullYear(s.substr(0,4));
			d.setMonth(parseInt(s.substr(4,2))-1);
			d.setDate(s.substr(6,2));
			d.setHours(s.substr(8,2));
			d.setMinutes(s.substr(10,2));
			d.setSeconds(0);
			// 有跨日加算一天
			if(crossDay) {
				let timeStamp = Date.parse(d) + crossDay*24*60*60000;
				d = new Date(timeStamp);
			}
			return d;
		},
	},
	components: {NormalDist},
	watch: {
		underlyingF(nv, ov) {
			// 合成期貨訂閱、解訂閱
			if(nv.indexOf('_U') != -1)
				M4C.Quote.sub(nv, this);
			if(ov.indexOf('_U') !=-1)
				M4C.Quote.unsub(ov, this);
		},
		underlyingS(nv, ov) {
			M4C.Quote.unsub(ov, this);
			M4C.Quote.sub(nv, this);
		},
	},
	computed: {
		// 因策略下單會另外彈出商品詳情，並重設關注商品，導致取sid異常。因此以contracts帶入，並以第一個合約當sid。
		sid() {return this.contracts[0];},
		minfo() {return M4C.Symbol.getMainformInfo(this.sid);},
		underlyingS() {return M4C.Symbol.mapHotMonth[this.minfo.Underlying.S] || this.minfo.Underlying.S;},
		underlyingF() {return this.minfo.Underlying.F;},
		underlyingSQO() {return M4C.Quote.getQuoteObject(this.underlyingS)},
		underlyingFQO() {return M4C.Quote.getQuoteObject(this.underlyingF)},
		// 開收盤時間
		openCloseTime() {return M4C.Symbol.getOpenCloseTime(this.sid);},
		// 收盤日時間
		closeDateTime() {
			// 開收盤時間
			let oc = this.openCloseTime;
			if (oc === null) {
				this.$store.state.notify(`error`, `商品开收盘时间异常`);
				return null;
			}
			// 開盤時間 > 收盤時間 => 表示本商品為跨日商品 (香港期貨交易所) -> 需略過本日，直接找前一日的開盤時間 (避免已經超過當日的開盤時間時，會找到本日的開盤時間Data，導致異常)
			let isCrossDay = oc.start > oc.close ? 1 : 0;
			// 開盤日期時間
			let closeDT = this.contractInfo ? new Date(this.contractInfo.TradingHours.slice(-1)[0].close)
				: this.timeKeyToDate(`${this.quoteObject.td}${oc.close}`, isCrossDay); 
			return closeDT;
		},
		// 今年天數
		YearDays() {
			let oneDay = 24*60*60000;
			let dt = new Date();
			let s = new Date(dt.getFullYear(), 0, 1);	// 1/1
			let e = new Date(dt.getFullYear(), 12, 0);	// 12/31
			let days = (Date.parse(e) - Date.parse(s)) / oneDay + 1;
			return days;
		},
		// 合約資訊
		contractInfo() {return M4C.Symbol.getContractInfo(this.sid);},
		// 取hv26 > HV20 > hv4
		target_hv_w26() {return this.underlyingSQO.hv26 || this.target_hv_w20 || this.target_hv_w4;},
		target_hv_w20() {return this.underlyingSQO.HV20;},
		target_hv_w4() {return this.underlyingSQO.hv4;},
		// 剩餘日
		remainDays() {
			let expireTime = new Date().resetDate(this.contractInfo.ExpirationDate).resetTime("000000");
			let todayTime = new Date().resetTime("000000");
			return Math.round((expireTime - todayTime) / 86400000);
		},
		// 標的現價
		target_price_underlying() {return this.underlyingSQO.p;},
		// 目標價格(合成期貨現價 > 標的現價)
		target_price() {
			// 合成期貨現價 > 標的現價
			if(this.underlyingF.indexOf('_U') != -1) {
				return this.underlyingFQO.p > 0? this.underlyingFQO.p || this.target_price_underlying: this.target_price_underlying;
			}		
			// 標的現價
			else {
				return this.target_price_underlying;
			}
		},
	},
}
</script>