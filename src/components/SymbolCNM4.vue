<template>
	<div class="symbol-cnm4-ctn" :class="[flexRow?'flex-row flex-wrap':'flex-col']">
		<!-- 合約名稱(名稱超過字數限制以micro字體顯示，且不顯示購、沽icon) -->
		<div class="flex-1 flex-start symbol-name mgr1" :class="[nameFontSize ? nameFontSize : selfNameFontSize,{'font-size-big font-bold': largeSize}]">
			{{symbolName}}
			<span v-if="showCP && isOpt" class="opt-cp mglr1 rd1 pdlr1 font-size-micro">{{$ln(sid.indexOf('.C.')!==-1?'购':'沽')}}</span>
			<span v-if="showBS&&showBS.length==1" class="rd1 pdlr1 font-size-micro" :class="showBS+'-icon'">{{bsText1}}</span>
		</div>
		<!-- 代碼月份 -->
		<div class="flex-1 flex-start month-ctn" :class="[(!isHot|| largeSize)?'font-size-small':'font-size-micro']">
			<span class="clr-gray nowrap" v-if="isHot">{{ hotText }}</span>
			<span class="clr-gray nowrap" v-if="!isHot||twMode" v-html="symbolCIDM4"></span>
			<div class="flex-1 clr-orange mgr1">{{setPRIADJ}}</div>
		</div>
	</div>
</template>

<script>
export default {
	// fontSize: 指定合約名稱使用的 font-size class
	// optWrap: 選擇權時從 C/P 固定折行 (廢棄) => 改使用選擇權特定的顯示方式
	props: ["sid", "flexRow", "nameFontSize", "optWrap", "sid2", "showCP", "showBS", "isHot"],
	data() {
		return {}
	},
	beforeMount() {},
	methods: {
		// 移除除權息字符
		trimPRIADJ(str) {
			let lastIndx = str.lastIndexOf('A');
			if(lastIndx == str.length - 1) {
				str = str.slice(0, lastIndx);
			}
			return str;
		},
	},
    computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		hotText() {
			return this.$ln(this.twMode? '熱門': '主连');
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 支持未傳入 sid 時使用 selectedSymbol.ID
		cptSid() {
			return this.sid || this.$store.state.selectedSymbol.ID;
		},
		// "澳幣"
		symbolName() {
			return M4C.Symbol.getContractName(this.cptSid);
		},
		// "6A1906"
		symbolCIDM4() {
			let str = M4C.Symbol.getCIDM4(this.cptSid);
				str = this.isOpt? this.trimPRIADJ(str): str;
			// 組合(複式單)回報
			if (this.sid2) {
				let str2 = M4C.Symbol.getCIDM4(this.sid2);
				str2 = this.isOpt? this.trimPRIADJ(str2): str2;
				// 複式單情境時不顯示商品代碼 (for 持倉匯總@台灣複式選擇權)
				str = str.split(' ').slice(1).join(' ');
				str2 = str2.split(' ').slice(1).join(' ');
				let tempstr1 = "";
				let tempstr2 = "";
				// 以showBS是否有值且長度等於2來判斷是否顯示複式權的cp、bs的icon(為了tw選擇權組拆ui特別加入的處理)
				if(this.showBS && this.showBS.length == 2) {
					tempstr1 = `<span class="opt-cp mglr1 rd1 pdlr1 font-size-micro">${this.$ln(this.sid.indexOf('.C.')!==-1?'购':'沽')}</span>
								<span class="rd1 pdlr1 font-size-micro ${this.showBS.charAt(0)}-icon">${this.bsText1}</span>`;
					tempstr2 = `<span class="opt-cp mglr1 rd1 pdlr1 font-size-micro">${this.$ln(this.sid2.indexOf('.C.')!==-1?'购':'沽')}</span>
								<span class="rd1 pdlr1 font-size-micro ${this.showBS.charAt(1)}-icon">${this.bsText2}</span>`;
				}
				return `
					<div class="flex-col font-size-micro">
						<div>${str}${tempstr1}</div>
						<div>${str2}${tempstr2}</div>
					</div>
				`;
			}
			// 若有指定固定在 C/P 折行
			if (this.isOpt && this.optWrap) {
				let tmp = this.cptSid.split('.');
				str = `<span class='mth4'>${tmp[4].substr(2)}</span><span class="mglr1">/</span><span class='strike'>${M4C.Option.getStrike(this.cptSid)}</span>`;
			}
			// 價差期貨
			if(this.isPriceDiffFut) {
				const Minfo = M4C.Symbol.getMainformInfo(this.cptSid);
				let sidArray = this.cptSid.split('.');
				let symbol = Minfo? Minfo.Symbol: sidArray[3];
				let m1 = sidArray[4];
				let m2 = sidArray.slice(-1);
				return `<div class="flex-col font-size-micro">
							<div>${symbol}</div>
							<div>${m1} (${m2})</div>
						</div>`;
			}
			return str;
		},
		isOpt() {return this.cptSid.indexOf('I.O.') === 0},
		selfNameFontSize() {
			// 期權超過5個字(因另加沽、購icon)或非期權超過6個字，縮小字體。
			if ((this.symbolName_len > 5 && this.isOpt) || this.symbolName_len >= 6)
				return 'font-size-small';
		},
		// 商品名稱長度(含數字計算)
		symbolName_len() {
			// 數字部分
			let findNumbers = this.symbolName.match(/\d+/g);
			// 數字長度
			let numberLen = findNumbers? this.$safeFloat(findNumbers.join('').length / 2): 0;
			// 整體長度(含數字)
			let strLen = this.$safeFloat(this.symbolName.length - numberLen);
			return strLen;
		},
		// 除權息合約
		setPRIADJ() {
			let minfo = M4C.Symbol.getMainformInfo(this.cptSid);
			return minfo ? (minfo.SetPRIADJ || '') : '';
		},
		// 是否為價差期貨
		isPriceDiffFut() {
			return M4C.Symbol.isPriceDiff_FutSymbol(this.cptSid);
		},
		bsText1() {
			if(this.showBS && this.showBS.charAt(0) == "B") return this.$ln(this.isOpt ? (this.twMode ? '買' : '权利') : '多');
			if(this.showBS && this.showBS.charAt(0) == "S") return this.$ln(this.isOpt ? (this.twMode ? '賣' : '义务') : '空');
		},
		bsText2() {
			if(this.showBS && this.showBS.charAt(1) == "B") return this.$ln(this.isOpt ? (this.twMode ? '買' : '权利') : '多');
			if(this.showBS && this.showBS.charAt(1) == "S") return this.$ln(this.isOpt ? (this.twMode ? '賣' : '义务') : '空');
		},
	},
}
</script>

<style scoped>
.symbol-name {
	white-space: normal;
}
.opt-cp {
	color: #A2A2A2;
	border: 1px solid #A2A2A2;
}
.month-ctn .opt-cp{
	margin-left: 0px;
}
.B-icon {
	color: #2453AB;
	border: 1px solid #2453AB;
}
.S-icon {
	color: #945821;
	border: 1px solid #945821;
}
</style>