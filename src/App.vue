<template>
	<div ref="appCtn" class="app-ctn sys-bgc flex-1 posr"
		:class="{
			'ENG': this.$store.state.language == 'en',
			'mobile': !isDesktop,
			'desktop': isDesktop, 
			'bgc-transparent': $store.state.bgcTransparent,
			'screen-shot': $store.state.onScreenShot,
			'device-ios': $store.state.device.isDeviceIOS,
		}" 
		v-touching="`.tcef`" v-touching-end="`.tcend`">
		<!-- 這個元素是為了讓 icon-font 提早被載入 -->
		<span class="for-init-icon-font"><i class="material-icons">cloud_download</i></span>
		<!-- M4C核心容器 -->
 		<M4Core />
		<!-- 期權雲處理核心 -->
 		<OCCore />
		<!-- 專案設定檔 -->
		<Config />
		<!-- Vuex 預設值管理器 -->
		<StoreFn />
		<StoreManager />
		<!-- App版本號檢查器 -->
		<AppVersionChecker v-if="publicPdSetting" />

		<!-- 登入頁 / 主畫面 -->
		<transition name="slide-left">
			<component class="FULL" :is="componentName"></component>
		</transition>
		<!-- 登入前/後都需要 FlashMessage，因此上提至 App.vue 層 -->
		<FlashMessage ref="flashMsg" />
		<!-- 利用此 canvas 來取得當前 ratio -->
		<canvas ref="ratioCanvas" v-if="!$store.state.device.ratio"></canvas>
		<!-- 彈出型浮現視窗 (全系統僅限一個) -->
		<FloatDialog v-if="floatDialog.comClass" :comClass="floatDialog.comClass"></FloatDialog>
		<!-- 收送记录器 (dev/browser only) -->
		<ServerRecord v-if="enableServerRecord"/>
		<!-- 單選器 -->
		<SingleSelectDialog class="FULL" />
		<!-- 確認視窗 -->
		<ConfirmDialog class="FULL"/>
		<!-- 處理交易帳號登入密碼失效或逾期的元件 -->
		<PasswordInvalid />
		<!-- 新提示機制 -->
		<Notifycation />
		<!-- 報價競速器 -->
		<QuoteRacer v-if="publicPdSetting && !$store.state.status.quoteHost" />
		<!-- 報價登入器 -->
		<QuoteLoginer v-if="aliveLoginQuote" />
		<!-- 暫停/恢復管理器 -->
		<PauseResume />
		<!-- 顯示來源主機 -->
		<FromHost />
		<!-- 使 watch: fontSizeRatio 有效  -->
		<div class="hidden">fontSizeRatio : {{fontSizeRatio}}</div>
		<!-- 全局 LoadingIcon -->
		<LoadingIcon class="font-size-xl zindex-9" v-model="$store.state.loading" />
		<!-- resize 監視器 -->
		<resize-observer v-if="isDesktop" @notify="desktopOnResize" />
		<!-- 彈出視窗 -->
		<PopupDialog />
		<!-- 中央彈出式視窗 -->
		<PopupFloatDialog />
		<!-- 陣列同意書 -->
		<AgreementList />
		<!-- 關注商品的最新Tick時間 (for AUTOTEST) -->
		<SelectedSymbolTickTime v-if="$store.state.autotest.enable" />
		<!-- JSTest -->
		<JSTest v-if="$store.state.jstest.display" />
		<LogSetting></LogSetting>
	</div>
</template>

<script>
import WarningDevice from "@/components/WarningDevice.vue"
import FromHost from "@/components/FromHost.vue"
import QuoteRacer from "@/components/QuoteRacer.vue"
import AgreementList from "@/components/AgreementList.vue"
import SelectedSymbolTickTime from "@/components/SelectedSymbolTickTime.vue"
import JSTest from "@/components/JSTest/JSTest.vue"
import LogSetting from "./components/LogSetting.vue"


export default {
	data() {
		return {
			floatDialog: {},
		}
	},
	components: {
    FromHost,
    QuoteRacer,
    AgreementList,
    SelectedSymbolTickTime,
    JSTest,
    LogSetting
},
	watch: {
		fontSize: {
			handler: function() {
                this.resetFontSize();
            },
			deep: true
		},
		/** 轉向發生 */
		orientation(nv) {
			this.resetFontSize(nv);
		},
		fontSizeRatio() {
			this.resetFontSize();
		},
		/** 商品表完成 */
		'$store.state.status.mainformReady'(nv) {
			// 商品表完成 && OC尚未完成
			if (nv && !this.$store.state.status.ocReady)
				window.showInitialMessage(this.$ln('正在取得期权云主程式...'));
			if (nv && !this.$store.state.status.rpReady)
				window.showInitialMessage(this.$ln('正在取得学院资源主程式...'));
		}
	},
	beforeMount() {
		console.log(`載入主程式耗時 : ${new Date() - window.onLoadBuildJsTime}ms`);
		let self = this.$store.state.root = this;
		// 方便 console 直接使用
		window.vuex = this.$store.state;
		// 清除主程式載入失敗的Timeout
		clearTimeout(window.loadingFailTimeout);
		// 全域變數 (應改用 Vuex)
		window.$gv = {};

		// 各種彈窗的關閉 ＆＆ 瀏覽器 or Android 的 Back Button (目前不處理 forward，要區分的話可以區分)
		window.onpopstate = function(event) {
			// 當前是否為直式
			let isPortrait = event && event.state ? event.state.isPortrait : true;
			// 關閉確認視窗 (若有的話)
			if (self.$store.state.confirmDialog.data) {
				self.$store.state.confirmDialog.data = null;
				return;
			}
			// 關閉 SingleSelectDialog (若有的話)
			if (self.$store.state.sync.singleSelectData) {
				self.$store.state.sync.singleSelectData = null;
				return;
			}
			// 取得最上層彈窗
			let dlgList = self.floatDialogList.length > 0 ? self.floatDialogList : self.popupDialogList;
			let dlgItem = dlgList[dlgList.length-1];
			// 關閉彈窗 (僅關閉當前裝置方向彈出的視窗)
			if (dlgItem && dlgItem.isPortrait === self.$store.state.status.isPortrait) {
				dlgList.pop();
				return;
			}
			// android 時，提示關閉離開
			if (self.$store.state.device.isAndroid) {
				// eventBus.$emit("FLASHMESSAGE", self.$ln("再按一次返回以離開程式"), {"bgClr": "black"});
				eventBus.$emit("CONFIRM-DIALOG", {
					title: self.$ln("關閉程式"),
					content: self.$ln("確認是否關閉並離開本應用程式？"),
					confirm: () => {
						window.navigator.app.exitApp();
					},
					cancel: ()=>{
						// 取消時重新加回一層保護
						history.pushState({isPortrait: self.$store.state.status.isPortrait}, '');
					},
				});
				return;
			}
			// 關桌機版彈窗
			if (self.isDesktop) {
				self.dskDlgList.pop();
			}
		};
		
		// 有截圖保護插件時要求使用權限(需要每次執行時要求app一次，這樣才收得到截圖後的檔案變動事件。只有首次會彈出選項。)
		if(this.screenshotsPlugin)
			this.screenshotsPlugin.requestPermission();
		// 截圖事件處理(一律跳溫馨提醒)
		document.addEventListener("onTookScreenshot", function() {
			eventBus.$emit("FLASHMESSAGE", self.$ln("【温馨提醒】截图内容可能包含个人或帐户资料，请妥善保管。"), {"bgClr": "black"});
		});
		// 同意書完成時
		eventBus.$on("ONCLOSE-AGREE", ()=>{
			console.log('Agreement Complete !');
			// 同意書完成 (console.log.js 要判讀，同意書完成後才能寫 log)
			window.agreementComplete = true;
			// 相容舊殼 3.8.0- : 預設 device.available = true
			if (window.device && window.device.available) {
				// M4C.BGInfo 看這個變數才生成
				this.$store.state.status.windowDeviceAvailable = true;
			}
			// CN核規要求同意書之後才可請求權限 https://trello.com/c/LE49Ksvj
			if (window.device && window.device.available === false && typeof(window.device.init) === "function") {
				window.device.init(()=>{
					console.log('window.device.init() success');
					// M4C.BGInfo 看這個變數才生成
					this.$store.state.status.windowDeviceAvailable = true;
					// MAC 要填入 window.device.uuid
					M4C.PdSetting.updateMAC();
				}, ()=>{
					console.log('window.device.init() error');
				});
			}
		});
	},
	mounted() {
		let self = this;
		// 揭示 deviceID
		let msg = document.getElementsByClassName("loader-message");
		if (msg[0]) msg[0].textContent = this.$store.state.device.deviceID;
		// AC 權限問題 (在登入前後都可能發生，所以提到 App.vue 層)
		M4C.on("AC-PERM-ERROR", (data)=> {
			let msg = data.$MSG;
			// 委託無權限情境
			if (data.d.c === "order") {
				msg = `(${this.$ln(data.d.c)}) ${data.$MSG}`;
				M4C.Order.clearOrderTimeout(data.r);
			}
			this.$store.state.notify(`error`, msg);
		});
		// PING/PONG 無回應
		M4C.on("PONG-TIMEOUT", (data)=> {
			this.$store.state.notify(`error`, `网路连线问题`);
		});
		M4C.on("SYMBOL-ERROR", (data)=> {
			this.$store.state.notify(`error`, `${this.$ln('总表异常')} (${data.cd})`);
		});
		// 斷線重連 登入失敗時
		M4C.on("AUTO-RECONNECT-FAIL", (data, wsConn)=>{
			eventBus.$emit("CONFIRM-DIALOG", {
				title: self.$ln("自动重连登入失败"),
				content: self.$ln("请重启后再尝试登入"),
				confirm: () => {
					window.location.reload();
				}
			});
		});
		
		console.log(`App.vue mounted`);
		// [orientationchange] 早於 [轉向後 size ready]
		window.addEventListener('orientationchange', this.onOrientationChange);
		// 取得 ratio 放到 Vuex
		this.canvas = this.$refs.ratioCanvas;
		this.$store.state.device.ratio = this.getRatio();
		// 記下當前的寬高 (轉向判定比對用)
		let curW = this.$store.state.device.width = this.$refs.appCtn.clientWidth;
		let curH = this.$store.state.device.height = this.$refs.appCtn.clientHeight;
		console.log(`App.curWH`, curW, curH);

		// PWA 情境時故意往回退一層，避免 history 增加時，可能導致 PWA@iOS SideMenu滑出時觸發前一頁內容
		if (this.$store.state.device.isPWA) {
			history.back();
		}
		
		// Android 時增加一層防止 back 直接離開的保護層
		if (this.$store.state.device.isAndroid)
			history.pushState({isPortrait: self.$store.state.status.isPortrait}, '');

		this.resetFontSize();
		
		// 檢查若不是手機模式則彈出提示
		if (!this.$store.state.device.isMobile && !this.isDesktop) {
			this.floatDialog = {comClass: WarningDevice};
		}

		// 載入 OC/RP 是否完成
		this.$store.state.status.ocReady = window.ocJsReady && window.ocCssReady;
		this.$store.state.status.rpReady = window.rpJsReady && window.rpCssReady;
		// 語系檔設定
		this.$store.state.lang.mappingTable = (window._language || {}).MappingTable;
		
		// 非台灣版設定交易數量上限為無限，且交易設定透過無限的值來判斷不顯示設定UI。
		if(!this.twMode) this.$store.state.order.maxQty = Number.MAX_VALUE;
		// 最大上限口數為空字串時，取公開設定config的最大下單口數(預設值)設定。
		else if(this.$store.state.order.maxQty == "") this.$store.state.order.maxQty = this.defaultMaxQty;
		// 如果最大上限口數大於委託最大上限時，以最大上限為準(防呆機制)。
		else if(this.$store.state.order.maxQty > this.orderMaxLimit) this.$store.state.order.maxQty = this.orderMaxLimit;	
	},
	methods: {
		/** 由於 iOS 不支持 resize-observer，因此這邊自己偵測 */
		onOrientationChange() {
			let self = this;
			let viewportmeta = document.querySelector('meta[name="viewport"]');
			let isPad = this.$store.state.device.isPad;
			// 平版旋轉
			if(isPad){
				if(viewportmeta.content.indexOf("width") >= 0){
					viewportmeta.content = `user-scalable=no, height=${this.$store.state.device.restrictWidth}, viewport-fit=cover`;
				}
				else if(viewportmeta.content.indexOf("height") >= 0){
					viewportmeta.content = `user-scalable=no, width=${this.$store.state.device.restrictWidth}, viewport-fit=cover`;
				}
			}
			// 每 100ms 檢查一次寬度確實有變化，才是轉向穩定 (最遲 1000ms 後得要呼叫 onSizeReady)
			self.checkSizeCnt = 0;
			self.checkSizeChangeInterval = setInterval(()=>{
				if (self.$refs.appCtn.clientWidth !== self.$store.state.device.width || self.checkSizeCnt++ >= 10){
					self.onSizeReady();
					clearInterval(self.checkSizeChangeInterval);
				}
			}, 100);
		},
		/** 轉向後 Size 穩定 */
		onSizeReady() {
			let curW = this.$store.state.device.width = this.$refs.appCtn.clientWidth;
			let curH = this.$store.state.device.height = this.$refs.appCtn.clientHeight;
			console.log(`App.onSizeReady`, curW, curH);
			// 暫時先用window.orientation判斷直、橫式(因寬、高在ipad mini 上會無法正常作用)
			this.$store.commit("setOrientation", Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait');
		},
		/** 取得 radio (物理像素/设备像素) */
		getRatio() {
			let context = this.canvas.getContext('2d');
			let backingStore = context.backingStorePixelRatio ||
						context.webkitBackingStorePixelRatio ||
						context.mozBackingStorePixelRatio ||
						context.msBackingStorePixelRatio ||
						context.oBackingStorePixelRatio ||
						context.backingStorePixelRatio || 1;
			let ratio = (window.devicePixelRatio || 1) / backingStore;
			console.log(`getRatio`, ratio);
			return ratio;
		},
		/** 更新字體大小 */
		resetFontSize(nv = "portrait") {
			let appCtn = this.$refs.appCtn;
			let fs = this.$store.state.fontSize;
			// 橫式時高度單位改用 px
			let vhpx = this.$store.state.device.height / 100;
			for (let key in fs) {
				if (this.isDesktop) {
					if (this.fontSizeRatio) {
						let fontSizeNum = this.toEven(fs[key] * this.fontSizeRatio * 0.5);
						// 記下當前算出來的字體 px 數值
						this.$set(this.$store.state.fontSizePX, key, fontSizeNum);
						appCtn.style.setProperty(`--font-size-${key}`, `${fontSizeNum}px`);
						appCtn.style.setProperty(`--font-size-material-icons`, `${this.toEven(this.fontSizeRatio * 3)}px`);
					}
				}
				else if (nv.indexOf("portrait") !== -1)
					appCtn.style.setProperty(`--font-size-${key}`, `${fs[key]}vw`);
				else
					appCtn.style.setProperty(`--font-size-${key}`, `${(fs[key] * vhpx).toFixed(1)}px`);
			}
		},
		// 轉偶整數以確保 css 描述 em 時不會發生抖動問題 (可見於 dialog head 處)
		toEven(num) {
			num = parseInt(num);
			return num%2===0 ? num : num+1;
		},
		// 桌機視窗尺寸變化
		desktopOnResize() {
			this.$store.state.device.width = this.$refs.appCtn.clientWidth;
			this.$store.state.device.height = this.$refs.appCtn.clientHeight;
		},
	},
	computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		pid() {
			return this.$store.state.config.projectID;
		},
		fontSize() {
			return this.$store.state.fontSize;
		},
		fontSizeRatio() {
			return this.$store.state.desktop.selectedLayout.fontSizeRatio || 7;
		},
		orientation() {
			return this.$store.state.status.orientation;
		},
		/** 是否啟用 ServerRecord 模式 */
		enableServerRecord() {
			return this.$store.state.config.urlParam.sr;
		},
		publicPdSetting() {
			return this.$store.state.config.publicPdSetting;
		},
		/** 當前總畫面使用哪個元件 */
		componentName() {
			if (!this.$store.state.config.CONFIG)
				return;
			// 語系檔完成 & 總表完成 & OC完成 & 公開設定完成-> 主畫面
			if (this.$store.state.status.languageReady && this.$store.state.status.mainformReady && this.publicPdSetting) {
				return `Main`;
			}
			// 會員登入模式
			else
				return `LoginMember`;
		},
		/** QuoteLoginer 存活階段 = 有登入報價設定 && 尚未取得總表 */
		aliveLoginQuote() {
			return this.$store.state.config.CONFIG.LOGIN_QUOTE
				&& !this.$store.state.status.mainformReady
				&& this.$store.state.status.quoteHost;
		},
		/** 彈出視窗 (背後會 suspend)*/
		popupDialogList() {
			return this.$store.state.popup.dialogList;
		},
		/** 中央繃出視窗 (背後不會 suspend) */
		floatDialogList() {
			return this.$store.state.popup.floatDialogList;
		},
		dskDlgList() {
			return this.$store.state.desktop.dskDlgList;
		},
		// 截圖插件
		screenshotsPlugin() {try {return window.plugins.preventscreenshot;} catch(e) {}},
		// 最大下單口數(預設值) 無設定取99當預設
		defaultMaxQty() {
			try {
				let maxQty = this.$store.state.config.publicPdSetting.CONFIG.order.defaultMaxQty;
				return maxQty < this.orderMaxLimit? maxQty: this.orderMaxLimit;
			} catch (e) {return 99;}
		},
		// 最大下單口數(上限) 無設定取999當上限
		orderMaxLimit() {
			try {
				return this.$store.state.config.publicPdSetting.CONFIG.order.maxLimit;
			} catch (e) {return 999;}
		}
	}
}
</script>

<style>
.app-ctn {
	color: white;
	/* background-color: #141414; */
	
	/* disable text selection */
	-webkit-touch-callout: none;
    -webkit-user-select: none;	
	user-select: none;
}
.for-init-icon-font {
    position: absolute;
    top: 1vw;
    left: 1vw;
	width: 10vw;
	height: 10vw;
    opacity: 0;
	/* z-index: 99; */
}
/* Using CSS custom properties (variables) https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties */
.app-ctn .font-size-pico,	.app-ctn .font-size-pico input		{font-size: var(--font-size-pico); -webkit-transform:scale(0.66);}
.app-ctn .font-size-nano,	.app-ctn .font-size-nano input		{font-size: var(--font-size-nano); -webkit-transform:scale(0.83);}
.app-ctn .font-size-micro,	.app-ctn .font-size-micro input		{font-size: var(--font-size-micro);}
.app-ctn .font-size-mini,	.app-ctn .font-size-mini input		{font-size: var(--font-size-mini);}
.app-ctn .font-size-small,	.app-ctn .font-size-small input		{font-size: var(--font-size-small);}
.app-ctn .font-size-little,	.app-ctn .font-size-little input	{font-size: var(--font-size-little);}
.app-ctn,					.app-ctn input 						{font-size: var(--font-size-normal);}
.app-ctn .font-size-normal,	.app-ctn .font-size-normal input	{font-size: var(--font-size-normal);}
.app-ctn .font-size-big,	.app-ctn .font-size-big input		{font-size: var(--font-size-big);}
.app-ctn .font-size-large,	.app-ctn .font-size-large input		{font-size: var(--font-size-large);}
.app-ctn .font-size-xl,		.app-ctn .font-size-xl input		{font-size: var(--font-size-xl);}
.desktop .material-icons	{font-size: var(--font-size-material-icons);}
</style>