<template>
    <div class="bottom-bar flex-row posr">
		<span v-for="(obj, key) in layoutList"
			class="layout-btn btn flex-1 flex-column flex-center tcef posr"
			:class="{selected: key === $store.state.bottomBar.activeKey, 'quit': key==='quit'}"
			@click="onBtnClick(key)" v-press="onPress" :keyName="key">
			<!-- 未讀公告數 -->
			<span v-if="key==='more' && unreadCount" class="unread-announce-count font-size-micro flex-center">{{unreadCount}}</span>
			<i class="material-icons material-icons-outlined">{{obj.icon}}</i>
			<span>{{$ln(obj.label)}}</span>
		</span>
    </div>
</template>

<script>
import QuotePageSub from "@/components/QuotePageSub.vue";

export default {
	data() {
		return {
        }
	},
	beforeMount() {
		if (!this.$store.state.bottomBar.activeKey)
			this.$store.state.bottomBar.activeKey = Object.keys(this.$store.state.config.CONFIG.LAYOUT)[0];
		// 支持使用 quotePdSetting.function.extramenu 的更多設定
		if (this.extraMenu) {
			let more = this.$store.state.config.CONFIG.LAYOUT.more;
			if (more) {
				more.label = this.extraMenu.name || more.label;
				more.icon = this.extraMenu.icon || more.icon;
			}
		}
	},
    mounted() {
		// ExtraMenu 中帶有公告項目時，才啟用公告功能
		if (this.enableAnnounce) {
			// 查詢公告未讀數
			M4C.Announce.queryAnnUnreads();
		}
	},
	beforeDestroy() {},
	components: {
		QuotePageSub,
	},
    methods:{
		onBtnClick(key) {
			// 更多
			if (key === 'more') {
				if (this.extraMenu)
					this.$store.state.status.displayExtraMenu = true;
				else
					eventBus.$emit("FLASHMESSAGE", 'expect extramenu setting');
				return;
			}
			// 離開
			if (key === 'quit') {
				eventBus.$emit("CONFIRM-DIALOG", {
					content: this.$ln('点击确认离开'),
					confirm: () => {
						if (window.navigator.app)
							window.navigator.app.exitApp();
					}
				});				
				return;
			}
			// 切至『交易』& 當前並未登入完成
			if (key === "trading" && !M4C.Trader.checkLoginTrade()) {
				this.$store.state.login.loginReadyAction = function(){
					this.self.$store.state.bottomBar.activeKey = this.key;
				}.bind({self: this, key: key});
				return;
			}
			// 閃電下單
			if(key == "thunder") {				
				this.$store.state.thunder.model = 'F';
				eventBus.$emit("POPUP-DIALOG", QuotePageSub, {comClass: 'QuotePageThunder', noQoNav: true});
				return;
			}
			this.$store.state.bottomBar.activeKey = key;
			eventBus.$emit("SWITCH-PAGE");
		},
		/** 長按 -> 切到該版面且要觸發選單按鈕 */
		onPress(event) {
			let key = event.srcElement.closest('.layout-btn').getAttribute("keyName");
			this.onBtnClick(key);
			this.$store.state.sync.autoOpenSubMenu = true;
		},
	},
	watch: {
		activeKey(nv) {
			this.$store.state.layout = this.$store.state.config.CONFIG.LAYOUT[nv].layout;
		},
	},
    computed: {
		activeKey() {
			return this.$store.state.bottomBar.activeKey;
		},
		/** 未讀問題回報 */
		unReadMsg() {return M4C.Issue.unReadMsg;},
		/** 是否有未讀問題回報 */
		hasUnreadMsg() {
			// 有啟用且有未讀問題回報才為true
			return this.unReadMsg && this.enableFeedBack;
		},
		/** 問題回報是否啟用(依據pdsetting) */
		enableFeedBack() {
			if(this.$store.state.wsConnMap.quote.acPdSetting.function.feedback)
				return this.$store.state.wsConnMap.quote.acPdSetting.function.feedback.enable;
		},
		/** 未讀公告數 */
		unreadAnnounceCount() {
			return this.$store.state.data.announceUnreads;
		},
		// 未讀數量(加計問題回報)
		unreadCount() {
			let count = 0;
			if(!isNaN(this.unreadAnnounceCount))
				count += this.unreadAnnounceCount;
			// 有未讀問題回報才加1
			if(this.hasUnreadMsg)
				count += 1;
			return count;
		},
		/** 更多 */
		extraMenu() {
			try{return this.$store.state.config.quotePdSetting.function.extramenu;}catch(e){}
		},
		enableAnnounce() {
			if (this.extraMenu)
				return !!this.extraMenu.items.find(o=>o.action==='announcement');
		},
		layoutList() {
			let layoutMap = this.$store.state.config.CONFIG.LAYOUT;
			// 內嵌於 3rd app 情境 -> 加入返回按鈕
			if (this.$store.state.device.isEmbedded)
				layoutMap = Object.assign({'quit': {label: "返回", icon: "keyboard_return"}}, layoutMap);
			return layoutMap;
		},
		// 停用一般閃電
		disableThunderN() {
			try{return this.quotePdSetting.function.disable.ThunderN;}catch(e){};
		},
    }
}
</script>

<style scoped>
.bottom-bar {
	font-size: 10px;
}
.btn.selected {
	color: #FF9800;
}
.unread-icon{
	position: absolute;
	right: 2vw;
	top: 1vw;
	pointer-events: none;
}
.unread-announce-count {
	position: absolute;
	top: 3px;
	right: 13px;
	padding: 0 6px;
	background-color: red;
	border-radius: 3px;
}
.quit {
	color: #FF5C3E;
	background-color: #272727;
}
</style>