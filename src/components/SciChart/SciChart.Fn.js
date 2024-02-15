export default {
	props: ['idcObj'],
	beforeDestroy() {
		if (this.lineSeries && this.sciChartSurface) {
			this.sciChartSurface.renderableSeries.remove(this.lineSeries);
			// this.lineSeries.delete();
		}
	},
	beforeMount() {
		if (this.idcObj)
			this.$set(this.idcObj, 'tickInfoHtml', '');
	},
	mounted() {
		this.$emit('mounted', this, this.idcObj);
	},
	methods: {
		// '201906200601' -> Unix timestamp
		timeKeyToUnixTimestamp(s) {
			// 初始日期物件(以1970/1/1為基底)，再設定。
			let d = new Date("1970-1-1");
			d.setFullYear(s.substr(0,4));
			d.setMonth(parseInt(s.substr(4,2))-1);
			d.setDate(s.substr(6,2));
			d.setHours(s.substr(8,2));
			d.setMinutes(s.substr(10,2));
			d.setSeconds(0);
			// console.log(s, 'to', d.dayTime18());
			return Math.floor(d.getTime() / 1000 + 28800);
		},
		// Unix timestamp -> Date
		unixTimestampToDate(s) {
			return new Date((s - 28800) * 1000);
		},
		// Unix timestamp -> TimeKey ('201906200601')
		unixTimestampToTimeKey(s) {
			return this.dateToTimeKey(this.unixTimestampToDate(s));
		},
		/**
		 * 依當前tick的開收價差顯示漲跌顏色
		 * @param {*} ohlcSeriesObj 	// SciChart OhlcDataSeries物件
		 * @param {*} index 			// Tick索引
		 * @returns {String} 			// 'clr-up': up, 'clr-dn': down, 'clr-ref: ref
		 */
		getOhlcTickUpDN(ohlcSeriesObj, index) {
			if(ohlcSeriesObj == null || ohlcSeriesObj.count() == 0) return null;
			let close = ohlcSeriesObj.getNativeCloseValues().get(index);
			let open = ohlcSeriesObj.getNativeOpenValues().get(index);
			let diff = close - open;
			return diff > 0? 'clr-up': diff < 0? 'clr-dn': 'clr-ref';
		},
		/**
		 * 依前tick收與當前tick的收價差顯示漲跌顏色
		 * @param {*} ohlcSeriesObj 	// SciChart OhlcDataSeries物件
		 * @param {*} index 			// Tick索引
		 * @returns {String} 			// 'clr-up': up, 'clr-dn': down, 'clr-ref: ref
		 */
		 getOhlcTickUpDN_V(ohlcSeriesObj, index) {
			if(ohlcSeriesObj == null || ohlcSeriesObj.count() == 0) return null;
			let close = ohlcSeriesObj.getNativeCloseValues().get(index);
			let open = ohlcSeriesObj.getNativeOpenValues().get(index);
			let preClose = ohlcSeriesObj.getNativeCloseValues().get(index - 1);
			let diff = close - (preClose || open);	// 如果沒前一tick(ex:第一根)，則取當前tick開的價格判斷。
			return diff > 0? 'clr-up': diff < 0? 'clr-dn': 'clr-ref';
		},
		// hhmmToTimeKey('20190620', '0600', '0600') -> '201906200600'
		// hhmmToTimeKey('20190620', '0600', '0500') -> '201906210500'
		hhmmToTimeKey(d8, firstStartTime, t) {
			let self = this;
			// 比第一盤的時間小 -> 跨日
			let td = t < firstStartTime ? (parseInt(d8) + 1) : d8;
			return `${td}${t}`;
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
		// Date -> '201906200601' 或 '20190620'
		dateToTimeKey(d) {
			if (d.getHours() === 0 && d.getMinutes() === 0)
				return d.getFullYear() + ("0" + (d.getMonth()+1)).slice(-2) + ("0" + d.getDate()).slice(-2);
			return d.getFullYear() + 
				("0" + (d.getMonth()+1)).slice(-2) +
				("0" + d.getDate()).slice(-2) +
				("0" + d.getHours()).slice(-2) + 
				("0" + d.getMinutes()).slice(-2);
		},
		showTickPrice(val) {
			if(isNaN(val)) return val;
			return this.$symbolPriceX({sid: this.sid, val, fillDecimal: true, noDeno: true});
		},
	},
	computed: {
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
}