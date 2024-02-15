<template>
	<div class="extra-menu FULL zindex-9">
		<div class="FULL mask" @click="$store.state.status.displayExtraMenu = false"/>
		<!-- 三角形 -->
		<div class="triangle"></div>
		<div class="extra-menu-ctn flex-col font-size-mini">
			<!-- 動態項目 -->
			<div class="flex-start item mgtb2 tcef posr" v-for="item in extraMenu.items" @click="onItemClick(item)">
				<!-- 未讀公告 (僅公告項目會有) -->
				<span v-if="item.action==='announcement' && unreadAnnounceCount" class="unread-announce-count font-size-micro flex-center">{{unreadAnnounceCount}}</span>
				<!-- 未讀問題回報 -->
				<span v-if="item.action==='feedback' && hasUnreadMsg" class="unread-announce-count font-size-micro flex-center">!</span>
				<!-- 圖示與文字 -->
				<i class="material-icons mgr2">{{item.icon}}</i>{{$ln(item.name)}}
			</div>
		</div>
	</div>
</template>

<script>
import Announce from "@/components/Announce.vue";
import IssueListMix from "@/components/Framework/IssueListMix.vue";
import IssueReport from '@/components/Framework/IssueReport.vue';
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {
		Announce,
		IssueListMix,
	},
    methods: {
		onItemClick(item) {
			this.$store.state.status.displayExtraMenu = false;
			switch(item.action) {
				// 外跳網頁
				case 'web':
					window.openLink(item.url);
					break;
				// 公告
				case 'announcement':
					eventBus.$emit("POPUP-DIALOG", Announce, "", {$HEAD: {title: this.$ln(`公告列表`)}});
					break;
				// 問題與回報
				case 'feedback':
					eventBus.$emit("POPUP-DIALOG", IssueListMix, "", {transName: 'float'});
					break;
				//  系統設定
				case 'setting':
					eventBus.$emit("POPUP-DIALOG", 'MixSetting', "", {transName: 'float'});
					break;
				// 截圖回報
				case 'screenshot':
					this.catchScreen();
					break;
				// 掃一掃 (手機)
				case 'scan':
					eventBus.$emit("POPUP-DIALOG", "QRScanner", "", {transName: 'float', fixedTop: true});
					break;
				// 手機同步 (桌機)
				case 'sync':
					eventBus.$emit("POPUP-DIALOG", "QRCode", "", {transName: 'float'});
					break;
			}
		},
		// 開始截圖 (僅桌機)
		catchScreen() {
			// 進入截圖狀態
			this.$store.state.onScreenShot = true;
			// 延遲讓 OC 的 tabs-panel 的 transform(0.2s) 跑完
			setTimeout(()=>{M4C.Issue.catchScreen(this.popupIssueReport);}, 250);
		},
		// 彈出問題回報 (僅桌機)
		popupIssueReport() {
			eventBus.$emit("POPUP-DIALOG", IssueReport, {}, {$HEAD: {title: this.$ln(`问题与建议`)}, transName: 'float'});
			// 離開截圖狀態
			this.$store.state.onScreenShot = false;
		},
	},
	watch: {},
    computed: {
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
		/** 更多 */
		extraMenu() {
			return this.$store.state.config.quotePdSetting.function.extramenu;
		},
	},
}
</script>

<style scoped>
.mask {
	background-color: rgba(0, 0, 0, 0.5);
}
.extra-menu-ctn {
	position: absolute;
	padding: 2vw 4vw;
	right: 5px;
	bottom: 55px;
	background-color: #374451;
	border-radius: 1vw;
}
.unread-announce-count {
	position: absolute;
	top: -10px;
	left: 13px;
	padding: 0 6px;
	background-color: red;
	border-radius: 3px;
}
.triangle {
	position: absolute;
	bottom: 40px;
	right: 22px;
	width: 0;
	height: 0;
	border-style: solid;
	border-width: 20px 15px 0 15px;
	border-color: #374451 transparent transparent transparent;	
}

.desktop .extra-menu-ctn {
	position: absolute;
	padding: 1em 2em;
	right: 100px;
	top: 35px;
	bottom: auto;
	background-color: #171E2E;
	border-radius: 0.5em;
    box-shadow: 5px 5px 5px 0px rgba(0,0,0,0.5);
}
.desktop .extra-menu-ctn .item {
	margin: 0.5em 0;
}
.desktop .extra-menu-ctn .item:hover {
	color: aqua;
}
</style>