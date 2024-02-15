<template>
    <div class="flex-col">
		<!-- 表頭列 -->
		<OptCloudHead class="head" :backType="1" :showText="param.name" v-if="displayX4Head"
			@onBtnShare="onBtnShare" @onBtnHelp="onBtnHelp" :enableShare="enableShare" />
		<div class="flex-1 posr" v-stop-propagation-y>
			<component ref="ocInstance" :is="componentID" :lang="langCode"
				@clickCallback="onClickCallback"
				:displayBackBtn="!$store.state.status.isPortrait"
				@displaySetting="onDisplaySetting"
				:id="param.watchId"
				theme="dark"
				@clickBackBtn="onClickBackBtn"
				@clickOrder="onClickOrder"
				:filterOptions="filterOptions"
			/>
		</div>
		<LoadingIcon v-if="isLoading"></LoadingIcon>
    </div>
</template>

<script>
import OptCloudHead from "@/components/OptCloudHead.vue";
import OptCloudDialog from "@/components/OptCloudDialog.vue";
import OptCloudHelper from "@/components/OptCloudHelper.vue";
import OCContainerBase from '@/components/OCContainer.base.js'

export default {
    mixins: [OCContainerBase],
	props: ["param"],
	data() {
		return {
			componentID: "",
			queryEpsResult: {},
		}
	},
	beforeMount() {
		// 統計分析使用
		this.$store.state.status.optCloudDialogName = this.param.name || this.param.id;
	},
    mounted() {
		// 延遲 300ms 載入，避免導致 Dialog 滑入效果卡頓
		setTimeout((self)=>{
			self.componentID = this.param.id;
		}, 300, this);
	},
	beforeDestroy() {},
	components: {
		OptCloudHead,
		OptCloudHelper,
	},
    methods: {
		/** 點擊特定商品 -> 連動並彈出該商品行情畫面 */
		onClickCallback(param) {
			if (param.symbol) {
				// 先把品種代碼轉合約代碼 -> 再設定關注商品
				let contractID = M4C.Symbol.toContractID(param.symbol);
				this.$store.commit("setSelectedSymbol", contractID);
				// 彈出商品頁
				eventBus.$emit("POPUP-DIALOG", "QuotePage");
			}
		},
		/** 點擊返回按鈕 */
		onClickBackBtn() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		/** 關注管理時，點擊新增關注卡片，或是已存在的關注卡片 -> 再彈出下一層載入 WatchListSetting */
		onDisplaySetting(watchId) {
			eventBus.$emit("POPUP-DIALOG", OptCloudDialog, {clsName: "OptCloudDialog", id: "WatchListSetting", "watchId": watchId});
		},
		/** 呼叫期權雲元件的分享(share) */
		onBtnShare() {
			if (this.enableShare) {
				OptionCloud.share(this.param.id, this.langCode);
			}
		},
		/** 彈出本期權雲元件的教學說明 */
		onBtnHelp() {
			let zindex = this.param.zindex ? this.param.zindex + 1 : null;
			eventBus.$emit("POPUP-DIALOG", OptCloudHelper,
				{id: this.param.id, name: `${this.param.name}${this.$ln('说明')}`},
				{transName: 'float', zindex: zindex});
		},
		/** 帶出下單盒 */
		onClickOrder(param) {
			console.log(`OptCloudDialog.onClickOrder`, param.sid, param);
			this.lastOrderParam = param;
			let sid = M4C.Symbol.getUnderlyingS(param.sid);
			sid = sid.split('.').slice(0,4).join('.');
			let mth = param.month === "HOT" ? 1 : param.month;
			this.queryEpsResult = M4C.HistoryData.queryEps(sid, mth);
		},
	},
	watch: {
		'queryEpsResult.$STATUS': function(nv) {
			if (nv === "DONE") {
				let param = this.lastOrderParam;
				let data = this.queryEpsResult.data.d.$data.gzip[0];
				let p = data.p;
				let eps = data.eps;
				// 將最新價塞入價平位置
				for (let i=0; i<eps.length; i++){
					if (p >= eps[i] && p < eps[i+1]) {
						eps.splice(i+1, 0, p);
						break;
					}
				}
				// 取得最新價的 index
				let idx = eps.indexOf(p);
				idx = idx === -1 ? (eps.length-1) : idx;
				// 取虛實值N檔座落的檔位
				idx = Big(this.lastOrderParam.autoStrike).times(param.callput==='C' ? -1 : 1).plus(idx);
				let strike = eps[idx];
				// 組合出合約代碼
				let sid = `${param.sid}.${data.m}.${param.callput}.${strike}`;
				// 設定關注商品
				this.$store.commit("setSelectedSymbol", sid);
				// 彈出下單盒
				eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
			}
		}
	},
    computed: {
		/** 要帶給 vue-option-cloud 的語系代號 */
		langCode() {
			switch(this.$store.state.lang.language) {
				case "zh":		return "zh-CN";
				case "zh-TW":	return "zh-TW";
				case "en":		return "en";
			}
		},
		/** 是否要顯示 X4 的標題列 */
		displayX4Head() {
			// 不顯示表頭列清單
			let mapArray = ["WatchListBoard", "WatchListSetting"];
			let isInarray = mapArray.indexOf(this.param.id) >=0 ;
			return !isInarray;
		},
		/** 是否支援分享功能 */
		enableShare() {
			if (OptionCloud.hasShare)
				return OptionCloud.hasShare(this.param.id);
		},
		/** 是否顯示 loading-icon */
		isLoading() {
			if (this.queryEpsResult.$STATUS === "QUERY")		return true;
			return false;
		},
	},
}
</script>

<style scoped>
</style>