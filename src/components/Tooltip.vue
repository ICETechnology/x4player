<template>
	<div class="FULL tooltip-ctn" v-if="display">
		<div class="tooltip-target"
			:style="{top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px`}"
			v-tooltip="{content: htmlContent, trigger: 'manual', show: display}"
			@click="show = !show" />
		<div @click="goNext" class="mask top" :style="{top: `0px`, left: `0px`, width: `100vw`, height: `${top}px`}"/>
		<div @click="goNext" class="mask left" :style="{top: `${top}px`, left: `0px`, width: `${left}px`, height: `${height}px`}"/>
		<div @click="goNext" class="mask right" :style="{top: `${top}px`, left: `${left+width}px`, right: `0px`, height: `${height}px`}"/>
		<div @click="goNext" class="mask bottom" :style="{top: `${top+height}px`, left: `0px`, right: `0px`, bottom: `0px`}"/>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			show: false,
			// 進行檢查的 key
			tmpKey: '',
			// 檢查通過要發動的 key
			curKey: '',
			curIndex: 0,
		}
	},
	beforeMount() {
		this.$store.state.components.tooltip = this;
	},
	mounted() {
		if (!this.settingTooltips)
			return;
		let self = this;
		// 彈出視窗時
		eventBus.$on("POPUP-DIALOG", (comClass, param, config)=>{
			self.tmpKey = comClass;
			self.checkKey();
		});
		// 關閉彈窗時
		eventBus.$on("CLOSE-DIALOG", ()=>{
			setTimeout(()=>{
				// 檢查是否已經關閉全部彈窗 -> 再檢查一次版面 (為了彈出公告情境，會直接彈新視窗)
				if (self.$store.state.popup.dialogList.length === 0) {
					self.tmpKey = this.$store.state.bottomBar.activeKey;
					self.checkKey();
				}
			}, 100);
		});
		eventBus.$on("TOOLTIP-NEXT", ()=>{
			self.curIndex++;
			if (self.curSetList && self.curIndex >= self.curSetList.length)
				self.close();
		});
		eventBus.$on("TOOLTIP-CLOSE", ()=>{
			self.close();
		});
		// 新手教學關閉時
		eventBus.$on("ONCLOSE-HELPER", ()=>{
			self.checkKey();
		});
		// 啟動同意書關閉時
		eventBus.$on("ONCLOSE-AGREE", ()=>{
			self.checkKey();
		});
		// 彈出公告關閉時
		eventBus.$on("CLOSE-ANNOUNCE-POPUP", ()=>{
			self.checkKey();
		});
		// 登入系統後立即檢查當前版面key
		self.tmpKey = this.$store.state.bottomBar.activeKey;
		self.checkKey();
	},
	beforeDestroy() {},
	components: {},
	methods: {
		goNext() {
			eventBus.$emit('TOOLTIP-NEXT');
		},
		checkKey() {
			// 固定延遲 500ms 來解決新畫面的移動漸變效果 (過早出來算出來的位置會錯)
			setTimeout((self)=>{
				let tmpKey = self.tmpKey;
				// 未設定當前頁面的導覽
				if (!self.settingTooltips || !self.settingTooltips[tmpKey])
					return;
				// 已經閱讀過當前畫面
				if (self.passMap[tmpKey])
					return;
				// 畫面上存在啟動同意書
				if (self.queryElement("//div[contains(@class, 'agree-container')]"))
					return;
				// 畫面上存在隱私權同意書
				if (self.queryElement("//div[contains(@class, 'privacy-container')]"))
					return;
				// 畫面上存在隱私權同意書
				if (self.queryElement("//div[contains(@class, 'agreement-list-ctn')]"))
					return;
				// 畫面上存在新手教學
				if (self.queryElement("//div[contains(@class, 'helper-content')]"))
					return;
				// 畫面上存在彈出公告
				if (self.queryElement("//div[contains(@class, 'announce-popup-wrapper')]"))
					return;
				// 利用 curKey 來驅動 v-tooltip
				self.curIndex = 0;
				self.curKey = self.tmpKey;
			}, 600, this);
		},
		// 關閉
		close() {
			if (this.curKey)
				this.$set(this.$store.state.tooltips.passMap, this.curKey, true);
			this.curKey = '';
			this.curIndex = 0;
		},
		// 重設
		reset() {
			this.$store.state.tooltips.passMap = {};
		},
		// 查詢元素
		queryElement(selector) {
			return document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		},
	},
	watch: {
		'$store.state.bottomBar.activeKey'(key) {
			this.tmpKey = key;
			this.checkKey();
		},
	},
	computed: {
		display() {
			return !!this.htmlContent;
		},
		settingTooltips() {
			return this.$store.state.config.quotePdSetting.function.tooltips;
		},
		// 已經讀過的紀錄
		passMap() {
			return this.$store.state.tooltips.passMap;
		},
		// tooltip 內容
		htmlContent() {
			if (!this.settingTooltips)
				return;
			let list = this.settingTooltips[this.curKey];
			if (list && list[this.curIndex]) {
				return `
					<div>${this.$ln(list[this.curIndex].content)}</div>
					<div class="flex-row mgt4">
						<div class="flex-1 flex-center nowrap mgr1" onclick="eventBus.$emit('TOOLTIP-CLOSE')">${this.$ln('停止展示')}</div>
						<div class="flex-1 flex-center nowrap mgl1 btn-next pd2" onclick="eventBus.$emit('TOOLTIP-NEXT')">${this.$ln('下一个')}</div>
					</div>
				`;
			}
		},
		top() {
			if (this.boundingClientRect)
				return this.boundingClientRect.top;
		},
		left() {
			if (this.boundingClientRect)
				return this.boundingClientRect.left;
		},
		width() {
			if (this.curElement)
				return this.curElement.offsetWidth;
		},
		height() {
			if (this.curElement)
				return this.curElement.offsetHeight;
		},
		// 當前的設定列表
		curSetList() {
			return this.settingTooltips[this.curKey];
		},
		// 當前的目標元素
		curElement() {
			// 有彈窗加入彈窗探查路徑
			let dlgSelectorStr = this.$store.state.popup.dialogList.length? "//div[contains(@class,'dialog-ctn')]": "";
			if (this.curSetList && this.curSetList[this.curIndex]) {
				let selector = dlgSelectorStr + this.curSetList[this.curIndex].selector;
				let elm = this.queryElement(selector);
				// 目標不存在時，自動跳下一個
				if (!elm) setTimeout(self=>self.curIndex++, 10, this);
				return elm;
			}
		},
		// 目標元素的 boundingClientRect (用以取得相對整個 window 的位置)
		boundingClientRect() {
			if (this.curElement)
				return this.curElement.getBoundingClientRect();
		},
	},
}
</script>

<style scoped>
.tooltip-ctn .mask {
	position: absolute;
	z-index: 4;
	background-color: black;
	opacity: .5;
}
.tooltip-target {
	position: absolute;
	/* border: 1px dashed gray; */
	z-index: 4;
	box-sizing: border-box;
}
</style>