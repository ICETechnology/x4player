<template>
    <div class="desktop-core hidden">
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		// 預設連動商品 (避免無連動商品時，部分元件空白異常的問題)
		try {
			if (!this.$store.state.selectedSymbol.ID) {
				this.$store.state.status.quoteTabID = 'SHFE';
				let cfc = M4C.Symbol.getClassification(this.$store.state.config.classification);
				let sid = cfc.find(o=>o.ENG==='SHFE').Node[0].Contracts[0];
				this.$store.commit("setSelectedSymbol", sid);
			}
		}catch(e){}
		// 偵測鍵盤
		if (!window._alreadyBindKeyboard) {
			window._alreadyBindKeyboard = true;
			document.addEventListener('keyup', (e)=>{
				if (e.code === "Escape") {
					history.back();
				}
			});
			document.addEventListener('keypress', (e)=>{
				// Ctrl || Ctrl + Shift
				if (e.ctrlKey || (e.ctrlKey && e.shiftKey)) {
					if (e.code === 'KeyE')
						this.$store.state.desktop.layoutEditable = !this.$store.state.desktop.layoutEditable;
				}
				// Ctrl + Shift
				if (e.ctrlKey && e.shiftKey) {
					if (e.code === 'KeyD')
						this.$store.state.device.isDVM = !this.$store.state.device.isDVM;
				}
			});
		}
	},
    mounted() {
		// 避免 hot-reload 導致多份 interval
		if (this.$store.state.status.checkVersionInterval == null) {
			this.$store.state.status.checkVersionInterval = true;
			setInterval(this.checkVersion, 600000);
		}
		// ExtraMenu 中帶有公告項目時，才啟用公告功能
		if (this.enableAnnounce) {
			// 查詢公告列表
			M4C.Announce.queryAnnUnreads();
		}
	},
	beforeDestroy() {},
	components: {},
    methods: {
		// 檢查主機上最新的版本號，若有改變則提示重新啟動
		checkVersion() {
			let versionSrc = `${window.cloudPath}/version.json?${new Date().getTime()}`;
			fetch(versionSrc).then(response => response.json()).then(json => {
				console.log(`DesktopCore.checkVersion : `, window._version.v, '->', json.v);
				if (json.v !== window._version.v) {
					eventBus.$emit("CONFIRM-DIALOG", {
						content: this.$ln("发现新版本，请点击重启"),
						confirm: () => {
							if (ipcRenderer)
								ipcRenderer.send('restart');
							else
								window.location.reload();
						}
					});
				}
			}).catch(() => {});
		},
	},
	watch: {},
    computed: {
		/** 更多選單 */
		extraMenu() {
			return this.$store.state.config.quotePdSetting.function.extramenu;
		},
		/** 有公告功能 */
		enableAnnounce() {
			return !!this.extraMenu.items.find(o=>o.action==='announcement');
		},
		dskDlgList() {
			return this.$store.state.desktop.dskDlgList;
		},
	},
}
</script>

<style scoped>
</style>