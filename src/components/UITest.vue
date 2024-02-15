<template>
	<div ref="ctn" class="uitest-ctn posa clr-black bgc-white flex-col font-size-micro pd1"
		:style="{left: `${left}px`, bottom: `${bottom}px`}" :class="{'max-mode': outputMode || configMode}">
		<!-- 測試列表 -->
		<div ref="listCtn" v-if="!configMode" class="item-list-ctn flex-1 flex-col overflow-auto">
			<div class="test-list-item flex-row" v-for="(testObj, idx) in testList" :key="`item-${idx}`" @click="testOne(idx)"
				:class="{'is-title': testObj.action==='title'}">
				<div class="col1 flex-end"><i v-if="testIndex===idx" class="exec-arrow icon material-icons md-18">double_arrow</i></div>
				<div class="col2  mgr1 flex-center">{{idx}}</div>
				<div class="col3 flex-1 flex-start">{{testObjText(testObj)}}</div>
				<div class="col4 flex-start">
					<i v-if="testObj.result === true" class="icon material-icons md-18">done</i>
					<i v-if="testObj.result === false" class="icon material-icons md-18 clr-warn">error</i>
					<i v-if="testObj.loading" class="icon material-icons md-18 loading">refresh</i>
				</div>
			</div>
		</div>
		<!-- 設定區塊 -->
		<div v-if="configMode" class="flex-1 flex-col divider-bottom font-size-small pd2">
			<div class="flex-row flex-start">
				<span>設定腳本名稱</span>
				<div class="flex-1"/>
				<input type="text" v-model="$store.state.uitest.fileName"/>
			</div>
			<!-- 調整間隔秒數 -->
			<div class="flex-row flex-start mgt2">
				<span>執行間隔秒數(ms)</span>
				<div class="flex-1"/>
				<i class="icon material-icons md-36 tcef" @click="$store.state.uitest.sleepMs -= 500">remove_circle</i>
				<div>间隔<span>{{$store.state.uitest.sleepMs}}</span>ms</div>
				<i class="icon material-icons md-36 tcef" @click="$store.state.uitest.sleepMs += 500">add_circle</i>
			</div>
		</div>
		<!-- 工具列 -->
		<div class="flex-row flex-start" @touchstart="onTouchStart" @touchmove="onTouchMove">
			<!-- 啟動/停止 -->
			<i v-if="!running" class="icon mglr1 material-icons md-36 tcef clr-orange" @click="start()">play_circle_filled</i>
			<i v-if="running" class="icon mglr1 material-icons md-36 tcef" @click="stop">pause_circle_filled</i>
			<!-- 填滿 -->
			<div class="flex-1"/>
			<!-- 重抓腳本 -->
			<i class="icon mglr1 material-icons md-36 tcef" @click="downloadJson">refresh</i>
			<!-- 放大/恢復 -->
			<i v-if="!outputMode" class="icon mglr1 material-icons md-36 tcef" @click="outputMode = true">post_add</i>
			<i v-if="outputMode" class="icon mglr1 material-icons md-36 tcef" @click="outputMode = false">vertical_align_bottom</i>
			<!-- 設定 -->
			<i v-if="!configMode" class="icon mglr1 material-icons md-36 tcef" @click="configMode = true">settings</i>
			<i v-if="configMode" class="icon mglr1 material-icons md-36 tcef" @click="configMode = false">settings</i>
			<!-- 關閉 -->
			<i class="icon mglr1 material-icons md-36 tcef" @click="onClose">cancel</i>
		</div>
	</div>
</template>

<script>
import UITest from '@/components/UITest';
import UITestReport from '@/components/UITestReport';
var VueScrollTo = require('vue-scrollto');
export default {
	mixins: [UITest, UITestReport],
	props: [],
	data() {
		return {
			left: 15,
			bottom: 15,
			// 放大模式
			outputMode: false,
			// 設定模式
			configMode: false,
			dvmTestList : [
				{"action": "title", "text": "檢查首頁"},
				{"action": "until", "text": "主畫面", "selector": ".main-ctn"},
				{"action": "click", "text": "同意書確認按鈕", "selector": ".agree-container .btn-confirm:contains(继续使用)", "continue": true},
				{"action": "click", "text": "新手教學確認按鈕", "selector": ".helper-container .button-ctn:visible", "continue": true},
				{"action": "click", "text": "首頁版面", "selector": "span[keyname='optcloud']"},
				{"action": "check", "text": "檢查置頂廣告", "selector": ".ad-top-ctn img"},
				{"action": "check", "text": "檢查關注合約", "selector": ".horizontal-selfselect .quote-card-sd"},
				{"action": "check", "text": "檢查期權雲龍虎榜", "selector": ".indicator-container:contains(IV 龙虎榜)"},

				{"action": "title", "text": "期貨行情-切至預設報價模式"},
				{"action": "click", "text": "行情版面", "selector": "span[keyname='market']"},
				{"action": "check", "text": "預設報價模式", "selector": ".quote-ctn .btn:not(:empty)", "if-skip": 4, "continue": true},
				{"action": "click", "text": "切換至預設報價模式", "selector": ".material-icons:contains(loop)", "ifnot": ".quote-ctn .btn:not(:empty)", "continue": true},
				{"action": "click", "text": "切換至預設報價模式", "selector": ".material-icons:contains(loop)", "ifnot": ".quote-ctn .btn:not(:empty)", "continue": true},
				{"action": "click", "text": "切換至預設報價模式", "selector": ".material-icons:contains(loop)", "ifnot": ".quote-ctn .btn:not(:empty)", "continue": true},
				{"action": "click", "text": "切換至預設報價模式", "selector": ".material-icons:contains(loop)", "ifnot": ".quote-ctn .btn:not(:empty)", "continue": true},

				{"action": "title", "text": "切至期貨主力合約"},
				{"action": "click", "text": "交易所選單", "selector": ".exg-btn"},
				{"action": "click", "text": "期货主力合约", "selector": ".button-ctn:contains(期货主力合约)"},

				{"action": "title", "text": "檢查各報價模式"},
				{"action": "check", "text": "有最新價按鈕且內容不為空", "selector": ".quote-ctn .btn:not(:empty)"},
				{"action": "click", "text": "切換報價模式", "selector": ".material-icons:contains(loop)"},
				{"action": "check", "text": "有買方按鈕", "selector": ".Buy-ctn"},
				{"action": "check", "text": "有賣方按鈕", "selector": ".Sell-ctn"},
				{"action": "check", "text": "有買價且內容不為空", "selector": ".bp1-ctn:not(:empty)"},
				{"action": "check", "text": "有賣價且內容不為空", "selector": ".sp1-ctn:not(:empty)"},
				{"action": "click", "text": "切換報價模式", "selector": ".material-icons:contains(loop)"},
				{"action": "check", "text": "自定義報價卡片合約名稱", "selector": ".swiper-slide-active .quotecard-sdname:not(:empty)"},
				{"action": "click", "text": "切換報價模式", "selector": ".material-icons:contains(loop)"},
				{"action": "check", "text": "表格報價價格類欄位", "selector": ".swiper-slide-active .quote-table-X-list-ctn:visible .is-price:not(:empty)"},
				{"action": "click", "text": "切換報價模式", "selector": ".material-icons:contains(loop)"},
				{"action": "click", "text": "切換至分時", "selector": ".swiper-slide-active .tchart-btn:contains('分时')"},
				{"action": "check", "text": "線圖價格軸", "selector": ".swiper-slide-active .price-axis-label-ctn"},
				{"action": "click", "text": "切換報價模式", "selector": ".material-icons:contains(loop)"},

				{"action": "title", "text": "側邊選單(含帳號登入)"},
				{"action": "click", "text": "側邊選單圖示按鈕", "selector": ".material-icons:contains(menu)"},
				{"action": "click", "text": "關閉側邊選單(若有)", "selector": ".side-menu-mask.FULL .mask", "continue": true},
				{"action": "check", "text": "檢查是否出現 [登入交易帳號]", "selector": ".login-trade-ctn", "ifnot-skip": 6},
				{"action": "click", "text": "登入交易帳號經記商選單", "selector": ".ss-broker-list .select-btn"},

				// {"action": "click", "text": "選項: *模拟* ", "selector": ".radioitem:contains(模拟)"},
				// {"action": "input", "text": "请输入您的帐号", "selector": "input[placeholder='请输入您的帐号']", "value": "sim001"},
				// {"action": "input", "text": "请输入您的密码", "selector": "input[placeholder='请输入您的密码']", "value": "a12345"},
				{"action": "click", "text": "選項: 上海中期期货期货仿真 ", "selector": ".radioitem:contains(上海中期期货期货仿真)"},
				{"action": "input", "text": "请输入您的帐号", "selector": "input[placeholder='请输入您的帐号']", "value": "333885730"},
				{"action": "input", "text": "请输入您的密码", "selector": "input[placeholder='请输入您的密码']", "value": "ctp123456"},

				{"action": "click", "text": "登入按鈕", "selector": ".button-ctn:contains(登入)"},
				{"action": "leave", "text": "登入完成(離開登入畫面)", "selector": ".dialog-ctn:contains(登录)", "sleep": 0},

				{"action": "title", "text": "一般委託下單"},
				{"action": "click", "text": "隨機最新價按鈕", "selector": ".quote-ctn .btn", "random": true},
				{"action": "until", "text": "下單盒", "selector": ".float-order-ctn"},
				{"action": "click", "text": "下單盒委託別選單", "selector": ".order-type-selector .select-btn"},
				{"action": "click", "text": "選項:限價", "selector": ".radioitem:contains(限价)"},
				{"action": "click", "text": "下單盒買進按鈕", "selector": ".float-order-ctn .order-btn.bgc-B"},
				{"action": "click", "text": "送出委託", "selector": ".button-ctn:contains(送出委托)"},
				{"action": "click", "text": "市價轉限價確認按鈕", "selector": ".confirm-dialog .confirm-btn", "continue": true},

				{"action": "title", "text": "檢查回報提示"},
				{"action": "check", "text": "委託回報提示訊息 (买进 限价 1手)", "selector": ".notifycation-ctn .card-ctn:contains(买进 限价 1手)"},
				{"action": "close"},

				{"action": "title", "text": "檢查委託回報"},
				{"action": "click", "text": "交易版面", "selector": "span[keyname='trading']"},
				{"action": "click", "text": "新手教學確認按鈕", "selector": ".helper-container .button-ctn:visible", "continue": true},
				{"action": "click", "text": "委託回報", "selector": ".tab:contains(委托回报)"},
				{"action": "click", "text": "所有回報選項", "selector": ".radioitem label:contains(所有回报)", "continue": true},
				{"action": "reportExist", "text": "委託回報已收到"},
				{"action": "reportValue", "text": "委託回報委託數量", "selector": ".order-qty", "orderKey": "ORDER_QTY"},
				{"action": "reportValue", "text": "委託回報委託價格", "selector": ".order-price-value", "orderKey": "ORDER_PRICE"},
				
				{"action": "title", "text": "期權下單"},
				{"action": "click", "text": "期權版面", "selector": "span[keyname='option']"},
				{"action": "click", "text": "新手教學確認按鈕", "selector": ".helper-container .button-ctn:visible", "continue": true},
				{"action": "click", "text": "期權報價隨機欄位", "selector": ".option-table-ctn tr td", "random": true},
				{"action": "click", "text": "新手教學確認按鈕", "selector": ".helper-container .button-ctn:visible", "continue": true},
				{"action": "click", "text": "商品詳情-快買", "selector": ".button-ctn:contains(快买)"},
				{"action": "click", "text": "送出委託", "selector": ".button-ctn:contains(送出委托)"},
				{"action": "close"},

				{"action": "title", "text": "檢查期權委託回報"},
				{"action": "click", "text": "交易版面", "selector": "span[keyname='trading']"},
				{"action": "reportExist", "text": "委託回報已收到"},
				{"action": "reportValue", "text": "委託回報委託數量", "selector": ".order-qty", "orderKey": "ORDER_QTY"},
				{"action": "reportValue", "text": "委託回報委託價格", "selector": ".order-price-value", "orderKey": "ORDER_PRICE"},
				{"action": "reportValue", "text": "委託回報月份四碼", "selector": ".mth4", "orderKey": "$MTH4"},
				{"action": "reportValue", "text": "委託回報履約價", "selector": ".strike", "orderKey": "$STRIKE"},
				
				{"action": "title", "text": "切至高級下單盒下成交單"},
				{"action": "click", "text": "行情版面", "selector": "span[keyname='market']"},
				{"action": "click", "text": "交易所選單", "selector": ".exg-btn"},
				{"action": "click", "text": "芝加哥商业交易所", "selector": ".button-ctn:contains(芝加哥商业交易所)"},
				{"action": "click", "text": "隨機最新價按鈕", "selector": ".quote-ctn .btn", "random": true},
				{"action": "until", "text": "下單盒", "selector": ".float-order-ctn"},
				{"action": "click", "text": "切換為高級下單盒", "selector": ".popup-dialog-ctn i:contains(loop)", "if": "span:textEquals('下单盒')", "continue": true},
				{"action": "click", "text": "委託別選單", "selector": ".order-type-selector .select-btn"},
				{"action": "click", "text": "選項:市价", "selector": ".radioitem:contains(市价)"},
				{"action": "click", "text": "手數+1", "selector": ".input-qty-ctn i:contains(add)"},
				{"action": "click", "text": "買開按鈕", "selector": ".float-order-ctn .order-btn:contains(买开)"},
				{"action": "click", "text": "送出委託", "selector": ".button-ctn:contains(送出委托)"},
				{"action": "close"},

				{"action": "title", "text": "檢查成交回報"},
				{"action": "click", "text": "交易版面", "selector": "span[keyname='trading']"},
				{"action": "click", "text": "成交回報", "selector": ".tab:contains(成交)"},
				{"action": "reportExist", "text": "成交回報已收到"},
				{"action": "reportValue", "text": "成交數量", "orderKey": "ORDER_QTY", "selector": ".cum-qty"},

				{"action": "title", "text": "檢查持倉"},
				{"action": "click", "text": "持仓", "selector": ".tab:contains(持仓)"},
				{"action": "positionExist", "text": "委託合約是否有持倉"},

				{"action": "check", "text": "持倉資料[0]存在於畫面上", "selector": ".position-card-ctn[sid='${$data.normalPositionSumList[0].SYMBOL}']"},
				{"action": "title", "text": "測試完成"},
			],
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		onClose() {
			this.outputMode = false;
			this.configMode = false;
			this.$store.state.uitest.display = false;
		},
		testObjText(testObj) {
			if (testObj.action === 'close')
				return '关闭弹窗';
			return testObj.text;
		},
		onTouchStart(event) {
			let touch0 = event.targetTouches[0];
			// 本次點擊開始的 X
			this.touchStartX = touch0.pageX;
			this.touchStartY = touch0.pageY;
			// 本次位移
			this.curLeft = parseFloat(this.$refs.ctn.style.left);
			this.curBottom = parseFloat(this.$refs.ctn.style.bottom);
		},
		onTouchMove(event) {
			let touch0 = event.targetTouches[0];
			let moveX = touch0.pageX - this.touchStartX;
			this.left = this.curLeft + moveX;
			let moveY = touch0.pageY - this.touchStartY;
			this.bottom = this.curBottom - moveY;
		},
	},
	watch: {
		outputMode(nv) {
			if (nv) {
				this.configMode = false;
			}
		},
		configMode(nv) {
			if (nv) this.outputMode = false;
		},
		testIndex(nv) {
			// 檢查箭頭位置，超出畫面時自動捲動
			setTimeout((self)=>{
				let target = $('.exec-arrow')[0];
				if (target && target.offsetTop > self.$refs.listCtn.offsetHeight + self.$refs.listCtn.scrollTop - 30) {
					self.$refs.listCtn.scrollTop = target.offsetTop - self.$refs.listCtn.offsetHeight + 30;
				}
			}, 10, this);
		},
	},
	computed: {},
}
</script>

<style scoped>
.uitest-ctn {
	width: 90vw;
	height: 9.6vw;
	z-index: 99;
}
.uitest-ctn.max-mode {
	height: 95vh;
}
.test-list-item {
	min-height: 5vw;
}
.col1 {
	width: 8vw;
}
.col2 {
	width: 8vw;
}
.col4 {
	width: 8vw;
}
.is-title {
	background-color: #CCC;
}

.icon.loading {
	-webkit-animation:spin 1s linear infinite;
	-moz-animation:spin 1s linear infinite;
	animation:spin 1s linear infinite;
}
@-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
@-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
@keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }

</style>