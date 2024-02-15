<template>
	<div class="desktop-head-ctn flex-col">
		<div class="flex-row electron-drag window-row">
			<!-- 標題logo -->
			<div class="flex-center mgl2">
				<span class="icon-logo"/><span class="font-bold clr-gray">{{$ln('咏春go2电脑版')}}</span>
				<span class="mgl3 clr-gray2" v-if="env">{{env}}</span>
			</div>
			<!-- 空白區 -->
			<div class="flex-1" />
			<!-- 資金 -->
			<div class="flex-center mglr3"><MarginMini class="" v-if="loginReady"/></div>
			<div class="electron-no-drag flex-row flex-center mglr2">
				<!-- 帳號 -->
				<div class="flex-row flex-center desktop-btn mglr1 pdlr2" :class="{'bgc-orange': loginReady, 'background-animate': selectedWSConn.connecting}" @click="onAccountBtn">
					<span class="flex-center h100p mgr1">{{accountBtnText}}</span>
					<i class="icon material-icons">account_circle</i>
				</div>
				<!-- 字體 -->
				<DesktopFontSizeBtn />
				<!-- 設定 -->
				<span class="icon-btn" @click="onSettings"><i class="material-icons">settings</i></span>
				<!-- 問題回報 -->
				<!-- <span :title="$ln('问题回报')" class="icon-btn" @click="onReport"><i class="material-icons">report</i></span> -->
				<!-- 更多菜單 -->
				<div class="extra-menu flex-row flex-center icon-btn posr" @click="$store.state.status.displayExtraMenu = true">
					<!-- 未讀公告數 -->
					<span v-if="unreadAnnounceCount" class="unread-announce-count font-size-micro flex-center">{{unreadAnnounceCount}}</span>
					<i class="material-icons">{{extraMenu.icon || 'help'}}</i>
					<span class="text">{{extraMenu.name}}</span>
					<i class="material-icons">arrow_drop_down</i>
				</div>
			</div>
			<!-- 視窗工具按鈕 縮小/放大/還原/關閉 -->
			<div v-if="$store.state.device.isElectron" class="electron-no-drag sys-icon-ctn flex-row mgl5">
				<div class="sys-btn pdlr3 h100p flex-center" @click="sendElectron('minimize')">
					<i class="material-icons md-18">minimize</i>
				</div>
				<div class="sys-btn pdlr3 h100p flex-center" v-if="!isMaximize" @click="onBtnMaximize">
					<i class="material-icons md-18">crop_square</i>
				</div>
				<div class="sys-btn pdlr3 h100p flex-center" v-if="isMaximize" @click="onBtnRestoreSize">
					<i class="material-icons md-18">filter_none</i>
				</div>
				<div class="sys-btn pdlr3 h100p flex-center" @click="sendElectron('close-window')">
					<i class="material-icons md-18">close</i>
				</div>
			</div>
		</div>
		<div class="layout-btn-row flex-row flex-center">
			<!-- 版面按鈕 -->
			<DesktopLayoutTabs class="h100p"/>
			<!-- 版面功能 -->
			<DesktopLayoutTool v-if="layoutEditable" />
			<!-- 空白區 -->
			<div class="flex-1" />
		</div>
	</div>
</template>

<script>
import IssueReport from '@/components/Framework/IssueReport.vue';
export default {
	props: [],
	data() {
		return {
			isMaximize: false,
		}
	},
	beforeMount() {
		let self = this;
		if (window.ipcRenderer) {
			// 查詢 electron 當前視窗是否在最大化
			ipcRenderer.on('isMaximize', (event, arg) => {
				self.isMaximize = arg;
			});
			ipcRenderer.send('isMaximize');
		}
	},
    mounted() {},
	beforeDestroy() {},
	components: {IssueReport,},
    methods: {
		/** 點擊帳號按鈕 */
		onAccountBtn() {
			// 未登入交易帳號 -> 彈出登入交易帳號視窗
			if (!M4C.Trader.checkLoginTrade()) return;
			// 顯示帳號管理視窗
			eventBus.$emit("POPUP-DIALOG", "DesktopTradingAccountManager");
		},
		/** 點擊設定按鈕 */
		onSettings() {
			eventBus.$emit("POPUP-DIALOG", "MixSetting");
		},
		onBtnMaximize() {
			this.sendElectron('maximize');
			this.isMaximize = true;
		},
		onBtnRestoreSize() {
			this.sendElectron('restore-size');
			this.isMaximize = false;
		},
		sendElectron(message) {
			if (ipcRenderer) ipcRenderer.send(message);
		},
		onReport() {
			// 進入截圖狀態
			this.$store.state.onScreenShot = true;
			// 延遲讓 OC 的 tabs-panel 的 transform(0.2s) 跑完
			setTimeout(()=>{M4C.Issue.catchScreen(this.popupIssueReport);}, 250);
		},
		popupIssueReport() {
			eventBus.$emit("POPUP-DIALOG", IssueReport, {}, {$HEAD: {title: this.$ln(`问题与建议`)}, transName: 'float'});
			// 離開截圖狀態
			this.$store.state.onScreenShot = false;
		},
	},
	watch: {
		/** 切換版面 */
		'$store.state.desktop.selectedLayout.layoutKey'() {
			if (!this.selectedLayout.fontSizeRatio)
				this.$set(this.selectedLayout, 'fontSizeRatio', 7);
			this.$store.state.desktop.fontSizeRatio = this.selectedLayout.fontSizeRatio;
		},
	},
    computed: {
		layout() {
			return this.$store.state.desktop.layout;
		},
		layoutEditable() {
			return this.$store.state.desktop.layoutEditable;
		},
		selectedBTO() {
			return this.$store.state.selectedBTO;
		},
		selectedWSConn() {
			return this.$store.state.selectedWSConn;
		},
		loginReady() {
			return this.selectedWSConn.loginReady;
		},
		selectedLayout() {
			return this.$store.state.desktop.selectedLayout;
		},
		accountBtnText() {
			if (this.loginReady)
				return this.selectedBTO.selectedAccountID;
			else if (this.selectedWSConn.connecting)
				return `${this.selectedBTO.selectedAccountID} ${this.$ln('登入中')}`;
			else
				return this.$ln(`未登入`);
		},
		enableFeedBack() {
			if(this.$store.state.wsConnMap.quote.acPdSetting.function.feedback)
				return this.$store.state.wsConnMap.quote.acPdSetting.function.feedback.enable;
		},
		/** 環境 */
		env() {
			let path = window.cloudPath;
			if (path.indexOf('172.28.') !== -1 || path.indexOf('192.168.') !== -1)
				return `[dvm]`;
			else if (path.indexOf('ss2-dev') !== -1)
				return `[dev]`;
			else if (path.indexOf('ss2-uat') !== -1)
				return `[uat]`;
			else if (path.indexOf('ss2-stage') !== -1)
				return `[stage]`;
		},
		/** 更多菜單 */
		extraMenu() {
			return this.$store.state.config.quotePdSetting.function.extramenu;
		},
		/** 未讀公告數 */
		unreadAnnounceCount() {
			return this.$store.state.data.announceUnreads;
		},
	},
}
</script>

<style scoped>
.desktop-head-ctn {
	/* 強制設定 head 的字體 */
	font-size: 14px !important;
}
.window-row {
	height: 34px;
	background-color: #171e2e;
	/* 不受遮罩影響 */
	z-index: 4;
}
.layout-btn-row {
	height: 36px;
	/* background-color: #0D1320; */
}
.desktop-head-ctn .material-icons, .desktop-head-ctn /deep/ .material-icons {
	/* 強制設定 head 的字體 */
	font-size: 20px !important;
}
.desktop-head-ctn /deep/ .logined-bto-selector .order-mode-ctn {
	border: 1px solid #999;
}
/** 本區域內的按鈕高度限制 (為了與版面頁簽呼應) */
.desktop-head-ctn .desktop-btn {
	height: 1.5em;
	line-height: 1.5em;
}
.electron-drag {
	-webkit-app-region: drag;
}
.electron-no-drag {
	-webkit-app-region: no-drag;
}
 .desktop .sys-icon-ctn .material-icons{
	font-size: 16px;
}
.sys-btn:hover {
	background-color: #444;
}
.icon-logo {
	width: 24px;
	height: 24px;
	background-size: cover;
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAIk0lEQVR42u1bTUxUVxR+M0PcdGFM3bcxsTFpd03apDWmqZrUZdNVkxrbuuiyi/IP8+6AKKEIxLYp/zQVFMJAVRBBxSaAgCwaQUSrKNJEQRFFEHEY5qfne9xrLs83AzPzRsb2LW7eSN6759zvnnu+83NVXC6X8n8eigWABYAFgAWABYAFgAWABUCowRjTBv225eTk2MMN8X68lBVzr0EPm6S3ORaQnp6upKamKmlpaSGHqqpKvEAQc0JGOB2gI3Q11QLwPH369L7Ozs7cjo4O57lz59jZs2fFUGm46G8/5OfnO7Kzs21mgyDmwtyQAVmQyWVrekAn6AYdW1tb961Vh7UoYMvIyFDq6+t3eDye4NzcnDaePn2qDfyenZ0NLiwsBC9fvlxBSipOp9O04yDmwJyYGzIgCzL1emBAx7q6uh3QGbqbZQG25ORkxe127ybBi5OTk54HDx54aSzx4aW/Lc7Pzwe7uroyYYL0ncNEC3BgTswNGZBlIN/z5MmTxYaGhl3QVfgBU3wAn8iBM0bmth+I379/3/vw4cPA1NRUEAO/6W9LUJBM8Eu8Sw7JEYsV4FvMgbkwJ+aGDCGXnkKuFzq1t7fvx7vQda1yIzJD7ERmZqYyMDCQz0EQygSgDD39tBt+shIPmeHHKSkpmseOBgS+eDucGubCnJgbMrgsyAzAAqBLf39/Psw+UsuL6iziee3atQYyOWEJQQkEH57T09NTFRUVW7gl2CIBgS/eBrMvLS3dgrnkuYUsyIYOIyMjDWCHaHxP1N744MGDG8bHx3seP34cxC7IitG/fY8ePQpOTEyMFBcXb8TOrBUEsXh8U1RUtPHevXsjmAtz6mQsQTbp0A1domWfaE3ThqNAi3uTduEW7ZChgtid27dvn8/Ly1sTPcoA45vR0dHzmMMIYMgk2aPQAbpEamUxhcLifMJEq6qq3p2ZmZkNZ6JXrlypAoWRmYYEQQp0BN1VgepCHTHIhGzoEK2fiSkXkJ1UY2PjbuJgOECf3kkJD33x4sVM7BR9F46bNY/f3d2dxT2+18DJ+iCLZO6C7FgWH90R4EOmKShC9PgtAhFuri/RI4KX5ubmTzhN2Y3oDqzR1ta2F4BxMFfMg7khA7L44h2xBluRfwSBPDiShGuBClHRAZke+THQfAGd53YKYzeSpw5pSceOHdtO7y5hpw0sSdDdAR7rO8yINiPcfbZsAYyGmk2/cwQYL87u1atXa3F2eYSmscHdu3eHCgsL3+DhqRxXvKC7srKyreTYprn16H2JtvNDQ0O13JeYFmpHav425qRg49fOz1lB+duu7HSAYBMgZGVlgR6T7ty50w2K4js5QVz+FndWNv3i4RcOHz68iejuuhGlYvHk8MAm3cQMSZBhZrIV0cuqKyfJlZWiqNV/FahN88Ms99AGDRBuCYK/jxw5spkU/weOjKK4D/TOSqI7JTc31zY2NnYBizSiO4BC8cRoSUnJ5kjiiXhZgINlpyqsvC/ZeSoYVOvGT7KcPBwHG5N2FY6utrb2/ZaWli9CLZ7MGLGBMjw8/FsIuoP1BOgIzVBEuY1HlHazaw0RApDjgAWwyksZ6omAXz1BINSO1TBnFoHgtMsgkKkqMO8QKanmNHt7ew/hbIejO8ruPjWD7swCIMkFC6joz1BPBoPMPe/BU60Z+pGpBAJTHUxKocXidbtvx26eOXPmOxwRmL208BVZJVHi11g8volXqS06ACovpWu737TgZe5nXg2EyoFk7XgwZmdhAics/vjx45+R2ft1i18ROPX09Li4BTlciVIVlgDgFrCwxJqeB1SAQICw0j/3sew00KQNlGm0+PLy8vfIsc0ZcH2Qmz1C56OIF+An4l1ojQ0AWECzh57P/QSCT20hS/i5bQ/eUSXzp8Ur8ODw5LTI8VDJEwETuHHjRhsxgxKP2mIcAKCd1wBY8KnNXjoSz8dZYc025sxUJF+A+EAhDrdTfNBllN3JANy8ebON3lXM5vu4AEA+AEfApzZ5gmrz4hQrqHyHgSWk4AhmDHOmKO4op7uXFi+BoB0BosajKHAk7hGo6E9f9gHPFgkEv/qHb56VNH6oOUFXjt0l5QhwZHBo+jqiqOeJnEFiAM0J9vX1JbgTPBEMaOf+JD1/OrWHZSVrcYLUkdESHFCZvpgpANA5whU0CBA6Ojq+STQapEAIFnApbTkQCsDzf6V5fkSJuuyOgpidIeoEMHc/wl8eAvv1USC+AVW63e6dsRRXzQ6Fly2gvDdNbSUfUNH3PQMgbOXiQXcIXxHG8pxev3gv/MHg4OAvGDx7NAyFyTHOVFdXJ0YorPJQWK0ZLFB//7tM8/ZS9CeSIdAdEhie3b1Edzy7uyB6icQOF8IVV1H7Q4KVCMmQ4kIdoLh+GyVBdhdPgvTpMFJXLFLv8UUlF6kvUmC8j1FUVLRpcnLyOq/+GqbDSLEx97qmwy4R3VHcj0XLi5cLIjzBWTIoZgZQ9EDxQ9QHREGEjsxWAiBkQQTHBHOvd0FELNzGVipgWBLTnWc/yl0oe8nZnew06+vrt9NCE7ckFqp3F64oigXgLEN5FDy5R19RzJSLokR9e/k8CVoUNS6L7wpXFkccgFK3aFyuVhbv7e3N0gVOiVMWj7QxgrOLJsdqZ1ffGEEzJVzvcd0aI5G2xtDeQiIUTWsMbbVVWmO3XmlrLNLmKBqbaHBG2xxFYxUN1lWaoz2vpDkqt8cRwKAlvVp7HK1tfTk8EivjEeWq7XG06uXWfTzb4w7sDC4j8PZVuAsSH8XipISfATOEuyAh6BGXNnjvMSJ6jPiKDK6hyB7aqJj5qq7I6FNoXN8x/YqMfEkKF5BwEWmVS1IZ63VJChe4cJHL7EtSmkPC1bPX5ZocrvSZfU0OJvjaXJTEpU4zL0paV2Wty9LW/xewALAAsACwALAAsACwAPgPjn8BZBzrfp+v2HwAAAAASUVORK5CYII=');
}
/* 更多菜單 */
.extra-menu {
	width: auto;
}
.extra-menu .text {
	color: yellow;
}
.unread-announce-count {
	position: absolute;
	top: 1px;
	right: 2px;
	padding: 0 6px;
	background-color: red;
	border-radius: 3px;
}
</style>