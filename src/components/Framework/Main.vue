<template>
	<div ref="mainCtn" class="main-ctn" :class="{'bgc-transparent': $store.state.bgcTransparent}">
		<!-- 底层各版面 ex.首页/市场/期权/交易/设定 -->
		<div class="FULL flex-col" :class="{'opacity0': $store.state.bgcTransparent}">
			<!-- 表頭區 -->
			<MixHead class="zindex-1"></MixHead>
			<!-- 身體區 -->
			<div class="body flex-1 posr">
				<transition name="slide-left">
					<!-- 版面元件 (有彈窗時 suspend) -->
					<component class="FULL" :is="$store.state.layout.body" :suspend="popupDialogList.length > 0"></component>
				</transition>
			</div>
			<!-- 底部版面按鈕 -->
			<BottomBar class="foot" v-show="isPortrait"></BottomBar>
		</div>

		<!-- 斷線提示 -->
		<DisconnectNotify />
		<!-- 音效控制 -->
		<AudioHandler />
		<!-- 滑出式選單 -->
		<SideMenuFramework v-if="popupDialogList.length==0"><SideMenu/></SideMenuFramework>
		<!-- 橫式阻擋畫面 -->
		<LandscapeDeny v-if="!isPortrait && !allowLandscape" class="FULL" />
		<!-- 下拉器 -->
		<DragDownCtn v-if="!twMode" class="drag-down-ctn">
			<SimpleOC />
		</DragDownCtn>
		<!-- 新手教學組件 -->
		<Helper />
		<!-- 更多 -->
		<transition name="show">
			<ExtraMenu v-if="$store.state.status.displayExtraMenu" />
		</transition>
		<!-- 截圖中 -->
		<ScreenShotMask />
		<!-- 雲端條件單同意書核心 (需在進入main以後才載入) -->
		<M4C_SmoAgreement />
		<!-- 新功能導覽 -->
		<Tooltip />
		<!-- 系統樣式覆寫器 -->
		<OverwriteStyle />
		<!-- 憑證檢查器 -->
		<CertValidator />
		<!-- 快速登入提示 -->
		<SecurityLockRemind />
	</div>
</template>

<script>
import OverwriteStyle from "@/components/Framework/OverwriteStyle.vue";
import BottomBar from "@/components/Framework/BottomBar.vue";
import DisconnectNotify from "@/components/Framework/DisconnectNotify.vue";
import LandscapeDeny from "@/components/LandscapeDeny.vue";
import SimpleOC from "@/components/SimpleOC.vue"
import OrderModeSwitch from "@/components/Order/OrderModeSwitch.vue"
import ArticleContent from "@/components/ArticleContent.vue";
import Tooltip from "@/components/Tooltip.vue"
import Helper from "@/components/Helper.vue"
import CertValidator from "@/components/Cert/CertValidator.vue"
import SecurityLockRemind from "@/components/SecurityLockRemind.vue"

export default {
	data() {
		return {
		}
	},
	components: {
		OverwriteStyle,
		BottomBar,
		DisconnectNotify,
		LandscapeDeny,
		SimpleOC,
		Tooltip,
		Helper,
		CertValidator,
		SecurityLockRemind,
	},
	beforeMount() {
		// 是否要隱藏首頁
		if (!this.displayHomepage) {
			delete this.$store.state.config.CONFIG.LAYOUT.optcloud;
		}
		// 呼叫彈出式下單盒 (利用這邊來統一/簡化所有彈出下單盒的參數)
		eventBus.$on("ORDER", (param)=>{
			// 未登入交易帳號 -> 彈出登入交易帳號視窗
			if (!M4C.Trader.checkLoginTrade()) return;
			// 彈出下單盒的動畫效果
			let config = {transName: 'float', moreBtns: [OrderModeSwitch]};
			// 台灣版移除下單盒模式切換按鈕，並指定高級下單盒模式
			if(this.twMode) {
				config.moreBtns = [];
				// 預設高級下單盒
				this.$store.state.config.orderBoxMode = 1;
			}
			eventBus.$emit("POPUP-DIALOG", 'Mixorder', param, config);
		});
		// 送出時間點事件
		eventBus.$emit("MAIN_BEFORE_MOUNT");
	},
	mounted() {
		// 顯示大字型提示
		if(this.$store.state.config.showLargeNotice){
			let self = this;
			// 舊用戶第一次更新到大字型版本，跳提示視窗;新用戶不顯示
			eventBus.$emit("CONFIRM-DIALOG", {
			title: this.$ln('啟用大字型提示標題'),
			content: this.$ln('啟用大字型提示內文'),
			confirm: () => {
				self.$store.state.config.largeSize = true;
				},
			});
			self.$store.state.config.showLargeNotice = false;	
		}

		// 移除載入主程式畫面
		window.removeScreenLoadingBuild();
		// 移除指定主程式來源主機密技功能
		try{document.getElementsByClassName('migi-ctn')[0].remove();}catch(e){};
		// 支持結算單
		if (this.$store.state.config.CONFIG.POPUP_SETTLEMENT) {
			// 每天僅彈出一次結算單
			let today = new Date().day8();
			if (today != localStorage.getItem(`${this.$store.state.config.projectID}_SETTLEMENT_DATE`)) {
				eventBus.$emit('POPUP-DIALOG', 'Settlement');
				localStorage.setItem(`${this.$store.state.config.projectID}_SETTLEMENT_DATE`, today);
			}
		}
		eventBus.$emit("START-COMPLETE");
		// 自動彈出文章
		if (this.popupArticleAuthKey) {
			eventBus.$emit("POPUP-DIALOG", ArticleContent, {auth_key: this.popupArticleAuthKey}, {transName: 'float'});
		}
	},
	created() {},
	methods: {},
	watch: {
		// 彈出文章代碼
		popupArticleAuthKey(nv) {
			if (nv) {
				eventBus.$emit("POPUP-DIALOG", ArticleContent, {auth_key: this.popupArticleAuthKey}, {transName: 'float'});
			}
		},
	},
	computed: {
		// 響應式轉向變數 (直向=true)
		isPortrait() {
			return this.$store.state.status.isPortrait;
		},
		quotePageDisplayClass() {
			return this.$store.state.status.quotePageDisplayClass;
		},
		// 允許橫向顯示 (僅在 QuotePage+K 才允許橫向顯示)
		allowLandscape() {
			// 無彈窗時一律不接受橫向
			let dlg = this.popupDialogList[this.popupDialogList.length - 1];
			if (!dlg) return;
			// 當前彈窗的 class
			let clsName = M4C.Analysis.getComponentClassName(dlg.cls);
			
			// OptCloudDialog && ResourcePluginDialog 接受轉橫向
			if (clsName === 'OptCloudDialog' || clsName === 'ResourcePluginDialog' || clsName === 'RelativeVideoListDialog' || clsName === 'ResourceDetailEntryDialog')
				return true;
			// 商品詳情 
			if (clsName === 'QuotePage' && this.quotePageDisplayClass === 'QuotePageMixChart')
				return true;
			if (clsName === 'QuotePageSub' && this.quotePageDisplayClass === 'QuotePageKChartOrder')
				return true;
			// 額外彈出的tvc技術線圖
			if (clsName === 'TvcKbar') return true;
		},
		/** 彈出視窗 (背後會 suspend)*/
		popupDialogList() {
			return this.$store.state.popup.dialogList;
		},
		/** 需要有交易登入才可使用的元件 */
		requireTradeLoginMap() {
			return this.$store.state.config.requireTradeLoginMap;
		},
		/** 是否顯示首頁 */
		displayHomepage() {
			try {return this.$store.state.config.quotePdSetting.function.style.homepage.display;}catch(e){}
		},
		// 要自動彈出的文章代號
		popupArticleAuthKey() {
			return this.$store.state.status.popupArticleAuthKey;
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
	},
}
</script>

<style scoped>
.main-ctn {
	overflow: hidden;
}
.main-ctn .foot {
	height: 50px;
    background-color: #363C42;
	z-index: 2;
}
/* 不支持橫向遮罩 */
.deny-landscape-mask {
	background-color: #222;
	z-index: 99;
}
/* 下拉器 */
.drag-down-ctn {
	position: absolute;
	top: 0;
	left: 15vw;
	right: 15vw;
	height: 10vw;
	z-index: 4;
}
</style>