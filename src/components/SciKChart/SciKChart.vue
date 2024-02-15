<template>
	<div class="flex-col" :class="`${model}-sciKchart-ctn`">
		<SciChart ref="sciChart" class="flex-1" v-if="showSciChart" :preFixedName="model === 'order'? model: ''" :suspend="suspend"
			:sid="sid" :param="sciChartParam" :key="sciChartKey" @click="onClick" @onPress="onPress" @passEmit="onPassEmit"/>
		<!-- SciChartPlugin 有使用到CustomAnnotation類，所以需要等SciChart的axis完成才處理 -->
		<SciChartPlugin ref="sciChartPlugin" :sciObj="sciObj" :sid="sid" v-if="sciChartInit" :mode="model" />
		<!-- 當sciChart還沒實體化前先用元素撐一下高度 -->
		<div class="flex-1" v-if="!showSciChart" />
		<KChartLandFoot v-if="model === 'order' && isPortrait" v-stop-propagation-x/>
	</div> 
</template>

<script>
import SciChart from '@/components/SciChart/SciChart';
import SciChartKbar from '@/components/SciKChart/SciChart.Kbar';
import SciTChartVolume from '@/components/SciKChart/SciChart.Volume';
import SciChartOPTDEF from '@/components/SciKChart/SciChart.OPTDEF';
import SciChartMA from '@/components/SciKChart/SciChart.MA';
import SciChartBBAND from '@/components/SciKChart/SciChart.BBAND';
import SciChartSAR from '@/components/SciKChart/SciChart.SAR';
import SciChartRSI from '@/components/SciKChart/SciChart.RSI';
import SciChartIchimoku from '@/components/SciKChart/SciChart.ichimoku';
import SciChartMACD from '@/components/SciKChart/SciChart.MACD';
import SciChartKD from '@/components/SciKChart/SciChart.KD';
import SciChartVIX from '@/components/SciKChart/SciChart.VIX';
import SciChartATR from '@/components/SciKChart/SciChart.ATR';
import SciChartDMI from '@/components/SciKChart/SciChart.DMI';
import SciChartOPID from '@/components/SciKChart/SciChart.OPID';
import SciChartPCRatio from '@/components/SciKChart/SciChart.PCRatio';
import SciChartWR from '@/components/SciKChart/SciChart.WR';
import SciChartPlugin from '@/components/SciKChart/SciChart.Plugin';
import KChartLandFoot from "@/components/KChart/KChart.Land.Foot";

export default {
	components: {SciChart, SciChartPlugin, KChartLandFoot},
	props: ['model', 'symbol', 'param', 'propNk', 'suspend'],
	data() {
		return {
			sciChartInit: false,
			sciChartKey: "".random(),
            // 啟用十字線
            enableCross: false,
			// SciChart 參數
			sciChartParam: {
				// 垂直主格線
				drawMajorGridLinesX: false,
				// 垂直副格線
				drawMinorGridLinesX: false,
				// 水平主格線
				drawMajorGridLinesY: true,
				// 水平副格線
				drawMinorGridLinesY: false,
				// 分割區列表
				partitionList: [
					{
						class: 'flex-4',
						labelPrecision: 'DECIMAL_LENGTH',
						idcList: [
							{component: SciChartKbar, visibleRangePlus: 4},
							// {component: SciChartMA},
						],
						// 額外處理YAxis顯示
						formatLabelYAxis: true,
					},
					{
						class: 'flex-1',
						idcList: [
							{component: SciChartRSI},
						]
					},
					{
						class: 'flex-1',
						idcList: [
							{component: SciChartMACD},
						]
					}
				],
				callback: {
					// onTouchStart: this.onTouchStart,
					onTouchMove: this.onTouchMove,
					onTouchEnd: this.onTouchEnd,
				},
				// 預設要顯示的根數 (優先度會低於最後記憶)
				defaultVisibleTicks: 60,
				NK: 1,
			},
			idcList_main: ['OPTDEF','MA','BBAND','SAR','ichimoku','None'],
			idcList_sub: ['Volume', 'RSI', 'MACD', 'KD', 'ATR', 'VIX', 'DMI', 'OPID', 'PCRatio', 'WR'],
			com_map: {
				"OPTDEF": SciChartOPTDEF, "MA": SciChartMA, "BBAND": SciChartBBAND, "SAR": SciChartSAR, "ichimoku": SciChartIchimoku,
				"Volume": SciTChartVolume, "RSI": SciChartRSI, "MACD": SciChartMACD,
				"KD": SciChartKD, "ATR": SciChartATR, "VIX": SciChartVIX, "DMI": SciChartDMI,
				"OPID": SciChartOPID, "PCRatio": SciChartPCRatio, "WR": SciChartWR,
			},
			sciObj: [],
			showSciChart: false,
		}
	},
	beforeMount() {
		this.sciChartParam.NK = this.$store.state.Kchart.NK;
		this.$store.state.Kchart.orderQty = this.$store.getters.getDefaultQty;
		// 處理從pdsettin來的不支持清單
		if(this.notSupportedIdc) {
			for(let idx in this.notSupportedIdc) {
				let idc = this.notSupportedIdc[idx];
				// 指標在清單中的位置
				let inListIdx_M = this.idcList_main.indexOf(idc);
				let inListIdx_S = this.idcList_sub.indexOf(idc);
				// 如果該指標在清單中，且pdsettin設定不支持就從清單移除。
				if(inListIdx_M != -1 && this.notSupportedIdc[idx]) {
					this.idcList_main.splice(inListIdx_M, 1);
				}
				// 如果該指標在清單中，且pdsettin設定不支持就從清單移除。
				if(inListIdx_S != -1 && this.notSupportedIdc[idx]) {
					this.idcList_sub.splice(inListIdx_S, 1);
				}
			}
			// 處理如果已選取的指標已經被設定不支援情況。
			// let list = Object.keys(this.notSupportedIdc);
			if(this.notSupportedIdc.indexOf(this.mainIdc) != -1) {
				let idc = this.idcList_main[0];
				// 設定主指標的技術線圖
				this.$store.commit("setKchartIdc", idc);
			}
			// 設定主指標的技術線圖組件
			if(this.com_map[this.mainIdc])
				this.sciChartParam.partitionList[0].idcList[1] = {
					component: this.com_map[this.mainIdc],
					visibleRangePlus: this.mainIdc==='ichimoku' ? 22 : 4,
				};
			// 設定副指標線圖
			for(let i = 1; i < this.sciChartParam.partitionList.length; i++){
				let com = this.com_map[this.subIdcList[i - 1]];
				this.sciChartParam.partitionList[i].idcList[0] = {component: com};
			}
		}
		// 目前橫置切換線圖後回復直式可能會有兩個副圖重複同一個指標情形，因此做自動判斷調整。
		let isSubRepeat = this.subIdcList.filter(sub=>(sub == this.subIdcList[0])).length > 1;
		if(isSubRepeat) {this.switchIdc(1);}
		// 非直向顯示(不顯示副圖)
		if(!this.isPortrait || (this.model == 'order')) {
			if(!this.isPortrait) {
				let idcQty = this.showSubIdcOnLandscape? 2: 1;
				// 橫置時保留一張副圖
				this.sciChartParam.partitionList.splice(idcQty);
			}
			else if(this.model == 'order'){
				// 重設class
				this.sciChartParam.partitionList[0].class = "flex-1";
				// 移除副圖partition
				this.sciChartParam.partitionList.splice(1);
			}
		}
		if(this.model == 'order') {
			this.sciChartParam.disablePress = true;
		}
	},
	mounted() {
		// 橫置時延遲實體化sciChart(以防止sciChart過早取得寬高，導致線圖超出範圍)
		if(!this.showSciChart) {
			let self = this;
			setTimeout(() => {
				self.showSciChart = true;
			}, 32);
		}
	},
	beforeDestroy() {},
	methods: {
		// 收到pass事件
		onPassEmit(key) {
			// 收到KBar初始化資料事件(不透過eventBus是為了不影響其他相同組件)
			if(key == 'KBARINITDATA') {
				// 重新指派sciObj
				this.sciObj = this.$refs.sciChart.sciObj;
				// 設定線圖初始完成(可執行plugin初始化)
				this.sciChartInit = true;
			}
		},
		onClick(pid){
			let ht = this.$refs.sciChart.getHitTestInfo(pid, event);
			// 沒有hitTestInfo不處理(點到x、y軸時時)
			if(ht.isEmpty) return;
			// 切換主指標
			this.switchIdc(pid);
		},
		// 取下一個指標
		getNextIdc(list , idx) {
			let newIdc = ""
			for(let i = 0; i < list.length; i++){
				idx ++;	// index
				// 找下一個指標
				if(list[idx]){
					newIdc = list[idx] 
				}
				// 找不到下一個指標，以第一個設定，並重設index
				else {
					newIdc = list[0];
					idx=0;
				};
				// 是否重複副指標
				let isRepeatVol = this.isPortrait? this.$store.state.Kchart.Vol.indexOf(newIdc) < 0: true;
				// 不存在vuex裡的指標結束回圈(不重複指標)
				if(isRepeatVol && this.$store.state.Kchart.Idc.indexOf(newIdc) < 0 ) {
					break;
				}
			}
			return newIdc;
		},
		switchIdc(pid){
			let idcIdx = 0;
			let idcList = [];
			// 主指標清單及圖標位置
			if(pid === 0) {
				idcIdx = 1;
				idcList = this.idcList_main;
			}
			// 副指標清單
			else {
				idcList = this.idcList_sub;
				// 量圖已全部使用不切換
				if(!this.unSelectedSubList[0]) return;
			}
			// 預設下一個指標是第一個
			let nextIdc = idcList[0];
			if(this.sciChartParam.partitionList[pid].idcList[idcIdx]) {
				// 取各指標內的資料comName處理。
				let idc = this.sciChartParam.partitionList[pid].idcList[idcIdx].component.data().comName.split('.').slice(-1)[0];
				let idx = idcList.indexOf(idc);
				nextIdc = this.getNextIdc(idcList, idx);
				let com = this.com_map[nextIdc];
				// 有組件時替換
				if(com){
					let newIdcObj = {"component": com, visibleRangePlus: nextIdc==='ichimoku' ? 22 : 4};
					this.sciChartParam.partitionList[pid].idcList.splice(idcIdx,1, newIdcObj);
				}
				// 有指標名稱，但沒有對應組件(None)移除
				else if(nextIdc && !com)
					this.sciChartParam.partitionList[pid].idcList.splice(idcIdx,1);
			}
			else 
				this.sciChartParam.partitionList[pid].idcList.splice(idcIdx,1, {"component": this.com_map[nextIdc]});
			// 設定主指標的技術線圖
			if(pid == 0) {
				this.$store.commit("setKchartIdc", nextIdc);
			}
			// 設定副指標
			else {
				this.subIdcList.splice(pid - 1, 1, nextIdc);

			}
		},
		// 填滿副指標清單
		fillSubIdcList(){
			let list = [];
			if(Array.isArray(this.$store.state.Kchart.Vol)){
				list = list.concat(this.$store.state.Kchart.Vol).concat(this.unSelectedSubList.slice(0, this.subChartLen - this.$store.state.Kchart.Vol.length));
			}
			else {
				list.push(this.$store.state.Kchart.Vol);
				list = list.concat(this.unSelectedSubList.slice(0, this.subChartLen - 1));
				
			}
			this.$store.commit('setKchartVol', list);
		},
		onPress(e) {
			if(this.model == 'order') {
				// 圖形下單模式下出十字線不處理
				if(this.$refs.sciChart.showCross) return;
				// 正常圖形下單模式，取消十字線功能，並執行長按委託。
				if(!this.$refs.sciChart.disableCross)
					this.$refs.sciChart.disableCross = true;
				// 設定非拖曳模式(避免move事件時被return)
				this.$refs.sciChart.enablePan = false;
				// 移除chartModifiers(避免因未結束滑動事件前就設定ZoomPanModifier的isEnabled屬性，導致後續非預期的異常問題)
				this.$refs.sciChart.removeModifiers();
				// 依觸發事件取hitTestInfo
				let hitTestInfo = this.$refs.sciChart.getHitTestInfo(0, e);
				// 有hitTestInfo才執行長按功能
				if(!hitTestInfo.isEmpty){
					this.$refs.sciChartPlugin.onPress(e, hitTestInfo.hitTestPointValues.y);
				}
			}
		},
		onTouchMove(idx, hitTestInfo) {
			if(this.model == 'order') {
				// 圖形下單模式下出十字線不處理
				if(this.$refs.sciChart.showCross) return;
				this.$refs.sciChartPlugin.onTouchMove(hitTestInfo.hitTestPointValues.y);
			}
		},
		onTouchEnd(idx) {
			if(this.model == 'order') {
				// 圖形下單模式下出十字線不處理
				if(this.$refs.sciChart.showCross) return;
				this.$refs.sciChartPlugin.onTouchEnd();
				// 重建chartModifiers
				this.$refs.sciChart.initModifier();
				// 設定拖曳模式
				this.$refs.sciChart.enablePan = true;
			}
		}
    },
	watch: {
		nk(nv, ov) {
			this.sciChartParam.NK = nv;
			let self = this;
			setTimeout(() => {
				self.sciChartKey = "".random();
			}, 1);
		},
		sid() {
			// 標的與日K切換時，因不會觸發NK改變。所以需要以更新方式切換線圖
			if(this.nk == this.sciChartParam.NK) 
				this.sciChartKey = "".random();
		},
		// sciChart更新時，設定初始化為false
		sciChartKey(nv) {
			this.sciChartInit = false;
		},
		isPortrait(nv, ov) {
			// 橫、直切換時先不實體化scichart以免線圖搶到其他組件的顯示寬高
			this.showSciChart = false;
			let self = this;
			setTimeout(() => {
				self.showSciChart = true;
			}, 32);
		},
		suspend(nv) {
			if(!nv)
				this.sciChartKey = "".random();
		}
	},
	computed: {
		sid() {
			if(this.symbol) return this.symbol;
			// 依已選擇商品是否為熱門月切換sid代碼
			if(this.$store.state.selectedSymbol.displayAsHot)
				return M4C.Symbol.toHotSymbol(this.$store.state.selectedSymbol.ID);
			else
				return this.$store.state.selectedSymbol.ID;
		},
		nk() {
			if(this.propNk) return this.propNk;
			return this.$store.state.Kchart.NK || 1;
		},
		/** 不支持的指標列表(By pdsetting) */
		notSupportedIdc(){
			const list =[];
			for (let idc in this.$store.state.config.quotePdSetting.function.hiddenIndicator) {
				if(this.$store.state.config.quotePdSetting.function.hiddenIndicator[idc]) 
					list.push(idc);
			}
			return list ;
		},
		mainIdc(){return this.$store.state.Kchart.Idc;},
		// 副指標圖數量
		subChartLen(){return this.sciChartParam.partitionList.length - 1;},
		// 已選副指標清單
		subIdcList(){
			// 長度不一致時填滿(目前橫置要顯示一個副圖，所以另外判斷)
			if(!Array.isArray(this.$store.state.Kchart.Vol) || (this.$store.state.Kchart.Vol.length != this.subChartLen && this.isPortrait)) {
				this.fillSubIdcList();
			}
			return this.$store.state.Kchart.Vol;
		},
		// 未被選取的副指標
		unSelectedSubList(){
			let selectedList = this.$store.state.Kchart.Vol;
			if(Array.isArray(selectedList)){
				return this.idcList_sub.filter((e) => {
					return selectedList.indexOf(e) === -1
				});
				
			}
			else 
				return this.idcList_sub.filter((e) => {
					return selectedList.indexOf(e) === -1
				});
		},
		// 直立顯示
		isPortrait() {
			return this.$store.state.status.isPortrait;
		},
		// 橫置時顯示副圖
		showSubIdcOnLandscape() {return this.$store.state.Kchart.showSubIdcOnLandscape},
    },
}
</script>

<style scoped>
.cross-btn.selected {
	color: yellow;
}
</style>