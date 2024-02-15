export default {
	methods: {
		// 依據當前語系轉換字詞
		$ln(txt, mapFailTxt) {
			if (!txt) return txt;
			// 對應語系表
			let map = this.$store.state.lang.mappingTable;
			if (map && map[txt])
				return map[txt][this.$store.state.lang.language] || txt;
			// 支持印出沒有設定語系的 KEY
			if (window.urlParam.findKey && map && !map[txt]) {
				// 利用 findKeyMap 來讓找不到的 key 僅印一次就好
				window.findKeyMap = window.findKeyMap || {};
				if (!window.findKeyMap[txt]) {
					window.findKeyMap[txt] = true;
					console.log(`找不到語系設定 Key: "${txt}"`);
				}
			}
			// TW 情境，語系表找不到時，使用簡轉繁API
			if (this.twMode && map && !map[txt]) {
				let cn2twTxt = window.$convert.cn2tw(txt);
				if (cn2twTxt !== txt)
					return cn2twTxt;
			}
			return mapFailTxt || txt;
		},
		$safeFloat(val, precision) {
			if (typeof precision !== 'number' || isNaN(precision)) {
				precision = 8;
			}
			let len = Math.pow(10, precision);
			return Math.round(val * len) / len;
		},
		// config合併(需求只做第一層無條件取代，其他情境會異常。)
		$deepMerge(a, b, fn = this.mfn) {
			return [...new Set([...Object.keys(a), ...Object.keys(b)])].reduce(
				(acc, key) => ({ ...acc, [key]: fn(a[key], b[key]) }),{});
		},
		mfn(a, b){if(b != undefined) return b; else return a;},
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
	}
}