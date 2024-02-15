<template>
    <div ref="optTable" class="option-table-ctn otc" :class="[{maxC: sideMode==0,maxP: sideMode==2}]" @mousedown="onMouseDown">
		<!-- Call/Put 列 -->
		<div class="cp-label-ctn opt_head_bgc bgc-opt-gray zindex-1" :class="{'font-size-little': !isDesktop,'font-size-big':largeSize}">
			<div class="lp-ctn flex-bottom scrolling-x hidden-scroll flex-row call-side-row">
				<span class="flex-1 cp-label flex-center nowrap h100p">{{$ln(`看涨期权 Call`)}}</span>
				<!-- 向左展開 -->
				<div v-if="!isDesktop" class="flex-center tcef h100p"><i class="material-icons md-18 rotate180" @click="sideMode=sideMode==1?2:1">play_arrow</i></div>
			</div>
			<!-- 設定 -->
			<div class="ct-ctn flex-center flex-row">
				<i class="material-icons md-24 hover-icon" @click="$emit('config')">settings</i>
			</div>
			<!-- 加入自選功能組件 -->
			<FavoriteIcon v-show="false" ref="favoriteIcon" class="icon-btn" :symbol="$store.state.selectedSymbol.ID" />
			<div class="rp-ctn flex-bottom scrolling-x hidden-scroll put-side-row">
				<!-- 向右展開 -->
				<div v-if="!isDesktop" class="flex-center tcef h100p"><i class="material-icons md-18" @click="sideMode=sideMode==1?0:1">play_arrow</i></div>
				<span class="flex-1 cp-label flex-center nowrap h100p">{{$ln(`看跌期权 Put`)}}</span>
			</div>
		</div>	
		<!-- 表格標題區 -->
    	<div class="head-ctn opt_head_bgc bgc-opt-gray font-size-micro zindex-1" :class="{'font-size-normal':largeSize}">
			<!-- 左側標題 -->
			<div ref="lHeadCtn" class="lp-ctn scrolling-x hidden-scroll direction-rtl touch-action-none">
				<table><thead><tr class="clr-bbb">
					<th v-for="(obj, idx) in columns" :key="`OptionT-lHead-th-${idx}`" v-html="thHtml(obj)" @click="onThClick(obj)" class="posr" />
				</tr></thead></table>
			</div>
			<!-- 行權價 -->
			<div class="ct-ctn flex-center flex-row posr clr-bbb tcef hover-line" @click="$store.state.opt.reverse = !$store.state.opt.reverse">
				<i class="material-icons hover-icon md-14 opacity0">south</i>
				<span class="nowrap">{{$ln('行权价')}}</span>
				<span class="flex-center" :class="{'font-size-pico': isDesktop}"><i class="material-icons hover-icon md-14 clr-white">{{reverse ? 'north' : 'south'}}</i></span>
			</div>
			<!-- 右側標題 -->
			<div ref="rHeadCtn" class="rp-ctn scrolling-x hidden-scroll touch-action-none">
				<table><thead><tr class="clr-bbb">
					<th v-for="(obj, idx) in columns" :key="`OptionT-rHead-th-${idx}`" v-html="thHtml(obj)" @click="onThClick(obj)" class="posr" />
				</tr></thead></table>
			</div>
		</div>
		<!-- 表格內容區 (本層產生 Y 捲軸) -->
		<ScrollBounce class="body-ctn font-size-micro" ref="scrollingBody" v-press="onPress" v-touching-end="`.option-table-tr`" @scroll="onBodyScroll">
			<!-- 專門用來撐開高度的元件 -->
			<div class="ctn-of-option-table-spread-height mgb3" >
				<OptionTableSpreadHeight v-for="obj in contractsList" :key="`OptionT-OptionTableSpreadHeight-${obj.mth}`" :month="obj.mth" :closedContracts="getClosedContracts(obj.item, 'C')" />
			</div>
			<!-- 左半邊 (本層產生 X 捲軸) -->
			<div ref="lBodyCtn" class="lp-ctn bottom-auto scrolling-x hidden-scroll direction-rtl" @scroll="onLTableScroll" @touchstart="onTouchStart" @mousedown="onTouchStart">
				<OptionTableMonthBlock ref="lBodyMonthBlock" v-for="obj in contractsList" :key="`OptionT-lBody-OptionTableMonthBlock-${obj.mth}`" :month="obj.mth" :closedContracts="getClosedContracts(obj.item, 'C')" :columns="columns" CP="C" :closedSP="obj.item.closedPrice" />
			</div>
			<!-- 右半邊 (本層產生 X 捲軸) -->
			<div ref="rBodyCtn" class="rp-ctn bottom-auto scrolling-x hidden-scroll" @scroll="onRTableScroll" @touchstart="onTouchStart">
				<OptionTableMonthBlock v-for="obj in contractsList" :key="`OptionT-rBody-OptionTableMonthBlock-${obj.mth}`" :month="obj.mth" :closedContracts="getClosedContracts(obj.item, 'P')" :columns="columns" CP="P" :closedSP="obj.item.closedPrice" />
			</div>
			<!-- 中央履約價 -->
			<div class="ct-ctn bottom-auto">
				<OptionTStrikePriceMonthBlock ref="strikeCtn" v-for="obj in contractsList" :key="`OptionT-OptionTStrikePriceMonthBlock-${obj.mth}`" 
					:month="obj.mth" :closedContracts="getClosedContracts(obj.item)" :contracts="obj.item" @closedPriceTop="onClosedPriceTop" />
			</div>
		</ScrollBounce>
		<!-- 虛擬月份列 (內容需與 OptionTStrikePriceMonthBlock 的 .mth-line 完全一致) -->
		<div class="fake-mth-head-ctn posr" v-if="fakeMthHeadDisplay" :fakeMthHeadKey="fakeMthHeadKey" :key="fakeMthHeadKey">
			<OptionTMonthRow ref="fakeMthHeadCtn" class="FULL fake-mth-head" :style="{top: fakeMthHeadTop+'px'}" 
				:fakeMthHeadTarget="fakeMthHeadTarget" @onClick="onFakeMonthClick" />
		</div>
		<!-- 負責訂閱期貨月份以取得 [價平價格] 與 [價平合約列表] 的元件 -->
		<OptionTableMonthControl v-for="obj in expandContractsList" :key="`OptionT-OptionTableMonthControl-${obj.mth}`" :month="obj.mth" :contracts="obj.item" />

		<!-- 桌機版專用橫向捲軸 -->
		<div v-if="isDesktop" ref="lpScroll" class="lpScroll direction-rtl" @scroll="onLpScroll">
			<div :style="{width: `${scrollContentWidth}px`}"/>
		</div>
		<div v-if="isDesktop" ref="rpScroll" class="rpScroll" @scroll="onRpScroll">
			<div :style="{width: `${scrollContentWidth}px`}"/>
		</div>
		<!-- 解決桌機版標題區因減縮scroll寬度，造成最右側未填滿的問題 -->
		<div v-if="isDesktop" class="head-bg bgc-opt-gray" />
		<resize-observer v-if="isDesktop" @notify="onResize" />
    </div>
</template>

<script>
import OptionTableMonthControl from "@/components/OptionT/OptionTableMonthControl.vue";
import OptionTStrikePriceMonthBlock from "@/components/OptionT/OptionTStrikePriceMonthBlock.vue";
import OptionTableMonthBlock from "@/components/OptionT/OptionTableMonthBlock.vue";
import OptionTableSpreadHeight from "@/components/OptionT/OptionTableSpreadHeight.vue";
import OptionTMonthRow from "@/components/OptionT/OptionTMonthRow.vue";

export default {
	/** contracts : {
		"202009": {
			C: ["I.O.TWF.TX2.202009.C.11400", 所有合約...],
			P: ["I.O.TWF.TX2.202009.P.11400", 所有合約...],
			closedPrice: 12619,
			closedContracts: {
				C: ["I.O.TWF.TX2.202009.C.11400", 價平N檔...],
				P: ["I.O.TWF.TX2.202009.P.11400", 價平N檔...],
			}
		},
		"202009W2": {...},
		...
	}
	**/
	props: ["contracts", "columns", "suspend", "underlying"],
	data() {
		return {
			/** 左半區寬度 (可用以決定要僅顯示 Call 或 Put 模式) */
			lpWidth: 42,
			col3: true,

			/** 虛擬月份列 : 目標來源 */
			fakeMthHeadTarget: {},
			/** 虛擬月份列 : 是否顯示 */
			fakeMthHeadDisplay: false,
			/** 虛擬月份列 : Top (推擠情境用) */
			fakeMthHeadTop: 0,
			/** 虛擬月份列高度 */
			fakeMthHeadHeight: 0,
			/** 是否已經 mounted 完成 (computed $refs 需要在 mounted 之後) */
			isMounted: false,

			/** 0:Call放大, 1:平均, 2:Put放大 */
			sideMode: 1,

			/** 桌機橫向捲軸模擬內容寬度 */
			scrollContentWidth: 0,
		}
	},
	beforeDestroy(){
		M4C.Quote.unsub(this.underlyingSymbolID, this);
	},
	beforeMount() {
		M4C.Quote.sub(this.underlyingSymbolID, this);

		this.col3 = !this.largeSize;
		this.lpWidth = this.col3 ? 42 : 40;
		this.rpWidth = this.col3 ? 42 : 40;
		this.colWidth = this.col3 ? 14 : 20;
		this.stpWidth = this.col3 ? 16 : 20;
		this.$store.state.optionT.displayColumnCount = this.col3 ? 3 : 2;

		// 當前行權價的排序與要求的排序不一致時，執行一次行權價排序
		if (this.reverse !== this.isReverse()) {
			this.doReverse();
		}
	},
    mounted() {
		this.lHead = this.$refs.lHeadCtn;
		this.rHead = this.$refs.rHeadCtn;
		this.lBody = this.$refs.lBodyCtn;
		this.rBody = this.$refs.rBodyCtn;
		/** 桌機版 */
		if (this.isDesktop) {
			this.$refs.optTable.style.setProperty("--left-width", `calc(50% - 3em)`);
			this.$refs.optTable.style.setProperty("--right-width", `calc(50% - 3em)`);
			this.$refs.optTable.style.setProperty("--col-width", `5em`); // 60px to 5em
			this.$refs.optTable.style.setProperty("--stp-width", `6em`);
			// 更新(桌機版)橫向捲軸
			this.updateDesktopScrollContentWidth();
			// 呼叫一次 onResize 以進行需要寬度的處理
			this.onResize();
		}
		/** 手機版 */
		else {
			this.$refs.optTable.style.setProperty("--left-width", `${this.lpWidth}vw`);
			this.$refs.optTable.style.setProperty("--right-width", `${this.rpWidth}vw`);
			this.$refs.optTable.style.setProperty("--col-width", `${this.colWidth}vw`);
			this.$refs.optTable.style.setProperty("--stp-width", `${this.stpWidth}vw`);
		}

		// 取得虛擬月份列高度
		this.fakeMthHeadHeight = this.$store.state.opt.isFeatureOption ? 84 : 34;
		// 檢查/展開第一個月份
		this.autoExpandOne();
	},
	beforeDestroy() {
	},
	components: {
		OptionTableMonthControl,
		OptionTStrikePriceMonthBlock,
		OptionTableMonthBlock,
		OptionTableSpreadHeight,
		OptionTMonthRow,
	},
    methods: {
		// 標題欄支持 html 格式
		thHtml(obj) {
			let str = this.$ln(obj.head);
			switch(str) {
				case '真实杠杆率': return '真实<br>杠杆率';
				case '历史波动率': return '历史<br>波动率';
			}
			// 有另設說明
			if(obj.title)
				str += `<i class="info-icon material-icons font-size-micro">info</i>`;
			return str;
		},
		onTouchStart(e) {
			this.touchingEl = e.currentTarget;
		},
		// 左半邊捲動
		onLTableScroll(e) {
			// 避免觸發回來
			if (e.currentTarget != this.touchingEl)
				return;
			this.lHead.scrollLeft = this.lBody.scrollLeft;
			// android chrome 84- 的寫法
			if (this.chromeVersion && this.chromeVersion < 85)
				this.rBody.scrollLeft = this.rHead.scrollLeft = this.lBody.scrollWidth - this.lBody.clientWidth - this.lBody.scrollLeft;
			// android chrome 85+ & ios 的寫法
			else
				this.rBody.scrollLeft = this.rHead.scrollLeft = -this.lBody.scrollLeft;
		},
		// 右半邊捲動
		onRTableScroll(e) {
			let colWidth = (this.rBody.offsetWidth || this.lBody.offsetWidth) / this.$store.state.optionT.displayColumnCount;
			// 記下當前捲動在第幾個欄位
			this.$store.state.optionT.scollOnIndex = parseInt(this.rBody.scrollLeft / colWidth);
			// 避免觸發回來
			if (e.currentTarget != this.touchingEl)
				return;
			this.rHead.scrollLeft = this.rBody.scrollLeft;
			// android chrome 84- 的寫法
			if (this.chromeVersion && this.chromeVersion < 85)
				this.lBody.scrollLeft = this.lHead.scrollLeft = this.lBody.scrollWidth - this.lBody.clientWidth - this.rBody.scrollLeft;
			// android chrome 85+ & ios 的寫法
			else
				this.lBody.scrollLeft = this.lHead.scrollLeft = -this.rBody.scrollLeft;
		},
		// 長按拉出至外層，可避免綁在 tr/td 上造成的 CPU 負擔
		onPress(e) {
			let el = e.srcElement;
			let sid = el.closest('tr').getAttribute("sid");
			let isPrice = el.getAttribute("isPrice");
			this.$store.commit("setSelectedSymbol", sid);
			// 調整彈出下單盒時，設定取消浮出彈窗事件阻擋機制，以免無法執行後續各功能的按鈕點擊處理(因這裡彈出時沒有執行press的touchend事件，不明原因)。
			this.$store.state.sync.floatDialogStopEvent = false;
			// 彈出下單盒
			eventBus.$emit("ORDER", {
				orderType: 'LIMIT',
				orderPrice: isPrice==1 ? parseFloat(el.textContent) : null,
				positionEffect: 'OPEN',
			});
			// 更新當前合約列表 (下單盒要用)
			try {
				let list = [];
				el.closest('tbody').querySelectorAll('tr').forEach((elm)=>{list.push(elm.getAttribute('sid'));});
				this.$store.state.status.curContractsList = list;
			}catch(e){}
		},
		/** 快速連動策略下單 */
		onBtnTrade(strategyName) {
			this.$emit("onBtnTrade", strategyName);
		},
		onBodyScroll(e) {
			if (!this.$refs.scrollingBody)
				return;
			// 捲軸頂點
			let curScrollTop = this.$refs.scrollingBody.getScrollTop();
			// console.log(`OptionTable.curScrollTop: `, curScrollTop);
			// 是否顯示虛擬月份標題列
			this.fakeMthHeadDisplay = curScrollTop <= 0 ? false : true;
			let len = this.$refs.strikeCtn.length;
			// 反向逐個查看每個月份列的頂點
			for (let i=len-1; i>=0; i--) {
				let strikeCtn = this.$refs.strikeCtn[i];
				// 此月份列的頂點
				let headOffsetTop = strikeCtn.$el.offsetTop;
				// 兩個頂點相距 (相距 < 列高時，要有推擠效果)
				let diffTop = headOffsetTop - curScrollTop;
				// 未推擠情境(預設) : 虛擬月份列的 top=0
				this.fakeMthHeadTop = 0;
				// 判斷進入推擠情境
				if (diffTop >= 0 && diffTop < this.fakeMthHeadHeight) {
					let top = diffTop - this.fakeMthHeadHeight + 1;
					// console.log(`OptionTable.fakeMthHeadTop: `, top);
					this.fakeMthHeadTop = top;
					// fake 目標為產生推擠月份的前(上)個月
					let prevStrikeCtn = i > 0 ? this.$refs.strikeCtn[i-1] : this.$refs.strikeCtn[0];
					this.fakeMthHeadTarget = prevStrikeCtn;
					break;
				}
				// 一般顯示著虛擬月份列情境
				if (curScrollTop >= headOffsetTop) {
					this.fakeMthHeadTarget = strikeCtn;
					break;
				}
			}
		},
		/** 虛擬月份列點擊 */
		onFakeMonthClick() {
			// 必須延時以取得真實的top (沒有延時立即呼叫會因為 top 不正確而算錯)
			setTimeout(this.onBodyScroll, 100);
		},
		/** 都沒有月份展開時，自動展開第一個月份 */
		autoExpandOne() {
			if (this.mthCount > 0) {
				setTimeout((self)=>{
					if (self.$refs.strikeCtn) {
						let hasExpand = self.$refs.strikeCtn.find((com)=>{return com.monthExpand;});
						if (!hasExpand && self.$refs.strikeCtn[0])
							self.$refs.strikeCtn[0].onMonthClick();
						setTimeout(this.onBodyScroll, 100);
					}
				}, 100, this);
			}
			else {
				setTimeout(this.onBodyScroll, 100);
			}
		},
		/** 收到展開月份價平Top位置 */
		onClosedPriceTop(top) {
			// 強制 100ms 內只發生一次 (解決多個展開月份時會呼叫多個過來)
			if (this.blockScrollTop) return;
			this.blockScrollTop = true;
			setTimeout((self)=>{delete self.blockScrollTop;}, 100, this);

			// 切換品種時 (每次切換品種都會重新建立 OptionTable) 使用 0 (直接捲到定點)
			let ms = this.alreadyOnClosedPrice ? 500 : 0;
			this.alreadyOnClosedPrice = true;

			let height = this.$refs.scrollingBody.getHeight();
			let plusHeight = (height + 40) / 2 - 5;
			this.$refs.scrollingBody.setScrollTop(top - plusHeight, ms);
		},
		/** 取出塞在 [各月份完整合約列表] 裡的 [價平合約列表] */
		getClosedContracts(obj, CP) {
			if (obj.closedContracts) {
				if (CP)
					return obj.closedContracts[CP];
				else
					return obj.closedContracts;
			}
			return {};
		},

		/** 桌機版的左方橫向捲軸 */
		onLpScroll(e) {
			// 防止觸發對向 onScroll 機制
			if (this.ignoreScrollEvent) {
				delete this.ignoreScrollEvent;
				return;
			}
			this.ignoreScrollEvent = true;

			let scrollLeft = e.currentTarget.scrollLeft;
			this.lBody.scrollLeft = this.lHead.scrollLeft = scrollLeft;
			this.rBody.scrollLeft = this.rHead.scrollLeft = this.$refs.rpScroll.scrollLeft = -scrollLeft;
		},
		/** 桌機版的右方橫向捲軸 */
		onRpScroll(e) {
			// 防止觸發對向 onScroll 機制
			if (this.ignoreScrollEvent) {
				delete this.ignoreScrollEvent;
				return;
			}
			this.ignoreScrollEvent = true;

			let scrollLeft = e.currentTarget.scrollLeft;
			this.rBody.scrollLeft = this.rHead.scrollLeft = scrollLeft;
			this.lBody.scrollLeft = this.lHead.scrollLeft = this.$refs.lpScroll.scrollLeft = -scrollLeft;
		},
		onMouseDown(e) {
			this.moveX = 0;
			this.mouseX = e.pageX;
			let width = this.$refs.optTable.clientWidth;
			this.side = this.mouseX < width/2 ? -1 : 1;
			this.curScrollLeft = this.lBody.scrollLeft;
			// 由 document 監聽 mousemove
			document.addEventListener('mousemove', this.onMouseMove, false);
			document.addEventListener('mouseup', this.onMouseUp, false);
		},
		onMouseMove(e) {
			this.moveX = e.pageX - this.mouseX;
			this.$refs.lpScroll.scrollLeft = this.curScrollLeft + (this.moveX * this.side);
		},
		onMouseUp(e) {
			document.removeEventListener('mousemove', this.onMouseMove, false);
			document.removeEventListener('mouseup', this.onMouseUp, false);
			// 暫時禁止 click 事件 500ms，避免觸發 tr/td click
			if (this.moveX > 5)
				this.$store.state.status.lockClick = true;
		},
		onResize() {
			// 全表格寬度
			this.$refs.optTable.style.setProperty("--table-width", `${this.$refs.optTable.clientWidth}px`);
		},
		// 當前行權價列表資料是否為逆向排序
		isReverse() {
			try{
				let list = this.contractsList[0].item.C;
				return M4C.Option.getStrike(list[0]) > M4C.Option.getStrike(list[1]);
			}catch(e){}
		},
		// 對行權價做一次反向排序
		doReverse() {
			this.contractsList.forEach(o=>{
				o.item.C.reverse();
				o.item.P.reverse();
			});
		},
		// 更新(桌機版)橫向捲軸
		updateDesktopScrollContentWidth() {
			if (!this.isDesktop)
				return;
			if (this.$refs.lBodyCtn) {
				let elm = this.$refs.lBodyCtn.querySelector('table');
				if (elm)
					this.scrollContentWidth = elm.clientWidth;
			}
			if (!this.scrollContentWidth)
				setTimeout(this.updateDesktopScrollContentWidth, 500);
		},
		onThClick(obj) {
			if(obj.title) {
				let self = this;
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `标题说明`,
					content: self.$ln(obj.title), 
					confirmOnly: true});
			}
		},
	},
	watch: {
		largeSize(nv){
			let lpWidth;
			let rpWidth;
			if(nv){
				lpWidth = this.sideMode ===0 ? 80: this.sideMode===1 ? 40 : 0;
				rpWidth = this.sideMode ===2 ? 80: this.sideMode===1 ? 40 : 0;
				this.colWidth = 20;
				this.stpWidth = 20;
				this.$store.state.optionT.displayColumnCount = this.sideMode=== 1 ? 2 : 4;
			}else{
				lpWidth = this.sideMode ===0 ? 84: this.sideMode===1 ? 42 : 0;
				rpWidth = this.sideMode ===2 ? 84: this.sideMode===1 ? 42 : 0;
				this.colWidth = 14;
				this.stpWidth = 16;
				this.$store.state.optionT.displayColumnCount = this.sideMode===1 ? 3 : 6;
			}
			this.$refs.optTable.style.setProperty("--left-width", `${lpWidth}vw`);
			this.$refs.optTable.style.setProperty("--right-width", `${rpWidth}vw`);
			this.$refs.optTable.style.setProperty("--col-width", `${this.colWidth}vw`);
			this.$refs.optTable.style.setProperty("--stp-width", `${this.stpWidth}vw`);
		},
		/** 月份數量改變 */
		mthCount(nv) {
			// 檢查/展開第一個月份
			this.autoExpandOne();
		},
		/** 單邊放大切換 -> 0:Call放大, 1:平均, 2:Put放大 */
		sideMode(nv) {
			let lpWidth;
			let rpWidth;
			if(this.largeSize){
				lpWidth = nv===0 ? 80 : (nv===1 ? 40 : 0);
				rpWidth = nv===2 ? 80 : (nv===1 ? 40 : 0);
			}else{
				lpWidth = nv===0 ? 84 : (nv===1 ? 42 : 0);
				rpWidth = nv===2 ? 84 : (nv===1 ? 42 : 0);
			}
			// 各寬度變數設定
			this.$refs.optTable.style.setProperty("--left-width", `${lpWidth}vw`);
			this.$refs.optTable.style.setProperty("--right-width", `${rpWidth}vw`);
			this.$refs.optTable.style.setProperty("--stp-width", `${this.stpWidth}vw`);

			// 當前顯示欄位數
			if(this.largeSize){
				this.$store.state.optionT.displayColumnCount = nv=== 1 ? 2 : 4;
			}else{
				this.$store.state.optionT.displayColumnCount = nv===1 ? 3 : 6;
			}
		},
		// 字體改變 -> 重新取得虛擬月份列高度
		'$store.state.desktop.fontSizeRatio'(nv) {
			setTimeout(()=>{
				this.fakeMthHeadHeight = this.$refs.fakeMthHeadCtn.$el.offsetHeight;
			}, 500);
			// 更新(桌機版)橫向捲軸
			setTimeout(this.updateDesktopScrollContentWidth, 500);
		},
		// 行權價排序方向
		reverse(nv) {
			this.doReverse();
		},
		// 欄位發生變動
		columns(nv) {
			// 更新(桌機版)橫向捲軸
			setTimeout(this.updateDesktopScrollContentWidth, 500);
		},
	},
    computed: {
		largeSize(){ return this.$store.state.config.largeSize;},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		/** 顯示月份數量 */
		mthCount() {
			return Object.keys(this.contracts).length;
		},
		/** 將 contracts 轉成指定排序過的陣列，保證月份含W的排序 */
		contractsList() {
			let list = [];
			for (let mth in this.contracts) {
				list.push({mth: mth, item: this.contracts[mth]});
			}
			return list.sort((a, b)=>{
				//  週月 202009W2 要排最前面
				if (a.mth.length > b.mth.length) return -1;
				return a.mth > b.mth ? 1 : -1;
			});
		},
		// 展開中的 contractsList (展開才需要生成的元件可以用這個List)
		expandContractsList() {
			return this.contractsList.filter(obj=>{
				return this.$store.state.opt.expandMap[`${this.underlyingSymbolID}.${obj.mth}`];
			});
		},
		// 當前標的品種代碼
		underlyingSymbolID() {
			let contractID = this.$store.state.opt.underlyingS;
			if (contractID)
				return contractID.split('.').splice(0,4).join('.');
		},
		chromeVersion() {
			return this.$store.state.device.chromeVersion;
		},
		/** 行權價反向排序 */
		reverse() {
			return this.$store.state.opt.reverse;
		},
		closedContractsReady() {
			return !this.contractsList.find(o=>!o.item.closedContracts);
		},
		fakeMthHeadKey() {
			return `${this.$store.state.opt.selectedSymbol}-${this.fakeMthHeadTarget.month}`;
		},
	},
}
</script>

<style>
/* 左側寬度 */
.otc .lp-ctn {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	width: var(--left-width);
	transition: width 0.5s;
}
/* 履約價寬度 */
.otc .ct-ctn {
	position: absolute;
	top: 0;
	left: var(--left-width);
	width: var(--stp-width);
	bottom: 0;
	transition: left 0.5s;
}
/* 右側寬度 */
.otc .rp-ctn {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	width: var(--right-width);
	transition: width 0.5s;
}

/* 表格相關樣式 */
.otc table {
	position: relative;
	border-collapse: collapse;
}
.otc tr, .otc .tr {
	height: 40px;
	min-height: 40px;
}
.otc .tr.bgc-opt-mth-line {
	height: 34px;
	min-height: 34px;
}
.otc .tr.bgc-opt-mth-line.expand.is-feature-option {
	height: 84px;
	min-height: 84px;
}
.otc td, .otc th {
	padding: 0;
	width: var(--col-width);
    min-width: var(--col-width);
	max-width: var(--col-width);
	text-align: center;
	/* height: 10vw; 這個 height 會導致高度超過 40px 導致誤差出現 */
	vertical-align: middle;
}
/* Call/Put 標籤列 */
.otc .cp-label-ctn {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 8vw;
}
.otc .cp-label {
	border-radius: 5vw;
}
/* 表格標題區 */
.otc .head-ctn {
	position: absolute;
	top: 8vw;
	left: 0;
	right: 0;
	height: 10vw;
}
/* 表格內容區 */
.otc .body-ctn {
	position: absolute;
	top: 18vw;
	left: 0;
	right: 0;
	bottom: 0;
}
/* 虛擬的月份標題列 (固定定位容器) */
.otc .fake-mth-head-ctn {
	position: absolute;
	top: 18vw;
	left: 0;
	right: 0;
	/* 無高度來避免遮蔽真實月份列的點擊事件，子元素透過 overflow 仍可超出顯示，表頭利用了 zindex-1 來遮蔽推上去的部分*/
	height: 1px;
}
.otc .fake-mth-head-ctn.not-display {
	opacity: 0;
}
.otc .fake-mth-head {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: initial;
	height: 34px;
}

/* 不顯示 scrollbar */
.otc .hidden-scroll::-webkit-scrollbar {
	display: none;
}

.otc .bottom-auto {
	bottom: auto;
}
/* 展開數量下拉選單 */
.option-table-ctn .button-ctn {
	padding: 0 6px;
}

/** 桌機版 */
.desktop .otc .cp-label-ctn {
	right: 0.8em;
	height: 2em;
}
/* 表格標題區 */
.desktop .otc .head-ctn {
	top: 2em;
	right: 0.5em;
	height: 2.5em;	/* 關連 .head-bg 的 height */
}
.desktop .otc .head-ctn tr {
	height: 2.5em;	/* 關連 .head-bg 的 height */
}
.desktop .head-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 4.5em;	/* 關連 .head-ctn 的 height */
}
/* 表格內容區 */
.desktop .otc .body-ctn {
	top: 4.5em;		/* 關連 .head-ctn 的 height */
}
/* 虛擬的月份標題列 (固定定位容器) */
.desktop .otc .fake-mth-head-ctn {
	top: 4.5em;		/* 關連 .head-ctn 的 height */
	left: -4px;	/* 捲軸寬度/2 */
	right: 4px; /* 捲軸寬度/2 */
}
.desktop .otc .fake-mth-head {
	height: 2em;
}
.desktop .otc tr, .desktop .otc .tr {
	height: 2em;
	min-height: 2em;
	/* border-bottom: 1px solid #1C2333; */
}

/* 桌機版才會有的橫向捲軸 */
.lpScroll {
	position: absolute;
	left: -10px;
	bottom: 0;
	width: calc(50% - 3em + 5px);
	height: 10px;
	overflow: auto;
}
.rpScroll {
	position: absolute;
	right: 0;
	bottom: 0;
	width: calc(50% - 3em + 5px);
	height: 10px;
	overflow: auto;
}
.lpScroll > div, .rpScroll > div {
	height: 1px;
	max-height: 1px;
	/* background-color: yellow; */
}
/* 指定月份列寬度 */
.desktop .mth-line {
	width: var(--table-width) !important;
}
.desktop .call-side-row {
	/* width: 50%; */
	background-color: #D2691E;
}
.desktop .put-side-row {
	/* width: 50%; */
	background-color: #1C3F80;
}
/** 微調校正 fake 列使文字與一般月份列對齊 */
.desktop .otc .fake-mth-head {
	left: -1px;
	right: 1px;
}
.info-icon {
	position: absolute;
	right: 0;
	top: 0.5em;
}
/* 利用 margin 讓寬度 100vw 的月份列推回正中央 */
.maxC .mth-line {
	margin-right: var(--left-width);
}
.maxP .mth-line {
	margin-left: var(--right-width);
}
</style>