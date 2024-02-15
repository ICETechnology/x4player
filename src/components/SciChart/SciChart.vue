<template>
	<div class="scichart-vue flex-col" v-stop-propagation-touchmove v-press="onPress">
		<!-- 依據 partitionList 建立分割區 -->
		<div v-for="(obj, idx) in partitionList" class="posr"
			@touchstart="(e)=>{onTouchStart(idx, e)}"
			@touchmove="(e)=>{onTouchMove(idx, e)}"
			@touchend="(e)=>{onTouchEnd(idx, e)}"
			@click="onPassClick(idx)"
			:class="[obj.class]" :key="`${propsPreFixedName}partition-${idx}`">
			<div :id="`${propsPreFixedName}partition-${idx}`" class="scichart-ctn" />
			<!-- TickInfo -->
			<div v-for="(idcObj, idx2) in obj.idcList" :key="`tickinfo-${idx}-${idx2}`" class="tick-info flex-start font-size-micro" :class="[`tick-info-${idx2}`]" v-html="idcObj.tickInfoHtml" />
		</div>
		<!-- 所有指標 (無UI) -->
		<div v-for="(idcObj, idx) in idcList" :key="`idc-${idx}`">
			<component ref="idcComponents" :is="idcObj.component" :sid="sid" :qo="qo" :idcObj="idcObj" :mode="preFixedName" @passEmit="onPassEmit" :sciObj='sciObj[0]' :param="param"
			@mounted="onIdcMounted" :key="getClassString(idcObj.component)+ranstr" @iniEmit="onEmitIni" ></component>
		</div>
		<LoadingIcon v-if="isLoading"></LoadingIcon>
	</div>
</template>

<script>
import {SciChartSurface} from "scichart/Charting/Visuals/SciChartSurface";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {SciChartVerticalGroup} from "scichart/Charting/LayoutManager/SciChartVerticalGroup";
import {NumberRange} from "scichart/Core/NumberRange";

import SciChartFn from '@/components/SciChart/SciChart.Fn';
import SciChartAxis from '@/components/SciChart/SciChart.Axis';
import SciChartModifier from '@/components/SciChart/SciChart.Modifier';
import SciChartCross from '@/components/SciChart/SciChart.Cross';

import {DpiHelper} from 'scichart/Charting/Visuals/TextureManager/DpiHelper';

export default {
	mixins: [SciChartFn, SciChartAxis, SciChartModifier, SciChartCross],
	components: {},
	props: ['sid', 'param', 'fullTradingDay', 'preFixedName', 'suspend'],
	data() {
		return {
			sciObj: [],
			qo: {},
			// 載入中
			isLoading: true,
			// 拖拉模式
			enablePan: true,
			chartData: null,
			timeKeyList: null,
			dataSeriesList: [],
			ranstr: ''.random(),
			// 不啟用十字線
			disableCross: false,
			// 跨日不reload判斷
			checkPassCross: false,
		}
	},
	beforeMount() {},
	mounted() {
		this.init();
		let self = this;
		// 收到重畫事件時執行重建線圖動作
		eventBus.$on("KCHART-REDREAW", (obj) => {
			self.ranstr = "".random();
		});
	},
	beforeDestroy() {
		// 舊分k已解訂(分k切換)就不再發解訂
		if(!this.hasUnsubOldK)
			M4C.SciChartData.unsub({com_instance: this, sid: this.sid, nk: this.propsNK});
		
		if(this.sciObj.length) {
			// 各圖區
			this.partitionList.forEach((obj, idx)=>{
				let sciChartSurface = this.sciObj[idx].sciChartSurface;
				// 清除圖區
				sciChartSurface.delete();
			});
		}
		// 清除資料
		this.dataSeriesList.forEach(dataSeries=>{
			dataSeries.delete();
		});
	},
	methods: {
		async init() {
			// 用 verticalGroup 來同步化各圖區
			this.verticalGroup = new SciChartVerticalGroup();
			// 平行建立各圖區
			let sciObjList = [];
			this.partitionList.forEach((obj, idx)=>{
				let sciObj = this.initSciChart(idx);
				sciObjList.push(sciObj);
			});
			// 各圖區建立完成
			await Promise.all(sciObjList);
			// 更新市況(以月份代碼取行情資料，sid有可能是熱門月代碼)
			if(this.sid)
				this.qo = M4C.Quote.getQuoteObject(this.monthSid);
			// 訂閱
			if(this.sid)
				M4C.SciChartData.sub({com_instance: this, sid: this.sid, nk: this.propsNK});
			else 
				this.isLoading = false;
			if(!this.sid) this.onEmitIni();
		},
		// 建立圖區
		async initSciChart(idx) {
			let sciObj = this.sciObj[idx] = await SciChartSurface.create(`${this.propsPreFixedName}partition-${idx}`);
			this.verticalGroup.addSurfaceToGroup(sciObj.sciChartSurface);
			sciObj.sciChartSurface.background = "Transparent";
			return sciObj;
		},
		// 取前一根的timekey
		getPreTimekey(timekey){
			// 日、週、月
			if(isNaN(this.propsNK)) {
				// 轉換為timestamp再扣到1天86400000ms再轉回timekey，這麼麻煩是避免遇到換月、換年問題;
				let tk = this.dateToTimeKey(new Date(this.timeKeyToDate(timekey).getTime() - 86400000));
				return tk;
			}
			// 分K
			else {
				// 轉換為timestamp再扣到分K的ms再轉回timekey，這麼麻煩是避免遇到換日、換月、換年問題;
				let ms = parseFloat(this.propsNK * 60 * 1000);
				let tk = this.dateToTimeKey(new Date(this.timeKeyToDate(timekey).getTime() - ms));
				return tk;
			}
		},
		// 收到首次回補(含已存在的)資料
		onInitData({sid, chartData, timeKeyList}) {
			// 如果只有一筆資料，另外塞前一筆無數據的資料
			if(timeKeyList.length == 1) {
				let preTimekey = this.getPreTimekey(timeKeyList[0]);
				this.$set(chartData, preTimekey,  {});
				timeKeyList.splice(0, 0, preTimekey);
			}
			this.isLoading = false;
			this.chartData = chartData;
			this.timeKeyList = timeKeyList;
			// 建立 X,Y 軸
			this.initAxis();
			// 建立 chartModifier
			this.initModifier();
			// 最新一筆
			let latestTickObj = this.getLatestTickObj();

			// 建立 X 軸資料
			let xValues = this.xValues = this.getXValues({chartData, timeKeyList});
			// 各指標
			this.idcList.forEach((idcObj, idx)=>{
				let sciObj = this.sciObj[idcObj.partitionIndex];
				let sciChartSurface = sciObj.sciChartSurface;
				let wasmContext = sciObj.wasmContext;
				// 各指標的空資料
				let yValues = new Array(xValues.length).fill(NaN);
				let dataSeries = this.dataSeriesList[idx] = new XyDataSeries(wasmContext, {xValues, yValues});
				// 各指標元件填入資料
				let idcComponent = this.$refs.idcComponents[idx];
				idcComponent.onInitData({chartData, timeKeyList, dataSeries, wasmContext});
				idcComponent.createLine({sciChartSurface, wasmContext, dataSeries});
				if (idcComponent.onFocusTick)
					idcComponent.onFocusTick(latestTickObj);
			});
			// 若有指定預設顯示根數時(k線)，依設定增加空tick根數
			if (this.param.defaultVisibleTicks) {
				// 可視線圖範圍最大值(timeKeyList長度加設定增加空tick根數)
				let visibleRangeMaxLimit = this.timeKeyList.length + this.visibleRangePlusMax;
				this.xAxis[0].visibleRangeLimit = new NumberRange(-100, visibleRangeMaxLimit);
				// 計算起始tick(可視線圖範圍最大值 - 預設顯示根數)
				let beginIndex = visibleRangeMaxLimit - this.param.defaultVisibleTicks;
				this.xAxis[0].visibleRange = new NumberRange(beginIndex, visibleRangeMaxLimit);
			}
			else if(this.sid) {
				// 最近交易日開盤時間的 index 與 timeKey
				let openTimeKey = this.openTimeKey = M4C.SciChartData.getOpenTimeKey(this.sid, '1');
				let openTimeIdx = timeKeyList.indexOf(openTimeKey);
				// 顯示區間從開盤時間開始
				this.xAxis[0].visibleRange = new NumberRange(openTimeIdx, xValues.length-1);
			}
		},
		// 收到更多資料 (由 getMore 觸發補回來的)
		onMoreData({sid, chartData, timeKeyList, moreTimeKeyList}) {
			this.isLoading = false;
			this.chartData = chartData;
			this.timeKeyList = timeKeyList;
			this.visibleRange = this.visibleRange || this.xAxis[0].visibleRange;
			// 建立 X 軸資料
			let xValues = [];
			moreTimeKeyList.forEach(timeKey=>{
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
			});
			// 各指標
			this.idcList.forEach((obj, idx)=>{
				let dataSeries = this.dataSeriesList[idx];
				// 各指標的空資料
				let yValues = new Array(moreTimeKeyList.length).fill(NaN);
				dataSeries.insertRange(0, xValues, yValues);
				// 各指標填入資料
				this.$refs.idcComponents[idx].onMoreData({chartData, timeKeyList, moreTimeKeyList, dataSeries});
			});
			// 調整顯示範圍使畫面保持在原地
			let newMin = moreTimeKeyList.length + this.visibleRange.min;
			let newMax = newMin + this.visibleRange.max - this.visibleRange.min;
			this.xAxis[0].visibleRange = new NumberRange(newMin, newMax);
		},
		// 收到即時更新Tick
		onUpdateTick(index, tick, timeKey) {
			// 避開未初始化完成時(進第二層線圖)，收到更新資料導致的錯誤訊息
			if(!this.timeKeyList) {
				console.log('SciChart no timeKeyList when update tick');
				return;
			}
			let xValue = this.timeKeyToUnixTimestamp(timeKey);
			let idx = this.getIndexByXValue(xValue);
			// 各指標
			this.idcList.forEach((obj, i)=>{
				let dataSeries = this.dataSeriesList[i];
				let idcComponent = this.$refs.idcComponents[i];
				idcComponent.onUpdateTick({index, tick, dataSeries: dataSeries, timeKey});
				if (!this.isTouching && idcComponent.onFocusTick) {
					// 啟用十字線時以十字線功能更新
					if(this.showCross)
						this.onCrossTouchMove({hitTestInfo: this.lastHitTestInfo});
					else 
						idcComponent.onFocusTick({xValue, tick, idx}); 
				}
			});
		},
		// 收到即時新的Tick
		onAppendTick(index, tick, timeKey, timeKeyList) {
			let self = this;
			this.timeKeyList = timeKeyList;
			let xValue = this.timeKeyToUnixTimestamp(timeKey);
			let idx = this.getIndexByXValue(xValue);
			// console.log('sciTChart receive cross day data, index, idx, size', index, idx, this.dataSeriesList[0].getNativeXValues().size());
			// 如果是走勢圖且跨日盤時(當日盤區間小於新的tick index)且未確認過跨日不重整
			if(this.fullTradingDay && this.dataSeriesList[0].getNativeXValues().size() == idx){
				if(!this.checkPassCross){
					// 彈出確認視窗
					eventBus.$emit("CONFIRM-DIALOG", {
						title: '线图资料跨日通知',
						content: this.$ln("收到跨日资料，是否需要切到最新?"),
						// 確認向上層發出reload訊息
						confirm: ()=>{self.$emit("reload");},
					});
					// 設定已確認略過跨日通知
					this.checkPassCross = true;
				}
				// 輪循所有指標，將dataSeries append一筆空的資料(以便走勢的組件以update方式append)。
				this.idcList.forEach((obj, i)=>{
					let dataSeries = this.dataSeriesList[i];
					// 超出當日區間的時候append(因走勢圖有預先開出區間，但如果超出需要另外append)
					dataSeries.append(index, NaN);
				});
			}
			// 各指標
			this.idcList.forEach((obj, i)=>{
				let dataSeries = this.dataSeriesList[i];
				let idcComponent = this.$refs.idcComponents[i];
				idcComponent.onAppendTick({index, tick, dataSeries: dataSeries, timeKey});
				if (!this.isTouching && idcComponent.onFocusTick) {
					// 啟用十字線時以十字線功能更新
					if(this.showCross)
						this.onCrossTouchMove({hitTestInfo: this.lastHitTestInfo});
					else 
						idcComponent.onFocusTick({xValue, tick, idx});
				}
			});
			// 若有指定預設顯示根數時(K線)且位置在最新一根tick=>調整可視範圍+1及可視最大值+1
			if (this.param.defaultVisibleTicks && this.xAxis[0].visibleRange.max > this.timeKeyList.length) {
				let visibleRangeMaxLimit = this.xAxis[0].visibleRangeLimit.max + 1;
				this.xAxis[0].visibleRangeLimit = new NumberRange(-100, visibleRangeMaxLimit);
				let beginIndex = this.xAxis[0].visibleRange.min +1;
				let endIndex = this.xAxis[0].visibleRange.max + 1;
				this.xAxis[0].visibleRange = new NumberRange(beginIndex, endIndex);			
			}
		},
		onTouchStart(idx, e) {
			this.isTouching = true;
			// 取得 HitTest
			let hitTestInfo = this.getHitTestInfo(idx, e);
			if (!hitTestInfo || !hitTestInfo.xCategoryValue)
				return;
			// 拖拉模式不往下處理
			if (this.enablePan)
				return;
			let xValue = hitTestInfo.xCategoryValue;
			let tick = this.chartData[this.unixTimestampToTimeKey(xValue)];
			// 送出當前關注Tick
			this.publishFocusTick({xValue, tick});
			// 支持回呼
			if (this.param.callback && this.param.callback.onTouchStart)
				this.param.callback.onTouchStart(idx, hitTestInfo);
		},
		onTouchMove(idx, e) {
			// 拖曳移動模式
			if (this.enablePan) {
				const range = this.visibleRange = this.xAxis[0].visibleRange;
				// 支持載入更多資料
				if (!this.isLoading && range.min < 0 && this.chartData) {
					let isQuerying = M4C.SciChartData.getMore({com_instance: this});
					if (isQuerying)
						this.isLoading = true;
				}
			}
			// 十字線模式
			else {
				// 取得 HitTest
				let hitTestInfo = this.getHitTestInfo(idx, e);
				if (!hitTestInfo || (!hitTestInfo.xCategoryValue && !hitTestInfo.xValue))
					return;
				this.onCrossTouchMove({idx, e, hitTestInfo});
				// 支持回呼
				if (this.param.callback && this.param.callback.onTouchMove)
					this.param.callback.onTouchMove(idx, hitTestInfo);
			}
		},
		onTouchEnd(idx, e) {
			this.isTouching = false;
			if (this.isPress) {
				delete this.isPress;
				this.enablePan = !this.enablePan;
			}
			// 拖拉模式不往下處理
			if (this.enablePan)
				return;
			// 支持回呼
			if (this.param.callback && this.param.callback.onTouchEnd)
				this.param.callback.onTouchEnd(idx);
		},
		// 支持外部呼叫顯示/隱藏十字線
		enableCross() {
			this.enablePan = !this.enablePan;
		},
		onPress(e) {
			// 支持參數決定是否要啟用 Press 出現十字線效果
			if (this.param.disablePress) {
				// 另外回onPress事件
				this.$emit("onPress", e);
				return;
			}
			this.enablePan = !this.enablePan;
		},
		// 取得最新一筆資料物件
		getLatestTickObj() {
			let lastTimeKey = this.timeKeyList[this.timeKeyList.length-1];
			let xValue = this.timeKeyToUnixTimestamp(lastTimeKey);
			let tick = this.chartData[lastTimeKey];
			let idx = this.getIndexByXValue(xValue);
			return {xValue, tick, idx};
		},
		// 取得當前觸碰點的 HitTest
		getHitTestInfo(idx, e) {
			let touch0 = e.targetTouches? e.targetTouches[0]: e;
			let target = e.currentTarget || e.target || e.srcElement;
			let rect = target.getBoundingClientRect();
			let x = parseInt(touch0.pageX - rect.left);
			let y = parseInt(touch0.pageY - rect.top);
			const premultipliedX = x * DpiHelper.PIXEL_RATIO;
			const premultipliedY = y * DpiHelper.PIXEL_RATIO;
			let lineSeries = this.sciObj[idx].sciChartSurface.renderableSeries.items[0];
			// console.log(`lineSeries.hitTestProvider.hitTest(${premultipliedX}, ${premultipliedY}, ${DpiHelper.PIXEL_RATIO})`);
			let result;
			try{result = lineSeries.hitTestProvider.hitTest(premultipliedX, premultipliedY, DpiHelper.PIXEL_RATIO);}catch(e){}
			if (result)
				this.lastHitTestInfo = result;
			return result;
		},
		// 指標切換時
		onIdcMounted(idcComponent, idcObj) {
			if (!this.chartData)
				return;
			console.log(`SciChart partitionList[${idcObj.partitionIndex}] idcList[${idcObj.idcIndex}] changed to : `, M4C.Analysis.getComponentClassName(idcObj.component));
			let sciObj = this.sciObj[idcObj.partitionIndex];
			let sciChartSurface = sciObj.sciChartSurface;
			let wasmContext = sciObj.wasmContext;
			let chartData = this.chartData;
			let timeKeyList = this.timeKeyList;
			let dataSeries = this.dataSeriesList[idcObj.idcIndex];
			// 指標元件啟始化資料
			idcComponent.onInitData({chartData, timeKeyList, dataSeries, wasmContext});
			idcComponent.createLine({sciChartSurface, wasmContext, dataSeries});
			if (idcComponent.onFocusTick)
				idcComponent.onFocusTick(this.getLatestTickObj());
		},
		// 查詢失敗回覆錯誤碼
		onChartError(sid, errCode) {
			this.isLoading = false;
			// 此查詢條件在即時或歷史都沒有資料，並且往更之前的時間查找也找不到歷史資料, 只有查詢tick、分K、L2時，會回覆此代碼
			if (errCode === -24 || errCode === -25) {
				eventBus.$emit("FLASHMESSAGE", `已无更多资料`, {"bgClr": "black"});
			}
		},
		// 更新可視範圍限制值
		resetVisibleRangeLimit() {
			// 調整以defaultVisibleTicks判別k線圖與分時，如果是k線圖xsize取用timeKeyList長度
			let xsize = this.param.defaultVisibleTicks? this.timeKeyList.length: this.dataSeriesList[0].getXValues().size();;
			let visibleRangeMaxLimit = xsize + this.visibleRangePlusMax;
			this.partitionList.forEach((obj, idx)=>{
				let curVisibleRange = this.xAxis[idx].visibleRange;
				// SciChart 在 visibleRange.max 大於 visibleRangeMaxLimit 時會發生異常，所以只好自己校正
				if (curVisibleRange.max > visibleRangeMaxLimit) {
					let shift = curVisibleRange.max - visibleRangeMaxLimit;
					this.xAxis[idx].visibleRange = new NumberRange(curVisibleRange.min - shift, curVisibleRange.max - shift);
				}
				this.xAxis[idx].visibleRangeLimit = new NumberRange(-100, visibleRangeMaxLimit);
			});
		},
		onPassClick(idx){
			// 暫時判斷如果點擊到sciChart plugin的項目時不emit click事件
			if(this.$store.state.sciChartPlugin.curClick) return;
			this.$emit('click', idx);
		},
		// 送出當前關注Tick
		publishFocusTick(info) {
			const {xValue, tick, index, e, hitTestInfo} = info;
			// 一般技術線圖
			if(xValue) {
				let idx = this.getIndexByXValue(xValue);
				this.idcList.forEach((obj, index)=>{
					if (this.$refs.idcComponents[index].onFocusTick)
						this.$refs.idcComponents[index].onFocusTick({xValue, tick, idx});
				});
			}
			// 其他線圖
			else {
				this.idcList.forEach((obj, index)=>{
					if (this.$refs.idcComponents[index].onFocusTick)
						this.$refs.idcComponents[index].onFocusTick(info);
				});
			}
		},
		getIndexByXValue(xValue) {
			let timekey = this.unixTimestampToTimeKey(xValue);
			// 非分k取前8碼
			if(isNaN(this.$store.state.Kchart.NK)){
				timekey = timekey.substr(0, 8);
			}
			// 因unixTimestampToTimeKey會將0時0分轉成只有年月日資料，所以在分K時要加回來，才找得到index
			else if(timekey.length < 12) {
				timekey += "0000";
			}
			let idx = this.timeKeyList.indexOf(timekey);
			// 如果找不到索引值就取最新一根。
				idx = idx < 0? this.timeKeyList.length - 1: idx;
			return idx;
		},
		// 取得今日完整 dataSeries (含未來時間)
		getXValues({chartData, timeKeyList}) {
			let xValues = [];
			timeKeyList.forEach((timeKey, index)=>{
				xValues.push(this.timeKeyToUnixTimestamp(timeKey));
			});
			// 要求顯示完整交易日範圍
			if (this.fullTradingDay) {
				// 證券類的合約表只取到交易所ex I.S.SSE、I.S.SZSE所以需要預先處理
				let _sid = this.sid.indexOf('I.S') == 0? this.sid.split('.').slice(0, 3).join('.'): this.sid;
				let contractInfo = M4C.Symbol.getContractInfo(_sid);
				if (contractInfo && contractInfo.TradingHours) {
					// 所有交易时段列表
					let tradingHours = contractInfo.TradingHours;
					// 最新資料的TimeKey
					let lastTimeKey = timeKeyList[timeKeyList.length - 1];
					tradingHours.forEach(obj=>{
						let od = new Date(obj.open);
						let cd = new Date(obj.close);
						var diffMins = Math.floor(((cd-od)/1000)/60);
						for (let i=0; i<diffMins; i++) {
							od.setMinutes(od.getMinutes() + 1);
							let thisTimeKey = this.dateToTimeKey(od);
							if (thisTimeKey > lastTimeKey)
								xValues.push(this.timeKeyToUnixTimestamp(thisTimeKey));
						}
					});
				}
			}
			return xValues;
		},
		// 取組件名稱
		getClassString(com) {
			return M4C.Analysis.getComponentClassName(com);
		},
		onPassEmit(data){
			this.$emit('passEmit', data);
		},
		onEmitIni(){
			// 建立 X,Y 軸
			this.initAxis();
			// 建立 chartModifier
			this.initModifier();
		},
	},
	watch: {
		propsNK(nv, ov) {
			// 因切換分k會重建scichart，所以只處理解訂舊分k，新分k訂閱在init時處理
			M4C.SciChartData.unsub({com_instance: this, sid: this.sid, nk: ov});
			// 加入已解訂暫存變數
			this.hasUnsubOldK = true;
		},
		// 當前所有指標顯示限制最大值
		visibleRangePlusMax(nv) {
			console.log('SciChart.visibleRangePlusMax : ', nv);
			this.resetVisibleRangeLimit();
		},
		// 當前資料長度
		timeKeyListLength(nv) {
			// console.log('SciChart.timeKeyListLength : ', nv);
			// 更新可視範圍限制值
			this.resetVisibleRangeLimit();
		},
		// 拖拉模式
		showCross(nv) {
			if (!nv && this.timeKeyListLength) {
				// 最新一筆
				let latestTickObj = this.getLatestTickObj();
				// 送出當前關注Tick
				this.idcList.forEach((obj, idx)=>{
					if (this.$refs.idcComponents[idx].onFocusTick)
						this.$refs.idcComponents[idx].onFocusTick(latestTickObj);
				});
			}
			else if (!nv) {
				this.idcList.forEach((obj, idx)=>{
					if (this.$refs.idcComponents[idx].onFocusTick)
						this.$refs.idcComponents[idx].onFocusTick();
				});
			}
		},
		suspend(nv) {
			// 進背景解訂閱線圖資料
			if(nv)
				M4C.SciChartData.unsub({com_instance: this, sid: this.sid, nk: this.propsNK});
		},
	},
	computed: {
		// 把各圖區的各指標提到同一層方便處理
		idcList() {
			let list = [];
			this.partitionList.forEach((obj, idx)=>{
				obj.idcList.forEach(idcObj=>{
					idcObj.idcIndex = list.length;
					idcObj.partitionIndex = idx;
					list.push(idcObj);
				});
			});
			return list;
		},
		partitionList() {
			return this.param.partitionList;
		},
		propsNK() {return this.param.NK || 1;},
		// 當前所有指標顯示限制最大值
		visibleRangePlusMax() {
			let max = 0;
			this.idcList.forEach((idcObj)=>{
				let plus = idcObj.visibleRangePlus;
				if (plus)
					max = plus > max ? plus : max;
			});
			return max;
		},
		timeKeyListLength() {
			if (this.timeKeyList)
				return this.timeKeyList.length;
		},
		tradingDate() {
			return this.qo.td;
		},
		propsPreFixedName() {
			return this.preFixedName || '';
		},
		// 當前商品的月份代碼
		monthSid() {return M4C.Symbol.toMonthSymbol(this.sid);},
		noCustomXaxis() {return !this.sid;},
	},
}
</script>

<style scoped>
.scichart-ctn {
	width: 100%;
	height: 100%;
	touch-action: none;
}
.tick-info {
	position: absolute;
	/* width: 90%;
	height: 15px; */
	/* border: 1px dashed #666; */
}
.tick-info-0 {
	top: 2px;
	right: 2px;
}
.tick-info-1 {
	top: 16px;
	right: 2px;
}
</style>