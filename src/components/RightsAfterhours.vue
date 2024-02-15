<template>
	<div class="rights-ctn flex-col font-size-small" v-stop-propagation-y>
		<div class="flex-row mgtb2 pdlr3">
			<div class="flex-start">{{$ln('資料時間')}} : {{updateTime}}</div>
			<div class="flex-1" />			
			<div><SingleSelect :options="currencyOptionList" v-model="currency"/></div>
		</div>
		<div class="flex-row pdtb1 pdlr3 bgc-head one-row">
			<div class="flex-start clr-gray">{{$ln('資金欄位')}}</div>
			<div class="flex-1 flex-end"><i class="material-icons tcef" @click="onBtnConfigColumn">dashboard_customize</i></div>
		</div>
		<div class="flex-1 posr">
			<ScrollBounce class="FULL" :refresh="true" @refresh="onRefresh">
				<div class="flex-col" v-show="existData && stampStatus==='DONE'">
					<div class="flex-row pdtb1 pdlr3 one-row" v-for="(obj, idx) in curCurrencyColumns" :class="{'switch-row-bg': idx%2===0}" :key="`crc-${idx}`">
						<div class="flex-start">{{$ln(obj.label)}}</div>
						<div class="flex-1 flex-end" :class="[afterhoursClass(obj)?'clr-warn':'']" >{{getValue(obj)}}</div>
					</div>
				</div>
				<Stamp v-if="!existData" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			currency: '',
			resultQueryAfterhours: {},
		}
	},
	beforeMount() {
		// 公開設定有設定預設值的情況
		if(this.columnSetting){
			this.columnSettingInit();
		}
		this.showAfterhoursNotice()
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		afterhoursClass(obj){
			// 用來存放需要變成紅色的試算結果
			const afterhoursArray = ["CURRENT_BALANCE", "RISK_RATE"];
			return afterhoursArray.includes(obj.key);
		},
		columnSettingInit(){
			// 一開始動態生成 rights_columnSetting 的物件
			if(!this.columnSD.rights_columnSetting){
				this.$set(this.columnSD,'rights_columnSetting',{autoStorage:true, default:this.columnSetting});

				// 取出存在localStorage的值，放回物件中
				const restoreList = JSON.parse(localStorage.getItem(`${this.projectID}_ColumnSD_rights_columnSetting`));
				if(restoreList){
					M4C.ColumnSD.restore("rights_columnSetting", restoreList);
				};
			};
			// 沒有show hide欄位的話，生成並監聽
			if(!this.columnSD.rights_columnSetting.show || !this.columnSD.rights_columnSetting.hide){
				M4C.ColumnSD.resetShowHide("rights_columnSetting");
				M4C.ColumnSD.watchToStorage("rights_columnSetting");
			}	
		},
		onRefresh() {
			this.resultQueryAfterhours = M4C.Margin.queryAfterhoursMargin();
		},
		// 取得欄位內容
		getValue(obj) {
			if (!this.currency || !this.allMarginData[this.currency])	return;
			let str = this.allMarginData[this.currency][obj.key];
			// 原始保證金(基) 'BASE_ORIGIN_MARGIN' : 一律抓國內/國外基幣(看當時選在國內或國外)的 ORIGIN_MARGIN
			if (obj.key === 'BASE_ORIGIN_MARGIN') {
				let baseCurrency = this.isOBCurrency ? 'OB-***' : '***';
				str = this.allMarginData[baseCurrency].ORIGIN_MARGIN;
			}
			// 可動用及出金保證金(基) 'BASE_AVAILABLE_MARGIN' : 一律抓國內/國外基幣(看當時選在國內或國外)的 AVAILABLE_MARGIN
			else if (obj.key === 'BASE_AVAILABLE_MARGIN') {
				let baseCurrency = this.isOBCurrency ? 'OB-***' : '***';
				str = this.allMarginData[baseCurrency].AVAILABLE_MARGIN;
			}
			let val;
			if (obj.isPercent) {
				val = parseFloat(str).toFixed(2);
				return isNaN(val) ? `--` : `${val}%`;
			}
			// 預設小數兩位
			val = parseFloat(str).toFixed(obj.dlen == null ? 2 : obj.dlen);
			return isNaN(val) ? '--' : this.$commas(val);
		},
		// 設定欄位
		onBtnConfigColumn() {
			eventBus.$emit('POPUP-DIALOG', 'ConfigColumnSD', {key: this.columnSDKey, maxWidth: true}, {transName: 'float', lock: true});
		},
		showAfterhoursNotice(){
			// 每次登入會顯示一次
			if(this.showAfterhours && !this.disableAfterhoursNotice){
				eventBus.$emit("CONFIRM-DIALOG", {
					title: this.afterhoursNoticeTitle||'',
					titleClass: "font-bold font-size-normal underline clr-white",
					confirmOnly: true,
					confirmText: "我知道了",
					htmlContent: this.afterhoursNoticeContent||"",
				});
			}	
			this.resultQueryAfterhours = M4C.Margin.queryAfterhoursMargin();	
			this.$store.state.status.showAfterhours = false;
		}
	},
	watch: {},
	computed: {
		projectID(){
			return this.$store.state.config.projectID;
		},
		$commas() {return this.$store.state.fn.$commas;},
		// 當前所有幣別 option 列表
		currencyOptionList() {
			if(!this.allMarginData) return;
			const allMarginDataList = Object.keys(this.allMarginData);
			// 將國內與國外分開排序後，再組起來
			let inList = allMarginDataList.filter(o=>o.indexOf('OB-')===-1);
			let obList = allMarginDataList.filter(o=>o.indexOf('OB-')!==-1);
			inList = inList.sort((a,b)=>{return a > b ? 1 : -1;});
			obList = obList.sort((a,b)=>{return a > b ? 1 : -1;});
			let currencyList = [].concat(inList).concat(obList);
			let currencyOptionList = [];
			currencyList.map((obj)=>{
				let result = {value: obj, selected: obj===this.currency};
				if (obj.indexOf('OB-')!==-1) {
					result.label = obj.indexOf("***")!==-1 ? "國外 基幣" : `國外 ${obj.replace('OB-','')}`;
				}
				else {
					result.label = (this.twMode ? "國內 " : "") + (obj==="***" ? "基币" : obj);
				}
				currencyOptionList.push(result)
			});
			return currencyOptionList;
		},
		// 以幣別為 key 的響應式資金資料
		allMarginData() {
			if(!this.resultQueryAfterhours.data) return {};
			if (this.resultQueryAfterhours.data.d.RIGHTS || this.resultQueryAfterhours.data.d.RIGHTS_OB) {
				let rightsMap = M4C.Margin.rightsArrayToMap(this.resultQueryAfterhours.data);
				let marginData = {};
				// 判斷查詢是否是夜盤
				for (let currency in rightsMap) {
					let rightsObj = Object.assign(
						marginData[currency] || {},
						rightsMap[currency]
					);
					M4C.Margin.extendColumn(rightsObj);
				}
				return rightsMap;
			}			
		},
		// 本幣別是否有資料
		existData() {
			let thisCurrencyData = this.allMarginData[this.currency];
			// 任一欄位有值(包含0)就視為有資料
			for (let key in thisCurrencyData) {if (thisCurrencyData[key] != null) return true;}
		},
		// 資金查詢狀態
		stampStatus() {
			return this.resultQueryAfterhours.$STATUS;
		},
		// 當前選在國外幣別
		isOBCurrency() {
			return this.currency.indexOf('OB-') !== -1;
		},
		// 當前欄位使用那個 key-name
		columnSDKey() {		
			// 公開設定有設定權益數欄位的情況
			if(this.columnSetting) {
				return "rights_columnSetting";
			}else {
				return this.isOBCurrency ? 'rights_ob_20221230' : 'rights_in_20230303';
			}
		},
		columnSetting(){
			try{return this.$store.state.config.CONFIG.Rights.columnSetting;}catch(e){return null};
		},
		// 當前幣別應顯示的欄位
		curCurrencyColumns() {
			return this.columnSD[this.columnSDKey].show;
		},
		columnSD(){
			return this.$store.state.columnSD;
		},
		// 資金資料更新時間
		updateTime() {
			try {return new Date(this.resultQueryAfterhours.data.d.UPDATE_TIME).time8();}catch(e){}
		},
		// 因為一天只顯示一次夜盤提示，用來紀錄開啟下一次提示的時間
		showAfterhours(){
			return this.$store.state.status.showAfterhours;
		},
		// 是否取消夜盤提示
		disableAfterhoursNotice(){
			try {return this.$store.state.config.CONFIG.Rights.disableAfterhoursNotice;}catch (e) {return null}
		},
		// 夜盤提示的標題
		afterhoursNoticeTitle(){
			try {return this.$store.state.config.CONFIG.Rights.afterhoursNoticeTitle;}catch (e) {}
		},
		// 夜盤提示的內容
		afterhoursNoticeContent(){
			try {return this.$store.state.config.CONFIG.Rights.afterhoursNoticeContent;}catch (e) {}
		},
	},
}
</script>

<style scoped>
.one-row {
	min-height: 32px;
}

</style>